import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Colors, FontSize, FontWeight, Spacing } from "../theme";
import { useAuth } from "../context/AuthContext";
import { getWorkerById } from "../services/apiClient";

export default function WorkerProfileScreen() {
  const { token, user } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const { workerId } = route.params;

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWorker = useCallback(async () => {
    try {
      const data = await getWorkerById(token, workerId);
      setWorker(data);
    } catch (error) {
      console.error("Failed to load worker profile", error);
      Alert.alert("Error", "Could not load worker details.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [token, workerId, navigation]);

  useEffect(() => {
    fetchWorker();
  }, [fetchWorker]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!worker) return null;

  const isVerified = worker.isVerified !== false;
  const getInitials = (f, l) => `${f?.charAt(0) || ""}${l?.charAt(0) || ""}`.toUpperCase();
  const isSelf = user?.userId === worker._id;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(worker.firstName, worker.lastName)}</Text>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{worker.firstName} {worker.lastName}</Text>
            {isVerified && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={{marginLeft: 6}} />}
          </View>
          <Text style={styles.location}><Ionicons name="location-outline" size={14} /> {worker.city}, {worker.district}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>
              {typeof worker.averageRating === 'number' ? worker.averageRating.toFixed(1) : "0.0"}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="briefcase" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{worker.jobsCompleted || 0}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="cash" size={24} color="#10B981" />
            <Text style={styles.statValue}>LKR {worker.hourlyRate || 0}</Text>
            <Text style={styles.statLabel}>Per Hour</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>
            {worker.bio || "This worker hasn't added a bio yet."}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {worker.skills?.length > 0 ? (
              worker.skills.map((skill, idx) => (
                <View key={idx} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))
            ) : worker.primarySkill ? (
              <View style={styles.skillTag}>
                <Text style={styles.skillText}>{worker.primarySkill}</Text>
              </View>
            ) : (
              <Text style={styles.description}>No skills listed.</Text>
            )}
          </View>
        </View>

        {/* NEW: Reviews Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Client Reviews</Text>
            <View style={styles.reviewCountBadge}>
              <Text style={styles.reviewCountText}>{worker.reviews?.length || 0}</Text>
            </View>
          </View>

          {worker.reviews?.length > 0 ? (
            worker.reviews.map((rev, idx) => (
              <View key={rev._id} style={[styles.reviewItem, idx < worker.reviews.length - 1 && styles.reviewDivider]}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>
                    {rev.reviewer?.name || `${rev.reviewer?.firstName} ${rev.reviewer?.lastName}` || "Anonymous"}
                  </Text>
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons 
                        key={s} 
                        name={s <= rev.overallRating ? "star" : "star-outline"} 
                        size={14} 
                        color={s <= rev.overallRating ? "#F59E0B" : Colors.textMuted} 
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewDate}>
                  {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </Text>
                <Text style={styles.reviewText}>{rev.reviewText}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyReviews}>
              <Ionicons name="chatbubbles-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyReviewsText}>No reviews yet. Be the first to book and rate!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {!isSelf && user?.role === "customer" && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate("CreateBooking", { workerId: worker._id, workerName: `${worker.firstName} ${worker.lastName}` })}
          >
            <Text style={styles.primaryButtonText}>Book This Worker</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  backButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  profileHeaderCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontWeight: "bold",
    color: Colors.primary,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  location: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  skillTag: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  skillText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  reviewCountBadge: {
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  reviewCountText: {
    fontSize: FontSize.xs,
    fontWeight: "bold",
    color: Colors.primary,
  },
  reviewItem: {
    paddingVertical: Spacing.md,
  },
  reviewDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 2,
  },
  reviewDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  reviewText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emptyReviews: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyReviewsText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: "center",
  },
});
