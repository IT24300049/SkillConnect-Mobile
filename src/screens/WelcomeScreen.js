import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from "../theme";

const { width } = Dimensions.get("window");

export default function WelcomeScreen({ navigation }) {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 10,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const Step = ({ icon, title, desc }) => (
    <View style={styles.stepContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={24} color={Colors.primary} />
      </View>
      <View style={styles.stepText}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* ── Background Elements ─────────────── */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim }}
      >
        {/* ── Header / Logo ─────────────── */}
        <Animated.View style={[styles.header, { transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>SC</Text>
          </View>
          <Text style={styles.appName}>SkillConnect</Text>
          <Text style={styles.tagline}>The Future of Local Services</Text>
        </Animated.View>

        {/* ── Features / How it Works ─────────────── */}
        <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>How it works</Text>
          
          <Step 
            icon="search-outline" 
            title="Discover Talent" 
            desc="Browse verified workers and suppliers in your area with ease."
          />
          <Step 
            icon="calendar-outline" 
            title="Book Securely" 
            desc="Schedule services and manage bookings all in one place."
          />
          <Step 
            icon="shield-checkmark-outline" 
            title="Quality Guaranteed" 
            desc="Experience reliable service backed by our community trust."
          />
        </Animated.View>

        {/* ── Call to Actions ─────────────── */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.6}
          >
            <Text style={styles.secondaryBtnText}>
              Already have an account? <Text style={styles.loginLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F", // Premium Dark Background
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
  },
  // Background Decorations
  bgCircle1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Colors.primary,
    opacity: 0.1,
  },
  bgCircle2: {
    position: "absolute",
    bottom: 100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#2d7ef7",
    opacity: 0.05,
  },
  // Header
  header: {
    alignItems: "center",
    marginBottom: Spacing.xxxl,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.lg,
    marginBottom: Spacing.md,
  },
  logoText: {
    fontSize: 32,
    fontWeight: FontWeight.extrabold,
    color: "#fff",
  },
  appName: {
    fontSize: 36,
    fontWeight: FontWeight.extrabold,
    color: "#fff",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontWeight: FontWeight.medium,
  },
  // Card
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)", // Glassmorphism effect
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    ...Shadow.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: "#fff",
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255, 179, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: "#fff",
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  // Footer
  footer: {
    marginTop: Spacing.xxxl,
    alignItems: "center",
  },
  primaryBtn: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    width: "100%",
    height: 60,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.lg,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginRight: Spacing.sm,
  },
  secondaryBtn: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
  secondaryBtnText: {
    color: Colors.textMuted,
    fontSize: FontSize.base,
  },
  loginLink: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});
