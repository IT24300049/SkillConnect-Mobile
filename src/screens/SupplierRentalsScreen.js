import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../context/AuthContext";
import { getSupplierRentals } from "../services/apiClient";

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
};

export default function SupplierRentalsScreen() {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setError("");
      const data = await getSupplierRentals(token);
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

  function renderItem({ item }) {
    const eq = item.equipment || {};
    const name = eq.equipmentName || "Equipment";
    const customerName = item.customer
      ? `${item.customer.firstName} ${item.customer.lastName || ""}`.trim()
      : "Customer";
    const phone = item.customer?.phone || "No phone";

    const isActive = item.status === "active";

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

        <View style={styles.rowLayout}>
          <View style={styles.col}>
            <Text style={styles.label}>Rental Period</Text>
            <Text style={styles.value}>{start} - {end}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Earnings</Text>
            <Text style={styles.valueHighlight}>LKR {item.totalCost?.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.label}>Customer Details</Text>
        <View style={styles.customerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.customerMeta}>{item.customer?.email}</Text>
            <Text style={styles.customerMeta}>{phone}</Text>
          </View>
          {phone !== "No phone" && (
            <Pressable
              style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.8 }]}
              onPress={() => Linking.openURL(`tel:${phone}`)}
            >
              <Ionicons name="call" size={16} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Equipment Rentals</Text>
        <Text style={styles.pageSub}>Track who has rented your tools</Text>
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
              <Ionicons name="list-outline" size={48} color={C.textMut} />
              <Text style={styles.emptyTitle}>No Rentals Yet</Text>
              <Text style={styles.emptyText}>No one has rented your equipment.</Text>
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
  pageSub: { fontSize: 13, color: C.textMut, marginTop: 4 },
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
  divider: { height: 1, backgroundColor: C.divider, marginVertical: 12 },
  rowLayout: { flexDirection: "row", justifyContent: "space-between" },
  col: { flex: 1 },
  label: { fontSize: 11, fontWeight: "700", color: C.textMut, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  value: { fontSize: 14, color: C.text, fontWeight: "500" },
  valueHighlight: { fontSize: 15, color: C.primary, fontWeight: "700" },
  customerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  customerName: { fontSize: 15, fontWeight: "600", color: C.text, marginBottom: 2 },
  customerMeta: { fontSize: 13, color: C.textSec },
  callBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: C.success,
    alignItems: "center", justifyContent: "center",
  },
  empty: { alignItems: "center", justifyContent: "center", marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.textMut },
});
