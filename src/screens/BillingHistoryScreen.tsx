import { TenantTabBar } from "@/components/navigation/TenantTabBar";
import LogoMark from "@/components/auth/LogoMark";
import { fonts, palette, radius } from "@/constants/theme";
import { FilterMenu } from "@/features/billing-history/FilterMenu";
import { HistoryIcon } from "@/features/billing-history/HistoryIcon";
import { UtilityChart } from "@/features/billing-history/UtilityChart";
import { fetchBillingHistory } from "@/features/billing-history/api";
import { BillingHistorySessionError } from "@/features/billing-history/errors";
import { signOut } from "@/lib/auth";
import { previewHistory } from "@/features/billing-history/fixture";
import {
  billMonthLabel,
  chartBills,
  filterBills,
  formatMoney,
  initials,
  shortDate,
  statusLabels,
  type BillingHistory,
  type HistoryBill,
  type StatusFilter,
} from "@/features/billing-history/model";
import {
  historyColors as c,
} from "@/features/billing-history/theme";
import {
  Inter_400Regular,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const previewEnabled =
  __DEV__ && process.env.EXPO_PUBLIC_BILLING_HISTORY_DEMO === "true";
const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
];
type Props = { onBillPress?: (billId: string) => void };

export default function BillingHistoryScreen({ onBillPress }: Props) {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });
  const [data, setData] = useState<BillingHistory | null>(
    previewEnabled ? previewHistory : null,
  );
  const [loading, setLoading] = useState(!previewEnabled);
  const [error, setError] = useState<string | null>(null);
  const [signInRequired, setSignInRequired] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [year, setYear] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [menu, setMenu] = useState<"year" | "status" | null>(null);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(() => {
    if (previewEnabled) return;
    setLoading(true);
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  const returnToSignIn = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      // Clearing the app session lets the protected Router open Login.
      await signOut();
    } catch {
      setError("We couldn’t clear your session. Please try signing in again.");
    } finally {
      setSigningOut(false);
    }
  };

  useEffect(() => {
    if (previewEnabled) return;
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetchBillingHistory(controller.signal)
      .then((history) => {
        if (active && !controller.signal.aborted) setData(history);
      })
      .catch((err: unknown) => {
        if (active) {
          if (err instanceof BillingHistorySessionError) {
            setData(null);
            setSignInRequired(true);
          }
          setError(
            controller.signal.aborted
              ? "The request took too long. Please try again."
              : err instanceof Error &&
                  err.message !== "Network request failed" &&
                  err.message !== "Failed to fetch"
                ? err.message
                : "We couldn’t reach the server. Check your connection and try again.",
          );
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  const years = [
    ...new Set(data?.bills.map((bill) => bill.billingMonth.slice(0, 4)) ?? []),
  ]
    .sort()
    .reverse();
  const selectedYear =
    year === "all"
      ? "all"
      : year && years.includes(year)
        ? year
        : (years[0] ?? "all");
  const bills = filterBills(data?.bills ?? [], selectedYear, status);
  const utilities = chartBills(data?.bills ?? [], selectedYear);
  const openBill = useCallback(
    (billId: string) => {
      if (onBillPress) {
        onBillPress(billId);
        return;
      }
      router.push({ pathname: "/bill/[billId]", params: { billId } });
    },
    [onBillPress],
  );
  const renderBill = useCallback(
    ({ item }: { item: HistoryBill }) => (
      <BillRow bill={item} onPress={openBill} />
    ),
    [openBill],
  );

  if (!fontsLoaded && !fontError)
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator
          style={styles.loading}
          color={c.brown}
          accessibilityLabel="Loading billing history"
        />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <View style={styles.container} aria-hidden={menu !== null} accessibilityElementsHidden={menu !== null} importantForAccessibility={menu !== null ? "no-hide-descendants" : "auto"}>
        <View style={styles.brandHeader}>
          <View style={styles.brand}>
            <LogoMark size={28} />
            <Text style={styles.brandName}>BoardEase</Text>
          </View>
          <View
            style={styles.avatar}
            accessible
            accessibilityRole="image"
            accessibilityLabel={data ? data.tenant.name : "Tenant account"}
          >
            <Text style={styles.avatarText}>
              {data ? initials(data.tenant.name) : "—"}
            </Text>
          </View>
        </View>
        <FlatList
          data={bills}
          renderItem={renderBill}
          keyExtractor={(bill) => bill.billId}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshing={loading && data !== null}
          onRefresh={signInRequired ? undefined : load}
          ListHeaderComponent={
            <>
              {previewEnabled ? (
                <Text style={styles.preview}>Design preview with sample data</Text>
              ) : null}
              <View style={styles.titleRow}>
                <Text accessibilityRole="header" style={styles.pageTitle}>
                  Billing history
                </Text>
                {Platform.OS === "web" && !previewEnabled && !signInRequired ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Refresh billing history"
                    accessibilityState={{ disabled: loading, busy: loading }}
                    disabled={loading}
                    onPress={load}
                    style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.filterLabel}>{loading ? "Refreshing…" : "Refresh"}</Text>
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.context}>
                {data
                  ? [
                      data.tenant.boardingHouseName,
                      data.tenant.roomNumber
                        ? `Room ${data.tenant.roomNumber}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Your bills and utility charges"
                  : "Your bills and utility charges"}
              </Text>
              {data ? <UtilityChart bills={utilities} /> : null}
              <View style={styles.filters}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>
                  Bills
                </Text>
                <View style={styles.filterButtons}>
                  <Pressable
                    disabled={!data || data.bills.length === 0}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by year: ${selectedYear === "all" ? "All years" : selectedYear}`}
                    accessibilityState={{
                      disabled: !data || data.bills.length === 0,
                      expanded: menu === "year",
                    }}
                    aria-expanded={menu === "year"}
                    onPress={() => setMenu("year")}
                    style={({ pressed }) => [
                      styles.filterButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.filterLabel}>
                      {selectedYear === "all" ? "All years" : selectedYear}
                    </Text>
                    <HistoryIcon name="down" />
                  </Pressable>
                  <Pressable
                    disabled={!data || data.bills.length === 0}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by status: ${status === "all" ? "All statuses" : statusLabels[status]}`}
                    accessibilityState={{
                      disabled: !data || data.bills.length === 0,
                      expanded: menu === "status",
                    }}
                    aria-expanded={menu === "status"}
                    onPress={() => setMenu("status")}
                    style={({ pressed }) => [
                      styles.filterButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.filterLabel}>
                      {status === "all" ? "Status" : statusLabels[status]}
                    </Text>
                    <HistoryIcon name="down" />
                  </Pressable>
                </View>
              </View>
              {error ? (
                <View style={styles.notice} accessibilityLiveRegion="polite">
                  <Text style={styles.noticeTitle}>
                    Couldn’t load billing history
                  </Text>
                  <Text style={styles.secondary}>{error}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={signInRequired ? returnToSignIn : load}
                    disabled={loading || signingOut}
                    accessibilityState={{ disabled: loading || signingOut, busy: loading || signingOut }}
                    style={({ pressed }) => [
                      styles.retry,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.retryText}>
                      {signInRequired ? signingOut ? "Opening sign in…" : "Sign in again" : loading ? "Trying again…" : "Try again"}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          }
          ListEmptyComponent={
            loading && !data ? (
              <ActivityIndicator
                style={styles.state}
                accessibilityLabel="Loading your bills"
                color={c.brown}
              />
            ) : !error ? (
              <View style={styles.notice} accessibilityLiveRegion="polite">
                <Text style={styles.noticeTitle}>
                  {data?.bills.length ? "No matching bills" : "No bills yet"}
                </Text>
                <Text style={styles.secondary}>
                  {data?.bills.length
                    ? "Try another year or payment status."
                    : "Your monthly bills will appear here once your owner creates them."}
                </Text>
                {data?.bills.length ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setYear("all");
                      setStatus("all");
                    }}
                    style={styles.retry}
                  >
                    <Text style={styles.retryText}>Clear filters</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : undefined
          }
        />
      </View>
      <TenantTabBar active="history" hidden={menu !== null} />
      <FilterMenu
        visible={menu !== null}
        title={menu === "year" ? "Filter by year" : "Filter by payment status"}
        selected={menu === "year" ? selectedYear : status}
        options={
          menu === "year"
            ? [
                { value: "all", label: "All years" },
                ...years.map((value) => ({ value, label: value })),
              ]
            : statusOptions
        }
        onClose={() => setMenu(null)}
        onSelect={(value) => {
          if (menu === "year") setYear(value);
          else setStatus(value as StatusFilter);
        }}
      />
    </SafeAreaView>
  );
}

function BillRow({
  bill,
  onPress,
}: {
  bill: HistoryBill;
  onPress: (id: string) => void;
}) {
  const detail =
    bill.status === "paid"
      ? bill.settledDate
        ? `Settled ${shortDate(bill.settledDate)}`
        : "Settled"
      : `${formatMoney(bill.outstandingBalance)} left, due ${shortDate(bill.dueDate)}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${billMonthLabel(bill.billingMonth)}, ${formatMoney(bill.totalAmount)}, ${statusLabels[bill.status]}. ${detail}. View bill details.`}
      onPress={() => onPress(bill.billId)}
      style={({ pressed }) => [styles.bill, pressed && styles.pressed]}
    >
      <View style={styles.billText}>
        <Text style={styles.billMonth}>
          {billMonthLabel(bill.billingMonth)}
        </Text>
        <Text style={styles.billAmount}>{formatMoney(bill.totalAmount)}</Text>
        <Text style={styles.billDetail}>{detail}</Text>
      </View>
      <View style={styles.billActions}>
        <View style={[styles.badge, badgeTone[bill.status].box]}>
          <Text style={[styles.badgeText, badgeTone[bill.status].text]}>{statusLabels[bill.status]}</Text>
        </View>
        <HistoryIcon name="right" />
      </View>
    </Pressable>
  );
}

const badgeTone = {
  paid: { box: { backgroundColor: palette.successSurface }, text: { color: palette.success } },
  partial: { box: { backgroundColor: palette.warningSurface }, text: { color: palette.warning } },
  unpaid: { box: { backgroundColor: palette.dangerSurface }, text: { color: palette.danger } },
} as const;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.canvas },
  loading: { flex: 1 },
  container: { flex: 1, width: "100%", maxWidth: 600, alignSelf: "center" },
  brandHeader: {
    marginHorizontal: 16,
    minHeight: 52,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandName: { fontFamily: fonts.bold, fontSize: 17, letterSpacing: -0.3, color: palette.text },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surfaceSelected,
  },
  avatarText: { fontFamily: fonts.semibold, fontSize: 12, color: palette.primary },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20, flexGrow: 1 },
  pageTitle: { fontFamily: fonts.semibold, fontSize: 22, letterSpacing: -0.4, color: palette.text },
  titleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 },
  context: { fontFamily: fonts.regular, fontSize: 13, color: palette.muted, marginTop: 2 },
  preview: { fontFamily: fonts.medium, fontSize: 12, color: palette.warning, marginBottom: 8 },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 15, color: palette.text },
  filterButtons: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  filterButton: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
  },
  filterLabel: { fontFamily: fonts.medium, fontSize: 13, color: palette.text },
  bill: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.card,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  billText: { flex: 1, gap: 2 },
  billMonth: { fontFamily: fonts.medium, fontSize: 13, color: palette.muted },
  billAmount: { fontFamily: fonts.semibold, fontSize: 16, color: palette.text, fontVariant: ["tabular-nums"] },
  billDetail: { fontFamily: fonts.regular, fontSize: 12, color: palette.muted },
  billActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3, alignItems: "center" },
  badgeText: { fontFamily: fonts.semibold, fontSize: 12 },
  pressed: { opacity: 0.7 },
  notice: {
    padding: 16,
    marginVertical: 10,
    borderRadius: radius.card,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 6,
  },
  noticeTitle: { fontFamily: fonts.semibold, fontSize: 15, color: palette.text },
  secondary: { fontFamily: fonts.regular, fontSize: 13, color: palette.muted, lineHeight: 20 },
  retry: {
    minHeight: 40,
    alignSelf: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: palette.primary,
    marginTop: 6,
  },
  retryText: { fontFamily: fonts.semibold, fontSize: 13, color: palette.inverse },
  state: { paddingVertical: 40 },
});
