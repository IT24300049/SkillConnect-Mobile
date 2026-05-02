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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>{job.jobTitle}</Text>
          <View style={styles.tagsContainer}>
            <View style={styles.tag}><Text style={styles.tagText}>{job.category}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{job.district}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{job.urgencyLevel}</Text></View>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{job.jobDescription}</Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Budget</Text>
                <Text style={styles.detailValue}>LKR {job.budgetMin} - {job.budgetMax}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Est. Duration</Text>
                <Text style={styles.detailValue}>{job.estimatedDurationHours} hours</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{job.city}, {job.district}</Text>
              </View>
            </View>
          </View>
        </View>

        {!isOwner && user?.role === "worker" && !existingApplication && job.jobStatus === "active" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Apply for this job</Text>
            
            <Text style={styles.label}>Proposed Hourly Rate (LKR)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1500"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={rate}
              onChangeText={setRate}
            />

            <Text style={styles.label}>Cover Letter / Message (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Why are you a good fit?"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              value={coverLetter}
              onChangeText={setCoverLetter}
            />

            <TouchableOpacity 
              style={[styles.primaryButton, submitting && styles.disabledButton]} 
              onPress={handleApply}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Submit Application</Text>
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
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  tag: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
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
    marginBottom: Spacing.lg,
  },
  detailsGrid: {
    gap: Spacing.md,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailTextContainer: {
    marginLeft: Spacing.md,
  },
  detailLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  detailValue: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
  applicantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  applicantName: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  applicantRate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  appCoverLetter: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: "italic",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptBtn: {
    backgroundColor: Colors.success,
  },
  rejectBtn: {
    backgroundColor: Colors.error,
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: Spacing.lg,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
  },
  modalBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  modalCancelBtn: {
    backgroundColor: Colors.surfaceHighlight,
  },
  modalCancelText: {
    color: Colors.textPrimary,
    fontWeight: "bold",
  },
  modalRejectBtn: {
    backgroundColor: Colors.error,
  },
  modalRejectText: {
    color: Colors.white,
    fontWeight: "bold",
  },
});
