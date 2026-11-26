import { fonts, palette, radius } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

type Props = TextInputProps & {
  label: string;
  hint?: string;
  hideLabel?: boolean;
};

export default function TextField({ label, hint, hideLabel = false, style, ...rest }: Props) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = Boolean(rest.secureTextEntry);

  return (
    <View style={hideLabel ? styles.wrapCompact : styles.wrap}>
      {hideLabel ? null : <Text style={styles.label}>{label}</Text>}
      <View style={styles.field}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={palette.muted}
          {...rest}
          placeholder={rest.placeholder ?? (hideLabel ? label : undefined)}
          onFocus={(event) => {
            setFocused(true);
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            rest.onBlur?.(event);
          }}
          style={[styles.input, focused && styles.inputFocused, isPassword && styles.passwordInput, style]}
          secureTextEntry={isPassword ? !passwordVisible : rest.secureTextEntry}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            accessibilityState={{ selected: passwordVisible }}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={({ pressed }) => [styles.visibilityButton, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={19} color={palette.muted} />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  wrapCompact: { marginTop: 12 },
  label: { marginBottom: 6, marginLeft: 4, fontSize: 13, fontFamily: fonts.medium, color: palette.text },
  field: { justifyContent: "center" },
  input: {
    height: 48,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    fontSize: 15,
    fontFamily: fonts.regular,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: "transparent",
    color: palette.text,
  },
  inputFocused: { backgroundColor: palette.surface, borderColor: palette.primary },
  passwordInput: { paddingRight: 52 },
  visibilityButton: {
    position: "absolute",
    right: 6,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { backgroundColor: palette.surface },
  hint: { marginTop: 6, marginLeft: 4, fontSize: 12, fontFamily: fonts.regular, color: palette.muted },
});
