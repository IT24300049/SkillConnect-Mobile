import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../context/AuthContext";
import {
  createBooking,
  deleteBooking,
  getMyBookings,
  getMyJobs,
  getWorkers,
  updateBookingStatus,
} from "../services/apiClient";
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from "../theme";

const STATUS_ACTIONS = {
  requested: ["accepted", "rejected", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
};

const STATUS_COLORS = {
  requested: { bg: "#1A1A00", text: Colors.warning },
  accepted: { bg: Colors.successSurface, text: Colors.success },
  in_progress: { bg: "#1A1000", text: "#FB923C" },
  completed: { bg: Colors.successSurface, text: Colors.success },
  rejected: { bg: Colors.errorSurface, text: Colors.error },
  cancelled: { bg: Colors.errorSurface, text: Colors.error },
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function StatusChip({ status }) {
  const cfg = STATUS_COLORS[status] || { bg: Colors.surfaceCard, text: Colors.textMuted };
  return (
    <View style={[styles.chip, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.chipText, { color: cfg.text }]}>
        {(status || "unknown").replace("_", " ").toUpperCase()}
      </Text>
    </View>
  );
}

export default function BookingsScreen() {
  const { token, user } = useAuth();
  const [roleView, setRoleView] = useState(user?.role === "worker" ? "worker" : "customer");
  const [bookings, setBookings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [focused, setFocused] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })();
  const [form, setForm] = useState({
    worker: "", job: "", scheduledDate: tomorrow,
    scheduledTime: "09:00", estimatedDurationHours: "2", notes: "",
  });
  const [createBusy, setCreateBusy] = useState(false);
  const customerMode = user?.role !== "worker";

  const loadData = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const [bookingsData, workersData, jobsData] = await Promise.all([
        getMyBookings(token, roleView),
        getWorkers(token),
        customerMode ? getMyJobs(token) : Promise.resolve([]),
      ]);
      setBookings(bookingsData);
      setWorkers(workersData);
      setJobs(jobsData);
    } catch (e) {
      setError(e.message || "Failed to load bookings data");
    } finally {
      setLoading(false);
    }
  }, [token, roleView, customerMode]);

  useEffect(() => { loadData(); }, [loadData]);

  const workerNameMap = useMemo(() => {
    const map = new Map();
    for (const w of workers) {
      map.set(w._id, `${w.firstName || ""} ${w.lastName || ""}`.trim());
    }
    return map;
  }, [workers]);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitBooking() {
    if (!form.worker || !form.scheduledDate || !form.scheduledTime) {
      setActionError("Worker, date and time are required");
      return;
    }
    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (form.scheduledDate < today) {
      setActionError("Cannot schedule a booking in the past.");
      return;
    }
    try {
      setActionError("");
      setCreateBusy(true);
      await createBooking(token, {
        worker: form.worker,
        job: form.job || undefined,
        scheduledDate: form.scheduledDate.toISOString(),
        scheduledTime: form.scheduledTime,
        estimatedDurationHours: Number(form.estimatedDurationHours || 2),
        notes: form.notes,
      });
      const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1);
      setForm({ worker: "", job: "", scheduledDate: tmrw, scheduledTime: "09:00", estimatedDurationHours: "2", notes: "" });
      setShowForm(false);
      await loadData();
    } catch (e) {
      setActionError(e.message || "Failed to create booking");
    } finally {
      setCreateBusy(false);
    }
  }

  async function onStatusChange(bookingId, nextStatus) {
    try {
      setActionError("");
      await updateBookingStatus(token, bookingId, nextStatus);
      await loadData();
    } catch (e) {
      setActionError(e.message || "Failed to update booking status");
    }
  }

  async function onDelete(bookingId) {
    try {
      setActionError("");
      await deleteBooking(token, bookingId);
      await loadData();
    } catch (e) {
      setActionError(e.message || "Failed to delete booking");
    }
  }

  const inputStyle = (name) => [styles.input, focused === name && styles.inputFocused];

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Title Row */}
            <View style={styles.titleRow}>
              <Text style={styles.pageTitle}>Bookings</Text>
              {loading && <ActivityIndicator size="small" color={Colors.primary} />}
            </View>

            {/* Segment + Refresh */}
            <View style={styles.segmentRow}>
              {user?.role === "worker" && ["customer", "worker"].map((view) => (
                <Pressable
                  key={view}
                  style={[styles.segmentBtn, roleView === view && styles.segmentBtnActive]}
                  onPress={() => setRoleView(view)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: roleView === view }}
                >
                  <Text style={[styles.segmentText, roleView === view && styles.segmentTextActive]}>
                    {view === "customer" ? "As Customer" : "As Worker"}
                  </Text>
                </Pressable>
              ))}
              {user?.role !== "worker" && (
                <Text style={{ ...styles.segmentTextActive, color: Colors.textPrimary, flex: 1, fontSize: FontSize.md, fontWeight: "bold" }}>
                  My Bookings
                </Text>
              )}
              <Pressable
                style={styles.refreshBtn}
                onPress={loadData}
                accessibilityLabel="Refresh bookings"
              >
                <Text style={styles.refreshText}>↻</Text>
              </Pressable>
            </View>

            {/* Create Booking Toggle */}
            {customerMode && (
              <Pressable
                style={({ pressed }) => [styles.toggleFormBtn, pressed && { opacity: 0.8 }]}
                onPress={() => setShowForm((v) => !v)}
                accessibilityLabel={showForm ? "Hide booking form" : "Show booking form"}
                accessibilityRole="button"
              >
                <Text style={styles.toggleFormText}>
                  {showForm ? "✕  Cancel" : "+  New Booking"}
                </Text>
              </Pressable>
            )}

            {/* Create Booking Form */}
            {customerMode && showForm && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>New Booking</Text>

                <Text style={styles.label}>Select Worker</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                  {workers.slice(0, 12).map((w) => {
                    const name = `${w.firstName || ""} ${w.lastName || ""}`.trim();
                    return (
                      <Pressable
                        key={w._id}
                        style={[styles.pill, form.worker === w._id && styles.pillActive]}
                        onPress={() => updateForm("worker", w._id)}
                      >
                        <Text style={[styles.pillText, form.worker === w._id && styles.pillTextActive]}>
                          {name || w._id.slice(-6)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text style={styles.label}>Select Job (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                  {jobs.slice(0, 12).map((job) => (
                    <Pressable
                      key={job._id}
                      style={[styles.pill, form.job === job._id && styles.pillActive]}
                      onPress={() => updateForm("job", job._id)}
                    >
                      <Text style={[styles.pillText, form.job === job._id && styles.pillTextActive]}>
                        {job.jobTitle || job._id.slice(-6)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={styles.label}>Scheduled Date</Text>
                <Pressable
                  style={[inputStyle("scheduledDate"), { justifyContent: "center" }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: Colors.textPrimary, fontSize: FontSize.base }}>
                    {form.scheduledDate instanceof Date
                      ? form.scheduledDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                      : "Tap to select date"}
                  </Text>
                </Pressable>
                {/* Date Picker Modal */}
                <Modal
                  visible={showDatePicker}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.pickerOverlay}>
                    <View style={styles.pickerContainer}>
                      <View style={styles.pickerHeader}>
                        <Pressable onPress={() => setShowDatePicker(false)}>
                          <Text style={styles.pickerDone}>Done</Text>
                        </Pressable>
                      </View>
                      <DateTimePicker
                        value={form.scheduledDate instanceof Date ? form.scheduledDate : new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        minimumDate={new Date()}
                        themeVariant="light"
                        textColor="#000000"
                        style={{ backgroundColor: '#ffffff' }}
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(Platform.OS === 'ios');
                          if (selectedDate) updateForm("scheduledDate", selectedDate);
                        }}
                      />
                    </View>
                  </View>
                </Modal>

                <Text style={styles.label}>Scheduled Time (HH:MM)</Text>
                <TextInput
                  style={inputStyle("scheduledTime")}
                  placeholder="09:00"
                  placeholderTextColor={Colors.textMuted}
                  value={form.scheduledTime}
                  onChangeText={(v) => updateForm("scheduledTime", v)}
                  onFocus={() => setFocused("scheduledTime")}
                  onBlur={() => setFocused("")}
                />

                <Text style={styles.label}>Duration (hours)</Text>
                <TextInput
                  style={inputStyle("duration")}
                  placeholder="2"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={form.estimatedDurationHours}
                  onChangeText={(v) => updateForm("estimatedDurationHours", v)}
                  onFocus={() => setFocused("duration")}
                  onBlur={() => setFocused("")}
                />

                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[inputStyle("notes"), styles.textArea]}
                  placeholder="Any special instructions..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  value={form.notes}
                  onChangeText={(v) => updateForm("notes", v)}
                  onFocus={() => setFocused("notes")}
                  onBlur={() => setFocused("")}
                />

                {actionError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠ {actionError}</Text>
                  </View>
                ) : null}

                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }, createBusy && { opacity: 0.6 }]}
                  onPress={submitBooking}
                  disabled={createBusy}
                  accessibilityLabel="Create booking button"
                  accessibilityRole="button"
                >
                  {createBusy
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.primaryBtnText}>Confirm Booking</Text>
                  }
                </Pressable>
              </View>
            )}

            {!customerMode && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Switch to Customer view to create bookings.
                </Text>
              </View>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>
              {bookings.length > 0 ? `${bookings.length} Booking${bookings.length !== 1 ? "s" : ""}` : "Your Bookings"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No Bookings Found</Text>
              <Text style={styles.emptyDesc}>Create a new booking to get started.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const workerName = item.worker?.firstName
            ? `${item.worker.firstName} ${item.worker.lastName || ""}`.trim()
            : workerNameMap.get(item.worker?._id) || "Unknown Worker";
          const customerName = item.customer?.firstName
            ? `${item.customer.firstName} ${item.customer.lastName || ""}`.trim()
            : "Unknown Customer";

          return (
            <View style={styles.bookingCard}>
              <View style={styles.bookingCardHeader}>
                <Text style={styles.bookingTitle} numberOfLines={1}>
                  {item.job?.jobTitle || "Service Booking"}
                </Text>
                <StatusChip status={item.bookingStatus} />
              </View>

              <View style={styles.bookingMeta}>
                <Text style={styles.metaItem}>📅 {formatDate(item.scheduledDate)} {item.scheduledTime || ""}</Text>
                <Text style={styles.metaItem}>👷 {workerName}</Text>
                <Text style={styles.metaItem}>👤 {customerName}</Text>
              </View>

              <View style={styles.actionRow}>
                {(STATUS_ACTIONS[item.bookingStatus] || []).filter(status => {
                  // Only workers can accept, reject, start work or complete
                  const workerOnly = ["accepted", "rejected", "in_progress", "completed"];
                  if (workerOnly.includes(status)) {
                    return roleView === "worker";
                  }
                  // Both can cancel
                  return true;
                }).map((status) => (
                  <Pressable
                    key={status}
                    style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => onStatusChange(item._id, status)}
                    accessibilityLabel={`Mark as ${status}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.actionBtnText}>{status.replace("_", " ")}</Text>
                  </Pressable>
                ))}
                <Pressable
                  style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => onDelete(item._id)}
                  accessibilityLabel="Delete booking"
                  accessibilityRole="button"
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  // Header
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  pageTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },

  // Segment
  segmentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  segmentBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 36,
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  segmentText: {
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  segmentTextActive: { color: "#fff" },
  refreshBtn: {
    marginLeft: "auto",
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshText: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },

  // Toggle form btn
  toggleFormBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  toggleFormText: {
    color: "#fff",
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },

  // Card
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceInput,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    minHeight: 50,
  },
  inputFocused: { borderColor: Colors.primary, backgroundColor: "#1F1500" },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  pillScroll: { marginBottom: Spacing.md },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
    marginRight: Spacing.sm,
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  pillTextActive: { color: "#fff" },

  // Primary button
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    marginTop: Spacing.lg,
    ...Shadow.md,
  },
  primaryBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: FontWeight.bold },

  // Error / Info
  errorBox: {
    backgroundColor: Colors.errorSurface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },
  infoBox: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  infoText: { color: Colors.textSecondary, fontSize: FontSize.sm },

  // Section title
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Booking card
  bookingCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  bookingCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  bookingTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  chipText: {
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.8,
  },
  bookingMeta: { marginBottom: Spacing.md, gap: 4 },
  metaItem: { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 20 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  actionBtn: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  actionBtnText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: "capitalize",
  },
  deleteBtn: {
    backgroundColor: Colors.errorSurface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteBtnText: { color: Colors.error, fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: Spacing.xxxl * 2 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center" },

  // Date Picker Modal
  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  pickerContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  pickerDone: {
    fontSize: 17,
    fontWeight: "600",
    color: "#007AFF",
  },
});
