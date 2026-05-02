// ──────────────────────────────────────────────
//  SkillConnect Design System — Orange / Black / White
//  Single source of truth for all colour, spacing,
//  typography, and shadow tokens used across every screen.
// ──────────────────────────────────────────────

export const Colors = {
  // Brand
  primary: "#FF6B00",         // vibrant orange
  primaryDark: "#CC5500",     // pressed / darker orange
  primaryLight: "#FF8C33",    // lighter tint
  primarySurface: "#FFF3E8",  // very light orange background
  primaryBorder: "#FFD6B0",   // orange-tinted border

  // Neutral
  black: "#0A0A0A",
  surface: "#111111",         // card surface on dark bg
  surfaceCard: "#1A1A1A",     // elevated card
  surfaceInput: "#1E1E1E",    // input fields

  // Greys
  textPrimary: "#FFFFFF",
  textSecondary: "#B0B0B0",
  textMuted: "#6E6E6E",
  textOnPrimary: "#FFFFFF",

  divider: "#2A2A2A",
  border: "#2F2F2F",
  borderActive: "#FF6B00",

  // Semantic
  error: "#FF4444",
  errorSurface: "#2D1212",
  success: "#22C55E",
  successSurface: "#0D2D1A",
  warning: "#FACC15",

  // Backgrounds
  background: "#0A0A0A",
  backgroundAlt: "#111111",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  display: 32,
};

export const FontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
};

export const Shadow = {
  sm: {
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
};

// ── Shared component styles ─────────────────────

import { StyleSheet } from "react-native";

export const SharedStyles = StyleSheet.create({
  // Containers
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  // Cards
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },

  // Typography
  screenTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  screenSubtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bodyText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Inputs
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
    borderColor: Colors.borderActive,
  },

  // Buttons
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: Spacing.xl,
    ...Shadow.md,
  },
  primaryButtonText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  dangerButton: {
    backgroundColor: Colors.error,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: Spacing.xl,
  },
  dangerButtonText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },

  // Badges / Pills
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.primarySurface,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
    marginRight: Spacing.sm,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  pillTextActive: {
    color: Colors.textOnPrimary,
  },

  // Status / Feedback
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  helper: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },

  // Row helpers
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spaceBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
