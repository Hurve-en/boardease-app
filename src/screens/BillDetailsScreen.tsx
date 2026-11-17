import { fetchBillingHistory } from "@/features/billing-history/api";
import { billMonthLabel, formatMoney, statusLabels, type BillingHistory, type HistoryBill } from "@/features/billing-history/model";
import { historyColors as c, historyFonts as f } from "@/features/billing-history/theme";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Inter_400Regular, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BillDetailsScreen() {
  const { billId } = useLocalSearchParams<{ billId: string }>();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  const [tenant, setTenant] = useState<BillingHistory["tenant"] | null>(null);
  const [bill, setBill] = useState<HistoryBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const history = await fetchBillingHistory(new AbortController().signal);
      setTenant(history.tenant);
      setBill(history.bills.find((item) => item.billId === billId) ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn’t load this bill.");
    } finally {
      setLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (!fontsLoaded || loading) return <SafeAreaView style={s.center}><ActivityIndicator color={c.brown} accessibilityLabel="Loading bill details" /></SafeAreaView>;

  if (error || !bill) return <SafeAreaView style={s.screen}><View style={s.topbar}><Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back"><Ionicons name="arrow-back" size={22} color={c.brown} /></Pressable><Text style={s.topTitle}>Bill details</Text></View><View style={s.notice}><Text style={s.sectionTitle}>{error ? "Couldn’t load this bill" : "Bill not found"}</Text><Text style={s.muted}>{error ?? "This bill may no longer be available."}</Text><Pressable onPress={() => void load()} style={s.retry}><Text style={s.retryText}>Try again</Text></Pressable></View></SafeAreaView>;

  const paid = bill.totalAmount - bill.outstandingBalance;
  return (
    <SafeAreaView style={s.screen}>
      <View style={s.topbar}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back"><Ionicons name="arrow-back" size={22} color={c.brown} /></Pressable>
        <Text style={s.topTitle}>Bill details</Text>
        <View style={s.avatar}><Text style={s.avatarText}>{tenant?.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</Text></View>
      </View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.titleRow}><View><Text style={s.month}>{billMonthLabel(bill.billingMonth)}</Text><Text style={s.ref}>{bill.billId.slice(0, 8).toUpperCase()} · {tenant?.roomNumber ? `Room ${tenant.roomNumber}` : "No room assigned"}</Text></View><Text style={[s.badge, bill.status === "paid" && s.badgePaid]}>{statusLabels[bill.status].toUpperCase()}</Text></View>
        {!tenant?.roomNumber ? <View style={s.roomNotice}><Ionicons name="information-circle-outline" size={19} color={c.brown} /><Text style={s.muted}>No room has been assigned to your account yet. Ask your owner to assign one.</Text></View> : null}
        <View style={s.card}>
          <MoneyRow label="Monthly rent" value={formatMoney(bill.totalAmount - bill.electricCharge - bill.waterCharge)} />
          <MoneyRow label="Electricity" value={formatMoney(bill.electricCharge)} />
          <MoneyRow label="Water" value={formatMoney(bill.waterCharge)} />
          <View style={s.divider} />
          <MoneyRow label="Total bill" value={formatMoney(bill.totalAmount)} strong />
          <MoneyRow label="Payments recorded" value={`− ${formatMoney(paid)}`} />
          <View style={s.balance}><Text style={s.balanceLabel}>OUTSTANDING BALANCE</Text><Text style={s.balanceAmount}>{formatMoney(bill.outstandingBalance)}</Text><Text style={s.balanceDue}>Due {formatDate(bill.dueDate)}</Text></View>
        </View>
        <Text style={s.sectionTitle}>Recorded payments</Text>
        {bill.payments?.length ? bill.payments.map((payment) => (
          <View style={s.paymentCard} key={payment.paymentId}>
            <View style={s.paymentTop}><Text style={s.paymentAmount}>{formatMoney(payment.amount)}</Text><Ionicons name="checkmark-circle-outline" size={21} color="#477452" /></View>
            <Text style={s.paymentMeta}>{formatDate(payment.paymentDate)} · Recorded by {payment.recordedBy ?? "your owner"}</Text>
          </View>
        )) : paid > 0 ? <View style={s.paymentCard}><Text style={s.paymentAmount}>{formatMoney(paid)}</Text><Text style={s.paymentMeta}>{bill.settledDate ? `Recorded ${formatDate(bill.settledDate)}` : "Payment recorded by your owner"}</Text></View> : <View style={s.paymentCard}><Text style={s.muted}>No payments have been recorded for this bill yet.</Text></View>}
        <View style={s.footerNote}><Ionicons name="information-circle-outline" size={17} color={c.muted} /><Text style={s.footerText}>Pay the remaining balance directly to your owner. Payments appear here after they’re recorded.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MoneyRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <View style={s.moneyRow}><Text style={[s.moneyLabel, strong && s.strong]}>{label}</Text><Text style={[s.moneyValue, strong && s.strong]}>{value}</Text></View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background },
  topbar: { minHeight: 58, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", gap: 14 }, topTitle: { flex: 1, fontFamily: f.bold, fontSize: 16, color: c.text },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: c.beige }, avatarText: { fontFamily: f.bold, fontSize: 11, color: c.brown },
  content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 30, width: "100%", maxWidth: 600, alignSelf: "center" }, titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 10 },
  month: { fontFamily: f.bold, fontSize: 23, color: c.text }, ref: { fontFamily: f.regular, fontSize: 12, color: c.muted, marginTop: 4 }, badge: { overflow: "hidden", borderRadius: 18, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: c.partial, color: c.brown, fontFamily: f.bold, fontSize: 10 }, badgePaid: { backgroundColor: c.paid },
  card: { padding: 18, borderWidth: 1, borderColor: c.border, borderRadius: 16, backgroundColor: c.white }, moneyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8 }, moneyLabel: { fontFamily: f.regular, fontSize: 14, color: c.muted }, moneyValue: { fontFamily: f.regular, fontSize: 14, color: c.text }, strong: { fontFamily: f.bold, color: c.text, fontSize: 16 }, divider: { height: 1, backgroundColor: c.border, marginBottom: 15 },
  balance: { padding: 14, marginTop: 5, borderRadius: 10, backgroundColor: c.beige }, balanceLabel: { fontFamily: f.regular, fontSize: 10, color: c.brown }, balanceAmount: { fontFamily: f.bold, fontSize: 24, color: c.brown, marginTop: 3 }, balanceDue: { fontFamily: f.regular, fontSize: 11, color: c.muted, marginTop: 3 },
  sectionTitle: { fontFamily: f.bold, fontSize: 16, color: c.text, marginTop: 22, marginBottom: 10 }, paymentCard: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 15, marginBottom: 9 }, paymentTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, paymentAmount: { fontFamily: f.bold, fontSize: 18, color: c.text }, paymentMeta: { fontFamily: f.regular, fontSize: 12, color: c.muted, marginTop: 8 },
  footerNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 15 }, footerText: { flex: 1, fontFamily: f.regular, fontSize: 12, color: c.muted, lineHeight: 18 },
  notice: { margin: 22, padding: 18, borderRadius: 14, backgroundColor: c.white, gap: 9 }, muted: { fontFamily: f.regular, fontSize: 13, color: c.muted, lineHeight: 19 }, retry: { alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: c.brown, borderRadius: 8 }, retryText: { fontFamily: f.bold, color: c.white, fontSize: 13 }, roomNotice: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 13, marginBottom: 13, backgroundColor: c.beige, borderRadius: 11 },
});
