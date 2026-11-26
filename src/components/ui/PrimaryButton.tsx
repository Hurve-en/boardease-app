import { fonts, palette, radius } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  busy?: boolean;
  variant?: "primary" | "secondary";
};

export default function PrimaryButton({ title, onPress, icon, disabled = false, busy = false, variant = "primary" }: Props) {
  const secondary = variant === "secondary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy }}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.secondary : styles.primary,
        pressed && !disabled && (secondary ? styles.secondaryPressed : styles.primaryPressed),
        disabled && styles.disabled,
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={secondary ? palette.text : palette.inverse} /> : null}
      <Text style={[styles.text, secondary && styles.secondaryText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  primary: { backgroundColor: palette.primary },
  primaryPressed: { backgroundColor: palette.primaryPressed },
  secondary: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  secondaryPressed: { backgroundColor: palette.surfaceSubtle },
  disabled: { opacity: 0.6 },
  text: { color: palette.inverse, fontSize: 14, fontFamily: fonts.semibold },
  secondaryText: { color: palette.text },
});
