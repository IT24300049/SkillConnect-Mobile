import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors, FontSize, FontWeight, Spacing } from "../theme";
import { useAuth } from "../context/AuthContext";
import { getAllComplaints, updateComplaintStatus } from "../services/apiClient";
import SkeletonCard from "../components/SkeletonCard";
import StatusBadge from "../components/StatusBadge";

export default function AdminComplaintsScreen() {
  const { token } = useAuth();
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const handleStatusChange = async (complaintId, status) => {
    try {
      await updateComplaintStatus(token, complaintId, status, `Resolved by Admin`);
      fetchComplaints();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const fetchComplaints = useCallback(async () => {
    try {
      const data = await getAllComplaints(token);
      setComplaints(data);
    } catch (error) {
      console.error("Failed to load complaints", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const filteredComplaints = complaints.filter(c => {
    const titleMatch = c.complaintTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    const idMatch = c._id?.toLowerCase().includes(searchQuery.toLowerCase());
    if (searchQuery && !titleMatch && !idMatch) return false;
    
    if (activeTab === "Action Needed") return c.complaintStatus === "pending" || c.complaintStatus === "investigating";
    if (activeTab === "Resolved") return c.complaintStatus === "resolved";
    if (activeTab === "Urgent") return c.priority === "urgent";
    
    return true;
  });

  const stats = {
    total: complaints.length,
    actionNeeded: complaints.filter(c => c.complaintStatus === "pending" || c.complaintStatus === "investigating").length,
    urgent: complaints.filter(c => c.priority === "urgent" && c.complaintStatus !== "resolved").length,
  };

  const renderCard = ({ item }) => {
    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{item.complaintTitle}</Text>
          <StatusBadge status={item.complaintStatus} />
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.complaintDescription}
        </Text>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailText}>ID: {item._id?.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.detailText}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          {(item.complaintStatus?.toLowerCase() === "pending" || item.complaintStatus?.toLowerCase() === "investigating") ? (
            <>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.resolveBtn]} 
                onPress={() => handleStatusChange(item._id, "resolved")}
              >
                <Text style={styles.actionBtnText}>Resolve</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.rejectBtn]} 
                onPress={() => handleStatusChange(item._id, "rejected")}
              >
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.resolvedLabel}>Case {item.complaintStatus?.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statBox, stats.actionNeeded > 0 && { borderColor: "#F59E0B" }]}>
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>{stats.actionNeeded}</Text>
          <Text style={styles.statLabel}>Needs Action</Text>
        </View>
        <View style={[styles.statBox, stats.urgent > 0 && { borderColor: "#EF4444" }]}>
          <Text style={[styles.statValue, { color: "#EF4444" }]}>{stats.urgent}</Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
      </View>

      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search complaints..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {["All", "Action Needed", "Urgent", "Resolved"].map(tab => (
          <TouchableOpacity 
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.listContainer}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={item => item._id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchComplaints(); }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>All Clear</Text>
              <Text style={styles.emptySub}>No complaints found matching your criteria.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  statsGrid: { flexDirection: "row", padding: Spacing.md, gap: Spacing.sm },
  statBox: { flex: 1, backgroundColor: Colors.surfaceCard, padding: Spacing.md, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  statValue: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4, textTransform: "uppercase", fontWeight: "bold" },
  header: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surfaceCard, borderRadius: 8, paddingHorizontal: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { marginRight: Spacing.xs },
  searchInput: { flex: 1, height: 40, color: Colors.textPrimary },
  tabsContainer: { flexDirection: "row", paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: "600" },
  tabTextActive: { color: Colors.white },
  listContainer: { padding: Spacing.md },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.sm },
  title: { fontSize: FontSize.md, fontWeight: "bold", color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 20 },
  detailsRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: Spacing.md },
  detailItem: { flexDirection: "row", alignItems: "center" },
  detailText: { marginLeft: 4, color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: "500" },
  emptyState: { alignItems: "center", justifyContent: "center", padding: Spacing.xl, marginTop: 40 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.textPrimary, marginTop: Spacing.md },
  emptySub: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.sm },
  actionRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider },
  actionBtn: { flex: 1, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  resolveBtn: { backgroundColor: Colors.success + "20", borderWidth: 1, borderColor: Colors.success },
  rejectBtn: { backgroundColor: Colors.error + "20", borderWidth: 1, borderColor: Colors.error },
  actionBtnText: { fontSize: FontSize.xs, fontWeight: "bold" },
  resolvedLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: "italic", marginTop: Spacing.sm },
});
