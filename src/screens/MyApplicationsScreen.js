import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { Colors, FontSize, FontWeight, Spacing } from "../theme";
import { useAuth } from "../context/AuthContext";
import { getMyApplications } from "../services/apiClient";
import SkeletonCard from "../components/SkeletonCard";
import StatusBadge from "../components/StatusBadge";

const TABS = ["All", "Pending", "Accepted", "Declined", "Cancelled"];

export default function MyApplicationsScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  const fetchApplications = useCallback(async () => {
    try {
      const data = await getMyApplications(token);
      // Ensure we have an array, handles fallback logic gracefully if endpoints are weird
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load applications", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApps = applications.filter(app => {
    if (activeTab === "All") return true;
    return app.status?.toLowerCase() === activeTab.toLowerCase();
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    accepted: applications.filter(a => a.status === "accepted").length,
  };

  const renderCard = ({ item }) => {
    const job = item.job || {}; // backend might populate this
    const title = job.jobTitle || "Job Application";

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate("JobDetail", { jobId: job._id || item.jobId })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.jobTitle}>{title}</Text>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.detailText}>Proposed: {item.proposedRate ? `LKR ${item.proposedRate}` : "N/A"}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.detailText}>
              {new Date(item.createdAt || Date.now()).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {item.status === 'rejected' && item.reason && (
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason for Rejection:</Text>
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.accepted}</Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
      </View>

      <View>
        <FlatList
          horizontal
          data={TABS}
          showsHorizontalScrollIndicator={false}
          style={styles.tabList}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === item && styles.tabBtnActive]}
              onPress={() => setActiveTab(item)}
            >
              <Text style={[styles.tabText, activeTab === item && styles.tabTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item}
        />
      </View>

      {loading ? (
        <View style={styles.listContainer}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredApps}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchApplications(); }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Applications</Text>
              <Text style={styles.emptySub}>You haven't applied to any jobs yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  statsContainer: {
    flexDirection: "row",
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },
  tabList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontWeight: "600", fontSize: FontSize.sm },
  tabTextActive: { color: Colors.white },
  listContainer: { padding: Spacing.md },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.md },
  jobTitle: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  detailsRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: Spacing.md },
  detailItem: { flexDirection: "row", alignItems: "center" },
  detailText: { marginLeft: 6, color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: "500" },
  emptyState: { alignItems: "center", justifyContent: "center", padding: Spacing.xl, marginTop: 40 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.textPrimary, marginTop: Spacing.md },
  emptySub: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.sm },
  reasonContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  reasonLabel: {
    fontSize: FontSize.xs,
    fontWeight: "bold",
    color: Colors.error,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
});
