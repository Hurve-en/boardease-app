import { colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { Link, useRouter } from "expo-router";
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
import AuthHeader from "./ui/AuthHeader";
import PrimaryButton from "./ui/PrimaryButton";
import TextField from "./ui/TextField";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");
  const router = useRouter();

  async function submit() {
    setProblem("");
    setNotice("");

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

      console.log("sign up successful", data, error);

      if (error) {
        setProblem(error.message);
        return;
      }

      setNotice(
        data.session
          ? "Account created successfully."
          : "Check your email for a confirmation link.",
      );
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

          {problem ? <Text>{problem}</Text> : null}
          {notice ? <Text>{notice}</Text> : null}

          <PrimaryButton
            title="Create account"
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
  bold: { fontWeight: "700", color: colors.brown },
  login: { marginTop: 24, fontSize: 13, color: colors.muted },
  footer: { marginTop: 24, fontSize: 12, color: colors.muted },
});
