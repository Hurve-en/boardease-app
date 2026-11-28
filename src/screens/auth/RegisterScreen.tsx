import { fonts, palette } from "@/constants/theme";
import Notice from "@/components/ui/Notice";
import { supabase } from "@/lib/supabase";
import { signIn } from "@/lib/auth";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthHeader from "@/components/auth/AuthHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TextField from "@/components/ui/TextField";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");
  const [created, setCreated] = useState(false);

  async function submit() {
    if (busy) return;
    if (created) {
      router.replace("/login");
      return;
    }
    setProblem("");
    setNotice("");

    if (!supabase) {
      setProblem("Registration is not configured. Please contact the administrator.");
      return;
    }

    if (!name.trim()) {
      setProblem("Enter your name.");
      return;
    }
    if (password.length < 8) {
      setProblem("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setProblem("Passwords don't match.");
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() } },
      });

      if (error) {
        setProblem(error.message);
        return;
      }

      setCreated(true);
      setPassword("");
      setConfirm("");
      if (data.session) {
        // Notify the app's route guard using the shared Supabase sign-in flow.
        const signInError = await signIn(email, password);
        if (!signInError) {
          router.replace("/history");
          return;
        }
        setProblem(signInError);
        setNotice("Your account was created. Please sign in to continue.");
      } else {
        setNotice("Check your email for a confirmation link, then sign in to continue.");
      }
    } catch {
      setProblem("Sign up failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
        <ScrollView
          style={{ flex: 1 }}
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader />

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Your owner links it to your room after you sign up.</Text>

          <View style={{ marginTop: 12 }}>
            <TextField
              label="Full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              placeholder="Your full name"
            />
            <TextField
              label="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@email.com"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              placeholder="Create a password"
              hint="Use at least 8 characters."
            />
            <TextField
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoComplete="new-password"
              placeholder="Re-enter your password"
            />
          </View>

          <Text style={styles.terms}>
            By creating an account, you agree to the Terms of Service and Privacy Policy.
          </Text>

          <View style={styles.actions}>
            {problem ? <Notice tone="error" message={problem} /> : null}
            {notice ? <Notice tone="success" message={notice} /> : null}

          <PrimaryButton
            title={busy ? "Creating account…" : created ? "Continue to sign in" : "Create account"}
            disabled={busy}
            busy={busy}
            onPress={submit}
          />
          </View>

          <Text style={styles.login}>
            Already have an account?{" "}
            <Link href="/login" style={styles.link}>
              Sign in
            </Link>
          </Text>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.surface },
  container: { flexGrow: 1, justifyContent: "center", padding: 24, paddingBottom: 40, width: "100%", maxWidth: 420, alignSelf: "center" },
  title: { marginTop: 28, textAlign: "center", fontSize: 24, letterSpacing: -0.5, fontFamily: fonts.semibold, color: palette.text },
  subtitle: { marginTop: 6, textAlign: "center", fontSize: 14, lineHeight: 20, fontFamily: fonts.regular, color: palette.muted },
  terms: { marginTop: 20, fontSize: 12, lineHeight: 18, fontFamily: fonts.regular, color: palette.muted, textAlign: "center" },
  actions: { marginTop: 16, gap: 12 },
  link: { fontFamily: fonts.semibold, color: palette.primary },
  login: { marginTop: 28, textAlign: "center", fontSize: 14, fontFamily: fonts.regular, color: palette.muted },
});
