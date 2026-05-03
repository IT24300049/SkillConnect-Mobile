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
import SelectionField from "../components/SelectionField";
import PickerModal from "../components/PickerModal";
import { CATEGORIES } from "../constants/categories";
import Ionicons from "@expo/vector-icons/Ionicons";

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
            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={() => onEdit(item)}
              accessibilityLabel="Edit Job"
            >
              <Ionicons name="create-outline" size={18} color={Colors.primary} />
              <Text style={styles.iconBtnTextPrimary}>Edit</Text>
            </TouchableOpacity>
            
            <View style={styles.vDivider} />

            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={() => onDelete(item._id)}
              accessibilityLabel="Delete Job"
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={styles.iconBtnTextDanger}>Delete</Text>
            </TouchableOpacity>
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
  const [errors, setErrors] = useState({});

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);

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
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
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
    setErrors({});
  }

  function cancelEdit() {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
    setActionError("");
    setErrors({});
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
    const newErrors = {};
    if (!form.jobTitle.trim()) newErrors.jobTitle = "Required";
    if (!form.category) newErrors.category = "Required";
    if (!form.jobDescription.trim()) newErrors.jobDescription = "Required";

    const min = Number(form.budgetMin) || 0;
    const max = Number(form.budgetMax) || 0;

    if (min > 0 && max > 0 && min >= max) {
      newErrors.budgetMax = "Must be > Min";
      setActionError("Maximum budget must be greater than minimum budget");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (!actionError) setActionError("Please fill in all required fields correctly.");
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
      setErrors({});
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
                <View style={styles.cardHeader}>
                  <Ionicons name={editingId ? "create-outline" : "add-circle-outline"} size={24} color={Colors.primary} />
                  <Text style={styles.cardTitle}>{editingId ? "Edit Job" : "New Job"}</Text>
                </View>

                {/* Section 1: Basic Info */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>General Information</Text>
                  <Text style={styles.label}>Job Title</Text>
                  <ThemedInput
                    style={[styles.input, errors.jobTitle && styles.inputError]}
                    placeholder="e.g. House plumbing repair"
                    value={form.jobTitle}
                    onChangeText={(v) => updateForm("jobTitle", v)}
                  />
                  {errors.jobTitle && <Text style={styles.fieldErrorText}>{errors.jobTitle}</Text>}
                </View>

                {/* Section 2: Category & Location */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Category & Location</Text>
                  <View style={{ flexDirection: "row", gap: Spacing.md }}>
                    <View style={{ flex: 1 }}>
                      <SelectionField
                        label="Category"
                        value={form.category}
                        placeholder="Select category"
                        onPress={() => setShowCategoryPicker(true)}
                        icon="construct-outline"
                        error={errors.category}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <SelectionField
                        label="District"
                        value={form.district}
                        placeholder="Select district"
                        onPress={() => setShowDistrictPicker(true)}
                        icon="location-outline"
                      />
                    </View>
                  </View>
                </View>

                {/* Section 3: Budget & Details */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Budget & Description</Text>
                  <View style={{ flexDirection: "row", gap: Spacing.md }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Min Budget</Text>
                      <View style={styles.inputWithIcon}>
                        <Text style={styles.inputPrefix}>Rs.</Text>
                        <ThemedInput
                          style={styles.flexInput}
                          placeholder="1000"
                          keyboardType="numeric"
                          value={form.budgetMin}
                          onChangeText={(v) => updateForm("budgetMin", v)}
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Max Budget</Text>
                      <View style={[styles.inputWithIcon, errors.budgetMax && styles.inputError]}>
                        <Text style={styles.inputPrefix}>Rs.</Text>
                        <ThemedInput
                          style={styles.flexInput}
                          placeholder="5000"
                          keyboardType="numeric"
                          value={form.budgetMax}
                          onChangeText={(v) => updateForm("budgetMax", v)}
                        />
                      </View>
                      {errors.budgetMax && <Text style={styles.fieldErrorText}>{errors.budgetMax}</Text>}
                    </View>
                  </View>

                  <Text style={styles.label}>Job Description</Text>
                  <ThemedInput
                    style={[styles.input, styles.textArea, errors.jobDescription && styles.inputError]}
                    placeholder="Provide details about the job, specific requirements, or timing..."
                    multiline
                    value={form.jobDescription}
                    onChangeText={(v) => updateForm("jobDescription", v)}
                  />
                  {errors.jobDescription && <Text style={styles.fieldErrorText}>{errors.jobDescription}</Text>}
                </View>

                {actionError ? (
                  <View style={styles.formError}>
                    <Ionicons name="alert-circle" size={20} color={Colors.error} />
                    <Text style={styles.errorText}>{actionError}</Text>
                  </View>
                ) : null}

                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }, createBusy && { opacity: 0.6 }]}
                  onPress={submitJob}
                  disabled={createBusy}
                >
                  {createBusy ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryBtnText}>{editingId ? "Save Changes" : "Post Job Now"}</Text>
                    </>
                  )}
                </Pressable>

                {/* Modals */}
                <PickerModal
                  visible={showCategoryPicker}
                  title="Select Category"
                  items={CATEGORIES}
                  onSelect={(v) => updateForm("category", v)}
                  onClose={() => setShowCategoryPicker(false)}
                />
                <PickerModal
                  visible={showDistrictPicker}
                  title="Select District"
                  items={DISTRICTS}
                  onSelect={(v) => updateForm("district", v)}
                  onClose={() => setShowDistrictPicker(false)}
                />
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
  ownerActions: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 0,
  },
  iconBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 4,
  },
  iconBtnTextPrimary: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  iconBtnTextDanger: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.error,
  },
  vDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
    marginHorizontal: 2,
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  formSection: {
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    height: 52,
    backgroundColor: Colors.surfaceInput,
    color: Colors.textPrimary,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceInput,
    paddingHorizontal: Spacing.md,
    height: 52,
    marginBottom: Spacing.md,
  },
  inputPrefix: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    marginRight: Spacing.xs,
  },
  flexInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: Spacing.md,
  },
  formError: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.errorSurface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 1.5,
  },
  fieldErrorText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: -Spacing.md + 4,
    marginBottom: Spacing.md,
    marginLeft: 4,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: Spacing.sm,
    ...Shadow.md,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
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
