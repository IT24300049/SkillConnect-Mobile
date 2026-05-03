import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import ThemedInput from "../components/ThemedInput";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, FontSize, FontWeight, Radius, SharedStyles, Shadow } from "../theme";
import StatusBadge from "../components/StatusBadge";
import {
  createComplaint,
  deleteComplaint,
  getComplaints,
  getCustomers,
  getMyBookings,
  getWorkers,
  updateComplaintStatus,
} from "../services/apiClient";

const INITIAL_FORM = {
  complainedAgainst: "",
  workerName: "",
  booking: "",
  job: "",
  jobTitle: "",
  complaintCategory: "service_quality",
  complaintTitle: "",
  complaintDescription: "",
  priority: "medium",
};

const CATEGORIES = [
  { id: "service_quality", label: "Quality", icon: "ribbon-outline" },
  { id: "inappropriate_behavior", label: "Behavior", icon: "hand-left-outline" },
  { id: "fraud", label: "Fraud", icon: "shield-alert-outline" },
  { id: "payment_issue", label: "Payment", icon: "cash-outline" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal-outline" },
];

const PRIORITIES = [
  { id: "low", label: "Low", color: Colors.success },
  { id: "medium", label: "Medium", color: Colors.warning },
  { id: "high", label: "High", color: Colors.error },
  { id: "urgent", label: "Urgent", color: "#B71C1C" },
];

export default function ComplaintsScreen() {
  const { token, user } = useAuth();
  const route = useRoute();
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);

  const adminMode = user?.role === "admin";

  const loadData = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const isWorker = user?.role === "worker";
      const userListPromise = isWorker ? getCustomers(token) : getWorkers(token);

      const [complaintsData, reportableUsers, bookingsData] = await Promise.all([
        getComplaints(token, false),
        userListPromise,
        getMyBookings(token, isWorker ? "worker" : "customer"),
      ]);

      setComplaints(complaintsData);
      setWorkers(reportableUsers);
      setBookings(bookingsData);
    } catch (e) {
      setError(e.message || "Failed to load complaints");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (route.params?.workerId) {
      setForm(prev => ({
        ...prev,
        complainedAgainst: route.params.workerId,
        workerName: route.params.workerName || "",
        booking: route.params.bookingId || "",
        job: route.params.jobId || "",
        jobTitle: route.params.jobTitle || ""
      }));
      setShowForm(true);
    }
  }, [route.params]);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitComplaint() {
    if (!form.complainedAgainst || !form.complaintTitle || !form.complaintDescription) {
      setActionError("Please fill all required fields");
      return;
    }

    try {
      setActionError("");
      setSubmitting(true);
      await createComplaint(token, form);
      setForm(INITIAL_FORM);
      setShowForm(false);
      await loadData();
    } catch (e) {
      setActionError(e.message || "Failed to create complaint");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(complaintId) {
    try {
      setActionError("");
      await deleteComplaint(token, complaintId);
      await loadData();
    } catch (e) {
      setActionError(e.message || "Failed to delete complaint");
    }
  }

  async function handleStatusChange(complaintId, status) {
    try {
      setActionError("");
      await updateComplaintStatus(token, complaintId, status, "Resolution through App");
      await loadData();
    } catch (e) {
      setActionError(e.message || "Failed to update status");
    }
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={SharedStyles.screenTitle}>Complaints</Text>
          <Text style={SharedStyles.screenSubtitle}>
            {adminMode ? "Manage system-wide issues" : "Report and track your issues"}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.7 }]}
          onPress={() => { setRefreshing(true); loadData(); }}
        >
          <Ionicons name="refresh" size={20} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {!adminMode && (
        <View style={[SharedStyles.card, styles.formCard]}>
          <Pressable
            style={styles.formHeader}
            onPress={() => setShowForm(!showForm)}
          >
            <View style={styles.formTitleRow}>
              <Ionicons
                name={showForm ? "remove-circle-outline" : "add-circle-outline"}
                size={22}
                color={Colors.primary}
              />
              <Text style={styles.formTitle}>File a New Complaint</Text>
            </View>
            <Ionicons
              name={showForm ? "chevron-up" : "chevron-down"}
              size={20}
              color={Colors.textMuted}
            />
          </Pressable>

          {showForm && (
            <View style={styles.formContent}>
              <View style={styles.divider} />

              {form.workerName || form.jobTitle ? (
                <View style={styles.targetBanner}>
                  <View style={styles.targetIconBox}>
                    <Ionicons name="warning" size={24} color={Colors.error} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.targetLabel}>REPORTING AGAINST</Text>
                    <Text style={styles.targetName}>{form.workerName || "Professional"}</Text>
                    {form.jobTitle && <Text style={styles.targetSub}>{form.jobTitle}</Text>}
                  </View>
                  <Pressable onPress={() => setForm(INITIAL_FORM)} style={styles.clearBtn}>
                    <Ionicons name="close-circle" size={24} color={Colors.textMuted} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.fieldGroup}>
                  <Text style={SharedStyles.label}>
                    {user?.role === "worker" ? "Select Customer" : "Select Professional"}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                    {workers.map((w) => (
                      <Pressable
                        key={w._id}
                        style={[SharedStyles.pill, form.complainedAgainst === w._id && SharedStyles.pillActive]}
                        onPress={() => {
                          updateForm("complainedAgainst", w._id);
                          updateForm("workerName", `${w.firstName || ""} ${w.lastName || ""}`.trim());
                        }}
                      >
                        <Text style={[SharedStyles.pillText, form.complainedAgainst === w._id && SharedStyles.pillTextActive]}>
                          {`${w.firstName || ""} ${w.lastName || ""}`.trim() || w._id.slice(-6)}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={SharedStyles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat.id}
                      style={[SharedStyles.pill, form.complaintCategory === cat.id && SharedStyles.pillActive]}
                      onPress={() => updateForm("complaintCategory", cat.id)}
                    >
                      <View style={styles.pillContent}>
                        <Ionicons
                          name={cat.icon}
                          size={14}
                          color={form.complaintCategory === cat.id ? Colors.textOnPrimary : Colors.textSecondary}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[SharedStyles.pillText, form.complaintCategory === cat.id && SharedStyles.pillTextActive]}>
                          {cat.label}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={SharedStyles.label}>Priority</Text>
                <View style={styles.priorityGrid}>
                  {PRIORITIES.map((p) => (
                    <Pressable
                      key={p.id}
                      style={[
                        SharedStyles.pill,
                        styles.priorityPill,
                        form.priority === p.id && { backgroundColor: p.color, borderColor: p.color }
                      ]}
                      onPress={() => updateForm("priority", p.id)}
                    >
                      <Text style={[SharedStyles.pillText, form.priority === p.id && { color: "#fff" }]}>
                        {p.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={SharedStyles.label}>Summary</Text>
                <ThemedInput
                  style={styles.input}
                  placeholder="e.g., Late arrival, missing tools..."
                  value={form.complaintTitle}
                  onChangeText={(v) => updateForm("complaintTitle", v)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={SharedStyles.label}>Description</Text>
                <ThemedInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell us more about what happened..."
                  multiline
                  numberOfLines={4}
                  value={form.complaintDescription}
                  onChangeText={(v) => updateForm("complaintDescription", v)}
                />
              </View>

              {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

              <Pressable
                style={[SharedStyles.primaryButton, submitting && { opacity: 0.7 }]}
                onPress={submitComplaint}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.textOnPrimary} size="small" />
                ) : (
                  <Text style={SharedStyles.primaryButtonText}>Submit Report</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      )}

      {complaints.length > 0 && (
        <Text style={[SharedStyles.sectionTitle, { marginTop: Spacing.lg }]}>Recent History</Text>
      )}
    </View>
  );

  const renderComplaintCard = ({ item }) => {
    const mine = !adminMode && (item.complainant?._id || item.complainant) === user?.id;
    const priorityColor = PRIORITIES.find(p => p.id === item.priority)?.color || Colors.textMuted;

    return (
      <View style={[SharedStyles.card, styles.complaintCard]}>
        <View style={[styles.priorityTag, { backgroundColor: priorityColor }]} />

        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.complaintTitle || "Complaint"}</Text>
            <Text style={styles.categoryText}>
              {CATEGORIES.find(c => c.id === item.complaintCategory)?.label || "Other"}
            </Text>
          </View>
          <StatusBadge status={item.complaintStatus} />
        </View>

        <Text style={styles.itemDescription}>{item.complaintDescription}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.metaLabel}>By: </Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {item.complainant ? `${item.complainant.firstName || ""} ${item.complainant.lastName || ""}`.trim() : "You"}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
              <Text style={styles.metaLabel}>Against: </Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {item.complainedAgainst ? `${item.complainedAgainst.firstName || ""} ${item.complainedAgainst.lastName || ""}`.trim() : "N/A"}
              </Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          {mine && (
            <Pressable style={styles.actionBtn} onPress={() => handleDelete(item._id)}>
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
              <Text style={[styles.actionBtnText, { color: Colors.error }]}>Withdraw</Text>
            </Pressable>
          )}

          {adminMode && (item.complaintStatus === "pending" || item.complaintStatus === "investigating") && (
            <View style={styles.adminActions}>
              <Pressable
                style={[styles.actionBtn, styles.resolveBtn]}
                onPress={() => handleStatusChange(item._id, "resolved")}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
                <Text style={[styles.actionBtnText, { color: Colors.success }]}>Resolve</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => handleStatusChange(item._id, "rejected")}
              >
                <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
                <Text style={[styles.actionBtnText, { color: Colors.error }]}>Reject</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={SharedStyles.safeArea}>
      <FlatList
        data={complaints}
        keyExtractor={(item) => item._id}
        renderItem={renderComplaintCard}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="shield-checkmark-outline" size={40} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>All Good!</Text>
              <Text style={styles.emptySubtitle}>No complaints found in your records.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.sm },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  listContainer: { paddingBottom: Spacing.xxxl },

  formCard: { padding: 0, overflow: "hidden", marginTop: Spacing.sm },
  formHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: Spacing.lg, backgroundColor: "rgba(255, 107, 0, 0.03)"
  },
  formTitleRow: { flexDirection: "row", alignItems: "center" },
  formTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginLeft: Spacing.sm },
  formContent: { padding: Spacing.lg, paddingTop: 0 },
  divider: { height: 1, backgroundColor: Colors.divider, marginBottom: Spacing.md },
  fieldGroup: { marginBottom: Spacing.md },
  pillScroll: { marginTop: Spacing.xs },
  pillContent: { flexDirection: "row", alignItems: "center" },
  priorityGrid: { flexDirection: "row", gap: Spacing.xs, marginTop: Spacing.xs },
  priorityPill: { flex: 1, marginRight: 0, alignItems: "center" },
  input: { marginTop: Spacing.xs },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  errorText: { color: Colors.error, fontSize: FontSize.sm, textAlign: "center", marginBottom: Spacing.md },

  targetBanner: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.surfaceInput,
    padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  targetIconBox: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.errorSurface,
    alignItems: "center", justifyContent: "center", marginRight: Spacing.md
  },
  targetLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: Colors.error, letterSpacing: 1 },
  targetName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  targetSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  clearBtn: { padding: Spacing.xs },

  complaintCard: {
    marginHorizontal: Spacing.lg, paddingLeft: Spacing.lg + 4,
    position: "relative", overflow: "hidden"
  },
  priorityTag: {
    position: "absolute", left: 0, top: 0, bottom: 0, width: 4
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.sm },
  itemTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  categoryText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold, marginTop: 2 },
  itemDescription: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.lg },

  cardFooter: { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: Spacing.md },
  metaRow: { gap: Spacing.xs, marginBottom: Spacing.sm },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: Spacing.xs },
  metaValue: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium, flex: 1 },
  dateRow: { flexDirection: "row", alignItems: "center", alignSelf: "flex-end" },
  dateText: { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: 4 },

  cardActions: { marginTop: Spacing.md },
  adminActions: { flexDirection: "row", gap: Spacing.sm },
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.surfaceInput, borderRadius: Radius.sm,
    paddingVertical: 8, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border
  },
  resolveBtn: { flex: 1, backgroundColor: Colors.successSurface, borderColor: Colors.success + "40" },
  rejectBtn: { flex: 1, backgroundColor: Colors.errorSurface, borderColor: Colors.error + "40" },
  actionBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginLeft: 6 },

  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surfaceCard,
    alignItems: "center", justifyContent: "center", marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.base, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.xs },
});
