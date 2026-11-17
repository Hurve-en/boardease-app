import { colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { signIn } from "@/lib/auth";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
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
        // Establish the same tenant-validated API session used by normal sign-in.
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader />

          <Text style={styles.title}>Create your account.</Text>
          <Text style={styles.subtitle}>
            Sign up to view your monthly bills and recorded payments.
          </Text>

          <View style={{ marginTop: 8 }}>
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
            By creating an account, you agree to our{" "}
            <Text style={styles.bold}>Terms of Service</Text> and{" "}
            <Text style={styles.bold}>Privacy Policy</Text>.
          </Text>

          {problem ? (
            <View style={[styles.message, styles.errorMessage]} accessibilityRole="alert">
              <Text style={styles.errorText}>{problem}</Text>
            </View>
          ) : null}
          {notice ? (
            <View style={[styles.message, styles.noticeMessage]} accessibilityRole="alert">
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}

          <PrimaryButton
            title={busy ? "Creating account…" : created ? "Continue to sign in" : "Create account"}
            disabled={busy}
            icon="arrow-forward"
            onPress={submit}
          />

          <Text style={styles.login}>
            Already have an account?{" "}
            <Link href="/login" style={styles.bold}>
              Log in
            </Link>
          </Text>

          <Text style={styles.footer}>
            Secure access to your bills and recorded payments.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24, paddingBottom: 40 },
  title: { marginTop: 28, fontSize: 30, fontWeight: "700", color: colors.text },
  subtitle: { marginTop: 6, fontSize: 15, lineHeight: 22, color: colors.muted },
  terms: {
    marginTop: 24,
    marginBottom: 16,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  message: {
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorMessage: { backgroundColor: "#FCEBE8", borderColor: "#E9B8B0" },
  errorText: { color: "#9A3529", fontSize: 13, lineHeight: 19 },
  noticeMessage: { backgroundColor: "#EAF4E9", borderColor: "#B9D5B6" },
  noticeText: { color: "#34633A", fontSize: 13, lineHeight: 19 },
  bold: { fontWeight: "700", color: colors.brown },
  login: { marginTop: 24, fontSize: 13, color: colors.muted },
  footer: { marginTop: 24, fontSize: 12, color: colors.muted },
});
