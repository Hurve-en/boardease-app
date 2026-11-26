import { fonts, palette, radius } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type IconName = keyof typeof Ionicons.glyphMap;

export function TabItem({
  label,
  icon,
  activeIcon,
  selected = false,
  role = "tab",
  disabled = false,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  icon: IconName;
  activeIcon?: IconName;
  selected?: boolean;
  role?: "tab" | "button";
  disabled?: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={role === "tab" ? { selected } : { disabled }}
      aria-selected={role === "tab" ? selected : undefined}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
    >
      <View style={[styles.indicator, selected && styles.indicatorSelected]}>
        <Ionicons
          name={selected && activeIcon ? activeIcon : icon}
          size={20}
          color={selected ? palette.primary : palette.muted}
        />
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

export const tabBarStyles = StyleSheet.create({
  bar: { backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border },
  tabs: { width: "100%", maxWidth: 600, alignSelf: "center", flexDirection: "row", paddingVertical: 6 },
});

const styles = StyleSheet.create({
  tab: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 3 },
  indicator: { width: 52, height: 28, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  indicatorSelected: { backgroundColor: palette.surfaceSelected },
  label: { fontFamily: fonts.medium, fontSize: 11, color: palette.muted },
  labelSelected: { fontFamily: fonts.semibold, color: palette.primary },
  pressed: { opacity: 0.7 },
});
