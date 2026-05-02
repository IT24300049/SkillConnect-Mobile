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
} from "react-native";
import { useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import ThemedInput from "../components/ThemedInput";
import { useAuth } from "../context/AuthContext";
import {
  createReview,
  deleteReview,
  getMyBookings,
  getMyReviews,
  updateReview,
} from "../services/apiClient";

const C = {
  primary: "#FF6B00",
  primarySurface: "rgba(255, 107, 0, 0.1)",
  primaryBorder: "rgba(255, 107, 0, 0.2)",
  card: "#1E1E1E",
  background: "#121212",
  border: "#333",
  input: "#252525",
  text: "#FFFFFF",
  textSec: "#B0B0B0",
  textMut: "#666666",
  error: "#FF4D4D",
  errorSurf: "rgba(255, 77, 77, 0.1)",
  success: "#4CAF50",
};

const INITIAL_FORM = {
  booking: "",
  reviewee: "",
  revieweeName: "",
  job: "",
  jobTitle: "",
  rating: 5,
  reviewText: "",
};

function StarRating({ rating, onRatingChange, size = 28 }) {
  return (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Pressable key={s} onPress={() => onRatingChange && onRatingChange(s)}>
          <Ionicons 
            name={s <= rating ? "star" : "star-outline"} 
            size={size} 
            color={s <= rating ? "#FFD700" : C.textMut} 
            style={{ marginRight: 6 }}
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
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState("");

  const [form, setForm] = useState(INITIAL_FORM);

  const reviewerType = user?.role === "worker" ? "worker" : "customer";
  const bookingsRole = reviewerType === "worker" ? "worker" : "customer";

  const loadData = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const [reviewsData, bookingsData] = await Promise.all([
        getMyReviews(token),
        getMyBookings(token, bookingsRole),
      ]);
      setReviews(reviewsData);
      setBookings(bookingsData);
    } catch (e) {
      setError(e.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [token, bookingsRole]);

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
    }
  }, [route.params]);

  const bookingToReviewee = useMemo(() => {
    const map = new Map();
    for (const booking of bookings) {
      const id = reviewerType === "worker"
        ? booking.customer?._id || booking.customer
        : (booking.assignedWorker?._id || booking.assignedWorker || booking.worker?._id || booking.worker);
      if (id) {
        map.set(booking._id, id);
      }
    }
    return map;
  }, [bookings, reviewerType]);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditingId("");
  }

  function useBooking(booking) {
    updateForm("booking", booking._id);
    updateForm("jobTitle", booking.job?.jobTitle || "");
    const reviewee = bookingToReviewee.get(booking._id) || "";
    if (reviewee) {
      updateForm("reviewee", reviewee);
    }
  }

  function startEdit(review) {
    setEditingId(review._id);
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
          setActionError("All fields are required");
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

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ScrollView style={styles.headerWrap}>
            <View style={styles.topRow}>
              <Text style={styles.title}>Reviews</Text>
              <Pressable style={styles.refreshBtn} onPress={loadData}>
                <Ionicons name="refresh" size={20} color={C.text} />
              </Pressable>
            </View>

            {user?.role !== "admin" && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{editingId ? "Edit Review" : "Create Review"}</Text>

                {form.revieweeName || form.jobTitle ? (
                  <View style={styles.targetInfo}>
                    <View style={styles.targetIcon}>
                      <Ionicons name="person-circle-outline" size={40} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.targetLabel}>REVIEWING</Text>
                      <Text style={styles.targetName}>{form.revieweeName || "Professional"}</Text>
                      {form.jobTitle && <Text style={styles.targetSub}>{form.jobTitle}</Text>}
                    </View>
                    {!editingId && (
                      <Pressable onPress={resetForm} style={styles.clearBtn}>
                        <Ionicons name="close-circle" size={20} color={C.textMut} />
                      </Pressable>
                    )}
                  </View>
                ) : (
                  <>
                    <Text style={styles.label}>Select Booking</Text>
                    {!editingId ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                        {bookings.length > 0 ? (
                          bookings.slice(0, 12).map((booking) => (
                            <Pressable
                              key={booking._id}
                              style={[styles.pill, form.booking === booking._id && styles.pillActive]}
                              onPress={() => useBooking(booking)}
                            >
                              <Text style={[styles.pillText, form.booking === booking._id && styles.pillTextActive]}>
                                {booking.job?.jobTitle || "Booking"} - {new Date(booking.scheduledDate || booking.createdAt).toLocaleDateString()}
                              </Text>
                            </Pressable>
                          ))
                        ) : (
                          <Text style={styles.helper}>No recent bookings found</Text>
                        )}
                      </ScrollView>
                    ) : null}
                  </>
                )}

                <Text style={styles.label}>Overall Rating</Text>
                <StarRating 
                  rating={form.rating} 
                  onRatingChange={(r) => updateForm("rating", r)} 
                />

                <Text style={styles.label}>Review Message</Text>
                <ThemedInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Share your experience..."
                  multiline
                  numberOfLines={4}
                  value={form.reviewText}
                  onChangeText={(value) => updateForm("reviewText", value)}
                />

                {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

                <Pressable
                  style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
                  onPress={submitReview}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>{editingId ? "Update Review" : "Submit Review"}</Text>
                  )}
                </Pressable>

                {editingId && (
                  <Pressable style={styles.cancelBtn} onPress={resetForm}>
                    <Text style={styles.cancelBtnText}>Cancel Editing</Text>
                  </Pressable>
                )}
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {loading ? <Text style={styles.helper}>Loading reviews...</Text> : null}
          </ScrollView>
        }
        ListEmptyComponent={!loading ? <Text style={styles.helper}>No reviews found.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View>
                <Text style={styles.itemTitle}>
                  {reviewerType === "worker" 
                    ? `From: ${item.reviewer?.firstName || "Customer"}`
                    : `For: ${item.reviewee?.firstName || "Professional"}`}
                </Text>
                <StarRating rating={item.overallRating || item.rating} size={16} />
              </View>
              <Text style={styles.meta}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            
            <Text style={styles.description}>{item.reviewText}</Text>
            
            {(item.reviewer?._id === user?.userId || item.reviewer === user?.userId) && (
              <View style={styles.actionRow}>
                <Pressable style={styles.smallBtn} onPress={() => startEdit(item)}>
                  <Text style={styles.smallBtnText}>Edit</Text>
                </Pressable>
                <Pressable style={[styles.smallBtn, styles.deleteBtn]} onPress={() => handleDelete(item._id)}>
                  <Text style={[styles.smallBtnText, { color: C.error }]}>Delete</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  headerWrap: { paddingHorizontal: 16, paddingTop: 16 },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", color: C.text },
  refreshBtn: {
    marginLeft: "auto", width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14, fontWeight: "700", color: C.primary,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16,
  },
  itemTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 6 },
  label: {
    fontSize: 11, fontWeight: "600", color: C.textSec,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, marginTop: 12,
  },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.input, color: C.text, fontSize: 15, minHeight: 50,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  pillRow: { marginTop: 8, marginBottom: 8 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: C.border, marginRight: 8, backgroundColor: C.card,
  },
  pillActive: { backgroundColor: C.primary, borderColor: C.primary },
  pillText: { color: C.textSec, fontSize: 12, fontWeight: "600" },
  pillTextActive: { color: "#fff" },
  primaryBtn: {
    marginTop: 16, backgroundColor: C.primary, borderRadius: 12,
    minHeight: 52, alignItems: "center", justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelBtn: {
    marginTop: 8, borderRadius: 12, minHeight: 44,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.border,
  },
  cancelBtnText: { color: C.textSec, fontWeight: "600", fontSize: 14 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  smallBtn: {
    backgroundColor: C.primarySurface, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.primaryBorder,
  },
  deleteBtn: { backgroundColor: C.errorSurf, borderColor: C.error },
  smallBtnText: { color: C.primary, fontWeight: "700", fontSize: 12 },
  meta: { color: C.textSec, marginBottom: 4, fontSize: 13 },
  helper: { color: C.textMut, marginBottom: 8, fontSize: 13, textAlign: "center" },
  error: { color: C.error, marginBottom: 8, fontSize: 13, textAlign: "center" },
  starsContainer: { flexDirection: "row", marginVertical: 8 },
  targetInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.input,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  targetIcon: { marginRight: 12 },
  targetLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  targetName: { fontSize: 16, fontWeight: "700", color: C.text },
  targetSub: { fontSize: 13, color: C.textSec },
  clearBtn: { padding: 4 },
  description: { fontSize: 14, color: C.textSec, lineHeight: 20, marginTop: 8 },
});
