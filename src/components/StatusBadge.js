import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const STATUS_CONFIG = {
  requested: { label: "Awaiting Response", icon: "time", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)" },
  pending: { label: "Pending", icon: "time", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)" },
  accepted: { label: "Confirmed", icon: "checkmark-circle", color: "#10B981", bg: "rgba(16, 185, 129, 0.1)" },
  in_progress: { label: "In Progress", icon: "build", color: "#3B82F6", bg: "rgba(59, 130, 246, 0.1)" },
  completed: { label: "Completed", icon: "checkmark-done", color: "#059669", bg: "rgba(5, 150, 105, 0.1)" },
  cancelled: { label: "Cancelled", icon: "close-circle", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)" },
  rejected: { label: "Declined", icon: "close", color: "#6B7280", bg: "rgba(107, 114, 128, 0.1)" },
  investigating: { label: "Investigating", icon: "search", color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.1)" },
  resolved: { label: "Resolved", icon: "checkmark-circle", color: "#10B981", bg: "rgba(16, 185, 129, 0.1)" },
};

export default function StatusBadge({ status, style }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    icon: "help-circle",
    color: "#6B7280",
    bg: "rgba(107, 114, 128, 0.1)",
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <Ionicons name={config.icon} size={14} color={config.color} style={styles.icon} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
