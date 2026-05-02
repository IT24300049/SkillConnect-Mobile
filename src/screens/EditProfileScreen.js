import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from "../theme";
import { useAuth } from "../context/AuthContext";
import { getProfile, updateProfile } from "../services/apiClient";
import { DISTRICTS, SRI_LANKA_LOCATIONS } from "../constants/locations";
import PickerModal from "../components/PickerModal";

export default function EditProfileScreen({ navigation }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    district: "",
    city: "",
    bio: "",
    hourlyRate: "",
    experience: "",
    role: "customer",
  });

  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const availableCities = form.district ? SRI_LANKA_LOCATIONS[form.district] || [] : [];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getProfile(token);
      setForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: data.phone || "",
        district: data.district || "",
        city: data.city || "",
        bio: data.bio || "",
        hourlyRate: data.hourlyRate ? String(data.hourlyRate) : "",
        experience: data.experience || "",
        role: data.role,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.firstName.trim()) {
      Alert.alert("Validation", "First name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (form.hourlyRate) payload.hourlyRate = parseFloat(form.hourlyRate);
      
      await updateProfile(token, payload);
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isWorker = form.role === "worker";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={form.firstName}
            onChangeText={(v) => setForm({ ...form, firstName: v })}
            placeholder="First Name"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={form.lastName}
            onChangeText={(v) => setForm({ ...form, lastName: v })}
            placeholder="Last Name"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
            placeholder="Phone Number"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: Spacing.md }}>
              <Text style={styles.label}>District</Text>
              <TouchableOpacity
                style={styles.pickerInput}
                onPress={() => setShowDistrictPicker(true)}
              >
                <Text style={[styles.pickerText, !form.district && { color: Colors.textMuted }]}>
                  {form.district || "Select District"}
                </Text>
                <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>City</Text>
              <TouchableOpacity
                style={[styles.pickerInput, !form.district && styles.disabledPicker]}
                onPress={() => form.district && setShowCityPicker(true)}
              >
                <Text style={[styles.pickerText, (!form.city || !form.district) && { color: Colors.textMuted }]}>
                  {form.city || "Select City"}
                </Text>
                <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Pickers */}
        <PickerModal
          visible={showDistrictPicker}
          onClose={() => setShowDistrictPicker(false)}
          onSelect={(val) => setForm({ ...form, district: val, city: "" })}
          items={DISTRICTS}
          title="Select District"
          placeholder="Search districts..."
        />

        <PickerModal
          visible={showCityPicker}
          onClose={() => setShowCityPicker(false)}
          onSelect={(val) => setForm({ ...form, city: val })}
          items={availableCities}
          title={`Cities in ${form.district}`}
          placeholder="Search cities..."
        />

        {isWorker && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Info</Text>
            
            <Text style={styles.label}>Bio / About Me</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.bio}
              onChangeText={(v) => setForm({ ...form, bio: v })}
              placeholder="Tell clients about your skills and experience..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: Spacing.md }}>
                <Text style={styles.label}>Hourly Rate (LKR)</Text>
                <TextInput
                  style={styles.input}
                  value={form.hourlyRate}
                  onChangeText={(v) => setForm({ ...form, hourlyRate: v })}
                  placeholder="e.g. 1500"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Years of Experience</Text>
                <TextInput
                  style={styles.input}
                  value={form.experience}
                  onChangeText={(v) => setForm({ ...form, experience: v })}
                  placeholder="e.g. 5"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelBtn} 
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveBtnFull, saving && styles.disabledBtn]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnTextFull}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  backButton: {
    padding: Spacing.xs,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.full,
    minWidth: 70,
    alignItems: "center",
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  footer: {
    flexDirection: "row",
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  saveBtnFull: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.md,
  },
  saveBtnTextFull: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    marginBottom: Spacing.lg,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
  },
  pickerInput: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 50,
  },
  pickerText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  disabledPicker: {
    opacity: 0.5,
    backgroundColor: Colors.border,
  },
});
