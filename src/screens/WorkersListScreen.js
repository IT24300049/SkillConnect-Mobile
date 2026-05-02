import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { Colors, FontSize, FontWeight, Spacing } from "../theme";
import { useAuth } from "../context/AuthContext";
import { getWorkers } from "../services/apiClient";
import SkeletonCard from "../components/SkeletonCard";
import FilterSheet from "../components/FilterSheet";
import { CATEGORIES, isSkillMatch } from "../constants/categories";

const DISTRICTS = ["Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", "Moneragala", "Ratnapura", "Kegalle"];

export default function WorkersListScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [filterVisible, setFilterVisible] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");

  const fetchWorkers = useCallback(async () => {
    try {
      const data = await getWorkers(token);
      setWorkers(data);
    } catch (error) {
      console.error("Failed to load workers", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorkers();
  };

  const filteredWorkers = workers.filter(w => {
    const fullName = `${w.firstName || ""} ${w.lastName || ""}`.toLowerCase();
    if (searchQuery && !fullName.includes(searchQuery.toLowerCase())) return false;
    
    // Improved category filtering: Handles both skills array and primarySkill, plus legacy matches
    if (filterCategory) {
      const workerSkills = w.skills || [];
      if (w.primarySkill && !workerSkills.includes(w.primarySkill)) {
        workerSkills.push(w.primarySkill);
      }
      if (!isSkillMatch(workerSkills, filterCategory)) return false;
    }
    
    if (filterDistrict && w.district !== filterDistrict) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "rating") return (b.averageRating || 0) - (a.averageRating || 0);
    if (sortBy === "jobs") return (b.jobsCompleted || 0) - (a.jobsCompleted || 0);
    return 0;
  });

  const getInitials = (f, l) => `${f?.charAt(0) || ""}${l?.charAt(0) || ""}`.toUpperCase();

  const renderWorkerCard = ({ item }) => {
    const isVerified = item.isVerified !== false; // Default true if not explicit

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate("WorkerProfile", { workerId: item._id })}
      >
        <View style={styles.cardRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(item.firstName, item.lastName)}</Text>
          </View>
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
              {isVerified && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={{marginLeft: 4}} />}
            </View>
            <View style={styles.statsRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.statText}>{item.averageRating?.toFixed(1) || "New"}</Text>
              <Text style={styles.statDivider}>•</Text>
              <Text style={styles.statText}>{item.jobsCompleted || 0} jobs</Text>
              <Text style={styles.statDivider}>•</Text>
              <Text style={styles.statText}>{item.district}</Text>
            </View>
          </View>
        </View>

        {(item.skills && item.skills.length > 0) || item.primarySkill ? (
          <View style={styles.skillsContainer}>
            {item.skills?.length > 0 ? (
              item.skills.slice(0, 3).map((skill, idx) => (
                <View key={idx} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))
            ) : (
              <View style={styles.skillTag}>
                <Text style={styles.skillText}>{item.primarySkill}</Text>
              </View>
            )}
            {item.skills?.length > 3 && (
              <Text style={styles.moreSkills}>+{item.skills.length - 3} more</Text>
            )}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search workers..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
          <Ionicons name="options" size={24} color={Colors.textPrimary} />
          {(filterCategory || filterDistrict || sortBy !== "rating") && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.spotlightContainer}>
          <TouchableOpacity 
            style={[styles.spotlightChip, !filterCategory && styles.spotlightChipActive]}
            onPress={() => setFilterCategory("")}
          >
            <Text style={[styles.spotlightChipText, !filterCategory && styles.spotlightChipTextActive]}>All</Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.spotlightChip, filterCategory === cat && styles.spotlightChipActive]}
              onPress={() => setFilterCategory(cat)}
            >
              <Text style={[styles.spotlightChipText, filterCategory === cat && styles.spotlightChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.listContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredWorkers}
          keyExtractor={(item) => item._id}
          renderItem={renderWorkerCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Workers Found</Text>
              <Text style={styles.emptySub}>Try adjusting your filters or search query.</Text>
            </View>
          }
        />
      )}

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        title="Filter Workers"
        onReset={() => {
          setSortBy("rating");
          setFilterCategory("");
          setFilterDistrict("");
          setFilterVisible(false);
        }}
        onApply={() => setFilterVisible(false)}
      >
        <View>
          <Text style={styles.filterSectionTitle}>Sort By</Text>
          <View style={styles.filterRow}>
            {["rating", "jobs"].map(sort => (
              <TouchableOpacity key={sort} style={[styles.filterChip, sortBy === sort && styles.filterChipActive]} onPress={() => setSortBy(sort)}>
                <Text style={[styles.filterChipText, sortBy === sort && styles.filterChipTextActive]}>
                  {sort === "rating" ? "Highest Rating" : "Most Jobs Completed"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.filterSectionTitle}>District</Text>
          <View style={styles.filterRow}>
            {DISTRICTS.map(dist => (
              <TouchableOpacity key={dist} style={[styles.filterChip, filterDistrict === dist && styles.filterChipActive]} onPress={() => setFilterDistrict(dist === filterDistrict ? "" : dist)}>
                <Text style={[styles.filterChipText, filterDistrict === dist && styles.filterChipTextActive]}>{dist}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </FilterSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
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
  spotlightContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  spotlightChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  spotlightChipActive: {
    backgroundColor: Colors.surfaceHighlight,
    borderColor: Colors.primary,
  },
  spotlightChipText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  spotlightChipTextActive: {
    color: Colors.primary,
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
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.primary,
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  statDivider: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginHorizontal: 6,
  },
  skillsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  skillTag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skillText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  moreSkills: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
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
