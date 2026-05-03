import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import ThemedInput from "../components/ThemedInput";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, FontSize, FontWeight, Radius, SharedStyles, Shadow } from "../theme";
import {
  createReview,
  deleteReview,
  getMyBookings,
  getMyReviews,
  updateReview,
} from "../services/apiClient";

const INITIAL_FORM = {
  booking: "",
  reviewee: "",
  revieweeName: "",
  job: "",
  jobTitle: "",
  rating: 5,
  reviewText: "",
};

function StarRating({ rating, onRatingChange, size = 28, readOnly = false }) {
  return (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Pressable
          key={s}
          onPress={() => !readOnly && onRatingChange && onRatingChange(s)}
          style={({ pressed }) => [!readOnly && pressed && { opacity: 0.7 }]}
        >
          <Ionicons
            name={s <= rating ? "star" : "star-outline"}
            size={size}
            color={s <= rating ? "#FFD700" : Colors.textMuted}
            style={{ marginRight: 4 }}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function ReviewsScreen() {
  const { token, user } = useAuth();
  const route = useRoute();
  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);

  const reviewerType = user?.role === "worker" ? "worker" : (user?.role === "supplier" ? "supplier" : "customer");
  const bookingsRole = reviewerType === "worker" ? "worker" : "customer";

  const loadData = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      
      const reviewsPromise = getMyReviews(token);
      let transactionsPromise;

      if (user?.role === "supplier") {
        transactionsPromise = getSupplierRentals(token);
      } else {
        transactionsPromise = getMyBookings(token, bookingsRole);
      }

      const [reviewsData, transactionsData] = await Promise.all([
        reviewsPromise,
        transactionsPromise,
      ]);

      setReviews(reviewsData);
      setBookings(transactionsData);
    } catch (e) {
      setError(e.message || "Failed to load reviews");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, bookingsRole, user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (route.params?.reviewee) {
      setForm(prev => ({
        ...prev,
        reviewee: route.params.reviewee,
        revieweeName: route.params.revieweeName || "",
        booking: route.params.booking || "",
        job: route.params.jobId || "",
        jobTitle: route.params.jobTitle || ""
      }));
      setShowForm(true);
    }
  }, [route.params]);

  const bookingToReviewee = useMemo(() => {
    const map = new Map();
    for (const booking of bookings) {
      let id;
      if (user?.role === "supplier") {
        id = booking.customer?._id || booking.customer;
      } else if (reviewerType === "worker") {
        id = booking.customer?._id || booking.customer;
      } else {
        id = (booking.assignedWorker?._id || booking.assignedWorker || booking.worker?._id || booking.worker);
      }
      
      if (id) {
        map.set(booking._id, id);
      }
    }
    return map;
  }, [bookings, reviewerType, user?.role]);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditingId("");
    setShowForm(false);
  }

  function useBooking(booking) {
    updateForm("booking", booking._id);
    const title = booking.job?.jobTitle || booking.equipment?.name || "Rental";
    updateForm("jobTitle", title);
    const reviewee = bookingToReviewee.get(booking._id) || "";
    if (reviewee) {
      updateForm("reviewee", reviewee);
      const revieweeObj = booking.customer || booking.worker || booking.assignedWorker;
      if (revieweeObj?.firstName) {
        updateForm("revieweeName", `${revieweeObj.firstName} ${revieweeObj.lastName || ""}`);
      }
    }
  }

  function startEdit(review) {
    setEditingId(review._id);
    setShowForm(true);
    setActionError("");
    setForm({
      booking: review.booking?._id || review.booking || "",
      reviewee: review.reviewee?._id || review.reviewee || "",
      revieweeName: review.reviewee?.firstName ? `${review.reviewee.firstName} ${review.reviewee.lastName || ""}` : "User",
      jobTitle: review.job?.jobTitle || "",
      rating: review.overallRating || review.rating || 5,
      reviewText: review.reviewText || review.comment || "",
    });
  }

  async function submitReview() {
    try {
      setActionError("");
      setSubmitting(true);

      if (editingId) {
        if (!form.reviewText) {
          setActionError("Review text is required");
          return;
        }
        await updateReview(token, editingId, {
          rating: form.rating,
          reviewText: form.reviewText,
        });
      } else {
        if (!form.booking || !form.reviewee || !form.reviewText) {
          setActionError("Please complete all fields");
          return;
        }

        await createReview(token, {
          booking: form.booking,
          reviewee: form.reviewee,
          rating: form.rating,
          reviewText: form.reviewText,
          reviewerType,
        });
      }

      resetForm();
      await loadData();
    } catch (e) {
      setActionError(e.message || "Failed to save review");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(reviewId) {
    try {
      setActionError("");
      await deleteReview(token, reviewId);
      if (editingId === reviewId) resetForm();
      await loadData();
    } catch (e) {
      setActionError(e.message || "Failed to delete review");
    }
  }

  const renderReviewCard = ({ item }) => {
    const isMine = (item.reviewer?._id || item.reviewer) === user?.userId;

    return (
      <View style={[SharedStyles.card, styles.reviewCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.reviewee?.firstName?.[0] || (reviewerType === "worker" ? "C" : "W"))}
              </Text>
            </View>
            <View>
              <Text style={styles.itemTitle}>
                {reviewerType === "worker" || reviewerType === "supplier"
                  ? `${item.reviewee?.firstName || "Customer"}`
                  : `${item.reviewee?.firstName || "Professional"}`}
              </Text>
              <StarRating rating={item.overallRating || item.rating} size={14} readOnly />
            </View>
          </View>
          <View style={styles.dateBox}>
            <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <Text style={styles.reviewContent}>{item.reviewText}</Text>

        {isMine && (
          <View style={styles.cardActions}>
            <Pressable style={styles.actionBtn} onPress={() => startEdit(item)}>
              <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
              <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Edit</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item._id)}>
              <Ionicons name="trash-outline" size={14} color={Colors.error} />
              <Text style={[styles.actionBtnText, { color: Colors.error }]}>Delete</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={SharedStyles.safeArea}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item._id}
        renderItem={renderReviewCard}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={SharedStyles.screenTitle}>Reviews</Text>
                <Text style={SharedStyles.screenSubtitle}>Your professional feedback history</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.7 }]}
                onPress={() => { setRefreshing(true); loadData(); }}
              >
                <Ionicons name="refresh" size={20} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {user?.role !== "admin" && (
              <View style={[SharedStyles.card, styles.formCard]}>
                <Pressable
                  style={styles.formHeader}
                  onPress={() => setShowForm(!showForm)}
                >
                  <View style={styles.formTitleRow}>
                    <Ionicons
                      name={editingId ? "create-outline" : "star-outline"}
                      size={22}
                      color={Colors.primary}
                    />
                    <Text style={styles.formTitle}>{editingId ? "Edit Your Review" : "Write a Review"}</Text>
                  </View>
                  <Ionicons
                    name={showForm ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={Colors.textMuted}
                  />
                </Pressable>

                {showForm && (
                  <View style={styles.formContent}>
                    <View style={styles.divider} />

                    {form.revieweeName || form.jobTitle ? (
                      <View style={styles.targetBanner}>
                        <View style={styles.targetIconBox}>
                          <Ionicons name="person-circle" size={32} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.targetLabel}>YOU ARE REVIEWING</Text>
                          <Text style={styles.targetName}>{form.revieweeName || "Professional"}</Text>
                          {form.jobTitle && <Text style={styles.targetSub}>{form.jobTitle}</Text>}
                        </View>
                        {!editingId && (
                          <Pressable onPress={() => setForm(INITIAL_FORM)} style={styles.clearBtn}>
                            <Ionicons name="close-circle" size={24} color={Colors.textMuted} />
                          </Pressable>
                        )}
                      </View>
                    ) : (
                      <View style={styles.fieldGroup}>
                        <Text style={SharedStyles.label}>
                          {user?.role === "supplier" ? "Select Recent Rental" : "Select Recent Booking"}
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                          {bookings.length > 0 ? (
                            bookings.slice(0, 12).map((booking) => (
                              <Pressable
                                key={booking._id}
                                style={[SharedStyles.pill, form.booking === booking._id && SharedStyles.pillActive]}
                                onPress={() => useBooking(booking)}
                              >
                                <Text style={[SharedStyles.pillText, form.booking === booking._id && SharedStyles.pillTextActive]}>
                                  {booking.job?.jobTitle || booking.equipment?.name || (user?.role === "supplier" ? "Rental" : "Job")} • {new Date(booking.scheduledDate || booking.createdAt).toLocaleDateString()}
                                </Text>
                              </Pressable>
                            ))
                          ) : (
                            <Text style={styles.emptySmall}>
                              {user?.role === "supplier" ? "No recent rentals to review" : "No recent bookings to review"}
                            </Text>
                          )}
                        </ScrollView>
                      </View>
                    )}

                    <View style={styles.fieldGroup}>
                      <Text style={SharedStyles.label}>Overall Rating</Text>
                      <View style={styles.starsWrapper}>
                        <StarRating
                          rating={form.rating}
                          onRatingChange={(r) => updateForm("rating", r)}
                        />
                        <Text style={styles.ratingText}>{form.rating}/5 Stars</Text>
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={SharedStyles.label}>Your Message</Text>
                      <ThemedInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Tell others about your experience..."
                        multiline
                        numberOfLines={4}
                        value={form.reviewText}
                        onChangeText={(value) => updateForm("reviewText", value)}
                      />
                    </View>

                    {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

                    <View style={styles.formActions}>
                      <Pressable
                        style={[SharedStyles.primaryButton, styles.submitBtn, submitting && { opacity: 0.7 }]}
                        onPress={submitReview}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <ActivityIndicator color={Colors.textOnPrimary} size="small" />
                        ) : (
                          <Text style={SharedStyles.primaryButtonText}>
                            {editingId ? "Save Changes" : "Post Review"}
                          </Text>
                        )}
                      </Pressable>

                      {editingId && (
                        <Pressable style={styles.cancelBtn} onPress={resetForm}>
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {reviews.length > 0 && (
              <Text style={[SharedStyles.sectionTitle, { marginTop: Spacing.lg }]}>Recent Activity</Text>
            )}
          </View>
        }
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="chatbox-outline" size={40} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Reviews Yet</Text>
              <Text style={styles.emptySubtitle}>Your feedback history will appear here.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.sm },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  listContainer: { paddingBottom: Spacing.xxxl },

  formCard: { padding: 0, overflow: "hidden", marginTop: Spacing.sm },
  formHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: Spacing.lg, backgroundColor: "rgba(255, 107, 0, 0.03)"
  },
  formTitleRow: { flexDirection: "row", alignItems: "center" },
  formTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginLeft: Spacing.sm },
  formContent: { padding: Spacing.lg, paddingTop: 0 },
  divider: { height: 1, backgroundColor: Colors.divider, marginBottom: Spacing.md },
  fieldGroup: { marginBottom: Spacing.md },
  pillScroll: { marginTop: Spacing.xs },
  emptySmall: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },

  starsWrapper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: Spacing.xs },
  starsContainer: { flexDirection: "row" },
  ratingText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.warning },

  input: { marginTop: Spacing.xs },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  errorText: { color: Colors.error, fontSize: FontSize.sm, textAlign: "center", marginBottom: Spacing.md },

  targetBanner: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.surfaceInput,
    padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  targetIconBox: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primarySurface,
    alignItems: "center", justifyContent: "center", marginRight: Spacing.md
  },
  targetLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: Colors.primary, letterSpacing: 1 },
  targetName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  targetSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  clearBtn: { padding: Spacing.xs },

  formActions: { gap: Spacing.sm },
  submitBtn: { flex: 1 },
  cancelBtn: {
    height: 44, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: FontWeight.semibold },

  reviewCard: { marginHorizontal: Spacing.lg },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.md },
  userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceInput,
    alignItems: "center", justifyContent: "center", marginRight: Spacing.md,
    borderWidth: 1, borderColor: Colors.border
  },
  avatarText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  itemTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  dateBox: { flexDirection: "row", alignItems: "center" },
  dateText: { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: 4 },
  reviewContent: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.md },

  cardActions: {
    flexDirection: "row", gap: Spacing.sm, borderTopWidth: 1,
    borderTopColor: Colors.divider, paddingTop: Spacing.md
  },
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.surfaceInput, borderRadius: Radius.sm,
    paddingVertical: 6, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    flex: 1
  },
  deleteBtn: { backgroundColor: Colors.errorSurface, borderColor: Colors.error + "40" },
  actionBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginLeft: 6 },

  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surfaceCard,
    alignItems: "center", justifyContent: "center", marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.base, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.xs },
});
