import { TenantTabBar } from "@/components/navigation/TenantTabBar";
import { fetchBillingHistory } from "@/features/billing-history/api";
import {
  billMonthLabel,
  type BillingHistory,
} from "@/features/billing-history/model";
import LogoMark from "@/components/auth/LogoMark";
import { fonts, palette, radius } from "@/constants/theme";
import { historyColors } from "@/features/billing-history/theme";
import { hasSession, signOut } from "@/lib/auth";
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

const colors = {
  ...historyColors,
  bg: historyColors.background,
  card: historyColors.white,
};

const STATUS_LABEL = { paid: "Paid", partial: "Partial", unpaid: "Unpaid" } as const;

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
  return bills
    .filter((bill) => bill.outstandingBalance > 0)
    .sort((a, b) => {
      const first = new Date(a.dueDate).getTime();
      const second = new Date(b.dueDate).getTime();
      return (
        (Number.isNaN(first) ? Infinity : first) -
        (Number.isNaN(second) ? Infinity : second)
      );
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
      setBills(
        result.bills.map((bill) => ({
          id: bill.billId,
          name: billMonthLabel(bill.billingMonth),
          amount: bill.totalAmount,
          dueDate: bill.dueDate,
          outstandingBalance: bill.outstandingBalance,
          totalAmount: bill.totalAmount,
          status: bill.status,
        })),
      );
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      setError(
        caught instanceof TypeError ||
          /failed to fetch|network request failed|load failed/i.test(message)
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
        <ActivityIndicator
          size="large"
          color={colors.brown}
          accessibilityLabel="Loading dashboard"
        />
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
                  <View style={styles.brandLine}>
                    <LogoMark size={28} />
                    <Text style={styles.brandName}>BoardEase</Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Log out"
                  onPress={() => void signOut()}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.logout,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={18}
                    color={palette.textSecondary}
                  />
                </Pressable>
              </View>

              {error ? (
                <View style={styles.errorCard} accessibilityRole="alert">
                  <Ionicons
                    name="cloud-offline-outline"
                    size={19}
                    color={palette.danger}
                  />
                  <View style={styles.errorCopy}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable
                      onPress={() => void loadBills()}
                      accessibilityRole="button"
                    >
                      <Text style={styles.retry}>Try again</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {tenant ? (
                <View style={styles.greeting}>
                  <Text style={styles.title}>
                    Hi, {tenant.name.split(" ")[0]}
                  </Text>
                  <Text style={styles.context}>
                    {[
                      tenant.boardingHouseName,
                      tenant.roomNumber ? `Room ${tenant.roomNumber}` : null,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Your tenant account"}
                  </Text>
                </View>
              ) : null}
              {tenant && !tenant.roomNumber ? (
                <View style={styles.roomNotice} accessibilityRole="alert">
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color={colors.brown}
                  />
                  <View style={styles.errorCopy}>
                    <Text style={styles.roomNoticeTitle}>
                      No room assigned yet
                    </Text>
                    <Text style={styles.roomNoticeText}>
                      Your owner hasn’t assigned a room to your account yet.
                      Your room details will appear here once it’s assigned.
                    </Text>
                  </View>
                </View>
              ) : null}

              {nextBill ? (
                <View style={styles.heroCard}>
                  <View style={styles.heroTop}>
                    <Text style={styles.summaryLabel}>Outstanding balance</Text>
                    <Text
                      style={[
                        styles.status,
                        nextBill.status === "partial" ? styles.statusPartial : styles.statusUnpaid,
                      ]}
                    >
                      {STATUS_LABEL[nextBill.status]}
                    </Text>
                  </View>
                  <Text style={styles.summaryAmount}>
                    {currency.format(nextBill.outstandingBalance)}
                  </Text>
                  <Text style={styles.summaryHint}>
                    {nextBill.name} bill, due {formatDueDate(nextBill.dueDate)}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: "/bill/[billId]",
                        params: { billId: nextBill.id },
                      })
                    }
                    style={({ pressed }) => [
                      styles.viewBill,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.viewBillText}>View bill</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={15}
                      color={palette.inverse}
                    />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={26}
                    color={palette.success}
                  />
                  <Text style={styles.emptyTitle}>
                    You&apos;re all caught up
                  </Text>
                  <Text style={styles.emptyText}>
                    New bills will appear here when they&apos;re available.
                  </Text>
                </View>
              )}

              {nextBill ? (
                <View style={styles.glance}>
                  <Text style={styles.sectionTitle}>
                    This month at a glance
                  </Text>
                  <View style={styles.glanceRow}>
                    <Text style={styles.dueDate}>Total bill</Text>
                    <Text style={styles.glanceAmount}>
                      {currency.format(nextBill.totalAmount)}
                    </Text>
                  </View>
                  <View style={styles.glanceRow}>
                    <Text style={styles.dueDate}>Recorded payments</Text>
                    <Text style={styles.glanceAmount}>
                      {currency.format(
                        nextBill.totalAmount - nextBill.outstandingBalance,
                      )}
                    </Text>
                  </View>
                </View>
              ) : null}
              <Text style={[styles.sectionTitle, styles.historyTitle]}>
                Recent bills
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/bill/[billId]",
                  params: { billId: item.id },
                })
              }
              style={({ pressed }) => [
                styles.historyRow,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.historyIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={19}
                  color={colors.muted}
                />
              </View>
              <View style={styles.historyCopy}>
                <Text style={styles.billName}>{item.name}</Text>
                <Text style={styles.dueDate}>
                  Due {formatDueDate(item.dueDate)}
                </Text>
              </View>
              <Text style={styles.historyAmount}>
                {currency.format(item.amount)}
              </Text>
            </Pressable>
          )}
          ListFooterComponent={
            <Text style={styles.pullHint}>Pull down to refresh</Text>
          }
        />
      </SafeAreaView>
      <TenantTabBar active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.canvas },
  safeArea: { flex: 1, backgroundColor: palette.canvas },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.canvas, padding: 24 },
  loadingText: { marginTop: 12, color: palette.muted, fontFamily: fonts.regular, fontSize: 14 },
  content: { padding: 16, paddingBottom: 24, maxWidth: 600, width: "100%", alignSelf: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  title: { color: palette.text, fontSize: 22, letterSpacing: -0.4, fontFamily: fonts.semibold },
  brandLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandName: { color: palette.text, fontSize: 17, letterSpacing: -0.3, fontFamily: fonts.bold },
  greeting: { marginBottom: 14 },
  context: { color: palette.muted, fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  logout: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  pressed: { opacity: 0.65 },
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    marginBottom: 12,
    borderRadius: radius.card,
    backgroundColor: palette.dangerSurface,
  },
  errorCopy: { flex: 1 },
  errorText: { color: palette.danger, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  retry: { color: palette.primary, fontFamily: fonts.semibold, fontSize: 13, marginTop: 6 },
  summaryLabel: { color: palette.text, fontSize: 13, fontFamily: fonts.medium },
  summaryAmount: { color: palette.text, fontSize: 30, letterSpacing: -0.8, fontFamily: fonts.medium, marginTop: 8, fontVariant: ["tabular-nums"] },
  summaryHint: { color: palette.muted, fontSize: 13, marginTop: 4, fontFamily: fonts.regular },
  heroCard: { padding: 14, borderRadius: radius.card, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  status: {
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
    fontSize: 12,
    overflow: "hidden",
    fontFamily: fonts.semibold,
  },
  statusPartial: { backgroundColor: palette.warningSurface, color: palette.warning },
  statusUnpaid: { backgroundColor: palette.dangerSurface, color: palette.danger },
  viewBill: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  viewBillText: { color: palette.inverse, fontFamily: fonts.semibold, fontSize: 14 },
  glance: {
    marginTop: 10,
    padding: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    gap: 10,
  },
  glanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  glanceAmount: { color: palette.text, fontFamily: fonts.semibold, fontSize: 14, fontVariant: ["tabular-nums"] },
  roomNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    marginBottom: 12,
    borderRadius: radius.card,
    backgroundColor: palette.surfaceMuted,
  },
  roomNoticeTitle: { color: palette.text, fontFamily: fonts.semibold, fontSize: 14 },
  roomNoticeText: { color: palette.muted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, marginTop: 2 },
  sectionTitle: { color: palette.text, fontSize: 15, fontFamily: fonts.semibold },
  billName: { color: palette.text, fontSize: 14, fontFamily: fonts.medium },
  dueDate: { color: palette.muted, fontFamily: fonts.regular, fontSize: 13 },
  emptyCard: {
    alignItems: "center",
    padding: 20,
    borderRadius: radius.card,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  emptyTitle: { color: palette.text, fontSize: 15, fontFamily: fonts.semibold, marginTop: 8 },
  emptyText: { color: palette.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "center", marginTop: 4 },
  historyTitle: { marginTop: 20, marginBottom: 8 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  historyIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.control,
    backgroundColor: palette.surfaceSelected,
  },
  historyCopy: { flex: 1, marginLeft: 10, gap: 2 },
  historyAmount: { color: palette.text, fontSize: 14, fontFamily: fonts.semibold, fontVariant: ["tabular-nums"] },
  pullHint: { color: palette.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: "center", marginTop: 14 },
});
