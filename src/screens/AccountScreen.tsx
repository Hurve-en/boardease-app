import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Inter_400Regular, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { StatusBar } from "expo-status-bar";
import { signOut } from "@/lib/auth";
import { TenantTabBar } from "@/components/navigation/TenantTabBar";
import { historyColors as c, historyFonts as f } from "@/features/billing-history/theme";
import { HistoryIcon } from "@/features/billing-history/HistoryIcon";

export default function AccountScreen() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_700Bold });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    setError("");
    try { await signOut(); }
    catch { setError("We couldn’t sign you out. Please try again."); }
    finally { setBusy(false); }
  }

  if (!fontsLoaded && !fontError) return <SafeAreaView style={styles.screen}><ActivityIndicator style={styles.loading} color={c.brown} accessibilityLabel="Loading account" /></SafeAreaView>;

  return <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}><View style={styles.mark}><HistoryIcon name="brand" /></View><Text style={styles.brand}>BoardEase</Text></View>
      <Text accessibilityRole="header" style={styles.title}>Account</Text>
      <Text style={styles.subtitle}>Profile and security</Text>
      <View style={styles.card}><Text style={styles.cardTitle}>Your profile</Text><Text style={styles.body}>Your profile details will be available here soon.</Text></View>
      <Text accessibilityRole="header" style={styles.sectionTitle}>Security</Text>
      {error ? <Text accessibilityRole="alert" style={styles.body}>{error}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} aria-disabled={busy}
        disabled={busy} onPress={handleSignOut} style={({ pressed }) => [styles.signOut, (pressed || busy) && styles.pressed]}>
        <Text style={styles.signOutText}>{busy ? "Signing out…" : "Sign out"}</Text>
      </Pressable>
    </ScrollView>
    <TenantTabBar active="account" />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  loading: { flex: 1 },
  content: { flexGrow: 1, width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 20, paddingBottom: 24 },
  header: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  mark: { width: 34, height: 34, borderRadius: 8, backgroundColor: c.brown, alignItems: "center", justifyContent: "center" },
  brand: { fontFamily: f.bold, fontSize: 19, color: c.brown },
  title: { fontFamily: f.bold, fontSize: 28, color: c.text, marginTop: 16 },
  subtitle: { fontFamily: f.regular, fontSize: 13, color: c.muted, marginTop: 5 },
  card: { padding: 16, marginTop: 24, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 14, gap: 8 },
  cardTitle: { fontFamily: f.bold, fontSize: 17, color: c.text },
  body: { fontFamily: f.regular, fontSize: 14, color: c.muted, lineHeight: 22 },
  sectionTitle: { fontFamily: f.bold, fontSize: 17, color: c.text, marginTop: 28, marginBottom: 12 },
  signOut: { backgroundColor: c.white, minHeight: 48, padding: 14, borderWidth: 1, borderColor: c.border, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  signOutText: { fontFamily: f.bold, fontSize: 14, color: c.brown },
  pressed: { opacity: 0.7 },
});
