import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Inter_400Regular, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { StatusBar } from "expo-status-bar";
import { signOut } from "@/lib/auth";
import { TenantTabBar } from "@/components/navigation/TenantTabBar";
import { historyColors as c, historyFonts as f } from "@/features/billing-history/theme";
import { HistoryIcon } from "@/features/billing-history/HistoryIcon";
import { initials } from "@/features/billing-history/model";
import { AccountSessionError, fetchAccount } from "@/features/account/api";
import { ownerContacts, type TenantAccount } from "@/features/account/model";
import { ChangePasswordForm } from "@/features/account/ChangePasswordForm";

export default function AccountScreen() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_700Bold });
  const [data, setData] = useState<TenantAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const signingOut = useRef(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetchAccount(controller.signal).then(account => {
      if (active && !controller.signal.aborted) { setData(account); setSessionExpired(false); }
    }).catch(err => {
      if (!active) return;
      setData(null); setShowContacts(false); setShowPassword(false);
      setSessionExpired(err instanceof AccountSessionError);
      setLoadError(controller.signal.aborted ? "The request took too long. Please try again." :
        err instanceof Error && err.message !== "Network request failed" && err.message !== "Failed to fetch" ? err.message : "We couldn’t load your account. Check your connection and try again.");
    }).finally(() => { clearTimeout(timeout); if (active) setLoading(false); });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [attempt]);

  async function handleSignOut() {
    if (signingOut.current || passwordBusy) return;
    signingOut.current = true;
    setBusy(true); setActionError("");
    try { await signOut(); }
    catch { setActionError("We couldn’t sign you out. Please try again."); }
    finally { signingOut.current = false; setBusy(false); }
  }
  async function openContact(url: string) {
    setActionError("");
    try { await Linking.openURL(url); }
    catch { setActionError("We couldn’t open a phone or email app. Use the owner’s contact details shown below."); }
  }
  function refresh() {
    if (!loading && !passwordBusy && !busy) {
      setLoading(true); setLoadError(""); setAttempt(value => value + 1);
    }
  }
  const contacts = ownerContacts(data?.owner ?? null);
  const avatar = data ? initials(data.profile.name) : "";
  const disabled = busy || passwordBusy;

  if (!fontsLoaded && !fontError) return <SafeAreaView style={styles.screen}><ActivityIndicator style={styles.loading} color={c.brown} accessibilityLabel="Loading account" /></SafeAreaView>;

  return <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
    <StatusBar style="dark" />
    <KeyboardAvoidingView style={styles.loading} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading && data !== null} onRefresh={refresh} enabled={!disabled} tintColor={c.brown} />}>
        <View style={styles.header}>
          <View style={styles.mark}><HistoryIcon name="brand" /></View><Text style={styles.brand}>BoardEase</Text>
          <View style={styles.headerAvatar} accessible={false}><Text style={styles.headerInitials}>{avatar}</Text></View>
        </View>
        <Text accessibilityRole="header" style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>Profile, boarding house, and security</Text>
        {loading && !data ? <View style={styles.state}><ActivityIndicator color={c.brown} accessibilityLabel="Loading account information" /><Text style={styles.body}>Loading your account…</Text></View> : null}
        {loadError ? <View style={styles.state}>
          <Text accessibilityRole="alert" style={styles.body}>{loadError}</Text>
          <Action label={sessionExpired ? "Sign in again" : "Try again"} disabled={disabled} onPress={sessionExpired ? handleSignOut : refresh} />
        </View> : null}
        {data ? <>
          <View style={styles.profileCard}>
            <View style={styles.avatar} accessible={false}><Text style={styles.avatarText}>{avatar}</Text></View>
            <View style={styles.profileText}><Text style={styles.profileName}>{data.profile.name}</Text><Text selectable style={styles.body}>{data.profile.email}</Text></View>
          </View>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Your boarding house</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{data.tenancy?.boardingHouseName ?? "Boarding-house name unavailable"}</Text>
            <Text style={styles.body}>{data.tenancy ? data.tenancy.roomNumber ? `Room ${data.tenancy.roomNumber}` : "No room assigned yet" : "Your account isn’t linked to a tenant record yet. Please contact your owner."}</Text>
            <Text style={styles.body}>{data.owner?.name ? `${data.owner.name} · Boarding-house owner` : "Owner information unavailable"}</Text>
          </View>
          <View style={styles.contactAction}><Action label="Contact owner" disabled={disabled} onPress={() => { setShowContacts(value => !value); setActionError(""); }} expanded={showContacts} /></View>
          {showContacts ? <View style={styles.contactDetails}>
            {contacts.length ? <>
              {data.owner?.phone ? <Text selectable style={styles.body}>{data.owner.phone}</Text> : null}
              {data.owner?.email ? <Text selectable style={styles.body}>{data.owner.email}</Text> : null}
              {contacts.map(contact => <Action key={contact.label} label={contact.label} onPress={() => openContact(contact.url)} disabled={disabled} />)}
            </> : <Text style={styles.body}>Your owner hasn’t provided contact details yet.</Text>}
          </View> : null}
        </> : null}
        <Text accessibilityRole="header" style={styles.sectionTitle}>Security</Text>
        <Action label="Change password" chevron disabled={disabled || sessionExpired || loading} expanded={showPassword}
          onPress={() => { setShowPassword(value => !value); setPasswordSaved(false); }} />
        {showPassword ? <ChangePasswordForm onBusyChange={setPasswordBusy} onClose={success => { setShowPassword(false); setPasswordSaved(!!success); }} /> : null}
        {passwordSaved ? <Text accessibilityRole="alert" style={styles.success}>Your password has been changed.</Text> : null}
        {actionError ? <Text accessibilityRole="alert" style={styles.actionError}>{actionError}</Text> : null}
        <View style={styles.signOut}><Action label={busy ? "Signing out…" : "Sign out"} disabled={disabled} onPress={handleSignOut} /></View>
        {Platform.OS === "web" && data ? <Pressable accessibilityRole="button" disabled={disabled || loading} onPress={refresh} style={styles.refresh}><Text style={styles.refreshText}>{loading ? "Refreshing…" : "Refresh account"}</Text></Pressable> : null}
      </ScrollView>
    </KeyboardAvoidingView>
    <TenantTabBar active="account" />
  </SafeAreaView>;
}

