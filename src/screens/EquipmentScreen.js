import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { createEquipment, deleteEquipment, getEquipment, updateEquipment } from "../services/apiClient";

const INITIAL_FORM = {
  equipmentName: "",
  equipmentDescription: "",
  category: "Power Tools",
  equipmentCondition: "good",
  rentalPricePerDay: "",
  quantityTotal: "1",
  isAvailable: true,
  location: "Colombo",
};

const CATEGORIES = ["Power Tools", "Hand Tools", "Construction", "Electrical", "Plumbing", "Landscaping", "Safety", "Vehicles", "Other"];
const CONDITIONS = ["new", "excellent", "good", "fair"];
const CONDITION_LABELS = { new: "New", excellent: "Excellent", good: "Good", fair: "Fair" };
const CONDITION_COLORS = { new: "#22C55E", excellent: "#3B82F6", good: "#F59E0B", fair: "#F97316" };

const DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Moneragala", "Ratnapura", "Kegalle",
];

function getSupplierId(item) {
  return item?.supplier?._id || item?.supplier;
}

function EquipmentCard({ item, canManage, isCustomer, onEdit, onDelete }) {
  const navigation = useNavigation();
  const name = item.equipmentName || item.name || "Equipment";
  const rate = item.rentalPricePerDay || item.dailyRate;
  const cond = item.equipmentCondition || "good";
  const condColor = CONDITION_COLORS[cond] || "#F59E0B";
  const supplierName = item.supplier?.firstName
    ? `${item.supplier.firstName} ${item.supplier.lastName || ""}`.trim()
    : "Supplier";
  const qtyAvail = item.quantityAvailable ?? 0;
  const qtyTotal = item.quantityTotal ?? 0;

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="construct-outline" size={22} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle} numberOfLines={1}>{name}</Text>
          <Text style={styles.itemCategory}>{item.category || "—"}</Text>
        </View>
        <View style={[styles.condBadge, { backgroundColor: condColor + "22", borderColor: condColor + "55" }]}>
          <Text style={[styles.condText, { color: condColor }]}>{CONDITION_LABELS[cond] || cond}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Daily Rate</Text>
          <Text style={styles.statValue}>LKR {rate || "—"}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Qty Available</Text>
          <Text style={styles.statValue}>{qtyAvail}/{qtyTotal}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: item.isAvailable ? C.success : C.error }]} />
            <Text style={[styles.statValue, { color: item.isAvailable ? C.success : C.error }]}>
              {item.isAvailable ? "Available" : "Unavailable"}
            </Text>
          </View>
        </View>
      </View>

      {/* Location + Supplier Row */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={13} color={C.textMut} />
          <Text style={styles.metaText}>{item.location || "Location N/A"}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="person-circle-outline" size={13} color={C.textMut} />
          <Text style={styles.metaText}>{supplierName}</Text>
        </View>
      </View>

      {/* Actions */}
      {(canManage || isCustomer) && (
        <View style={styles.actionRow}>
          {isCustomer && (
            <Pressable
              style={({ pressed }) => [styles.rentBtn, pressed && { opacity: 0.8 }, !item.isAvailable && styles.rentBtnDisabled]}
              disabled={!item.isAvailable}
              onPress={() => navigation.navigate("RentEquipment", { equipment: item })}
              accessibilityLabel="Rent this equipment"
            >
              <Ionicons name="cart-outline" size={15} color={item.isAvailable ? "#fff" : C.textMut} />
              <Text style={[styles.rentBtnText, !item.isAvailable && { color: C.textMut }]}>
                {item.isAvailable ? "Rent Now" : "Unavailable"}
              </Text>
            </Pressable>
          )}
          {canManage && (
            <>
              <Pressable
                style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.75 }]}
                onPress={() => onEdit(item)}
                accessibilityLabel="Edit equipment"
              >
                <Ionicons name="pencil-outline" size={14} color={C.primary} />
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.75 }]}
                onPress={() =>
                  Alert.alert("Delete Equipment", `Remove "${name}"?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => onDelete(item._id) },
                  ])
                }
                accessibilityLabel="Delete equipment"
              >
                <Ionicons name="trash-outline" size={14} color={C.error} />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

function SectionLabel({ text }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function ChipPicker({ options, selected, onSelect, labelMap }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContent}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          style={[styles.chip, selected === opt && styles.chipActive]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.chipText, selected === opt && styles.chipTextActive]}>
            {labelMap ? labelMap[opt] || opt : opt}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function DistrictDropdown({ selected, onSelect, districts }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity
        style={styles.dropdownBtn}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <Ionicons name="location-outline" size={16} color={C.textSec} />
        <Text style={[styles.dropdownBtnText, !selected && { color: C.textMut }]}>
          {selected || "Select District"}
        </Text>
        <Ionicons name="chevron-down" size={16} color={C.textMut} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownSheet}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select District</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.dropdownClose}>
                <Ionicons name="close" size={22} color={C.textSec} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {districts.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dropdownItem, selected === d && styles.dropdownItemActive]}
                  onPress={() => { onSelect(d); setOpen(false); }}
                >
                  <Text style={[styles.dropdownItemText, selected === d && styles.dropdownItemTextActive]}>{d}</Text>
                  {selected === d && <Ionicons name="checkmark" size={18} color={C.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function EquipmentScreen() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  // Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");

  const supplierMode = user?.role === "supplier";

  const loadData = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const equipment = await getEquipment(token);
      setItems(equipment);
    } catch (e) {
      setError(e.message || "Failed to load equipment");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const ownedSet = useMemo(() => {
    const set = new Set();
    for (const item of items) {
      if (getSupplierId(item) === user?.userId) set.add(item._id);
    }
    return set;
  }, [items, user?.userId]);

  // Filtering Logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const nameMatch = (item.equipmentName || item.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const categoryMatch = filterCategory === "All" || item.category === filterCategory;
      const locationMatch = filterLocation === "All" || item.location === filterLocation;
      return nameMatch && categoryMatch && locationMatch;
    });
  }, [items, searchQuery, filterCategory, filterLocation]);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditingId("");
    setShowForm(false);
    setActionError("");
  }

  function startEdit(item) {
    setEditingId(item._id);
    setActionError("");
    setShowForm(true);
    setForm({
      equipmentName: item.equipmentName || item.name || "",
      equipmentDescription: item.equipmentDescription || item.description || "",
      category: item.category || "Power Tools",
      equipmentCondition: item.equipmentCondition || "good",
      rentalPricePerDay: String(item.rentalPricePerDay || item.dailyRate || ""),
      quantityTotal: String(item.quantityTotal ?? 1),
      isAvailable: item.isAvailable !== false,
      location: item.location || "Colombo",
    });
  }

  async function submitEquipment() {
    if (!supplierMode) { setActionError("Only supplier accounts can manage equipment"); return; }
    if (!form.equipmentName.trim()) { setActionError("Equipment name is required"); return; }
    if (!form.category) { setActionError("Category is required"); return; }
    if (!form.rentalPricePerDay) { setActionError("Daily rate is required"); return; }

    try {
      setActionError("");
      setSubmitting(true);
      const qty = Number(form.quantityTotal || 1);
      const payload = {
        ...form,
        rentalPricePerDay: Number(form.rentalPricePerDay),
        depositAmount: 0,
        quantityAvailable: qty,
        quantityTotal: qty,
      };
      if (editingId) {
        await updateEquipment(token, editingId, payload);
      } else {
        await createEquipment(token, payload);
      }
      resetForm();
      await loadData();
    } catch (e) {
      setActionError(e.message || (editingId ? "Failed to update equipment" : "Failed to create equipment"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(itemId) {
    try {
      setActionError("");
      await deleteEquipment(token, itemId);
      if (editingId === itemId) resetForm();
      await loadData();
    } catch (e) {
      setActionError(e.message || "Failed to delete equipment");
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* ── Page Header ── */}
            <View style={styles.pageHeader}>
              <View>
                <Text style={styles.pageTitle}>Equipment</Text>
                <Text style={styles.pageSubtitle}>
                  {loading ? "Loading..." : `${filteredItems.length} result${filteredItems.length !== 1 ? "s" : ""} found`}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
                  onPress={loadData}
                  accessibilityLabel="Refresh equipment"
                >
                  <Ionicons name="refresh-outline" size={20} color={C.textSec} />
                </Pressable>
                {supplierMode && (
                  <Pressable
                    style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
                    onPress={() => { resetForm(); setShowForm((v) => !v); }}
                    accessibilityLabel={showForm ? "Close form" : "Add equipment"}
                  >
                    <Ionicons name={showForm ? "close" : "add"} size={20} color="#fff" />
                    <Text style={styles.addBtnText}>{showForm ? "Close" : "Add"}</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* ── Search & Filters ── */}
            {!showForm && (
              <View style={styles.filterSection}>
                <View style={styles.searchBar}>
                  <Ionicons name="search-outline" size={18} color={C.textMut} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search equipment..."
                    placeholderTextColor={C.textMut}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery !== "" && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons name="close-circle" size={18} color={C.textMut} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.filterRow}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
                    {["All", ...CATEGORIES].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
                        onPress={() => setFilterCategory(cat)}
                      >
                        <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.locationFilterRow}>
                  <TouchableOpacity
                    style={styles.locationSelector}
                    onPress={() => {
                      // We can reuse the DistrictDropdown logic or just simple toggle for now
                      // But since we want "Pro Max", let's make it look like a nice pill
                    }}
                  >
                    <Ionicons name="location" size={14} color={filterLocation !== "All" ? C.primary : C.textSec} />
                    <Text style={[styles.locationLabel, filterLocation !== "All" && { color: C.primary }]}>
                      {filterLocation === "All" ? "Everywhere" : filterLocation}
                    </Text>
                  </TouchableOpacity>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locationChips}>
                    {["All", "Colombo", "Gampaha", "Kandy", "Galle"].map((loc) => (
                      <TouchableOpacity
                        key={loc}
                        style={[styles.miniChip, filterLocation === loc && styles.miniChipActive]}
                        onPress={() => setFilterLocation(loc)}
                      >
                        <Text style={[styles.miniChipText, filterLocation === loc && styles.miniChipTextActive]}>
                          {loc}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* ── Error Banner ── */}
            {(error || actionError) ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={C.error} />
                <Text style={styles.errorText}>{error || actionError}</Text>
              </View>
            ) : null}

            {/* ── Supplier Form ── */}
            {supplierMode && showForm && (
              <View style={styles.formCard}>
                <View style={styles.formHeaderRow}>
                  <View style={styles.formIconBg}>
                    <Ionicons name={editingId ? "pencil" : "add-circle"} size={18} color={C.primary} />
                  </View>
                  <Text style={styles.formTitle}>{editingId ? "Edit Equipment" : "New Listing"}</Text>
                </View>

                <View style={styles.formDivider} />

                {/* Name */}
                <SectionLabel text="Equipment Name *" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Heavy Duty Drill"
                  placeholderTextColor={C.textMut}
                  value={form.equipmentName}
                  onChangeText={(v) => updateForm("equipmentName", v)}
                  returnKeyType="next"
                />

                {/* Category */}
                <SectionLabel text="Category *" />
                <ChipPicker options={CATEGORIES} selected={form.category} onSelect={(v) => updateForm("category", v)} />

                {/* Condition */}
                <SectionLabel text="Condition *" />
                <ChipPicker options={CONDITIONS} selected={form.equipmentCondition} onSelect={(v) => updateForm("equipmentCondition", v)} labelMap={CONDITION_LABELS} />

                {/* Daily Rate */}
                <SectionLabel text="Daily Rate (LKR) *" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1500"
                  placeholderTextColor={C.textMut}
                  keyboardType="numeric"
                  value={form.rentalPricePerDay}
                  onChangeText={(v) => updateForm("rentalPricePerDay", v)}
                />

                {/* Description */}
                <SectionLabel text="Description" />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe the equipment, its uses, any special notes..."
                  placeholderTextColor={C.textMut}
                  value={form.equipmentDescription}
                  onChangeText={(v) => updateForm("equipmentDescription", v)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {/* Quantity */}
                <SectionLabel text="Total Quantity" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5"
                  placeholderTextColor={C.textMut}
                  keyboardType="numeric"
                  value={form.quantityTotal}
                  onChangeText={(v) => updateForm("quantityTotal", v)}
                />

                {/* Location */}
                <SectionLabel text="District / Location" />
                <DistrictDropdown
                  selected={form.location}
                  onSelect={(v) => updateForm("location", v)}
                  districts={DISTRICTS}
                />

                {/* Availability Toggle */}
                <View style={styles.toggleRow}>
                  <View>
                    <Text style={styles.toggleLabel}>Available for Rental</Text>
                    <Text style={styles.toggleSub}>Customers can see and request this item</Text>
                  </View>
                  <Pressable
                    style={[styles.toggle, form.isAvailable && styles.toggleOn]}
                    onPress={() => updateForm("isAvailable", !form.isAvailable)}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: form.isAvailable }}
                  >
                    <View style={[styles.toggleThumb, form.isAvailable && styles.toggleThumbOn]} />
                  </Pressable>
                </View>

                {/* Submit */}
                <Pressable
                  style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }, submitting && { opacity: 0.6 }]}
                  onPress={submitEquipment}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name={editingId ? "checkmark-circle-outline" : "cloud-upload-outline"} size={18} color="#fff" />
                      <Text style={styles.submitBtnText}>
                        {editingId ? "Update Equipment" : "Create Listing"}
                      </Text>
                    </>
                  )}
                </Pressable>

                {editingId ? (
                  <Pressable style={styles.cancelBtn} onPress={resetForm}>
                    <Text style={styles.cancelBtnText}>Cancel Editing</Text>
                  </Pressable>
                ) : null}
              </View>
            )}

            {/* Loading */}
            {loading && (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={C.primary} size="large" />
                <Text style={styles.loadingText}>Loading equipment...</Text>
              </View>
            )}

            {/* Section heading for list */}
            {!loading && filteredItems.length > 0 && (
              <View style={styles.listHeaderRow}>
                <Text style={styles.listHeading}>{searchQuery || filterCategory !== "All" ? "Search Results" : "All Listings"}</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <Ionicons name={searchQuery ? "search-outline" : "construct-outline"} size={36} color={C.textMut} />
              </View>
              <Text style={styles.emptyTitle}>{searchQuery ? "No Results Found" : "No Equipment Found"}</Text>
              <Text style={styles.emptyDesc}>
                {searchQuery 
                  ? "We couldn't find any items matching your search. Try different keywords or reset filters."
                  : (supplierMode ? "Tap the + Add button above to create your first listing." : "Check back later — no equipment is available right now.")
                }
              </Text>
              { (searchQuery || filterCategory !== "All" || filterLocation !== "All") && (
                <TouchableOpacity 
                  style={styles.resetBtn} 
                  onPress={() => {
                    setSearchQuery("");
                    setFilterCategory("All");
                    setFilterLocation("All");
                  }}
                >
                  <Text style={styles.resetBtnText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <EquipmentCard
            item={item}
            canManage={supplierMode && ownedSet.has(item._id)}
            isCustomer={user?.role === "customer"}
            onEdit={startEdit}
            onDelete={handleDelete}
          />
        )}
      />
    </SafeAreaView>
  );
}

/* ─── Design Tokens ─────────────────────────── */
const C = {
  bg: "#0D0D0F",
  card: "#17171B",
  cardBorder: "#26262E",
  input: "#1E1E24",
  inputBorder: "#2E2E38",
  primary: "#FF6B00",
  primarySurface: "rgba(255,107,0,0.12)",
  text: "#F5F5F7",
  textSec: "#9999A8",
  textMut: "#55555F",
  divider: "#22222A",
  error: "#FF4444",
  errorSurface: "rgba(255,68,68,0.10)",
  success: "#22C55E",
  surface2: "#1C1C22",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  listContent: { paddingBottom: 40 },

  /* Header */
  pageHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  pageTitle: { fontSize: 26, fontWeight: "800", color: C.text, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: C.textMut, marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.primary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, minHeight: 40,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  /* Error */
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: C.errorSurface, borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: "rgba(255,68,68,0.25)",
  },
  errorText: { color: C.error, fontSize: 13, flex: 1 },

  /* Form Card */
  formCard: {
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: C.card, borderRadius: 20,
    borderWidth: 1, borderColor: C.cardBorder,
    padding: 20,
  },
  formHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  formIconBg: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.primarySurface, alignItems: "center", justifyContent: "center",
  },
  formTitle: { fontSize: 17, fontWeight: "700", color: C.text },
  formDivider: { height: 1, backgroundColor: C.divider, marginBottom: 16 },

  /* Form inputs */
  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: C.textSec,
    textTransform: "uppercase", letterSpacing: 0.8,
    marginTop: 16, marginBottom: 6,
  },
  input: {
    backgroundColor: C.input, borderWidth: 1, borderColor: C.inputBorder,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: C.text, fontSize: 15, minHeight: 50,
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },

  /* Chip picker */
  chipScroll: { marginBottom: 4 },
  chipContent: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 10, backgroundColor: C.input,
    borderWidth: 1, borderColor: C.inputBorder,
  },
  chipActive: { backgroundColor: C.primarySurface, borderColor: C.primary },
  chipText: { color: C.textSec, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: C.primary },

  /* Toggle */
  toggleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.divider,
  },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: C.text },
  toggleSub: { fontSize: 12, color: C.textMut, marginTop: 2 },
  toggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: C.inputBorder, justifyContent: "center", paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: C.primary },
  toggleThumb: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  toggleThumbOn: { alignSelf: "flex-end" },

  /* Submit */
  submitBtn: {
    marginTop: 20, backgroundColor: C.primary, borderRadius: 14,
    minHeight: 52, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
  },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelBtn: {
    marginTop: 10, borderRadius: 14, minHeight: 46,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  cancelBtnText: { color: C.textSec, fontWeight: "600", fontSize: 14 },

  /* Loading */
  loadingWrap: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingText: { color: C.textMut, fontSize: 14 },

  /* List section header */
  listHeaderRow: {
    paddingHorizontal: 20, paddingBottom: 8, paddingTop: 4,
  },
  listHeading: { fontSize: 13, fontWeight: "700", color: C.textMut, textTransform: "uppercase", letterSpacing: 0.8 },

  /* Equipment Card */
  card: {
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: C.card, borderRadius: 18,
    borderWidth: 1, borderColor: C.cardBorder,
    padding: 16,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.primarySurface, alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  itemTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 2 },
  itemCategory: { fontSize: 12, color: C.textMut, fontWeight: "500" },
  condBadge: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1,
  },
  condText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },

  /* Stats */
  divider: { height: 1, backgroundColor: C.divider, marginBottom: 12 },
  statsRow: { flexDirection: "row", alignItems: "stretch", marginBottom: 12 },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: C.divider, marginHorizontal: 8 },
  statLabel: { fontSize: 10, color: C.textMut, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 13, color: C.text, fontWeight: "600", textAlign: "center" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },

  /* Meta Row (location + supplier) */
  metaRow: { flexDirection: "row", gap: 16, marginTop: 8, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: C.textMut },

  /* Dropdown */
  dropdownBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.input, borderWidth: 1, borderColor: C.inputBorder,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 50,
  },
  dropdownBtnText: { flex: 1, color: C.text, fontSize: 15, fontWeight: "500" },
  dropdownOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  dropdownSheet: {
    backgroundColor: "#17171B", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: C.cardBorder, maxHeight: "70%",
  },
  dropdownHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 20, borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  dropdownTitle: { fontSize: 17, fontWeight: "700", color: C.text },
  dropdownClose: { padding: 4 },
  dropdownItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  dropdownItemActive: { backgroundColor: C.primarySurface },
  dropdownItemText: { fontSize: 15, color: C.textSec, fontWeight: "500" },
  dropdownItemTextActive: { color: C.primary, fontWeight: "700" },

  /* Actions */
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: C.divider, paddingTop: 12 },
  rentBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderRadius: 10, paddingVertical: 11, backgroundColor: C.primary,
  },
  rentBtnDisabled: { backgroundColor: C.input },
  rentBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  editBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderRadius: 10, paddingVertical: 9, borderWidth: 1,
    borderColor: "rgba(255,107,0,0.4)", backgroundColor: C.primarySurface,
  },
  editBtnText: { color: C.primary, fontWeight: "700", fontSize: 13 },
  deleteBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderRadius: 10, paddingVertical: 9, borderWidth: 1,
    borderColor: "rgba(255,68,68,0.3)", backgroundColor: "rgba(255,68,68,0.08)",
  },
  deleteBtnText: { color: C.error, fontWeight: "700", fontSize: 13 },

  /* Filters */
  filterSection: { paddingHorizontal: 20, marginBottom: 16 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 15 },
  filterRow: { marginBottom: 12 },
  filterChips: { gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, backgroundColor: C.surface2,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  filterChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterChipText: { color: C.textSec, fontSize: 13, fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },

  locationFilterRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  locationSelector: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.surface2, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  locationLabel: { fontSize: 13, color: C.textSec, fontWeight: "600" },
  locationChips: { gap: 6 },
  miniChip: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, backgroundColor: C.input,
    borderWidth: 1, borderColor: C.inputBorder,
  },
  miniChipActive: { backgroundColor: C.primarySurface, borderColor: C.primary },
  miniChipText: { color: C.textMut, fontSize: 12, fontWeight: "500" },
  miniChipTextActive: { color: C.primary, fontWeight: "700" },

  resetBtn: {
    marginTop: 16, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: C.divider,
  },
  resetBtnText: { color: C.textSec, fontSize: 14, fontWeight: "600" },

  /* Empty state */
  emptyState: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyIconBg: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: C.surface2, alignItems: "center", justifyContent: "center",
    marginBottom: 16, borderWidth: 1, borderColor: C.cardBorder,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: C.textMut, textAlign: "center", lineHeight: 21 },
});
