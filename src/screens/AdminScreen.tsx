import { fonts, palette, radius } from "@/constants/theme";
import { historyColors as c, historyFonts as f } from "@/features/billing-history/theme";
import { fetchAdminDashboard, type AdminDashboardData } from "@/features/admin-dashboard/api";
import { AdminTabBar } from "@/components/navigation/AdminTabBar";
import { AdminScreenHeader } from "@/components/navigation/AdminScreenHeader";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Inter_400Regular, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const currency = new Intl.NumberFormat("en-PH", {style: "currency", currency: "PHP"});

function money(value: string) {
  const amount = Number(value);
  return currency.format(Number.isFinite(amount) ? amount : 0);
}

function dayLabel(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", {day: "numeric", month: "short", year: "numeric"});
}

function monthLabel(value: string) {
  const date = new Date(`${value.slice(0, 7)}-01T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {month: "long", year: "numeric"});
}

export default function AdminScreen() {
  const [fontsLoaded, fontError] = useFonts({Inter_400Regular, Inter_700Bold});
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchAdminDashboard(controller.signal)
      .then(setData)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Couldn’t load the admin dashboard.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  function retryDashboard() {
    setLoading(true);
    setError("");
    setAttempt((value) => value + 1);
  }

  if (!fontsLoaded && !fontError) {
    return <View style={styles.loading}><ActivityIndicator accessibilityLabel="Loading admin dashboard" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <AdminScreenHeader title="Dashboard" onRefresh={retryDashboard} refreshing={loading} />

        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator color={c.brown} accessibilityLabel="Loading dashboard data" />
            <Text style={styles.body}>Loading dashboard…</Text>
          </View>
        ) : error ? (
          <View style={styles.state}>
            <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
            <Pressable onPress={retryDashboard} style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : data ? (
          <>
            <Text style={styles.sectionLabel}>{monthLabel(data.billing.month)}</Text>
            <View style={styles.billingCard}>
              <Text style={styles.cardLabel}>Total billed</Text>
              <Text style={styles.total}>{money(data.billing.totalBilled)}</Text>
              <View style={styles.billingRow}>
                <View>
                  <Text style={styles.billingLabel}>Collected</Text>
                  <Text style={styles.billingValue}>{money(data.billing.totalCollected)}</Text>
                </View>
                <View>
                  <Text style={styles.billingLabel}>Outstanding</Text>
                  <Text style={styles.billingValue}>{money(data.billing.totalOutstanding)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.metricGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Rooms occupied</Text>
                <Text style={styles.metricValue}>{data.rooms.occupied} / {data.rooms.total}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Active tenants</Text>
                <Text style={styles.metricValue}>{data.tenants.active} / {data.tenants.total}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Overdue bills</Text>
                <Text style={styles.metricValue}>{data.overdue.count}</Text>
                <Text style={styles.metricHint}>{money(data.overdue.amount)} outstanding</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Bills this month</Text>
                <Text style={styles.metricValue}>{data.billing.paidCount + data.billing.partialCount + data.billing.unpaidCount}</Text>
                <Text style={styles.metricHint}>{data.billing.paidCount} paid, {data.billing.partialCount} partial, {data.billing.unpaidCount} unpaid</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Recent payments</Text>
            {data.recentPayments.length ? data.recentPayments.map((payment) => (
              <View key={payment.paymentId} style={styles.paymentRow}>
                <View style={styles.paymentIcon}>
                  <Ionicons name="receipt-outline" size={18} color={c.brown} />
                </View>
                <View style={styles.paymentCopy}>
                  <Text style={styles.paymentName}>{payment.tenantName}</Text>
                  <Text style={styles.paymentDate}>{dayLabel(payment.paymentDate)}</Text>
                </View>
                <Text style={styles.paymentAmount}>{money(payment.amount)}</Text>
              </View>
            )) : (
              <Text style={styles.body}>No payments have been recorded yet.</Text>
            )}
          </>
        ) : null}
      </ScrollView>

      <AdminTabBar active="dashboard" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: palette.canvas},
  loading: {flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.canvas},
  content: {flexGrow: 1, width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24},
  pressed: {opacity: 0.65},
  sectionLabel: {fontFamily: f.regular, fontSize: 13, color: c.muted, marginBottom: 8},
  billingCard: {padding: 14, borderRadius: radius.card, borderWidth: 1, borderColor: c.border, backgroundColor: c.white},
  cardLabel: {fontFamily: fonts.medium, fontSize: 13, color: c.text},
  total: {fontFamily: fonts.medium, fontSize: 30, letterSpacing: -0.8, color: c.text, marginTop: 6, fontVariant: ["tabular-nums"]},
  billingRow: {flexDirection: "row", justifyContent: "space-between", gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border},
  billingLabel: {fontFamily: f.regular, fontSize: 12, color: c.muted},
  billingValue: {fontFamily: f.bold, fontSize: 15, color: c.text, marginTop: 2, fontVariant: ["tabular-nums"]},
  metricGrid: {flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8},
  metricCard: {width: "48%", flexGrow: 1, padding: 12, borderRadius: radius.card, borderWidth: 1, borderColor: c.border, backgroundColor: c.white},
  metricLabel: {fontFamily: fonts.medium, fontSize: 13, color: c.text},
  metricValue: {fontFamily: fonts.medium, fontSize: 22, letterSpacing: -0.5, color: c.text, marginTop: 6, fontVariant: ["tabular-nums"]},
  metricHint: {fontFamily: f.regular, fontSize: 12, lineHeight: 16, color: c.muted, marginTop: 2},
  sectionTitle: {fontFamily: f.bold, fontSize: 15, color: c.text, marginTop: 20, marginBottom: 8},
  paymentRow: {flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6, borderRadius: radius.card, borderWidth: 1, borderColor: c.border, backgroundColor: c.white},
  paymentIcon: {width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: radius.control, backgroundColor: c.beige},
  paymentCopy: {flex: 1},
  paymentName: {fontFamily: fonts.medium, fontSize: 14, color: c.text},
  paymentDate: {fontFamily: f.regular, fontSize: 12, color: c.muted, marginTop: 2},
  paymentAmount: {fontFamily: f.bold, fontSize: 14, color: palette.success, fontVariant: ["tabular-nums"]},
  state: {flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 20},
  body: {fontFamily: f.regular, fontSize: 13, lineHeight: 20, color: c.muted},
  error: {fontFamily: f.regular, fontSize: 13, lineHeight: 20, textAlign: "center", color: palette.danger},
  retry: {paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: c.brown},
  retryText: {fontFamily: f.bold, fontSize: 13, color: c.white},
});
