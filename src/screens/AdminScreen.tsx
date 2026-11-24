import { historyColors as c, historyFonts as f } from "@/features/billing-history/theme";
import { fetchAdminDashboard, type AdminDashboardData } from "@/features/admin-dashboard/api";
import { AdminTabBar } from "@/components/navigation/AdminTabBar";
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
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>BOARDEASE ADMIN</Text>
            <Text style={styles.title}>Dashboard</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh dashboard"
            onPress={retryDashboard}
            style={({pressed}) => [styles.refresh, pressed && styles.pressed]}
          >
            <Ionicons name="refresh-outline" size={20} color={c.brown} />
          </Pressable>
        </View>

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
                <Text style={styles.metricHint}>{data.billing.paidCount} paid · {data.billing.partialCount} partial · {data.billing.unpaidCount} unpaid</Text>
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
                  <Text style={styles.paymentDate}>{payment.paymentDate}</Text>
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
  safe: {flex: 1, backgroundColor: c.background},
  loading: {flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background},
  content: {flexGrow: 1, width: "100%", maxWidth: 600, alignSelf: "center", padding: 24, paddingBottom: 32},
  header: {flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24},
  eyebrow: {fontFamily: f.bold, fontSize: 11, letterSpacing: 1.5, color: c.muted},
  title: {marginTop: 4, fontFamily: f.bold, fontSize: 25, color: c.text},
  refresh: {width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: c.beige},
  pressed: {opacity: 0.65},
  sectionLabel: {fontFamily: f.bold, fontSize: 14, color: c.text, marginBottom: 10},
  billingCard: {padding: 20, borderRadius: 18, backgroundColor: c.brown},
  cardLabel: {fontFamily: f.regular, fontSize: 12, color: "#EAD9C9"},
  total: {fontFamily: f.bold, fontSize: 30, color: c.white, marginTop: 7},
  billingRow: {flexDirection: "row", justifyContent: "space-between", gap: 16, marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.24)"},
  billingLabel: {fontFamily: f.regular, fontSize: 11, color: "#EAD9C9"},
  billingValue: {fontFamily: f.bold, fontSize: 14, color: c.white, marginTop: 4},
  metricGrid: {flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 14},
  metricCard: {width: "48%", flexGrow: 1, minHeight: 94, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.white},
  metricLabel: {fontFamily: f.regular, fontSize: 11, color: c.muted},
  metricValue: {fontFamily: f.bold, fontSize: 22, color: c.text, marginTop: 8},
  metricHint: {fontFamily: f.regular, fontSize: 10, lineHeight: 15, color: c.muted, marginTop: 3},
  sectionTitle: {fontFamily: f.bold, fontSize: 17, color: c.text, marginTop: 28, marginBottom: 10},
  paymentRow: {flexDirection: "row", alignItems: "center", gap: 11, minHeight: 62, borderBottomWidth: 1, borderBottomColor: c.border},
  paymentIcon: {width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: c.beige},
  paymentCopy: {flex: 1},
  paymentName: {fontFamily: f.bold, fontSize: 13, color: c.text},
  paymentDate: {fontFamily: f.regular, fontSize: 11, color: c.muted, marginTop: 3},
  paymentAmount: {fontFamily: f.bold, fontSize: 13, color: c.text},
  state: {flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 20},
  body: {fontFamily: f.regular, fontSize: 13, lineHeight: 20, color: c.muted},
  error: {fontFamily: f.regular, fontSize: 13, lineHeight: 20, textAlign: "center", color: "#9A3529"},
  retry: {paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: c.brown},
  retryText: {fontFamily: f.bold, fontSize: 13, color: c.white},
});
