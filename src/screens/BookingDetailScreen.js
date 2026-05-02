import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Colors, FontSize, FontWeight, Spacing } from "../theme";
import { useAuth } from "../context/AuthContext";
import { getBookingById, cancelBooking } from "../services/apiClient";
import StatusBadge from "../components/StatusBadge";
import FilterSheet from "../components/FilterSheet";

const TIMELINE_STEPS = ["requested", "accepted", "in_progress", "completed"];

export default function BookingDetailScreen() {
  const { token, user } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId } = route.params;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelSheetVisible, setCancelSheetVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      const data = await getBookingById(token, bookingId);
      setBooking(data);
    } catch (error) {
      console.error("Failed to load booking details", error);
      Alert.alert("Error", "Could not load booking details.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [token, bookingId, navigation]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert("Error", "Please provide a reason for cancellation.");
      return;
    }
    setCancelling(true);
    try {
      await cancelBooking(token, bookingId, cancelReason);
      Alert.alert("Success", "Booking cancelled.");
      setCancelSheetVisible(false);
      fetchBooking();
    } catch (error) {
      Alert.alert("Failed", error.message || "Failed to cancel booking.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!booking) return null;

  const isCustomer = user?.role === "customer";
  const partner = isCustomer ? booking.worker : booking.customer;
  const partnerName = partner ? `${partner.firstName} ${partner.lastName}` : "Unknown";

  const getStepIndex = (status) => TIMELINE_STEPS.indexOf(status);
  const currentStepIdx = getStepIndex(booking.status);
  const isCancelled = booking.status === "cancelled" || booking.status === "rejected";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{booking.serviceDetails}</Text>
          <StatusBadge status={booking.status} style={{ alignSelf: "center", marginTop: Spacing.sm }} />
        </View>

        {!isCancelled && currentStepIdx !== -1 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <View style={styles.timeline}>
              {TIMELINE_STEPS.map((step, idx) => {
                const isActive = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <View key={step} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, isActive && styles.timelineDotActive]} />
                    {idx < TIMELINE_STEPS.length - 1 && (
                      <View style={[styles.timelineLine, isActive && !isCurrent && styles.timelineLineActive]} />
                    )}
                    <Text style={[styles.timelineText, isActive && styles.timelineTextActive]}>
                      {step.replace("_", " ")}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {isCancelled && (
          <View style={[styles.card, { borderColor: "#EF4444", backgroundColor: "rgba(239,68,68,0.05)" }]}>
            <Text style={[styles.sectionTitle, { color: "#EF4444" }]}>Cancellation Reason</Text>
            <Text style={styles.description}>{booking.cancellationReason || "No reason provided."}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Schedule & Cost</Text>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />
            <Text style={styles.detailText}>{new Date(booking.scheduledDate).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={Colors.textMuted} />
            <Text style={styles.detailText}>{booking.scheduledTime} ({booking.durationHours} hours)</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={20} color={Colors.textMuted} />
            <Text style={styles.detailText}>Total: LKR {booking.totalCost || "TBD"}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{isCustomer ? "Worker" : "Customer"}</Text>
          <View style={styles.partnerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{partnerName.charAt(0)}</Text>
            </View>
            <Text style={styles.partnerName}>{partnerName}</Text>
          </View>
        </View>
      </ScrollView>

      {!isCancelled && booking.status !== "completed" && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={() => setCancelSheetVisible(true)}
          >
            <Text style={styles.dangerButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      )}

      <FilterSheet
        visible={cancelSheetVisible}
        onClose={() => setCancelSheetVisible(false)}
        title="Cancel Booking"
      >
        <Text style={styles.label}>Reason for cancellation</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Please explain why you need to cancel..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={4}
          value={cancelReason}
          onChangeText={setCancelReason}
        />
        <TouchableOpacity 
          style={[styles.primaryButton, cancelling && {opacity: 0.7}]}
          onPress={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryButtonText}>Confirm Cancellation</Text>}
        </TouchableOpacity>
      </FilterSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: Spacing.md, backgroundColor: Colors.surfaceCard, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  backButton: { padding: Spacing.xs },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  heroCard: {
    backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: Spacing.xl,
    alignItems: "center", borderWidth: 1, borderColor: Colors.border,
  },
  heroTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: "center" },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  description: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm },
  detailText: { fontSize: FontSize.md, color: Colors.textPrimary, marginLeft: Spacing.sm },
  partnerRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surfaceHighlight, justifyContent: "center", alignItems: "center", marginRight: Spacing.md },
  avatarText: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.primary },
  partnerName: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.textPrimary },
  footer: { padding: Spacing.lg, backgroundColor: Colors.surfaceCard, borderTopWidth: 1, borderTopColor: Colors.border },
  dangerButton: { backgroundColor: "rgba(239, 68, 68, 0.1)", padding: Spacing.md, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#EF4444" },
  dangerButtonText: { color: "#EF4444", fontWeight: FontWeight.bold, fontSize: FontSize.md },
  label: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  textArea: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: Spacing.md, color: Colors.textPrimary, minHeight: 100, textAlignVertical: "top", marginBottom: Spacing.lg },
  primaryButton: { backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: 8, alignItems: "center" },
  primaryButtonText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.md },
  timeline: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: Spacing.sm },
  timelineItem: { flex: 1, alignItems: "center", position: "relative" },
  timelineDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.surfaceHighlight, zIndex: 2 },
  timelineDotActive: { backgroundColor: Colors.primary },
  timelineLine: { position: "absolute", top: 7, left: "50%", right: "-50%", height: 2, backgroundColor: Colors.surfaceHighlight, zIndex: 1 },
  timelineLineActive: { backgroundColor: Colors.primary },
  timelineText: { fontSize: 10, color: Colors.textMuted, marginTop: 8, textAlign: "center", textTransform: "capitalize" },
  timelineTextActive: { color: Colors.textPrimary, fontWeight: "bold" },
});
