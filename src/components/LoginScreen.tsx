import { colors } from "@/constants/theme";
import { useState } from "react";
import {
    KeyboardAvoidingView, Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LogoMark from "./ui/LogoMark";
import PrimaryButton from "./ui/PrimaryButton";
import TextField from "./ui/TextField";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = () => {
    console.log("sign in", email);
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
          <View style={styles.logoRow}>
            <LogoMark size={36} />
            <Text style={styles.brand}>BoardEase</Text>
          </View>

          <View style={styles.hero}>
            <LogoMark size={66} />
            <Text style={styles.heroLabel}>TENANT WORKSPACE</Text>
          </View>

          <Text style={styles.title}>Welcome home.</Text>
          <Text style={styles.subtitle}>
            Sign in to view your monthly bills and recorded payments.
          </Text>

          <View style={{ marginTop: 8 }}>
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
              autoComplete="password"
              placeholder="Your password"
            />
          </View>

          <Pressable onPress={() => {}}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>

          <View style={{ marginTop: 18 }}>
            <PrimaryButton title="Sign in" icon="arrow-forward" onPress={handleSignIn} />
          </View>

          <Text style={styles.footer}>
            Need an account? Ask your boarding-house owner for your sign-in details.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 28, paddingTop: 24 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  brand: { fontSize: 24, fontWeight: "700", color: colors.brown },
  hero: {
    marginTop: 28,
    height: 148,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLabel: {
    marginTop: 14,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: colors.brown,
  },
  title: { marginTop: 28, fontSize: 30, fontWeight: "700", color: colors.text },
  subtitle: { marginTop: 6, fontSize: 15, lineHeight: 22, color: colors.muted },
  forgot: { marginTop: 18, fontSize: 13, fontWeight: "600", color: colors.brown },
  footer: { marginTop: 28, fontSize: 13, lineHeight: 19, color: colors.muted },
});