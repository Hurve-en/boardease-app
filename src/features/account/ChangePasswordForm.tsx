import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { historyColors as c, historyFonts as f } from "@/features/billing-history/theme";
import { passwordProblem } from "./model";
import { changePassword } from "./password";

export function ChangePasswordForm({ onClose, onBusyChange }: { onClose: (success?: boolean) => void; onBusyChange: (busy: boolean) => void }) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  async function submit() {
    if (submitting.current) return;
    const problem = passwordProblem(current, password, confirmation);
    if (problem) { setError(problem); return; }
    submitting.current = true;
    setBusy(true); onBusyChange(true); setError("");
    try {
      await changePassword(current, password);
      setCurrent(""); setPassword(""); setConfirmation(""); onClose(true);
    } catch (err) {
      setError(err instanceof Error && err.message !== "Network request failed" ? err.message : "We couldn’t reach the service. Please try again.");
    } finally { submitting.current = false; setBusy(false); onBusyChange(false); }
  }
  return <View style={styles.form}>
    <Text style={styles.description}>Use at least 8 characters. Your current password is required to save the change.</Text>
    {[
      { label: "Current password", value: current, change: setCurrent, current: true },
      { label: "New password", value: password, change: setPassword, current: false },
      { label: "Confirm new password", value: confirmation, change: setConfirmation, current: false },
    ].map(field => <View key={field.label} style={styles.field}>
      <Text style={styles.label}>{field.label}</Text>
      <TextInput accessibilityLabel={field.label} value={field.value} onChangeText={field.change}
        secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!busy}
        autoComplete={field.current ? "current-password" : "new-password"}
        textContentType={field.current ? "password" : "newPassword"} style={styles.input} />
    </View>)}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Pressable accessibilityRole="button" accessibilityState={{ busy, disabled: busy }} disabled={busy}
      onPress={submit} style={({ pressed }) => [styles.save, (pressed || busy) && styles.pressed]}>
      <Text style={styles.saveText}>{busy ? "Saving…" : "Save password"}</Text>
    </Pressable>
    <Pressable accessibilityRole="button" disabled={busy} accessibilityState={{ disabled: busy }} onPress={() => onClose()}
      style={({ pressed }) => [styles.cancel, (pressed || busy) && styles.pressed]}><Text style={styles.label}>Cancel</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({
  form: { gap: 16, padding: 16, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 14, marginTop: 12 },
  description: { fontFamily: f.regular, fontSize: 13, lineHeight: 20, color: c.muted },
  field: { gap: 8 },
  label: { fontFamily: f.bold, fontSize: 13, color: c.text },
  input: { minHeight: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: c.border, borderRadius: 8, color: c.text, fontFamily: f.regular, fontSize: 14 },
  error: { fontFamily: f.regular, fontSize: 13, lineHeight: 20, color: c.text },
  save: { minHeight: 48, borderRadius: 10, backgroundColor: c.brown, alignItems: "center", justifyContent: "center", padding: 12 },
  saveText: { fontFamily: f.bold, fontSize: 14, color: c.white },
  cancel: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.7 },
});
