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
} from "react-native";
import { useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import ThemedInput from "../components/ThemedInput";
import { useAuth } from "../context/AuthContext";
import {
  createComplaint,
  deleteComplaint,
  getComplaints,
  getCustomers,
  getMyBookings,
  getWorkers,
  updateComplaintStatus,
} from "../services/apiClient";

const C = {
  primary: "#FF6B00",
  primarySurface: "rgba(255, 107, 0, 0.1)",
  primaryBorder: "rgba(255, 107, 0, 0.2)",
  card: "#1E1E1E",
  background: "#121212",
  border: "#333",
  input: "#252525",
  text: "#FFFFFF",
  textSec: "#B0B0B0",
  textMut: "#666666",
  error: "#FF4D4D",
  errorSurf: "rgba(255, 77, 77, 0.1)",
  success: "#4CAF50",
};

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

export default function ComplaintsScreen() {
  const { token, user } = useAuth();
  const route = useRoute();
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);

  const adminMode = user?.role === "admin";

  const loadData = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      
      // Determine what type of users we can report against
      // Customers report Workers, Workers report Customers
      const isWorker = user?.role === "worker";
      const userListPromise = isWorker ? getCustomers(token) : getWorkers(token);

      const [complaintsData, reportableUsers, bookingsData] = await Promise.all([
        getComplaints(token, adminMode),
        userListPromise,
        getMyBookings(token, isWorker ? "worker" : "customer"),
      ]);

      setComplaints(complaintsData);
      setWorkers(reportableUsers); 
      setBookings(bookingsData);
    } catch (e) {
      console.error("Load Complaints Error:", e);
      setError(e.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, [token, adminMode, user?.role]);

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
    }
  }, [route.params]);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitComplaint() {
    if (!form.complainedAgainst || !form.complaintTitle || !form.complaintDescription) {
      setActionError("All fields are required");
      return;
    }

    try {
      setActionError("");
      setSubmitting(true);
      await createComplaint(token, form);
      setForm(INITIAL_FORM);
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
      await updateComplaintStatus(token, complaintId, status, "Updated from App");
      await loadData();
    } catch (e) {
      setActionError(e.message || "Failed to update status");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={complaints}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ScrollView style={styles.headerWrap}>
            <View style={styles.topRow}>
              <Text style={styles.title}>Complaints</Text>
              <Pressable style={styles.refreshBtn} onPress={loadData}>
                <Ionicons name="refresh" size={20} color={C.text} />
              </Pressable>
            </View>

            {!adminMode && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>File a Complaint</Text>

                {form.workerName || form.jobTitle ? (
                  <View style={styles.targetInfo}>
                    <View style={styles.targetIcon}>
                      <Ionicons name="warning-outline" size={32} color={C.error} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.targetLabel, { color: C.error }]}>REPORTING</Text>
                      <Text style={styles.targetName}>{form.workerName || "Professional"}</Text>
                      {form.jobTitle && <Text style={styles.targetSub}>{form.jobTitle}</Text>}
                    </View>
                    <Pressable onPress={() => setForm(INITIAL_FORM)} style={styles.clearBtn}>
                      <Ionicons name="close-circle" size={20} color={C.textMut} />
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <Text style={styles.label}>{user?.role === 'worker' ? 'Report a Customer' : 'Report a Professional'}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                      {workers.map((w) => (
                        <Pressable
                          key={w._id}
                          style={[styles.pill, form.complainedAgainst === w._id && styles.pillActive]}
                          onPress={() => {
                            updateForm("complainedAgainst", w._id);
                            updateForm("workerName", `${w.firstName || ""} ${w.lastName || ""}`.trim());
                          }}
                        >
                          <Text style={[styles.pillText, form.complainedAgainst === w._id && styles.pillTextActive]}>
                            {`${w.firstName || ""} ${w.lastName || ""}`.trim() || w._id.slice(-6)}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </>
                )}

                <View style={{ marginTop: 12 }}>
                  <Text style={styles.label}>Complaint Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                    {[
                      { id: 'service_quality', label: 'Quality' },
                      { id: 'inappropriate_behavior', label: 'Behavior' },
                      { id: 'fraud', label: 'Fraud' },
                      { id: 'payment_issue', label: 'Payment' },
                      { id: 'other', label: 'Other' }
                    ].map((cat) => (
                      <Pressable
                        key={cat.id}
                        style={[styles.pill, form.complaintCategory === cat.id && styles.pillActive]}
                        onPress={() => updateForm("complaintCategory", cat.id)}
                      >
                        <Text style={[styles.pillText, form.complaintCategory === cat.id && styles.pillTextActive]}>
                          {cat.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                <View style={{ marginTop: 8 }}>
                  <Text style={styles.label}>Priority Level</Text>
                  <View style={[styles.pillRow, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                    {[
                      { id: 'low', label: 'Low', color: '#4CAF50' },
                      { id: 'medium', label: 'Medium', color: '#FF9800' },
                      { id: 'high', label: 'High', color: '#F44336' },
                      { id: 'urgent', label: 'Urgent', color: '#B71C1C' }
                    ].map((p) => (
                      <Pressable
                        key={p.id}
                        style={[
                          styles.pill, 
                          form.priority === p.id && { backgroundColor: p.color, borderColor: p.color }
                        ]}
                        onPress={() => updateForm("priority", p.id)}
                      >
                        <Text style={[styles.pillText, form.priority === p.id && { color: '#fff' }]}>
                          {p.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Text style={styles.label}>Summary</Text>
                <ThemedInput
                  style={styles.input}
                  placeholder="Brief summary of the issue"
                  value={form.complaintTitle}
                  onChangeText={(v) => updateForm("complaintTitle", v)}
                />

                <Text style={styles.label}>Description</Text>
                <ThemedInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Detailed description..."
                  multiline
                  numberOfLines={4}
                  value={form.complaintDescription}
                  onChangeText={(v) => updateForm("complaintDescription", v)}
                />

                <Pressable 
                  style={[styles.primaryBtn, submitting && { opacity: 0.7 }]} 
                  onPress={submitComplaint} 
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Submit Report</Text>
                  )}
                </Pressable>
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
            {loading ? <Text style={styles.helper}>Loading...</Text> : null}
          </ScrollView>
        }
        ListEmptyComponent={!loading ? <Text style={styles.helper}>No complaints found.</Text> : null}
        renderItem={({ item }) => {
          const mine = !adminMode && (item.complainant?._id || item.complainant) === user?.id;
          return (
            <View style={styles.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.itemTitle}>{item.complaintTitle || "Complaint"}</Text>
                <Text style={[styles.meta, { color: item.priority === "high" || item.priority === "urgent" ? C.error : C.textSec }]}>
                  {item.priority?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.meta}>Status: {item.complaintStatus?.toUpperCase()}</Text>
              <Text style={styles.description}>{item.complaintDescription}</Text>

              <View style={styles.actionRow}>
                {mine && (
                  <Pressable style={[styles.smallBtn, styles.deleteBtn]} onPress={() => handleDelete(item._id)}>
                    <Text style={styles.smallBtnText}>Delete</Text>
                  </Pressable>
                )}
                {adminMode && (
                  <>
                    <Pressable style={styles.smallBtn} onPress={() => handleStatusChange(item._id, "resolved")}>
                      <Text style={styles.smallBtnText}>Resolve</Text>
                    </Pressable>
                    <Pressable style={styles.smallBtn} onPress={() => handleStatusChange(item._id, "rejected")}>
                      <Text style={styles.smallBtnText}>Reject</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  headerWrap: { paddingHorizontal: 16, paddingTop: 16 },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", color: C.text },
  refreshBtn: {
    marginLeft: "auto", width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14, fontWeight: "700", color: C.primary,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16,
  },
  itemTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 6 },
  label: {
    fontSize: 11, fontWeight: "600", color: C.textSec,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, marginTop: 12,
  },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.input, color: C.text, fontSize: 15, minHeight: 50,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  pillRow: { marginTop: 8, marginBottom: 8 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: C.border, marginRight: 8, backgroundColor: C.card,
  },
  pillActive: { backgroundColor: C.primary, borderColor: C.primary },
  pillText: { color: C.textSec, fontSize: 12, fontWeight: "600" },
  pillTextActive: { color: "#fff" },
  primaryBtn: {
    marginTop: 16, backgroundColor: C.primary, borderRadius: 12,
    minHeight: 52, alignItems: "center", justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  smallBtn: {
    backgroundColor: C.primarySurface, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.primaryBorder,
  },
  deleteBtn: { backgroundColor: C.errorSurf, borderColor: C.error },
  smallBtnText: { color: C.primary, fontWeight: "700", fontSize: 12 },
  meta: { color: C.textSec, marginBottom: 4, fontSize: 12 },
  helper: { color: C.textMut, marginBottom: 8, fontSize: 13, textAlign: "center" },
  error: { color: C.error, marginBottom: 8, fontSize: 13, textAlign: "center" },
  targetInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.input,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  targetIcon: { marginRight: 12 },
  targetLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  targetName: { fontSize: 16, fontWeight: "700", color: C.text },
  targetSub: { fontSize: 13, color: C.textSec },
  clearBtn: { padding: 4 },
  description: { fontSize: 14, color: C.textSec, lineHeight: 20 },
});