function Action({ label, onPress, disabled = false, chevron = false, expanded }: { label: string; onPress: () => void; disabled?: boolean; chevron?: boolean; expanded?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, ...(expanded === undefined ? {} : { expanded }) }} aria-expanded={expanded} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [styles.action, (pressed || disabled) && styles.pressed]}>
    <Text style={[styles.actionText, chevron && styles.rowLabel]}>{label}</Text>
    {chevron ? <HistoryIcon name="right" /> : null}
  </Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  loading: { flex: 1 },
  content: { flexGrow: 1, width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 20, paddingBottom: 24 },
  header: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  mark: { width: 34, height: 34, borderRadius: 8, backgroundColor: c.brown, alignItems: "center", justifyContent: "center" },
  brand: { fontFamily: f.bold, fontSize: 19, color: c.brown },
  headerAvatar: { marginLeft: "auto", width: 34, height: 34, borderRadius: 17, backgroundColor: c.beige, alignItems: "center", justifyContent: "center" },
  headerInitials: { fontFamily: f.bold, fontSize: 11, color: c.brown },
  title: { fontFamily: f.bold, fontSize: 28, color: c.text, marginTop: 16 },
  subtitle: { fontFamily: f.regular, fontSize: 13, color: c.muted, marginTop: 5 },
  profileCard: { minHeight: 94, padding: 18, marginTop: 24, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.beige, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: f.bold, fontSize: 13, color: c.brown },
  profileText: { flex: 1, gap: 4 },
  profileName: { fontFamily: f.bold, fontSize: 17, color: c.text },
  card: { padding: 16, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 14, gap: 6 },
  cardTitle: { fontFamily: f.bold, fontSize: 16, color: c.text },
  body: { fontFamily: f.regular, fontSize: 13, color: c.muted, lineHeight: 20, flexShrink: 1 },
  sectionTitle: { fontFamily: f.bold, fontSize: 17, color: c.text, marginTop: 28, marginBottom: 12 },
  action: { flexDirection: "row", gap: 12, backgroundColor: c.white, minHeight: 48, padding: 14, borderWidth: 1, borderColor: c.border, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionText: { fontFamily: f.bold, fontSize: 14, color: c.brown, flexShrink: 1 },
  rowLabel: { flex: 1, color: c.text },
  contactAction: { marginTop: 14 },
  contactDetails: { padding: 16, marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.white, gap: 16 },
  signOut: { marginTop: 18 },
  state: { marginTop: 24, padding: 16, gap: 16 },
  success: { marginTop: 12, padding: 14, backgroundColor: c.paid, borderRadius: 10, fontFamily: f.regular, fontSize: 14, color: c.text },
  actionError: { marginTop: 12, fontFamily: f.regular, fontSize: 14, lineHeight: 22, color: c.text },
  refresh: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 12 },
  refreshText: { fontFamily: f.regular, fontSize: 13, color: c.muted },
  pressed: { opacity: 0.7 },
});
