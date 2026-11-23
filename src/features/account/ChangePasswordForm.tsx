import { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { SecurityForm, securityStyles as styles } from "./SecurityForm";
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
  return <SecurityForm busy={busy} error={error} onSubmit={submit} onCancel={() => onClose()}
    submitLabel={busy ? "Saving…" : "Save password"}
    description="Use at least 8 characters. Your current password is required to save the change.">
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
  </SecurityForm>;
}
