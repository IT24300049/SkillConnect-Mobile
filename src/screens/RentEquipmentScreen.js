import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { rentEquipment } from "../services/apiClient";

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
  successSurface: "rgba(34,197,94,0.12)",
};

function DateField({ label, value, onPress }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={onPress} activeOpacity={0.75}>
        <Ionicons name="calendar-outline" size={16} color={C.primary} />
        <Text style={styles.dateBtnText}>
          {value.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function DatePickerModal({ visible, value, minimumDate, onConfirm, onClose }) {
  const [tempDate, setTempDate] = useState(value);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={onClose} style={styles.pickerHeaderBtn}>
              <Text style={styles.pickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>Select Date</Text>
            <TouchableOpacity onPress={() => onConfirm(tempDate)} style={styles.pickerHeaderBtn}>
              <Text style={styles.pickerDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            minimumDate={minimumDate || new Date()}
            themeVariant="light"
            textColor="#000000"
            style={{ backgroundColor: "#ffffff" }}
            onChange={(_, selected) => { if (selected) setTempDate(selected); }}
          />
        </View>
      </View>
    </Modal>
  );
}

function QuantityStepper({ value, max, onChange }) {
  return (
    <View style={styles.stepperRow}>
      <TouchableOpacity
        style={[styles.stepBtn, value <= 1 && styles.stepBtnDisabled]}
        onPress={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
      >
        <Ionicons name="remove" size={20} color={value <= 1 ? C.textMut : C.text} />
      </TouchableOpacity>
      <Text style={styles.stepValue}>{value}</Text>
      <TouchableOpacity
        style={[styles.stepBtn, value >= max && styles.stepBtnDisabled]}
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Ionicons name="add" size={20} color={value >= max ? C.textMut : C.text} />
      </TouchableOpacity>
    </View>
  );
}

function SummaryRow({ label, value, highlight }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && styles.summaryValueHighlight]}>{value}</Text>
    </View>
  );
}

export default function RentEquipmentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = useAuth();
  const { equipment } = route.params || {};

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);

  const [startDate, setStartDate] = useState(tomorrow);
  const [endDate, setEndDate] = useState(dayAfter);
  const [quantity, setQuantity] = useState(1);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const name = equipment?.equipmentName || equipment?.name || "Equipment";
  const rate = equipment?.rentalPricePerDay || 0;
  const maxQty = equipment?.quantityAvailable || 1;
  const location = equipment?.location || "—";
  const cond = equipment?.equipmentCondition || "good";
  const supplierName = equipment?.supplier?.firstName
    ? `${equipment.supplier.firstName} ${equipment.supplier.lastName || ""}`.trim()
    : "Supplier";

  const diffMs = endDate - startDate;
  const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const totalCost = days * rate * quantity;

  function handleStartConfirm(date) {
    setShowStartPicker(false);
    setStartDate(date);
    // Push end date if it's before or same as new start
    if (endDate <= date) {
      const newEnd = new Date(date);
      newEnd.setDate(newEnd.getDate() + 1);
      setEndDate(newEnd);
    }
  }

  function handleEndConfirm(date) {
    setShowEndPicker(false);
    if (date <= startDate) {
      setError("End date must be after start date.");
      return;
    }
    setError("");
    setEndDate(date);
  }

  async function handleConfirm() {
    setError("");
    if (endDate <= startDate) {
      setError("End date must be after start date.");
      return;
    }
    try {
      setSubmitting(true);
      const result = await rentEquipment(token, equipment._id, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        quantity,
      });

      Alert.alert(
        "Booking Confirmed!",
        `Your rental for "${result.equipmentName}" has been confirmed.\n\n` +
        `📅 ${new Date(result.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} → ` +
        `${new Date(result.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}\n` +
        `📦 Quantity: ${result.quantity}\n` +
        `💰 Total: LKR ${result.totalCost.toLocaleString()}`,
        [{ text: "Done", onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      setError(e.message || "Failed to process rental. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rent Equipment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Equipment Summary Card */}
        <View style={styles.equipCard}>
          <View style={styles.equipIconWrap}>
            <Ionicons name="construct-outline" size={28} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.equipName}>{name}</Text>
            <Text style={styles.equipMeta}>{cond.charAt(0).toUpperCase() + cond.slice(1)} condition • {equipment?.category || "—"}</Text>
            <View style={styles.equipBadgeRow}>
              <View style={styles.badge}>
                <Ionicons name="location-outline" size={12} color={C.textMut} />
                <Text style={styles.badgeText}>{location}</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="person-outline" size={12} color={C.textMut} />
                <Text style={styles.badgeText}>{supplierName}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rateBadge}>
            <Text style={styles.rateAmt}>LKR {rate.toLocaleString()}</Text>
            <Text style={styles.rateLabel}>per day</Text>
          </View>
        </View>

        {/* Date Picker Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Period</Text>
          <View style={styles.dateRow}>
            <DateField
              label="START DATE"
              value={startDate}
              onPress={() => setShowStartPicker(true)}
            />
            <View style={styles.dateArrow}>
              <Ionicons name="arrow-forward" size={16} color={C.textMut} />
            </View>
            <DateField
              label="END DATE"
              value={endDate}
              onPress={() => setShowEndPicker(true)}
            />
          </View>
          <View style={styles.durationChip}>
            <Ionicons name="time-outline" size={14} color={C.primary} />
            <Text style={styles.durationText}>{days} day{days !== 1 ? "s" : ""} rental period</Text>
          </View>
        </View>

        {/* Quantity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.qtyRow}>
            <View>
              <Text style={styles.qtyLabel}>Units to Rent</Text>
              <Text style={styles.qtyAvail}>{maxQty} unit{maxQty !== 1 ? "s" : ""} available</Text>
            </View>
            <QuantityStepper value={quantity} max={maxQty} onChange={setQuantity} />
          </View>
        </View>

        {/* Cost Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost Summary</Text>
          <View style={styles.summaryCard}>
            <SummaryRow label="Daily Rate" value={`LKR ${rate.toLocaleString()}`} />
            <SummaryRow label="Duration" value={`${days} day${days !== 1 ? "s" : ""}`} />
            <SummaryRow label="Quantity" value={`× ${quantity}`} />
            <View style={styles.summaryDivider} />
            <SummaryRow
              label="Total Amount"
              value={`LKR ${totalCost.toLocaleString()}`}
              highlight
            />
          </View>
        </View>

        {/* Error */}
        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={C.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>LKR {totalCost.toLocaleString()}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.85 }, submitting && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.confirmBtnText}>Confirm Rental</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Date Picker Modals */}
      <DatePickerModal
        visible={showStartPicker}
        value={startDate}
        minimumDate={new Date()}
        onConfirm={handleStartConfirm}
        onClose={() => setShowStartPicker(false)}
      />
      <DatePickerModal
        visible={showEndPicker}
        value={endDate}
        minimumDate={(() => { const d = new Date(startDate); d.setDate(d.getDate() + 1); return d; })()}
        onConfirm={handleEndConfirm}
        onClose={() => setShowEndPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.cardBorder,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: C.text },

  content: { padding: 20, gap: 16, paddingBottom: 32 },

  /* Equipment card */
  equipCard: {
    backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder,
    padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 12,
  },
  equipIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: C.primarySurface, alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  equipName: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 3 },
  equipMeta: { fontSize: 12, color: C.textMut, marginBottom: 6 },
  equipBadgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4 },
  badgeText: { fontSize: 11, color: C.textMut },
  rateBadge: { alignItems: "flex-end", flexShrink: 0 },
  rateAmt: { fontSize: 16, fontWeight: "800", color: C.primary },
  rateLabel: { fontSize: 10, color: C.textMut, marginTop: 1 },

  /* Sections */
  section: {
    backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, padding: 16,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: C.textSec, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 14 },

  /* Date fields */
  dateRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  fieldLabel: { fontSize: 10, fontWeight: "700", color: C.textMut, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 },
  dateBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.input, borderWidth: 1, borderColor: C.inputBorder,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, minHeight: 48,
  },
  dateBtnText: { fontSize: 14, fontWeight: "600", color: C.text },
  dateArrow: { paddingBottom: 12, alignSelf: "flex-end" },
  durationChip: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12,
    backgroundColor: C.primarySurface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    alignSelf: "flex-start",
  },
  durationText: { fontSize: 13, fontWeight: "600", color: C.primary },

  /* Quantity */
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qtyLabel: { fontSize: 15, fontWeight: "600", color: C.text },
  qtyAvail: { fontSize: 12, color: C.textMut, marginTop: 2 },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  stepBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.input, borderWidth: 1, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center",
  },
  stepBtnDisabled: { opacity: 0.4 },
  stepValue: { fontSize: 22, fontWeight: "800", color: C.text, minWidth: 40, textAlign: "center" },

  /* Cost summary */
  summaryCard: { gap: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 14, color: C.textSec },
  summaryValue: { fontSize: 14, fontWeight: "600", color: C.text },
  summaryValueHighlight: { fontSize: 20, fontWeight: "800", color: C.primary },
  summaryDivider: { height: 1, backgroundColor: C.divider, marginVertical: 4 },

  /* Error */
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.errorSurface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "rgba(255,68,68,0.3)",
  },
  errorText: { color: C.error, fontSize: 13, flex: 1 },

  /* Footer */
  footer: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderTopWidth: 1, borderTopColor: C.cardBorder,
    backgroundColor: C.card,
  },
  footerTotal: { flex: 1 },
  footerTotalLabel: { fontSize: 12, color: C.textMut, fontWeight: "600" },
  footerTotalValue: { fontSize: 20, fontWeight: "800", color: C.text, marginTop: 1 },
  confirmBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.primary, borderRadius: 14, minHeight: 52,
  },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  /* Date Picker Modal */
  pickerOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  pickerSheet: {
    backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 0 : 16,
  },
  pickerHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#e0e0e0",
  },
  pickerHeaderBtn: { minWidth: 60 },
  pickerTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
  pickerCancel: { fontSize: 16, color: "#8e8e93" },
  pickerDone: { fontSize: 16, fontWeight: "700", color: "#FF6B00", textAlign: "right" },
});
