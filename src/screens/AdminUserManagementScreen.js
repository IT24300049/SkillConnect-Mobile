import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from "../theme";
import { useAuth } from "../context/AuthContext";
import { getAllUsersAdmin, toggleUserStatus } from "../services/apiClient";

export default function AdminUserManagementScreen() {
  const { token, user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRole, setActiveRole] = useState("All");

  const fetchUsers = useCallback(async () => {
    try {
      const response = await getAllUsersAdmin(token);
      setUsers(response.content || []);
    } catch (error) {
      console.error("Failed to load users", error);
      Alert.alert("Error", "Could not load users list.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user) => {
    const newStatus = !user.isActive;
    const action = newStatus ? "enable" : "disable";

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.firstName}'s account?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Proceed",
          style: newStatus ? "default" : "destructive",
          onPress: async () => {
            try {
              await toggleUserStatus(token, user._id, newStatus);
              // Update local state
              setUsers(prev => prev.map(u =>
                u._id === user._id ? { ...u, isActive: newStatus } : u
              ));
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to update status");
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(u => {
    const name = `${u.firstName} ${u.lastName}`.toLowerCase();
    const email = u.email?.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || email.includes(query);

    if (activeRole === "All") return matchesSearch;
    return matchesSearch && u.role === activeRole.toLowerCase();
  });

  const renderUserCard = ({ item }) => {
    const isMe = item._id === currentUser?._id;

    return (
      <View style={styles.card}>
        <View style={styles.cardMain}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.firstName?.[0]}{item.lastName?.[0]}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.firstName} {item.lastName} {isMe && "(You)"}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
                <Text style={styles.roleBadgeText}>{item.role.toUpperCase()}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: item.isActive ? "#10B98120" : "#EF444420", borderColor: item.isActive ? "#10B981" : "#EF4444" }]}>
                <Text style={[styles.statusBadgeText, { color: item.isActive ? "#10B981" : "#EF4444" }]}>
                  {item.isActive ? "ACTIVE" : "DISABLED"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {!isMe && item.role !== 'admin' && (
          <TouchableOpacity
            style={[styles.actionBtn, item.isActive ? styles.disableBtn : styles.enableBtn]}
            onPress={() => handleToggleStatus(item)}
          >
            <Ionicons name={item.isActive ? "person-remove-outline" : "person-add-outline"} size={18} color={item.isActive ? "#EF4444" : "#10B981"} />
            <Text style={[styles.actionBtnText, { color: item.isActive ? "#EF4444" : "#10B981" }]}>
              {item.isActive ? "Disable Access" : "Restore Access"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#F59E0B';
      case 'worker': return '#10B981';
      case 'customer': return '#3B82F6';
      case 'supplier': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or email..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["All", "Customer", "Worker", "Supplier", "Admin"]}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tabBtn, activeRole === item && styles.tabBtnActive]}
              onPress={() => setActiveRole(item)}
            >
              <Text style={[styles.tabText, activeRole === item && styles.tabTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.tabsContent}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item._id}
          renderItem={renderUserCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptySub}>Try adjusting your search or role filter.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: Spacing.md },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 48,
    ...Shadow.sm
  },
  searchIcon: { marginRight: Spacing.xs },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.base },
  tabsContainer: { marginBottom: Spacing.sm },
  tabsContent: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border
  },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: "600" },
  tabTextActive: { color: Colors.white },
  listContainer: { padding: Spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm
  },
  cardMain: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md
  },
  avatarText: { color: Colors.primary, fontWeight: "bold", fontSize: FontSize.md },
  userInfo: { flex: 1 },
  userName: { fontSize: FontSize.md, fontWeight: "bold", color: Colors.textPrimary },
  userEmail: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 6 },
  badgeRow: { flexDirection: "row", gap: 8 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  roleBadgeText: { fontSize: 10, fontWeight: "bold", color: "#fff" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  statusBadgeText: { fontSize: 10, fontWeight: "bold" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: 8
  },
  actionBtnText: { fontSize: FontSize.sm, fontWeight: "bold" },
  emptyState: { alignItems: "center", justifyContent: "center", marginTop: 60 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "bold", color: Colors.textPrimary, marginTop: Spacing.md },
  emptySub: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.sm },
});
