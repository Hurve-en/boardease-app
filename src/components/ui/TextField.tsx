import { colors } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

type Props = TextInputProps & {
  label: string;
  hint?: string;
};

export default function TextField({ label, hint, style, ...rest }: Props) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = Boolean(rest.secureTextEntry);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={isPassword ? styles.passwordWrap : undefined}>
        <TextInput
          placeholderTextColor={colors.muted}
          style={[styles.input, isPassword && styles.passwordInput, style]}
          {...rest}
          secureTextEntry={isPassword ? !passwordVisible : rest.secureTextEntry}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            accessibilityState={{ disabled: false }}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={({ pressed }) => [styles.visibilityButton, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 20 },
  label: { marginBottom: 8, fontSize: 14, fontWeight: "600", color: colors.text },
  input: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  passwordWrap: { position: "relative", justifyContent: "center" },
  passwordInput: { paddingRight: 48 },
  visibilityButton: { position: "absolute", right: 12, minWidth: 32, height: 40, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.65 },
  hint: { marginTop: 8, fontSize: 12, color: colors.muted },
});
