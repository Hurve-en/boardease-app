import { colors } from "@/constants/theme";
import { Link } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform, ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthHeader from "./ui/Authheader";
import PrimaryButton from "./ui/PrimaryButton";
import TextField from "./ui/TextField";


export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleRegister = () => {
    if (password.length < 8) return console.log("password too short");
    if (password !== confirm) return console.log("passwords don't match");
    console.log("register", name, email);
  };

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

          <PrimaryButton
            title="Create account"
            icon="arrow-forward"
            onPress={handleRegister}
          />

          <Text style={styles.login}>
            Already have an account?{" "}
            <Link href="/" style={styles.bold}>Log in</Link>
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