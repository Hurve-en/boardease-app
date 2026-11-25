import { fonts, palette, radius } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

const tones = {
  error: { icon: "alert-circle-outline", fg: palette.danger, bg: palette.dangerSurface },
  success: { icon: "checkmark-circle-outline", fg: palette.success, bg: palette.successSurface },
  info: { icon: "information-circle-outline", fg: palette.textSecondary, bg: palette.surfaceMuted },
} as const;

export default function Notice({ tone, message }: { tone: keyof typeof tones; message: string }) {
  const t = tones[tone];
  return (
    <View style={[styles.box, { backgroundColor: t.bg }]} accessibilityRole="alert">
      <Ionicons name={t.icon} size={17} color={t.fg} style={styles.icon} />
      <Text style={[styles.text, { color: t.fg }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingVertical: 11, borderRadius: radius.card },
  icon: { marginTop: 1 },
  text: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
});
