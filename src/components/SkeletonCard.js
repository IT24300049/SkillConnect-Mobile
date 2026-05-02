import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";
import { Colors } from "../theme";

const { width } = Dimensions.get("window");

export default function SkeletonCard() {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.row, { opacity: fadeAnim }]}>
        <View style={styles.circle} />
        <View style={styles.textStack}>
          <View style={styles.lineLong} />
          <View style={styles.lineShort} />
        </View>
      </Animated.View>
      <Animated.View style={[styles.lineFull, { opacity: fadeAnim }]} />
      <Animated.View style={[styles.lineMedium, { opacity: fadeAnim }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceHighlight,
    marginRight: 16,
  },
  textStack: {
    flex: 1,
    gap: 8,
  },
  lineLong: {
    height: 14,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 4,
    width: "70%",
  },
  lineShort: {
    height: 12,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 4,
    width: "40%",
  },
  lineFull: {
    height: 12,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 4,
    width: "100%",
    marginBottom: 8,
  },
  lineMedium: {
    height: 12,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 4,
    width: "60%",
  },
});
