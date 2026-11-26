import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette, radius } from "@/constants/theme";
import { historyColors as c, historyFonts as f } from "@/features/billing-history/theme";

type Props = {
  children: ReactNode;
  description: string;
  error: string;
  busy: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
};

export function SecurityForm({ children, description, error, busy, submitLabel, onSubmit, onCancel }: Props) {
  return <View style={securityStyles.form}>
    <Text style={securityStyles.description}>{description}</Text>
    {children}
    {error ? <Text accessibilityRole="alert" style={securityStyles.error}>{error}</Text> : null}
    <Pressable accessibilityRole="button" accessibilityState={{ busy, disabled: busy }} disabled={busy}
      onPress={onSubmit} style={({ pressed }) => [securityStyles.save, (pressed || busy) && securityStyles.pressed]}>
      <Text style={securityStyles.saveText}>{submitLabel}</Text>
    </Pressable>
    <Pressable accessibilityRole="button" disabled={busy} accessibilityState={{ disabled: busy }} onPress={onCancel}
      style={({ pressed }) => [securityStyles.cancel, (pressed || busy) && securityStyles.pressed]}><Text style={securityStyles.label}>Cancel</Text></Pressable>
  </View>;
}

export const securityStyles = StyleSheet.create({
  form: { gap: 12, padding: 14, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: radius.card, marginTop: 10 },
  description: { fontFamily: f.regular, fontSize: 13, lineHeight: 20, color: c.muted },
  field: { gap: 6 },
  label: { fontFamily: f.bold, fontSize: 13, color: c.text },
  passwordInputRow: { minHeight: 44, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "transparent", borderRadius: radius.pill, backgroundColor: palette.surfaceMuted, paddingLeft: 4 },
  passwordInput: { flex: 1, minWidth: 0, minHeight: 42, paddingHorizontal: 12, color: c.text, fontFamily: f.regular, fontSize: 14 },
  visibilityButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  input: { minHeight: 44, paddingHorizontal: 16, borderWidth: 1, borderColor: "transparent", borderRadius: radius.pill, backgroundColor: palette.surfaceMuted, color: c.text, fontFamily: f.regular, fontSize: 14 },
  error: { fontFamily: f.regular, fontSize: 13, lineHeight: 19, color: palette.danger, backgroundColor: palette.dangerSurface, padding: 10, borderRadius: radius.card, overflow: "hidden" },
  save: { minHeight: 44, borderRadius: radius.pill, backgroundColor: c.brown, alignItems: "center", justifyContent: "center", padding: 12 },
  saveText: { fontFamily: f.bold, fontSize: 14, color: c.white },
  cancel: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.7 },
});
