import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../context/AuthContext";
import { getMyRentals, returnRental } from "../services/apiClient";

const C = {
  bg: "#0D0D0F",
  card: "#17171B",
  cardBorder: "#26262E",
  primary: "#FF6B00",
  primarySurface: "rgba(255,107,0,0.12)",
  text: "#F5F5F7",
  textSec: "#9999A8",
  textMut: "#55555F",
  divider: "#22222A",
  success: "#22C55E",
  successSurface: "rgba(34,197,94,0.12)",
  warning: "#F59E0B",
  warningSurface: "rgba(245,158,11,0.12)",
  surface2: "#1C1C22",
};

export default function MyRentalsScreen() {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setError("");
      const data = await getMyRentals(token);
      setRentals(data);
    } catch (err) {
      setError(err.message || "Failed to load rentals");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleReturn(rentalId, name) {
    Alert.alert(
      "Return Equipment",
      `Are you sure you want to return "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Return",
          onPress: async () => {
            try {
              await returnRental(token, rentalId);
              loadData();
            } catch (e) {
              Alert.alert("Error", e.message || "Failed to return equipment");
            }
          },
        },
      ]
    );
  }

  function renderItem({ item }) {
    const eq = item.equipment || {};
    const name = eq.equipmentName || "Equipment";
    const supplierName = item.supplier
      ? `${item.supplier.firstName} ${item.supplier.lastName || ""}`.trim()
      : "Supplier";

    const isActive = item.status === "active";
    const isReturned = item.status === "returned";

    const start = new Date(item.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const end = new Date(item.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconWrap}>
            <Ionicons name="construct-outline" size={22} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{name}</Text>
            <Text style={styles.subtitle}>{eq.category || "—"} • Qty: {item.quantity}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? C.warningSurface : C.successSurface }]}>
            <Text style={[styles.statusText, { color: isActive ? C.warning : C.success }]}>
              {isActive ? "Active" : "Returned"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color={C.textMut} />
          <Text style={styles.detailText}>{start} to {end}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={14} color={C.textMut} />
          <Text style={styles.detailText}>LKR {item.totalCost?.toLocaleString()} ({item.days} days)</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person-circle-outline" size={14} color={C.textMut} />
          <Text style={styles.detailText}>{supplierName}</Text>
        </View>

        {isActive && (
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [styles.returnBtn, pressed && { opacity: 0.8 }]}
              onPress={() => handleReturn(item._id, name)}
            >
              <Ionicons name="arrow-undo-outline" size={16} color="#fff" />
              <Text style={styles.returnBtnText}>Return Equipment</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>My Rentals</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#FF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={rentals}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); loadData(); }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="cart-outline" size={48} color={C.textMut} />
              <Text style={styles.emptyTitle}>No Rentals Yet</Text>
              <Text style={styles.emptyText}>You haven't rented any equipment.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { padding: 20, paddingBottom: 10 },
  pageTitle: { fontSize: 26, fontWeight: "800", color: C.text },
  errorBox: {
    margin: 20, marginTop: 0, padding: 12, backgroundColor: "rgba(255,68,68,0.1)",
    borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,68,68,0.3)",
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  errorText: { color: "#FF4444", flex: 1, fontSize: 13 },
  list: { padding: 20, paddingTop: 10, gap: 12 },
  card: {
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder,
    padding: 16,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: C.primarySurface,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  title: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 2 },
  subtitle: { fontSize: 13, color: C.textMut },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  divider: { height: 1, backgroundColor: C.divider, marginBottom: 12 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  detailText: { fontSize: 13, color: C.textSec },
  actionRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.divider },
  returnBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.primary, paddingVertical: 12, borderRadius: 12,
  },
  returnBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  empty: { alignItems: "center", justifyContent: "center", marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.textMut },
});
