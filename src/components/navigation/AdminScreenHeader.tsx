import LogoMark from "@/components/auth/LogoMark";
import { fonts, palette, radius } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function AdminScreenHeader({
  title,
  onRefresh,
  refreshing = false,
}: {
  title: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.brand}>
          <LogoMark size={28} />
          <Text style={styles.brandName}>BoardEase</Text>
        </View>
        <View accessible accessibilityRole="image" accessibilityLabel="Admin account" style={styles.avatar}>
          <Text style={styles.avatarLabel}>AD</Text>
        </View>
      </View>
      <View style={styles.titleRow}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {onRefresh ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={refreshing ? "Refreshing" : `Refresh ${title.toLowerCase()}`}
            accessibilityState={{ disabled: refreshing, busy: refreshing }}
            disabled={refreshing}
            onPress={onRefresh}
            style={({ pressed }) => [styles.refresh, pressed && styles.pressed]}
          >
            <Ionicons name="refresh-outline" size={17} color={palette.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  brandRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    paddingBottom: 10,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandName: { fontFamily: fonts.bold, fontSize: 17, letterSpacing: -0.3, color: palette.text },
  avatar: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceSelected,
  },
  avatarLabel: { fontFamily: fonts.semibold, fontSize: 11, color: palette.primary },
  titleRow: { minHeight: 40, marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { flex: 1, fontFamily: fonts.semibold, fontSize: 22, letterSpacing: -0.4, color: palette.text },
  refresh: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  pressed: { opacity: 0.68 },
});
