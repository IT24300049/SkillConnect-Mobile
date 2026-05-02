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
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from "../theme";
import { DISTRICTS, SRI_LANKA_LOCATIONS } from "../constants/locations";
import { CATEGORIES as SKILLS } from "../constants/categories";
import PickerModal from "../components/PickerModal";

function Checkbox({ value, onValueChange }) {
  return (
    <Pressable
      style={[styles.checkbox, value && styles.checkboxChecked]}
      onPress={() => onValueChange(!value)}
    >
      {value && <Ionicons name="checkmark" size={14} color="#fff" />}
    </Pressable>
  );
}

const ROLES = ["customer", "worker", "supplier"];

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
  agreed: false,
  primarySkill: "",
  hourlyRate: "",
  experience: "",
};

function Field({ label, children }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState("");
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const availableCities = form.district ? SRI_LANKA_LOCATIONS[form.district] : [];

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);

  function updateField(field, value) {
    if (field === "district") {
      setForm((prev) => ({ ...prev, district: value, city: "" }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  }

  // FUNCTION: This runs when the user clicks the "Register" button
  async function handleRegister() {
    // 1. FRONTEND VALIDATION: Check if mandatory fields are empty
    if (!form.firstName || !form.email || !form.password) {
      setError("First name, email and password are required");
      return;
    }

    // 2. FRONTEND VALIDATION: Check if both passwords match
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // 3. FRONTEND VALIDATION: Check extra fields if user is a "Worker"
    if (form.role === "worker") {
      if (!form.primarySkill || !form.hourlyRate || !form.experience) {
        setError("Please fill in all worker details");
        return;
      }
    }

    // 4. FRONTEND VALIDATION: Check if they agreed to terms
    if (!form.agreed) {
      setError("You must agree to the Terms & Conditions");
      return;
    }

    try {
      setError("");
      setSubmitting(true);
      // 5. CALL API: Call the signUp function from AuthContext.js
      await signUp(form);
    } catch (e) {
      setError(e.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = (name) => [
    styles.input,
    focused === name && styles.inputFocused,
  ];

  return (
    <SafeAreaView style={styles.safe}>
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
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>SC</Text>
            </View>
            <Text style={styles.pageTitle}>Create Account</Text>
            <Text style={styles.pageSubtitle}>Join SkillConnect today</Text>
          </View>

          {/* ── Role Selector ─────────── */}
          <View style={styles.roleContainer}>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleBtn, form.role === "customer" && styles.roleBtnActive]}
                onPress={() => updateField("role", "customer")}
              >
                <Ionicons
                  name="person"
                  size={18}
                  color={form.role === "customer" ? "#fff" : Colors.textSecondary}
                />
                <Text style={[styles.roleBtnText, form.role === "customer" && styles.roleBtnTextActive]}>
                  Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, form.role === "worker" && styles.roleBtnActive]}
                onPress={() => updateField("role", "worker")}
              >
                <Ionicons
                  name="construct"
                  size={18}
                  color={form.role === "worker" ? "#fff" : Colors.textSecondary}
                />
                <Text style={[styles.roleBtnText, form.role === "worker" && styles.roleBtnTextActive]}>
                  Worker
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleBtn, form.role === "supplier" && styles.roleBtnActive, { flex: 0.5 }]}
                onPress={() => updateField("role", "supplier")}
              >
                <Ionicons
                  name="cube"
                  size={18}
                  color={form.role === "supplier" ? "#fff" : Colors.textSecondary}
                />
                <Text style={[styles.roleBtnText, form.role === "supplier" && styles.roleBtnTextActive]}>
                  Supplier
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Form Card ───────────── */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Field label="First Name">
                  <TextInput
                    style={inputStyle("firstName")}
                    placeholder="John"
                    placeholderTextColor={Colors.textMuted}
                    value={form.firstName}
                    onChangeText={(v) => updateField("firstName", v)}
                    onFocus={() => setFocused("firstName")}
                    onBlur={() => setFocused("")}
                  />
                </Field>
              </View>
              <View style={styles.rowGap} />
              <View style={styles.flex}>
                <Field label="Last Name">
                  <TextInput
                    style={inputStyle("lastName")}
                    placeholder="Doe"
                    placeholderTextColor={Colors.textMuted}
                    value={form.lastName}
                    onChangeText={(v) => updateField("lastName", v)}
                    onFocus={() => setFocused("lastName")}
                    onBlur={() => setFocused("")}
                  />
                </Field>
              </View>
            </View>

            <Field label="Email">
              <TextInput
                style={inputStyle("email")}
                placeholder="john@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(v) => updateField("email", v)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused("")}
              />
            </Field>

            <Field label="Phone">
              <TextInput
                style={inputStyle("phone")}
                placeholder="077 123 4567"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(v) => updateField("phone", v)}
                onFocus={() => setFocused("phone")}
                onBlur={() => setFocused("")}
              />
            </Field>

            <Field label="Password">
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[inputStyle("password"), { flex: 1, borderBottomRightRadius: 0, borderTopRightRadius: 0 }]}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={(v) => updateField("password", v)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </Field>

            <Field label="Confirm Password">
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[inputStyle("confirmPassword"), { flex: 1, borderBottomRightRadius: 0, borderTopRightRadius: 0 }]}
                  placeholder="Re-enter password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showConfirmPassword}
                  value={form.confirmPassword}
                  onChangeText={(v) => updateField("confirmPassword", v)}
                  onFocus={() => setFocused("confirmPassword")}
                  onBlur={() => setFocused("")}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </Field>

            <View style={styles.row}>
              <View style={styles.flex}>
                <Field label="District">
                  <TouchableOpacity
                    style={inputStyle("district")}
                    onPress={() => setShowDistrictPicker(true)}
                  >
                    <Text
                      style={[
                        styles.pickerValue,
                        !form.district && { color: Colors.textMuted },
                      ]}
                    >
                      {form.district || "Select District"}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </Field>
              </View>
              <View style={styles.rowGap} />
              <View style={styles.flex}>
                <Field label="City">
                  <TouchableOpacity
                    style={[
                      inputStyle("city"),
                      !form.district && styles.disabledPicker,
                    ]}
                    onPress={() => form.district && setShowCityPicker(true)}
                  >
                    <Text
                      style={[
                        styles.pickerValue,
                        (!form.city || !form.district) && { color: Colors.textMuted },
                      ]}
                    >
                      {form.city || "Select City"}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </Field>
              </View>
            </View>

            {/* Pickers */}
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

            {/* ── Worker Fields ────────── */}
            {form.role === "worker" && (
              <View style={styles.workerSection}>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>Worker Profile</Text>

                <Field label="Primary Skill">
                  <TouchableOpacity
                    style={inputStyle("primarySkill")}
                    onPress={() => setShowSkillPicker(true)}
                  >
                    <Text
                      style={[
                        styles.pickerValue,
                        !form.primarySkill && { color: Colors.textMuted },
                      ]}
                    >
                      {form.primarySkill || "Select Primary Skill"}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </Field>

                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Field label="Hourly Rate (LKR)">
                      <TextInput
                        style={inputStyle("hourlyRate")}
                        placeholder="e.g. 1500"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numeric"
                        value={form.hourlyRate}
                        onChangeText={(v) => updateField("hourlyRate", v)}
                        onFocus={() => setFocused("hourlyRate")}
                        onBlur={() => setFocused("")}
                      />
                    </Field>
                  </View>
                  <View style={styles.rowGap} />
                  <View style={styles.flex}>
                    <Field label="Experience (Years)">
                      <TextInput
                        style={inputStyle("experience")}
                        placeholder="e.g. 5"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numeric"
                        value={form.experience}
                        onChangeText={(v) => updateField("experience", v)}
                        onFocus={() => setFocused("experience")}
                        onBlur={() => setFocused("")}
                      />
                    </Field>
                  </View>
                </View>

                <PickerModal
                  visible={showSkillPicker}
                  onClose={() => setShowSkillPicker(false)}
                  onSelect={(val) => updateField("primarySkill", val)}
                  items={SKILLS}
                  title="Select Primary Skill"
                  placeholder="Search skills..."
                />
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.termsRow}>
              <Checkbox
                value={form.agreed}
                onValueChange={(v) => updateField("agreed", v)}
                color={form.agreed ? Colors.primary : undefined}
                style={styles.checkbox}
              />
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.linkHighlight}>Terms &amp; Conditions</Text>
              </Text>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                submitting && styles.primaryButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Register</Text>
              )}
            </Pressable>

            {navigation && (
              <Pressable
                style={styles.linkRow}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.linkText}>
                  Already have an account?{" "}
                  <Text style={styles.linkHighlight}>Sign In</Text>
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  rowGap: { width: Spacing.md },

  // Header
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Shadow.lg,
  },
  logoText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: "#fff",
    letterSpacing: 1,
  },
  pageTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  // Card
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.lg,
  },

  // Fields
  fieldGroup: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceInput,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    minHeight: 50,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: "#1F1500",
  },

  // Role selector
  roleContainer: {
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  roleRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceInput,
    gap: Spacing.sm,
  },
  roleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadow.md,
  },
  roleBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  roleBtnTextActive: {
    color: "#fff",
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  eyeIcon: {
    position: "absolute",
    right: 0,
    height: "100%",
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  pickerValue: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    flex: 1,
  },
  disabledPicker: {
    opacity: 0.5,
    backgroundColor: Colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceInput,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
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

  // Worker
  workerSection: {
    marginTop: Spacing.sm,
  },

  // Buttons
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    ...Shadow.md,
  },
  primaryButtonPressed: { backgroundColor: Colors.primaryDark },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.4,
  },
  linkRow: {
    alignItems: "center",
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  linkText: { color: Colors.textMuted, fontSize: FontSize.base },
  linkHighlight: { color: Colors.primary, fontWeight: FontWeight.bold },
});
