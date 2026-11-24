import { HistoryIcon } from "@/features/billing-history/HistoryIcon";
import { historyColors as c, historyFonts as f } from "@/features/billing-history/theme";
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
          <View style={styles.brandMark}>
            <HistoryIcon name="brand" />
          </View>
          <Text style={styles.brandName}>BoardEase</Text>
        </View>
        <View accessible accessibilityRole="image" accessibilityLabel="Admin account" style={styles.avatar}>
          <Text style={styles.avatarLabel}>AD</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text style={styles.eyebrow}>BOARDEASE ADMIN</Text>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        </View>
        {onRefresh ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={refreshing ? "Refreshing" : `Refresh ${title.toLowerCase()}`}
            accessibilityState={{ disabled: refreshing, busy: refreshing }}
            disabled={refreshing}
            onPress={onRefresh}
            style={({ pressed }) => [styles.refresh, pressed && styles.pressed]}
          >
            <Ionicons name="refresh-outline" size={20} color={c.brown} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  brandRow: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: c.brown },
  brandName: { fontFamily: f.bold, fontSize: 19, color: c.brown },
  avatar: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: c.beige },
  avatarLabel: { fontFamily: f.bold, fontSize: 11, color: c.brown },
  divider: { height: 1, backgroundColor: c.border, marginTop: 10, marginBottom: 15 },
  titleRow: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  titleCopy: { flex: 1 },
  eyebrow: { fontFamily: f.bold, fontSize: 10, letterSpacing: 1, color: c.muted },
  title: { marginTop: 2, fontFamily: f.bold, fontSize: 27, color: c.text },
  refresh: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: c.beige },
  pressed: { opacity: 0.68 },
});
