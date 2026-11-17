import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HistoryIcon } from "@/features/billing-history/HistoryIcon";
import { historyColors as c, historyFonts as f } from "@/features/billing-history/theme";

export function TenantTabBar({ active, hidden = false }: { active: "history" | "account"; hidden?: boolean }) {
  return <SafeAreaView edges={["bottom"]} style={styles.bar} aria-hidden={hidden}
    accessibilityElementsHidden={hidden} importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}>
    <View style={styles.tabs} accessibilityRole="tablist" accessibilityLabel="Main navigation">
      <View accessibilityRole="tab" accessibilityLabel="Home, coming soon" accessibilityState={{ disabled: true, selected: false }}
        aria-disabled aria-selected={false} style={[styles.tab, styles.disabled]}>
        <View style={styles.icon}><HistoryIcon name="home" /></View><Text style={styles.label}>Home</Text>
      </View>
      {(["history", "account"] as const).map(tab => <Pressable key={tab} accessibilityRole="tab"
        accessibilityState={{ selected: active === tab }} aria-selected={active === tab}
        onPress={() => { if (active !== tab) router.replace(tab === "history" ? "/history" : "/account"); }}
        style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
        <View style={[styles.icon, active === tab && styles.selected]}><HistoryIcon name={tab} /></View>
        <Text style={[styles.label, active === tab && styles.selectedLabel]}>{tab === "history" ? "History" : "Account"}</Text>
      </Pressable>)}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  bar: { backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.border },
  tabs: { width: "100%", maxWidth: 600, alignSelf: "center", flexDirection: "row", paddingVertical: 8 },
  tab: { flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", gap: 5 },
  icon: { width: 44, height: 26, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  selected: { backgroundColor: c.beige },
  label: { fontFamily: f.regular, fontSize: 11, color: c.muted },
  selectedLabel: { fontFamily: f.bold, color: c.brown },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
});
