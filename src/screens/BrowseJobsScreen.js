import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, SafeAreaView } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { Colors, FontSize, FontWeight, Spacing } from "../theme";
import { useAuth } from "../context/AuthContext";
import { getJobs } from "../services/apiClient";
import SkeletonCard from "../components/SkeletonCard";
import FilterSheet from "../components/FilterSheet";
import StatusBadge from "../components/StatusBadge";
import { CATEGORIES } from "../constants/categories";

const DISTRICTS = ["Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", "Moneragala", "Ratnapura", "Kegalle"];

export default function BrowseJobsScreen() {
  const { token, user } = useAuth();
  const navigation = useNavigation();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [filterVisible, setFilterVisible] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");

  const fetchJobs = useCallback(async () => {
    try {
      const data = await getJobs(token);
      setJobs(data.filter(j => j.jobStatus === "active" || j.status === "active"));
    } catch (error) {
      console.error("Failed to load jobs", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const filteredJobs = jobs.filter(job => {
    if (searchQuery && !job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterCategory && job.category !== filterCategory) return false;
    if (filterDistrict && job.district !== filterDistrict) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === "highest_budget") return (b.budgetMax || b.budgetMin || 0) - (a.budgetMax || a.budgetMin || 0);
    return 0;
  });

  const renderJobCard = ({ item }) => {
    const isEmergency = item.urgencyLevel === "emergency";
    const isUrgent = item.urgencyLevel === "urgent";

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate("JobDetail", { jobId: item._id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.jobTitle}>{item.jobTitle}</Text>
          {isEmergency && <View style={[styles.urgencyBadge, { backgroundColor: "#FEF2F2" }]}><Text style={{color: "#EF4444", fontSize: 10, fontWeight: "bold"}}>🔥 Emergency</Text></View>}
          {isUrgent && <View style={[styles.urgencyBadge, { backgroundColor: "#FFFBEB" }]}><Text style={{color: "#F59E0B", fontSize: 10, fontWeight: "bold"}}>⚡ Urgent</Text></View>}
        </View>

        <View style={styles.tagsContainer}>
          <View style={styles.tag}><Text style={styles.tagText}>{item.category}</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>{item.district}</Text></View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="wallet-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.detailText}>LKR {item.budgetMin} - {item.budgetMax}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.detailText}>{item.estimatedDurationHours} hours</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const firstName = user?.firstName || "Worker";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.userName}>{firstName} 👋</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
          <Ionicons name="options" size={24} color={Colors.textPrimary} />
          {(filterCategory || filterDistrict || sortBy !== "newest") && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.listContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item._id}
          renderItem={renderJobCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Jobs Found</Text>
              <Text style={styles.emptySub}>Try adjusting your filters or search query.</Text>
            </View>
          }
        />
      )}

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        title="Filter Jobs"
        onReset={() => {
          setSortBy("newest");
          setFilterCategory("");
          setFilterDistrict("");
          setFilterVisible(false);
        }}
        onApply={() => setFilterVisible(false)}
      >
        <View>
          <Text style={styles.filterSectionTitle}>Sort By</Text>
          <View style={styles.filterRow}>
            {["newest", "oldest", "highest_budget"].map(sort => (
              <TouchableOpacity key={sort} style={[styles.filterChip, sortBy === sort && styles.filterChipActive]} onPress={() => setSortBy(sort)}>
                <Text style={[styles.filterChipText, sortBy === sort && styles.filterChipTextActive]}>
                  {sort.replace("_", " ")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.filterSectionTitle}>Category</Text>
          <View style={styles.filterRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat} style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]} onPress={() => setFilterCategory(cat === filterCategory ? "" : cat)}>
                <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </FilterSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  greeting: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: Colors.textPrimary,
  },
  filterButton: {
    padding: Spacing.xs,
    position: "relative",
  },
  filterDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  listContainer: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  jobTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tag: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    marginLeft: 6,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySub: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  filterSectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: "bold",
  },
});
