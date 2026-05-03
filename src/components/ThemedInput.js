/**
 * ThemedInput — drop-in TextInput with correct placeholder color
 * for the dark orange/black/white theme. Use everywhere instead
 * of raw TextInput so the placeholder is always legible.
 */
import { TextInput } from "react-native";
import { Colors } from "../theme";

const MUTED = "#6E6E6E";

export default function ThemedInput({ style, ...props }) {
  return (
    <TextInput
      placeholderTextColor={MUTED}
      style={[{ color: Colors.textPrimary }, style]}
      {...props}
    />
  );
}
