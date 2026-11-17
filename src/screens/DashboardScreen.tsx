import { historyColors, historyFonts } from "@/features/billing-history/theme";
import { hasSession, signOut } from "@/lib/auth";
import { fetchBillingHistory } from "@/features/billing-history/api";
import { billMonthLabel, type BillingHistory } from "@/features/billing-history/model";
import { TenantTabBar } from "@/components/navigation/TenantTabBar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const colors = { ...historyColors, bg: historyColors.background, card: historyColors.white };

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

type DashboardBill = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  outstandingBalance: number;
  totalAmount: number;
  status: "paid" | "partial" | "unpaid";
};

function formatDueDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getNextBill(bills: DashboardBill[]) {
  return bills.filter((bill) => bill.outstandingBalance > 0).sort((a, b) => {
    const first = new Date(a.dueDate).getTime();
    const second = new Date(b.dueDate).getTime();
    return (Number.isNaN(first) ? Infinity : first) - (Number.isNaN(second) ? Infinity : second);
  })[0];
}

export default function DashboardScreen() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [bills, setBills] = useState<DashboardBill[]>([]);
  const [tenant, setTenant] = useState<BillingHistory["tenant"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      void hasSession()
        .then((value) => {
          if (active) setSignedIn(value);
        })
        .catch(() => {
          if (active) setSignedIn(false);
        });
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const loadBills = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const result = await fetchBillingHistory(controller.signal);
      setTenant(result.tenant);
      setBills(result.bills.map((bill) => ({
        id: bill.billId,
        name: billMonthLabel(bill.billingMonth),
        amount: bill.totalAmount,
        dueDate: bill.dueDate,
        outstandingBalance: bill.outstandingBalance,
        totalAmount: bill.totalAmount,
        status: bill.status,
      })));
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      setError(
        caught instanceof TypeError || /failed to fetch|network request failed|load failed/i.test(message)
          ? "The billing server could not be reached. Check the API address and that the server allows this app."
          : message || "We couldn't load your bills. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    const timer = setTimeout(() => void loadBills(), 0);
    return () => clearTimeout(timer);
  }, [loadBills, signedIn]);

  const nextBill = useMemo(() => getNextBill(bills), [bills]);

  if (signedIn === false) {
    return <Redirect href="/login" />;
  }

  if (signedIn === null || isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brown} accessibilityLabel="Loading dashboard" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadBills(true)}
            tintColor={colors.brown}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <View>
                <View style={styles.brandLine}><View style={styles.brandIcon}><Ionicons name="home-outline" size={22} color={colors.white} /></View><Text style={styles.brandName}>BoardEase</Text></View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Log out"
                onPress={() => void signOut()}
                hitSlop={10}
                style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
              >
                <Ionicons name="log-out-outline" size={21} color={colors.brown} />
              </Pressable>
            </View>

            {error ? (
              <View style={styles.errorCard} accessibilityRole="alert">
                <Ionicons name="cloud-offline-outline" size={22} color={colors.brown} />
                <View style={styles.errorCopy}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable onPress={() => void loadBills()} accessibilityRole="button">
                    <Text style={styles.retry}>Try again</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {tenant ? <View style={styles.greeting}><Text style={styles.title}>Hi, {tenant.name.split(" ")[0]} 👋</Text><Text style={styles.context}>{[tenant.boardingHouseName, tenant.roomNumber ? `Room ${tenant.roomNumber}` : null].filter(Boolean).join(" · ") || "Your tenant account"}</Text></View> : null}
            {tenant && !tenant.roomNumber ? <View style={styles.roomNotice} accessibilityRole="alert"><Ionicons name="information-circle-outline" size={20} color={colors.brown} /><View style={styles.errorCopy}><Text style={styles.roomNoticeTitle}>No room assigned yet</Text><Text style={styles.roomNoticeText}>Your owner hasn’t assigned a room to your account yet. Your room details will appear here once it’s assigned.</Text></View></View> : null}

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Outstanding balance</Text>
            </View>
            {nextBill ? (
              <View style={styles.heroCard}><View style={styles.heroTop}><Text style={styles.summaryLabel}>Outstanding balance</Text><Text style={styles.status}>{nextBill.status.toUpperCase()}</Text></View><Text style={styles.summaryAmount}>{currency.format(nextBill.outstandingBalance)}</Text><Text style={styles.summaryHint}>{nextBill.name} · Due {formatDueDate(nextBill.dueDate)}</Text><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/bill/[billId]", params: { billId: nextBill.id } })} style={({ pressed }) => [styles.viewBill, pressed && styles.pressed]}><Ionicons name="arrow-forward" size={17} color={colors.brown} /><Text style={styles.viewBillText}>View current bill</Text></Pressable></View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-circle-outline" size={26} color={colors.brown} />
                <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
                <Text style={styles.emptyText}>New bills will appear here when they&apos;re available.</Text>
              </View>
            )}

            {nextBill ? <View style={styles.glance}><Text style={styles.sectionTitle}>This month at a glance</Text><View style={styles.glanceRow}><Text style={styles.dueDate}>Total bill</Text><Text style={styles.glanceAmount}>{currency.format(nextBill.totalAmount)}</Text></View><View style={styles.glanceRow}><Text style={styles.dueDate}>Recorded payments</Text><Text style={styles.glanceAmount}>{currency.format(nextBill.totalAmount - nextBill.outstandingBalance)}</Text></View></View> : null}
            <Text style={[styles.sectionTitle, styles.historyTitle]}>Bill history</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/bill/[billId]", params: { billId: item.id } })} style={({ pressed }) => [styles.historyRow, pressed && styles.pressed]}>
            <View style={styles.historyIcon}>
              <Ionicons name="document-text-outline" size={19} color={colors.muted} />
            </View>
            <View style={styles.historyCopy}>
              <Text style={styles.billName}>{item.name}</Text>
              <Text style={styles.dueDate}>Due {formatDueDate(item.dueDate)}</Text>
            </View>
            <Text style={styles.historyAmount}>{currency.format(item.amount)}</Text>
          </Pressable>
        )}
        ListFooterComponent={<Text style={styles.pullHint}>Pull down to refresh</Text>}
        />
      </SafeAreaView>
      <TenantTabBar active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: 24,
  },
  loadingText: { marginTop: 12, color: colors.muted, fontSize: 14 },
  content: { padding: 24, paddingBottom: 32, maxWidth: 600, width: "100%", alignSelf: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 25, fontFamily: historyFonts.bold, marginTop: 4 },
  brandLine: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: colors.brown, alignItems: "center", justifyContent: "center" },
  brandName: { color: colors.brown, fontSize: 20, fontFamily: historyFonts.bold },
  greeting: { marginBottom: 20 },
  context: { color: colors.muted, fontFamily: historyFonts.regular, fontSize: 13, marginTop: 4 },
  logout: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.card,
  },
  pressed: { opacity: 0.65 },
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: "#F4DCD2",
  },
  errorCopy: { flex: 1 },
  errorText: { color: colors.text, fontSize: 13, lineHeight: 19 },
  retry: { color: colors.brown, fontSize: 13, fontWeight: "700", marginTop: 6 },
  summaryCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.brown,
  },
  summaryLabel: { color: "#EAD9C9", fontSize: 12, fontFamily: historyFonts.regular },
  summaryAmount: { color: colors.white, fontSize: 35, fontFamily: historyFonts.regular, marginTop: 12 },
  summaryHint: { color: "#EAD9C9", fontSize: 12, marginTop: 10, fontFamily: historyFonts.regular },
  heroCard: { padding: 21, borderRadius: 18, backgroundColor: colors.brown },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  status: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: colors.partial, color: colors.brown, fontSize: 10, overflow: "hidden", fontWeight: "700" },
  viewBill: { marginTop: 18, minHeight: 46, borderRadius: 9, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9 },
  viewBillText: { color: colors.brown, fontFamily: historyFonts.bold, fontSize: 13 },
  glance: { marginTop: 20, padding: 17, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, gap: 14 },
  glanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  glanceAmount: { color: colors.text, fontFamily: historyFonts.bold, fontSize: 13 },
  roomNotice: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, marginBottom: 18, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  roomNoticeTitle: { color: colors.text, fontFamily: historyFonts.bold, fontSize: 14 },
  roomNoticeText: { color: colors.muted, fontFamily: historyFonts.regular, fontSize: 12, lineHeight: 18, marginTop: 4 },
  sectionHeading: { marginTop: 28, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 17, fontFamily: historyFonts.bold },
  nextBillCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  billIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  nextBillCopy: { flex: 1, marginLeft: 12 },
  billName: { color: colors.text, fontSize: 15, fontWeight: "600" },
  dueDate: { color: colors.muted, fontSize: 12, marginTop: 4 },
  billAmount: { color: colors.text, fontSize: 15, fontWeight: "700" },
  emptyCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 10 },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: "center", marginTop: 5 },
  historyTitle: { marginTop: 28, marginBottom: 12 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.card,
  },
  historyCopy: { flex: 1, marginLeft: 11 },
  historyAmount: { color: colors.text, fontSize: 14, fontWeight: "600" },
  pullHint: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 20 },
});
