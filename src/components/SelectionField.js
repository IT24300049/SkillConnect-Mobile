import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors, FontSize, FontWeight, Radius, Spacing } from "../theme";

export default function SelectionField({
  label,
  value,
  placeholder,
  onPress,
  error,
  icon,
}) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.field, error && styles.fieldError]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={Colors.primary}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.value,
              !value && { color: Colors.textMuted },
            ]}
          >
            {value || placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    height: 52,
  },
  fieldError: {
    borderColor: Colors.error,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  value: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
});
