import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, Modal } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRoute, useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors, FontSize, FontWeight, Spacing } from "../theme";
import { useAuth } from "../context/AuthContext";
import { createBooking } from "../services/apiClient";

const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

export default function CreateBookingScreen() {
  const { token } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const { workerId, workerName } = route.params;

  const [date, setDate] = useState(new Date()); 
  const [showPicker, setShowPicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Auto-set date to tomorrow if today is too late (optional)
  useEffect(() => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    setDate(tmrw);
  }, []);

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!selectedTime) newErrors.time = "Please select a time slot";
    if (!notes.trim()) newErrors.notes = "Please provide job details";

    // Double check date validation before sending
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      newErrors.date = "You cannot pick a date in the past";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await createBooking(token, {
        worker: workerId,
        scheduledDate: date.toISOString().split('T')[0],
        scheduledTime: selectedTime,
        durationHours: duration,
        serviceDetails: notes.trim(),
      });
      Alert.alert("Success", "Booking created successfully!");
      navigation.navigate("MainTabs", { screen: "Bookings" }); 
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  function updateNotes(text) {
    setNotes(text);
    if (errors.notes) setErrors(prev => ({...prev, notes: null}));
  }

  function selectTime(time) {
    setSelectedTime(time);
    if (errors.time) setErrors(prev => ({...prev, time: null}));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book {workerName}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          
           <Text style={styles.label}>Date</Text>
          <TouchableOpacity 
            style={[styles.input, errors.date && styles.inputError]} 
            onPress={() => setShowPicker(true)}
          >
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text style={{color: Colors.textPrimary, fontSize: FontSize.md}}>
                {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            </View>
          </TouchableOpacity>
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}

          {/* Date Picker Modal - white background for both platforms */}
          <Modal
            visible={showPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowPicker(false)}
          >
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={styles.pickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                  themeVariant="light"
                  textColor="#000000"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </View>
            </View>
          </Modal>

           <Text style={styles.label}>Start Time</Text>
          <View style={[styles.timeGrid, errors.time && styles.gridError]}>
            {TIME_SLOTS.map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.timeSlot, selectedTime === time && styles.timeSlotActive]}
                onPress={() => selectTime(time)}
              >
                <Text style={[styles.timeText, selectedTime === time && styles.timeTextActive]}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Duration (Hours)</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity 
              style={styles.stepperBtn} 
              onPress={() => setDuration(Math.max(1, duration - 1))}
            >
              <Ionicons name="remove" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{duration}</Text>
            <TouchableOpacity 
              style={styles.stepperBtn} 
              onPress={() => setDuration(Math.min(12, duration + 1))}
            >
              <Ionicons name="add" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
           <Text style={styles.sectionTitle}>Service Details</Text>
          <Text style={styles.label}>What do you need help with?</Text>
          <TextInput
            style={[styles.input, styles.textArea, errors.notes && styles.inputError]}
            placeholder="Please describe the task in detail..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={updateNotes}
          />
          {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryButton, submitting && {opacity: 0.7}]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryButtonText}>Confirm Booking</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: Spacing.md, backgroundColor: Colors.surfaceCard, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  backButton: { padding: Spacing.xs },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: "bold", color: Colors.textPrimary, marginBottom: Spacing.xs },
  input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: Spacing.md, color: Colors.textPrimary, marginBottom: Spacing.md },
  inputError: { borderColor: Colors.error, borderWidth: 1.5, marginBottom: 4 },
  gridError: { padding: 4, borderWidth: 1, borderColor: Colors.error, borderRadius: 8 },
  errorText: { color: Colors.error, fontSize: FontSize.xs, marginBottom: Spacing.md, marginLeft: 4 },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  timeSlot: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  timeSlotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeText: { color: Colors.textSecondary, fontWeight: "500" },
  timeTextActive: { color: Colors.white, fontWeight: "bold" },
  stepperContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: Spacing.sm },
  stepperBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceHighlight, justifyContent: "center", alignItems: "center" },
  stepperValue: { fontSize: FontSize.xxl, fontWeight: "bold", color: Colors.textPrimary, marginHorizontal: Spacing.xl },
  footer: { padding: Spacing.lg, backgroundColor: Colors.surfaceCard, borderTopWidth: 1, borderTopColor: Colors.border },
  primaryButton: { backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: 8, alignItems: "center" },
  primaryButtonText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.md },
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
