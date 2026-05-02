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
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from "../theme";

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  // FUNCTION: This runs when the user clicks the "Sign In" button
  async function handleLogin() {
    // 1. FRONTEND VALIDATION: Check if email or password is empty
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    try {
      setError("");
      setSubmitting(true);
      // 2. CALL API: Call the signIn function from AuthContext.js
      // This will talk to the backend /api/auth/login
      await signIn(email, password);
    } catch (e) {
      // 3. ERROR HANDLING: Show error if login fails (e.g. wrong password)
      setError(e.message || "Login failed. Check your credentials.");
    } finally {
      setSubmitting(false);
    }
  }

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
          {/* ── Logo / Hero ─────────────── */}
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>SC</Text>
            </View>
            <Text style={styles.appName}>SkillConnect</Text>
            <Text style={styles.tagline}>Find skilled workers, get things done.</Text>
          </View>

          {/* ── Card ─────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your account</Text>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={[styles.input, emailFocused && styles.inputFocused]}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, passFocused && styles.inputFocused]}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                textContentType="password"
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            {/* Login Button */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                submitting && styles.primaryButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={submitting}
              accessibilityLabel="Login button"
              accessibilityRole="button"
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </Pressable>

            {/* Register link */}
            <Pressable
              style={styles.linkRow}
              onPress={() => navigation.navigate("Register")}
              accessibilityLabel="Go to registration page"
              accessibilityRole="link"
            >
              <Text style={styles.linkText}>
                Don't have an account?{" "}
                <Text style={styles.linkHighlight}>Create one</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },

  // Hero
  hero: {
    alignItems: "center",
    marginBottom: Spacing.xxxl,
  },
  logoCircle: {
    width: 72,
    height: 72,
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
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: FontSize.sm,
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
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },

  // Form
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
    minHeight: 52,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: "#1F1500",
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
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
  },

  // Buttons
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    marginTop: Spacing.sm,
    ...Shadow.md,
  },
  primaryButtonPressed: {
    backgroundColor: Colors.primaryDark,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.4,
  },

  // Link
  linkRow: {
    alignItems: "center",
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  linkText: {
    color: Colors.textMuted,
    fontSize: FontSize.base,
  },
  linkHighlight: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});
