import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { useAuth } from "../context/AuthContext";
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, SharedStyles } from "../theme";
import { DISTRICTS, SRI_LANKA_LOCATIONS } from "../constants/locations";
import { CATEGORIES as SKILLS } from "../constants/categories";
import PickerModal from "../components/PickerModal";



const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  district: "",
  city: "",
  role: "customer",
  primarySkill: "",
  hourlyRate: "",
  experience: "",
};

function SectionHeader({ title, icon }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconBox}>
        <Ionicons name={icon} size={16} color={Colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function RequirementItem({ label, met }) {
  return (
    <View style={styles.requirementRow}>
      <Ionicons
        name={met ? "checkmark-circle" : "close-circle-outline"}
        size={14}
        color={met ? Colors.success : Colors.textMuted}
      />
      <Text style={[styles.requirementText, met && { color: Colors.success, fontWeight: "600" }]}>
        {label}
      </Text>
    </View>
  );
}

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState("");
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);

  // Real-time password complexity check (Regex-based)
  // Ensures user meets industry standards before they click register
  const passwordRequirements = {
    length: form.password.length >= 8, // Min 8 characters
    upper: /[A-Z]/.test(form.password), // At least one uppercase
    lower: /[a-z]/.test(form.password), // At least one lowercase
    number: /[0-9]/.test(form.password), // At least one number
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(form.password), // At least one special character
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  const availableCities = form.district ? SRI_LANKA_LOCATIONS[form.district] : [];

  function updateField(field, value) {
    if (field === "district") {
      setForm((prev) => ({ ...prev, district: value, city: "" }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleRegister() {
    const newErrors = {};

    // Identity check
    if (!form.firstName) newErrors.firstName = true;
    if (!form.email) newErrors.email = true;
    if (!form.password) newErrors.password = true;
    if (!form.confirmPassword) newErrors.confirmPassword = true;

    // Password Complexity Check
    if (!isPasswordValid) {
      newErrors.password = true;
      setError("Password does not meet all security requirements");
      setErrors(newErrors);
      return;
    }

    // Password match check
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      newErrors.password = true;
      newErrors.confirmPassword = true;
      setError("Passwords do not match");
      setErrors(newErrors);
      return;
    }

    // Worker check
    if (form.role === "worker") {
      if (!form.primarySkill) newErrors.primarySkill = true;
      if (!form.hourlyRate) newErrors.hourlyRate = true;
      if (!form.experience) newErrors.experience = true;
    }

    // Check if any errors
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError("Please fill in all required fields highlighted in red");
      return;
    }

    try {
      setError("");
      setSubmitting(true);
      await signUp(form);
    } catch (e) {
      setError(e.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputContainerStyle = (name) => [
    styles.inputWrapper,
    focused === name && styles.inputWrapperFocused,
    errors[name] && styles.inputWrapperError,
  ];

  return (
    <SafeAreaView style={SharedStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ──────────────── */}
          <View style={styles.header}>
            <View style={styles.brandBox}>
              <View style={styles.logoCircle}>
                <Ionicons name="flash" size={32} color="#fff" />
              </View>
              <View>
                <Text style={styles.brandTitle}>SkillConnect</Text>
                <Text style={styles.brandSubtitle}>Empowering Local Services</Text>
              </View>
            </View>
            <Text style={styles.pageTitle}>Create Account</Text>
            <Text style={styles.pageSubtitle}>Select your role to get started</Text>
          </View>

          {/* ── Role Segmented Switcher ─────────── */}
          <View style={styles.segmentedControl}>
            <Pressable
              style={[styles.segment, form.role === "customer" && styles.segmentActive]}
              onPress={() => updateField("role", "customer")}
            >
              <Ionicons
                name="person"
                size={18}
                color={form.role === "customer" ? "#fff" : Colors.textMuted}
              />
              <Text style={[styles.segmentText, form.role === "customer" && styles.segmentTextActive]}>
                Customer
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segment, form.role === "worker" && styles.segmentActive]}
              onPress={() => updateField("role", "worker")}
            >
              <Ionicons
                name="construct"
                size={18}
                color={form.role === "worker" ? "#fff" : Colors.textMuted}
              />
              <Text style={[styles.segmentText, form.role === "worker" && styles.segmentTextActive]}>
                Worker
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segment, form.role === "supplier" && styles.segmentActive]}
              onPress={() => updateField("role", "supplier")}
            >
              <Ionicons
                name="cube"
                size={18}
                color={form.role === "supplier" ? "#fff" : Colors.textMuted}
              />
              <Text style={[styles.segmentText, form.role === "supplier" && styles.segmentTextActive]}>
                Supplier
              </Text>
            </Pressable>
          </View>

          {/* ── Form Card ───────────── */}
          <View style={[SharedStyles.card, styles.card]}>

            {/* Identity Section */}
            <SectionHeader title="Personal Identity" icon="finger-print-outline" />
            <View style={styles.row}>
              <View style={styles.flex}>
                <View style={inputContainerStyle("firstName")}>
                  <Ionicons name="person-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor={Colors.textMuted}
                    value={form.firstName}
                    onChangeText={(v) => updateField("firstName", v)}
                    onFocus={() => setFocused("firstName")}
                    onBlur={() => setFocused("")}
                  />
                </View>
              </View>
              <View style={{ width: Spacing.md }} />
              <View style={styles.flex}>
                <View style={inputContainerStyle("lastName")}>
                  <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    placeholderTextColor={Colors.textMuted}
                    value={form.lastName}
                    onChangeText={(v) => updateField("lastName", v)}
                    onFocus={() => setFocused("lastName")}
                    onBlur={() => setFocused("")}
                  />
                </View>
              </View>
            </View>

            <View style={inputContainerStyle("email")}>
              <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(v) => updateField("email", v)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused("")}
              />
            </View>

            <View style={inputContainerStyle("phone")}>
              <Ionicons name="call-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(v) => updateField("phone", v)}
                onFocus={() => setFocused("phone")}
                onBlur={() => setFocused("")}
              />
            </View>

            {/* Security Section */}
            <SectionHeader title="Account Security" icon="lock-closed-outline" />
            <View style={inputContainerStyle("password")}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password (Min. 8 chars, A-Z, 0-9, !@#)"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(v) => updateField("password", v)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused("")}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={Colors.textMuted} />
              </Pressable>
            </View>

            {/* Password Requirements Checklist */}
            {form.password.length > 0 && (
              <View style={styles.requirementsContainer}>
                <View style={styles.requirementsGrid}>
                  <RequirementItem label="8+ Characters" met={passwordRequirements.length} />
                  <RequirementItem label="Uppercase" met={passwordRequirements.upper} />
                  <RequirementItem label="Lowercase" met={passwordRequirements.lower} />
                  <RequirementItem label="Number" met={passwordRequirements.number} />
                  <RequirementItem label="Symbol" met={passwordRequirements.symbol} />
                </View>
              </View>
            )}

            <View style={inputContainerStyle("confirmPassword")}>
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showConfirmPassword}
                value={form.confirmPassword}
                onChangeText={(v) => updateField("confirmPassword", v)}
                onFocus={() => setFocused("confirmPassword")}
                onBlur={() => setFocused("")}
              />
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={Colors.textMuted} />
              </Pressable>
            </View>

            {/* Location Section */}
            <SectionHeader title="Service Area" icon="location-outline" />
            <View style={styles.row}>
              <View style={styles.flex}>
                <Pressable
                  style={inputContainerStyle("district")}
                  onPress={() => setShowDistrictPicker(true)}
                >
                  <Text style={[styles.pickerText, !form.district && { color: Colors.textMuted }]}>
                    {form.district || "District"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
                </Pressable>
              </View>
              <View style={{ width: Spacing.md }} />
              <View style={styles.flex}>
                <Pressable
                  style={[inputContainerStyle("city"), !form.district && { opacity: 0.5 }]}
                  onPress={() => form.district && setShowCityPicker(true)}
                >
                  <Text style={[styles.pickerText, !form.city && { color: Colors.textMuted }]}>
                    {form.city || "City"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
                </Pressable>
              </View>
            </View>

            {/* Role Specific Section */}
            {(form.role === "worker" || form.role === "supplier") && (
              <View style={styles.proSection}>
                <View style={styles.proBanner}>
                  <Ionicons name="ribbon" size={20} color="#fff" />
                  <Text style={styles.proBannerText}>Professional Account Details</Text>
                </View>

                {form.role === "worker" && (
                  <>
                    <View style={inputContainerStyle("primarySkill")}>
                      <Ionicons name="star-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                      <Pressable
                        style={{ flex: 1, height: "100%", justifyContent: "center" }}
                        onPress={() => setShowSkillPicker(true)}
                      >
                        <Text style={[styles.pickerText, !form.primarySkill && { color: Colors.textMuted }]}>
                          {form.primarySkill || "Primary Skill Selection"}
                        </Text>
                      </Pressable>
                      <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
                    </View>

                    <View style={styles.row}>
                      <View style={styles.flex}>
                        <View style={inputContainerStyle("hourlyRate")}>
                          <Text style={styles.inputPrefix}>LKR</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Rate"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="numeric"
                            value={form.hourlyRate}
                            onChangeText={(v) => updateField("hourlyRate", v)}
                            onFocus={() => setFocused("hourlyRate")}
                            onBlur={() => setFocused("")}
                          />
                        </View>
                      </View>
                      <View style={{ width: Spacing.md }} />
                      <View style={styles.flex}>
                        <View style={inputContainerStyle("experience")}>
                          <TextInput
                            style={styles.input}
                            placeholder="Years Exp."
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="numeric"
                            value={form.experience}
                            onChangeText={(v) => updateField("experience", v)}
                            onFocus={() => setFocused("experience")}
                            onBlur={() => setFocused("")}
                          />
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </View>
            )}

            <View style={styles.footer}>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={[SharedStyles.primaryButton, submitting && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.textOnPrimary} size="small" />
                ) : (
                  <Text style={SharedStyles.primaryButtonText}>Create Account</Text>
                )}
              </Pressable>

              <Pressable style={styles.signInRow} onPress={() => navigation.goBack()}>
                <Text style={styles.signInText}>
                  Already have an account? <Text style={styles.linkHighlight}>Sign In</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      <PickerModal
        visible={showDistrictPicker}
        onClose={() => setShowDistrictPicker(false)}
        onSelect={(val) => updateField("district", val)}
        items={DISTRICTS}
        title="Select District"
        placeholder="Search districts..."
      />
      <PickerModal
        visible={showCityPicker}
        onClose={() => setShowCityPicker(false)}
        onSelect={(val) => updateField("city", val)}
        items={availableCities}
        title={`Cities in ${form.district}`}
        placeholder="Search cities..."
      />
      <PickerModal
        visible={showSkillPicker}
        onClose={() => setShowSkillPicker(false)}
        onSelect={(val) => updateField("primarySkill", val)}
        items={SKILLS}
        title="Select Primary Skill"
        placeholder="Search skills..."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: Spacing.xxxl },
  header: { padding: Spacing.xl, paddingTop: Spacing.xxl },
  brandBox: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.xl },
  logoCircle: {
    width: 56, height: 56, borderRadius: Radius.lg, backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center", marginRight: Spacing.lg,
    ...Shadow.md,
  },
  brandTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  brandSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted },
  pageTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  pageSubtitle: { fontSize: FontSize.base, color: Colors.textMuted, marginTop: Spacing.xs },

  segmentedControl: {
    flexDirection: "row", backgroundColor: Colors.surfaceCard,
    marginHorizontal: Spacing.xl, borderRadius: Radius.lg,
    padding: 6, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border,
  },
  segment: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 10, borderRadius: Radius.md, gap: Spacing.xs,
  },
  segmentActive: { backgroundColor: Colors.primary, ...Shadow.sm },
  segmentText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textMuted },
  segmentTextActive: { color: "#fff" },

  card: { marginHorizontal: Spacing.xl, padding: Spacing.xl },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: Spacing.lg, marginBottom: Spacing.md },
  sectionIconBox: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primarySurface,
    alignItems: "center", justifyContent: "center", marginRight: Spacing.sm
  },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 },

  row: { flexDirection: "row", width: "100%" },
  inputWrapper: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.surfaceInput,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, height: 52, marginBottom: Spacing.md,
  },
  inputWrapperFocused: { borderColor: Colors.primary, backgroundColor: "rgba(255, 107, 0, 0.05)" },
  inputWrapperError: { borderColor: Colors.error, backgroundColor: "rgba(255, 59, 48, 0.05)" },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.base },
  inputPrefix: { color: Colors.primary, fontWeight: FontWeight.bold, marginRight: Spacing.xs, fontSize: FontSize.xs },
  eyeBtn: { padding: Spacing.xs },
  pickerText: { fontSize: FontSize.base, color: Colors.textPrimary, flex: 1 },

  proSection: { marginTop: Spacing.md, paddingTop: Spacing.md },
  proBanner: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.primary,
    paddingVertical: 8, paddingHorizontal: Spacing.md, borderRadius: Radius.sm,
    marginBottom: Spacing.lg,
  },
  proBannerText: { color: "#fff", fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginLeft: Spacing.sm, textTransform: "uppercase", letterSpacing: 0.5 },

  footer: { marginTop: Spacing.xl },
  linkHighlight: { color: Colors.primary, fontWeight: FontWeight.bold },
  errorText: { color: Colors.error, fontSize: FontSize.sm, textAlign: "center", marginBottom: Spacing.md },
  signInRow: { marginTop: Spacing.xl, alignItems: "center" },
  signInText: { color: Colors.textMuted, fontSize: FontSize.base },

  // Requirements Checklist
  requirementsContainer: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm, // Bring closer to input
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requirementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "45%", // Two columns roughly
  },
  requirementText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
