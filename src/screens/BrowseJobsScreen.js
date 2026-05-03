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
      if (user?.role === "supplier") {
        setJobs([]);
        setLoading(false);
        return;
      }

      const data = await getJobs(token);
      setJobs(data.filter(j => j.jobStatus === "active" || j.status === "active"));
    } catch (error) {
      console.error("Failed to load jobs", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.role]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const timeAgo = (date) => {
    if (!date) return "";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
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
        activeOpacity={0.9}
        onPress={() => navigation.navigate("JobDetail", { jobId: item._id })}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.jobTitle} numberOfLines={1}>{item.jobTitle}</Text>
            <View style={styles.posterInfo}>
              <Text style={styles.posterText}>by {item.postedBy?.firstName || "Customer"}</Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.budgetBadge}>
            <Text style={styles.budgetText}>LKR {item.budgetMax || item.budgetMin}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoPill}>
            <Ionicons name="folder-outline" size={12} color={Colors.primary} />
            <Text style={styles.infoPillText}>{item.category}</Text>
          </View>
          <View style={styles.infoPill}>
            <Ionicons name="location-outline" size={12} color={Colors.primary} />
            <Text style={styles.infoPillText}>{item.district}</Text>
          </View>
          <View style={styles.infoPill}>
            <Ionicons name="time-outline" size={12} color={Colors.primary} />
            <Text style={styles.infoPillText}>{item.estimatedDurationHours}h</Text>
          </View>
        </View>

        {(isEmergency || isUrgent) && (
          <View style={styles.urgencyRow}>
            {isEmergency ? (
              <View style={[styles.statusTag, { backgroundColor: "#450a0a" }]}>
                <View style={[styles.statusDot, { backgroundColor: "#ef4444" }]} />
                <Text style={[styles.statusTagText, { color: "#fca5a5" }]}>Emergency</Text>
              </View>
            ) : (
              <View style={[styles.statusTag, { backgroundColor: "#451a03" }]}>
                <View style={[styles.statusDot, { backgroundColor: "#f59e0b" }]} />
                <Text style={[styles.statusTagText, { color: "#fcd34d" }]}>Urgent</Text>
              </View>
            )}
          </View>
        )}
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
            placeholder="Search for skills, locations..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
          <View style={styles.filterBtnIcon}>
            <Ionicons name="options-outline" size={22} color={Colors.textPrimary} />
          </View>
          {(filterCategory || filterDistrict || sortBy !== "newest") && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["All", ...CATEGORIES]}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item: cat }) => {
            const isActive = (cat === "All" && !filterCategory) || filterCategory === cat;
            return (
              <TouchableOpacity
                style={[styles.catPill, isActive && styles.catPillActive]}
                onPress={() => setFilterCategory(cat === "All" ? "" : cat)}
              >
                <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          }}
        />
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
              <Ionicons name={user?.role === "supplier" ? "lock-closed-outline" : "briefcase-outline"} size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {user?.role === "supplier" ? "Access Restricted" : "No Jobs Found"}
              </Text>
              <Text style={styles.emptySub}>
                {user?.role === "supplier" 
                  ? "As a supplier, your focus is on equipment management. Service job browsing is reserved for workers." 
                  : "Try adjusting your filters or search query."}
              </Text>
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  posterInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  posterText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  dotSeparator: {
    marginHorizontal: 6,
    color: Colors.textMuted,
    fontSize: 10,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  budgetBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  budgetText: {
    color: "#10b981",
    fontSize: 14,
    fontWeight: "700",
  },
  cardBody: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  infoPillText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  urgencyRow: {
    flexDirection: "row",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
    letterSpacing: 0.5,
  },
  categoryContainer: {
    paddingBottom: Spacing.md,
  },
  categoryList: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  catPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catPillText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  catPillTextActive: {
    color: Colors.white,
  },
  filterBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    marginTop: 60,
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
