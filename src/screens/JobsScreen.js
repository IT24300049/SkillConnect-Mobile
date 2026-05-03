import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { createJob, deleteJob, getJobs, getMyJobs, updateJob } from "../services/apiClient";
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from "../theme";
import ThemedInput from "../components/ThemedInput";
import { CATEGORIES } from "../constants/categories";

const QUICK_MODULES = [
  { name: "Bookings", screen: "Bookings", icon: "📅", desc: "Manage your service bookings" },
  { name: "Equipment", screen: "Equipment", icon: "🔧", desc: "Browse & rent equipment" },
  { name: "Complaints", screen: "Complaints", icon: "⚠", desc: "Submit & track complaints" },
  { name: "Reviews", screen: "Reviews", icon: "⭐", desc: "Read & write reviews" },
];

const DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Moneragala", "Ratnapura", "Kegalle"
];

function StatusBadge({ status }) {
  const colors = {
    open: { bg: "#0D2D1A", text: Colors.success, label: "Open" },
    active: { bg: "#0D2D1A", text: Colors.success, label: "Active" },
    closed: { bg: "#2A1515", text: Colors.error, label: "Closed" },
    in_progress: { bg: "#1A1500", text: Colors.warning, label: "In Progress" },
  };
  const cfg = colors[status] || { bg: Colors.surfaceCard, text: Colors.textMuted, label: status };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

function JobCard({ item, onEdit, onDelete, onPress, currentUserId }) {
  const isOwner = item.customer?._id === currentUserId || item.customer === currentUserId;

  return (
    <TouchableOpacity style={styles.jobCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.jobCardHeader}>
        <View style={styles.jobCardTitleWrap}>
          <Text style={styles.jobTitle} numberOfLines={1}>{item.jobTitle}</Text>
          <Text style={styles.jobMeta}>{item.category} · {item.district}</Text>
        </View>
        <StatusBadge status={item.status || item.jobStatus || "open"} />
      </View>
      <Text style={styles.jobDesc} numberOfLines={2}>{item.jobDescription}</Text>
      <View style={styles.jobFooter}>
        <View style={styles.budgetBadge}>
          <Text style={styles.budgetText}>Rs. {item.budgetMin} – {item.budgetMax}</Text>
        </View>

        {isOwner && (
          <View style={styles.ownerActions}>
            <Pressable style={styles.editBtn} onPress={() => onEdit(item)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={() => onDelete(item._id)}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </Pressable>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const INITIAL_FORM = {
  jobTitle: "",
  category: "Plumbing",
  district: "Colombo",
  budgetMin: "",
  budgetMax: "",
  jobDescription: "",
};

export default function JobsScreen({ navigation }) {
  const { token, user, signOut } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("active"); // active, history

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadJobs = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const customerMode = user?.role === "customer";
      const list = customerMode ? await getMyJobs(token) : await getJobs(token);
      setJobs(list);
    } catch (e) {
      setError(e.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [token, user?.role]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const firstName = user?.name?.split(" ")[0] || user?.firstName || "User";
  const customerMode = user?.role === "customer";

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleEdit(item) {
    setForm({
      jobTitle: item.jobTitle,
      category: item.category,
      district: item.district,
      budgetMin: String(item.budgetMin || ""),
      budgetMax: String(item.budgetMax || ""),
      jobDescription: item.jobDescription,
    });
    setEditingId(item._id);
    setShowForm(true);
    setActionError("");
  }

  function cancelEdit() {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
    setActionError("");
  }

  async function handleDelete(jobId) {
    try {
      setActionError("");
      await deleteJob(token, jobId);
      await loadJobs();
    } catch (e) {
      setActionError(e.message || "Failed to delete job");
    }
  }

  async function submitJob() {
    if (!form.jobTitle || !form.category || !form.jobDescription) {
      setActionError("Title, Category, and Description are required");
      return;
    }
    try {
      setActionError("");
      setCreateBusy(true);
      const payload = {
        ...form,
        budgetMin: Number(form.budgetMin) || 0,
        budgetMax: Number(form.budgetMax) || 0,
      };

      if (editingId) {
        await updateJob(token, editingId, payload);
      } else {
        await createJob(token, payload);
      }

      setForm(INITIAL_FORM);
      setEditingId(null);
      setShowForm(false);
      await loadJobs();
    } catch (e) {
      setActionError(e.message || "Failed to save job");
    } finally {
      setCreateBusy(false);
    }
  }

  const filteredJobs = useMemo(() => {
    if (activeTab === "active") {
      return jobs.filter(j => j.jobStatus === "active" || j.jobStatus === "assigned");
    } else {
      return jobs.filter(j => j.jobStatus === "completed" || j.jobStatus === "cancelled" || j.jobStatus === "expired");
    }
  }, [jobs, activeTab]);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* ── Top Bar ──────────────── */}
            <View style={styles.topBar}>
              <View>
                <Text style={styles.greeting}>Good day,</Text>
                <Text style={styles.userName}>{firstName} 👋</Text>
              </View>
              <Pressable
                style={styles.avatarBtn}
                onPress={() => navigation.navigate("Profile")}
                accessibilityLabel="Open profile"
                accessibilityRole="button"
              >
                <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
              </Pressable>
            </View>

            {/* ── Quick Actions ─────────── */}
            <View style={styles.quickRow}>
              <Pressable
                style={({ pressed }) => [styles.quickBtn, pressed && styles.quickBtnPressed]}
                onPress={loadJobs}
                accessibilityLabel="Refresh jobs list"
                accessibilityRole="button"
              >
                <Text style={styles.quickBtnText}>↻  Refresh</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.quickBtnDanger, pressed && { opacity: 0.8 }]}
                onPress={signOut}
                accessibilityLabel="Sign out"
                accessibilityRole="button"
              >
                <Text style={styles.quickBtnDangerText}>Sign Out</Text>
              </Pressable>
            </View>

            {/* ── Module Grid ──────────── */}
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.moduleGrid}>
              {QUICK_MODULES
                .filter(m => !(user?.role === "admin" && m.name === "Complaints"))
                .map((m) => (
                  <Pressable
                    key={m.name}
                    style={({ pressed }) => [styles.moduleCard, pressed && styles.moduleCardPressed]}
                    onPress={() => navigation.navigate(m.screen)}
                    accessibilityLabel={`Navigate to ${m.name}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.moduleIcon}>{m.icon}</Text>
                    <Text style={styles.moduleTitle}>{m.name}</Text>
                    <Text style={styles.moduleSub}>{m.desc}</Text>
                    <View style={styles.moduleArrow}>
                      <Text style={styles.moduleArrowText}>›</Text>
                    </View>
                  </Pressable>
                ))}
              {user?.role === "admin" && (
                <Pressable
                  style={({ pressed }) => [styles.moduleCard, { borderColor: Colors.primary }, pressed && styles.moduleCardPressed]}
                  onPress={() => navigation.navigate("AdminUserManagement")}
                  accessibilityLabel="Navigate to User Management"
                  accessibilityRole="button"
                >
                  <Text style={styles.moduleIcon}>👥</Text>
                  <Text style={styles.moduleTitle}>User Management</Text>
                  <View style={[styles.moduleArrow, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.moduleArrowText}>›</Text>
                  </View>
                </Pressable>
              )}
              {user?.role === "admin" && (
                <Pressable
                  style={({ pressed }) => [styles.moduleCard, { borderColor: Colors.primary }, pressed && styles.moduleCardPressed]}
                  onPress={() => navigation.navigate("AdminComplaints")}
                  accessibilityLabel="Navigate to Complaints Management"
                  accessibilityRole="button"
                >
                  <Text style={styles.moduleIcon}>⚠</Text>
                  <Text style={styles.moduleTitle}>Handle Complaints</Text>
                  <View style={[styles.moduleArrow, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.moduleArrowText}>›</Text>
                  </View>
                </Pressable>
              )}
            </View>

            {/* ── Create Job Toggle ────── */}
            {customerMode && (
              <Pressable
                style={({ pressed }) => [styles.toggleFormBtn, pressed && { opacity: 0.8 }]}
                onPress={() => (showForm && editingId ? cancelEdit() : setShowForm((v) => !v))}
                accessibilityLabel={showForm ? "Cancel job creation" : "Post a new job"}
                accessibilityRole="button"
              >
                <Text style={styles.toggleFormText}>
                  {showForm ? "✕  Cancel" : "+  Post a New Job"}
                </Text>
              </Pressable>
            )}

            {/* ── Create/Edit Job Form ──────── */}
            {customerMode && showForm && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{editingId ? "Edit Job" : "New Job"}</Text>

                <Text style={styles.label}>Job Title</Text>
                <ThemedInput
                  style={styles.input}
                  placeholder="Need a plumber"
                  value={form.jobTitle}
                  onChangeText={(v) => updateForm("jobTitle", v)}
                />

                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      style={[styles.chip, form.category === cat && styles.chipActive]}
                      onPress={() => updateForm("category", cat)}
                    >
                      <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>{cat}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={styles.label}>District</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
                  {DISTRICTS.map((dist) => (
                    <Pressable
                      key={dist}
                      style={[styles.chip, form.district === dist && styles.chipActive]}
                      onPress={() => updateForm("district", dist)}
                    >
                      <Text style={[styles.chipText, form.district === dist && styles.chipTextActive]}>{dist}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Min Budget</Text>
                    <ThemedInput
                      style={styles.input}
                      placeholder="1000"
                      keyboardType="numeric"
                      value={form.budgetMin}
                      onChangeText={(v) => updateForm("budgetMin", v)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Max Budget</Text>
                    <ThemedInput
                      style={styles.input}
                      placeholder="5000"
                      keyboardType="numeric"
                      value={form.budgetMax}
                      onChangeText={(v) => updateForm("budgetMax", v)}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Description</Text>
                <ThemedInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Detailed description..."
                  multiline
                  value={form.jobDescription}
                  onChangeText={(v) => updateForm("jobDescription", v)}
                />

                {actionError ? (
                  <Text style={styles.errorText}>⚠ {actionError}</Text>
                ) : null}

                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }, createBusy && { opacity: 0.6 }]}
                  onPress={submitJob}
                  disabled={createBusy}
                >
                  {createBusy ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>{editingId ? "Update Job" : "Post Job"}</Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Status Tabs ──────────── */}
            <View style={styles.tabsContainer}>
              <Pressable
                style={[styles.tab, activeTab === "active" && styles.activeTab]}
                onPress={() => setActiveTab("active")}
              >
                <Text style={[styles.tabText, activeTab === "active" && styles.activeTabText]}>Active Jobs</Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeTab === "history" && styles.activeTab]}
                onPress={() => setActiveTab("history")}
              >
                <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>Job History</Text>
              </Pressable>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💼</Text>
              <Text style={styles.emptyTitle}>{activeTab === "active" ? "No Active Jobs" : "No Job History"}</Text>
              <Text style={styles.emptyDesc}>
                {activeTab === "active"
                  ? "Check back later for new opportunities."
                  : "Your past jobs will appear here once completed or cancelled."}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <JobCard
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPress={() => navigation.navigate("JobDetail", { jobId: item._id })}
            currentUserId={user?.userId || user?._id}
          />
        )}
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

  // Top Bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.md,
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: "#fff",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.primary,
    ...Shadow.sm,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: "#fff",
  },

  // Quick actions
  quickRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickBtn: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 40,
    justifyContent: "center",
  },
  quickBtnPressed: { opacity: 0.7 },
  quickBtnText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  quickBtnDanger: {
    backgroundColor: Colors.errorSurface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.error,
    minHeight: 40,
    justifyContent: "center",
  },
  quickBtnDangerText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  // Section title
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Module Grid
  moduleGrid: {
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  moduleCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    ...Shadow.sm,
  },
  moduleCardPressed: { opacity: 0.8 },
  moduleIcon: { fontSize: 22 },
  moduleTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  moduleSub: {
    display: "none",
  },
  moduleArrow: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleArrowText: {
    color: "#fff",
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    lineHeight: 24,
  },

  // Jobs header
  jobsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },

  // Error
  errorBox: {
    backgroundColor: Colors.errorSurface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },

  // Job Card
  jobCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  jobCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  jobCardTitleWrap: { flex: 1 },
  jobTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  jobMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  jobDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  jobFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  budgetBadge: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  budgetText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },

  // Status badge
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Form Styles
  toggleFormBtn: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  toggleFormText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    ...Shadow.md,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    marginBottom: Spacing.md,
    color: Colors.textPrimary, // Ensure text is visible
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    color: Colors.textPrimary, // Ensure text is visible
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },

  // Owner actions in card
  ownerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginLeft: "auto",
  },
  editBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editBtnText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  deleteBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteBtnText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  // Picker chips
  categoryPicker: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  chipTextActive: {
    color: "#fff",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl * 2,
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center" },
});
