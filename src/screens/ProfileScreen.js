import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/apiClient";
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from "../theme";

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

function RoleBadge({ role }) {
  const roleColors = {
    admin: Colors.warning,
    worker: Colors.success,
    supplier: "#60A5FA",
    customer: Colors.primary,
  };
  return (
    <View style={[styles.roleBadge, { borderColor: roleColors[role] || Colors.primary }]}>
      <Text style={[styles.roleBadgeText, { color: roleColors[role] || Colors.primary }]}>
        {(role || "User").toUpperCase()}
      </Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { token, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const data = await getProfile(token);
          setProfile(data);
        } catch (e) {
          setError(e.message || "Failed to load profile");
        } finally {
          setLoading(false);
        }
      })();
    }, [token])
  );

  const initials = profile
    ? `${(profile.firstName || "?").charAt(0)}${(profile.lastName || "").charAt(0)}`.toUpperCase()
    : "?";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Back Button ──────────── */}
        {navigation && (
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backBtnText}>‹  Back</Text>
          </Pressable>
        )}

        {/* ── Loading / Error ─────── */}
        {loading && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading profile…</Text>
          </View>
        )}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        ) : null}

        {/* ── Profile Card ─────────── */}
        {profile && (
          <>
            {/* Avatar Hero */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarOuter}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              </View>
              <Text style={styles.profileName}>
                {profile.firstName} {profile.lastName}
              </Text>
              <RoleBadge role={profile.role} />

              <Pressable
                style={styles.editBtn}
                onPress={() => navigation.navigate("EditProfile")}
              >
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </Pressable>
            </View>

            {/* About / Bio Card */}
            {profile.bio ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>About</Text>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            ) : profile.role === 'worker' ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>About</Text>
                <Text style={styles.bioPlaceholder}>You haven't added a bio yet. Tell clients about your skills!</Text>
                <Pressable
                  style={styles.addBioBtn}
                  onPress={() => navigation.navigate("EditProfile")}
                >
                  <Text style={styles.addBioBtnText}>+ Add Bio</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Contact Information Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Contact Information</Text>
              <InfoRow label="Email" value={profile.email} />
              <View style={styles.divider} />
              <InfoRow label="Phone" value={profile.phone} />
              <View style={styles.divider} />
              <InfoRow label="District" value={profile.district} />
              <View style={styles.divider} />
              <InfoRow label="City" value={profile.city} />
            </View>

            {/* Skills & Rates Card (Worker only) */}
            {profile.role === "worker" && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Skills & Rates</Text>
                
                <View style={styles.infoRow}>
                  <View>
                    <Text style={styles.infoLabel}>Hourly Rate</Text>
                    <Text style={styles.infoSubtext}>LKR {profile.hourlyRate || "0"} / hour</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                
                <View style={styles.infoRow}>
                  <View>
                    <Text style={styles.infoLabel}>Experience</Text>
                    <Text style={styles.infoSubtext}>{profile.experience || "0"} Years</Text>
                  </View>
                </View>

                {((profile.skills && profile.skills.length > 0) || profile.primarySkill) && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.skillsContainer}>
                      {profile.skills?.length > 0 ? (
                        profile.skills.map((skill, idx) => (
                          <View key={idx} style={styles.skillTag}>
                            <Text style={styles.skillText}>{skill}</Text>
                          </View>
                        ))
                      ) : (
                        <View style={styles.skillTag}>
                          <Text style={styles.skillText}>{profile.primarySkill}</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Stats Card (Hide for Admin) */}
            {profile.role !== "admin" && (
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.jobsCompleted || 0}</Text>
                  <Text style={styles.statLabel}>Jobs Done</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.reviewCount || 0}</Text>
                  <Text style={styles.statLabel}>Reviews</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {typeof profile.averageRating === 'number' ? profile.averageRating.toFixed(1) : "0.0"}
                  </Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* ── Sign Out ─────────────── */}
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.8 }]}
          onPress={signOut}
          accessibilityLabel="Sign out of SkillConnect"
          accessibilityRole="button"
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  // Back button
  backBtn: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    alignSelf: "flex-start",
  },
  backBtnText: {
    color: Colors.primary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },

  // Loading / error states
  centerState: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: FontSize.base,
  },
  errorBox: {
    backgroundColor: Colors.errorSurface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },

  // Avatar section
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  avatarOuter: {
    padding: 4,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: Spacing.md,
    ...Shadow.lg,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
  },
  profileName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1.2,
  },
  editBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editBtnText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  // Bio
  bioText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bioPlaceholder: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: "italic",
    marginBottom: Spacing.md,
  },
  addBioBtn: {
    alignSelf: "flex-start",
  },
  addBioBtnText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },

  // Info card
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  cardTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  infoValue: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    textAlign: "right",
    flex: 1,
    marginLeft: Spacing.lg,
  },
  infoSubtext: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  skillTag: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  skillText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },

  // Stats card
  statsCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.divider,
  },

  // Sign out
  signOutBtn: {
    backgroundColor: Colors.errorSurface,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  signOutText: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
