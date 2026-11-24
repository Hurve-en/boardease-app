import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
  form: { gap: 16, padding: 16, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 14, marginTop: 12 },
  description: { fontFamily: f.regular, fontSize: 13, lineHeight: 20, color: c.muted },
  field: { gap: 8 },
  label: { fontFamily: f.bold, fontSize: 13, color: c.text },
  passwordInputRow: { minHeight: 48, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: c.border, borderRadius: 8, backgroundColor: c.white },
  passwordInput: { flex: 1, minWidth: 0, minHeight: 46, paddingHorizontal: 12, color: c.text, fontFamily: f.regular, fontSize: 14 },
  visibilityButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  input: { minHeight: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: c.border, borderRadius: 8, color: c.text, fontFamily: f.regular, fontSize: 14 },
  error: { fontFamily: f.regular, fontSize: 13, lineHeight: 20, color: c.text },
  save: { minHeight: 48, borderRadius: 10, backgroundColor: c.brown, alignItems: "center", justifyContent: "center", padding: 12 },
  saveText: { fontFamily: f.bold, fontSize: 14, color: c.white },
  cancel: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.7 },
});
