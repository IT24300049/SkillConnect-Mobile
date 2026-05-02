import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from "../theme";
import { useAuth } from "../context/AuthContext";

export default function ServicesHubScreen({ navigation }) {
  const { user } = useAuth();
  const role = user?.role || "customer";

  const ServiceCard = ({ icon, title, desc, target, color = Colors.primary }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate(target)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Service Hub</Text>
          <Text style={styles.subtitle}>Explore all tools and services</Text>
        </View>

        <View style={styles.grid}>
          <Text style={styles.sectionTitle}>General Services</Text>
          
          <ServiceCard
            icon="construct-outline"
            title="Equipment"
            desc="Buy or sell tools and machinery"
            target="Equipment"
            color="#2d7ef7"
          />

          <ServiceCard
            icon="cart-outline"
            title="Rentals"
            desc="Rent equipment for your projects"
            target="Rentals"
            color="#22C55E"
          />

          <ServiceCard
            icon="star-outline"
            title="Reviews"
            desc="Check your ratings and feedback"
            target="Reviews"
            color="#FACC15"
          />

          <ServiceCard
            icon="alert-circle-outline"
            title="Complaints"
            desc="Report issues or view support"
            target="Complaints"
            color={Colors.error}
          />
        </View>

        {role === "admin" && (
          <View style={styles.grid}>
            <Text style={styles.sectionTitle}>Admin Controls</Text>
            <ServiceCard
              icon="shield-checkmark-outline"
              title="Manage Complaints"
              desc="Review system-wide reports"
              target="AdminComplaints"
              color={Colors.primary}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  grid: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
