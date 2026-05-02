import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from "react-native";
import { Colors, FontSize, FontWeight, Spacing } from "../theme";

export default function FilterSheet({ visible, onClose, title, children, onApply, onReset }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>{title || "Filter & Sort"}</Text>
              {onReset && (
                <TouchableOpacity onPress={onReset}>
                  <Text style={styles.resetText}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
              {children}
            </ScrollView>

            {onApply && (
              <View style={styles.footer}>
                <TouchableOpacity style={styles.applyButton} onPress={onApply}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  resetText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  contentContainer: {
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  applyButtonText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
});
