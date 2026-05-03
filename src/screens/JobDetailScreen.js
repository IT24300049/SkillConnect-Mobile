import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Colors, FontSize, FontWeight, Spacing } from "../theme";
import { useAuth } from "../context/AuthContext";
import { getJobById, applyToJob, updateApplicationStatus, updateJobStatus } from "../services/apiClient";
import StatusBadge from "../components/StatusBadge";

export default function JobDetailScreen() {
  const { token, user } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const { jobId } = route.params;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Application Form State
  const [rate, setRate] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Application Action State (for customers)
  const [actionBusy, setActionBusy] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedAppId, setSelectedAppId] = useState(null);

  const fetchJob = useCallback(async () => {
    try {
      const data = await getJobById(token, jobId);
      setJob(data);
    } catch (error) {
      console.error("Failed to load job details", error);
      Alert.alert("Error", "Could not load job details.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [token, jobId, navigation]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleApply = async () => {
    if (rate && isNaN(rate)) {
      Alert.alert("Validation Error", "Please enter a valid numeric hourly rate.");
      return;
    }

    setSubmitting(true);
    try {
      await applyToJob(token, jobId, {
        proposedRate: rate ? parseFloat(rate) : undefined,
        coverLetter: coverLetter.trim()
      });
      Alert.alert("Success", "Your application has been submitted.");
      fetchJob(); // Refresh job details to show applied status
    } catch (error) {
      Alert.alert("Application Failed", error.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (appId) => {
    Alert.alert(
      "Accept Application",
      "Are you sure you want to accept this worker? Other applications will be rejected.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Accept", 
          onPress: async () => {
            setActionBusy(true);
            try {
              await updateApplicationStatus(token, jobId, appId, "accepted");
              Alert.alert("Success", "Application accepted. The job is now assigned.");
              fetchJob();
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to accept application.");
            } finally {
              setActionBusy(false);
            }
          }
        }
      ]
    );
  };

  const openRejectModal = (appId) => {
    setSelectedAppId(appId);
    setRejectReason("");
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert("Validation Error", "Please provide a reason for rejection.");
      return;
    }
    setActionBusy(true);
    try {
      await updateApplicationStatus(token, jobId, selectedAppId, "rejected", rejectReason.trim());
      setRejectModalVisible(false);
      Alert.alert("Success", "Application rejected.");
      fetchJob();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to reject application.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleCompleteJob = async () => {
    Alert.alert(
      "Complete Job",
      "Are you sure this job is finished? This will move it to your history.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Completed", 
          onPress: async () => {
            setActionBusy(true);
            try {
              await updateJobStatus(token, jobId, "completed");
              Alert.alert("Success", "Job marked as completed!");
              fetchJob();
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to update job status.");
            } finally {
              setActionBusy(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!job) return null;

  const currentUserId = user?.userId || user?._id;
  const isOwner = job.customer && (job.customer._id === currentUserId || job.customer === currentUserId);
  const existingApplication = job.applications?.find(a => a.worker === currentUserId || a.worker?._id === currentUserId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroSection}>
          <View style={styles.urgencyRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{job.category}</Text>
            </View>
            {job.urgencyLevel === "emergency" && (
              <View style={[styles.statusTag, { backgroundColor: "#450a0a" }]}>
                <View style={[styles.statusDot, { backgroundColor: "#ef4444" }]} />
                <Text style={[styles.statusTagText, { color: "#fca5a5" }]}>Emergency</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.title}>{job.jobTitle}</Text>
          <View style={styles.locationSnippet}>
            <Ionicons name="location-sharp" size={14} color={Colors.textMuted} />
            <Text style={styles.locationSnippetText}>{job.city}, {job.district}</Text>
          </View>

          <View style={styles.metricsBar}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>BUDGET (MAX)</Text>
              <Text style={styles.metricValue}>LKR {job.budgetMax}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>EST. TIME</Text>
              <Text style={styles.metricValue}>{job.estimatedDurationHours}h</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>STATUS</Text>
              <Text style={[styles.metricValue, { color: Colors.primary, textTransform: "capitalize" }]}>{job.jobStatus}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>{job.jobDescription}</Text>
          
          {job.customer && (
            <View style={styles.clientCard}>
              <View style={styles.clientAvatar}>
                <Text style={styles.clientAvatarText}>{job.customer?.firstName?.[0] || "C"}</Text>
              </View>
              <View>
                <Text style={styles.clientLabel}>POSTED BY</Text>
                <Text style={styles.clientName}>{job.customer?.firstName} {job.customer?.lastName}</Text>
              </View>
            </View>
          )}
        </View>

        {!isOwner && user?.role === "worker" && !existingApplication && job.jobStatus === "active" && (
          <View style={styles.applySection}>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Apply for this job</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PROPOSED RATE (LKR / HR)</Text>
              <TextInput
                style={styles.modernInput}
                placeholder="e.g. 1500"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={rate}
                onChangeText={setRate}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>WHY ARE YOU A GOOD FIT?</Text>
              <TextInput
                style={[styles.modernInput, styles.modernTextArea]}
                placeholder="Describe your experience with similar tasks..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
                value={coverLetter}
                onChangeText={setCoverLetter}
              />
            </View>

            <TouchableOpacity 
              style={[styles.mainCta, submitting && styles.disabledButton]} 
              onPress={handleApply}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.mainCtaText}>Submit Application</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {existingApplication && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Application</Text>
            <StatusBadge status={existingApplication.status} style={{ marginBottom: Spacing.md }} />
            <Text style={styles.label}>
              Proposed Rate: {existingApplication.proposedRate ? `LKR ${existingApplication.proposedRate}/hr` : "N/A"}
            </Text>
            {existingApplication.coverLetter ? (
              <Text style={styles.description}>"{existingApplication.coverLetter}"</Text>
            ) : null}
          </View>
        )}

        {isOwner && job.jobStatus === "assigned" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Manage Project</Text>
            <Text style={styles.description}>Work is currently in progress. Once the worker has finished the task, please mark it as completed.</Text>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: Colors.success, marginTop: Spacing.md }]} 
              onPress={handleCompleteJob}
              disabled={actionBusy}
            >
              {actionBusy ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Confirm Completion</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {isOwner && user?.role !== "admin" && job.jobStatus === "completed" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Job Completed</Text>
            <Text style={styles.description}>This job was finished on {new Date(job.completedAt).toLocaleDateString()}. How was your experience?</Text>
            
            <View style={{ flexDirection: "row", gap: Spacing.md, marginTop: Spacing.md }}>
              <TouchableOpacity 
                style={[styles.actionBtn, { flex: 1, backgroundColor: "#FFF8E5", borderColor: "#FFD700", borderWidth: 1 }]} 
                onPress={() => navigation.navigate("MainTabs", {
                  screen: "Reviews",
                  params: { 
                    booking: null, 
                    reviewee: job.assignedWorker?._id || job.assignedWorker,
                    revieweeName: `${job.assignedWorker?.firstName} ${job.assignedWorker?.lastName}`,
                    jobId: job._id,
                    jobTitle: job.jobTitle
                  }
                })}
              >
                <Text style={{ color: "#B8860B", fontWeight: "bold", textAlign: "center" }}>⭐ Rate Worker</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionBtn, { flex: 1, backgroundColor: "#F0F0F0", borderColor: "#ccc", borderWidth: 1 }]} 
                onPress={() => navigation.navigate("MainTabs", {
                  screen: "Complaints",
                  params: { 
                    workerId: job.assignedWorker?._id || job.assignedWorker,
                    workerName: `${job.assignedWorker?.firstName} ${job.assignedWorker?.lastName}`,
                    jobId: job._id,
                    jobTitle: job.jobTitle
                  }
                })}
              >
                <Text style={{ color: "#666", fontWeight: "bold", textAlign: "center" }}>🚩 Report Issue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isOwner && (job.jobStatus === "active" || job.jobStatus === "assigned") && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Applicants</Text>
            {job.applications?.length > 0 ? (
              job.applications.map((app, index) => (
                <View key={index} style={styles.applicantRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.applicantName}>{app.worker?.firstName} {app.worker?.lastName}</Text>
                    <Text style={styles.applicantRate}>
                      {app.proposedRate ? `LKR ${app.proposedRate}/hr` : "No rate proposed"}
                    </Text>
                    {app.coverLetter ? (
                      <Text style={styles.appCoverLetter} numberOfLines={2}>"{app.coverLetter}"</Text>
                    ) : null}
                  </View>
                  
                  {app.status === 'pending' ? (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.acceptBtn]} 
                        onPress={() => handleAccept(app._id)}
                        disabled={actionBusy}
                      >
                        <Text style={styles.actionBtnText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.rejectBtn]} 
                        onPress={() => openRejectModal(app._id)}
                        disabled={actionBusy}
                      >
                        <Text style={styles.actionBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <StatusBadge status={app.status} />
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.description}>No applications yet.</Text>
            )}
          </View>
        )}

      </ScrollView>

      {/* Rejection Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Application</Text>
            <Text style={styles.label}>Reason for rejection</Text>
            <TextInput
              style={[styles.input, styles.textArea, { marginBottom: Spacing.xl }]}
              placeholder="e.g., Found someone closer, rate too high..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalCancelBtn]} 
                onPress={() => setRejectModalVisible(false)}
                disabled={actionBusy}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalRejectBtn]} 
                onPress={handleReject}
                disabled={actionBusy}
              >
                {actionBusy ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.modalRejectText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: Spacing.xl * 2,
  },
  heroSection: {
    padding: Spacing.lg,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  urgencyRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: "rgba(255, 140, 0, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 140, 0, 0.2)",
  },
  categoryBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textPrimary,
    lineHeight: 32,
    marginBottom: 8,
  },
  locationSnippet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  locationSnippetText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "500",
  },
  metricsBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  metricBox: {
    flex: 1,
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "700",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  contentSection: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  clientAvatarText: {
    color: Colors.white,
    fontWeight: "800",
    fontSize: 18,
  },
  clientLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  clientName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  applySection: {
    paddingHorizontal: Spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  modernInput: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  modernTextArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  mainCta: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mainCtaText: {
    color: Colors.white,
    fontWeight: "800",
    fontSize: 16,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginHorizontal: Spacing.lg,
  },
  applicantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  applicantName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  applicantRate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  appCoverLetter: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: "italic",
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptBtn: {
    backgroundColor: Colors.success,
  },
  rejectBtn: {
    backgroundColor: Colors.error,
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: Spacing.lg,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalCancelBtn: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  modalCancelText: {
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  modalRejectBtn: {
    backgroundColor: Colors.error,
  },
  modalRejectText: {
    color: Colors.white,
    fontWeight: "800",
  },
});
