import { fetchBillingHistory } from "@/features/billing-history/api";
import {
  billMonthLabel,
  formatMoney,
  statusLabels,
  type BillingHistory,
  type HistoryBill,
} from "@/features/billing-history/model";
import {
  historyColors as c,
} from "@/features/billing-history/theme";
import {
  Inter_400Regular,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { fonts, palette, radius } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
      setError(
        caught instanceof Error
          ? caught.message
          : "We couldn’t load this bill.",
      );
    } finally {
      setLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (!fontsLoaded || loading)
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator
          color={c.brown}
          accessibilityLabel="Loading bill details"
        />
      </SafeAreaView>
    );

  if (error || !bill)
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.topbar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={palette.text} />
          </Pressable>
          <Text style={s.topTitle}>Bill details</Text>
        </View>
        <View style={s.notice}>
          <Text style={s.sectionTitle}>
            {error ? "Couldn’t load this bill" : "Bill not found"}
          </Text>
          <Text style={s.muted}>
            {error ?? "This bill may no longer be available."}
          </Text>
          <Pressable onPress={() => void load()} style={s.retry}>
            <Text style={s.retryText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );

  const paid = bill.totalAmount - bill.outstandingBalance;
  return (
    <SafeAreaView style={s.screen}>
      <View style={s.topbar}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={palette.text} />
        </Pressable>
        <Text style={s.topTitle}>Bill details</Text>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {tenant?.name
              .split(/\s+/)
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.titleRow}>
          <View>
            <Text style={s.month}>{billMonthLabel(bill.billingMonth)}</Text>
            <Text style={s.ref}>
              {bill.billId.slice(0, 8).toUpperCase()},{" "}
              {tenant?.roomNumber
                ? `Room ${tenant.roomNumber}`
                : "No room assigned"}
            </Text>
          </View>
          <Text style={[s.badge, badgeTone[bill.status]]}>
            {statusLabels[bill.status]}
          </Text>
        </View>
        {!tenant?.roomNumber ? (
          <View style={s.roomNotice}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={c.brown}
            />
            <Text style={s.muted}>
              No room has been assigned to your account yet. Ask your owner to
              assign one.
            </Text>
          </View>
        ) : null}
        <View style={s.card}>
          <MoneyRow
            label="Monthly rent"
            value={formatMoney(
              bill.totalAmount - bill.electricCharge - bill.waterCharge,
            )}
          />
          <MoneyRow
            label="Electricity"
            value={formatMoney(bill.electricCharge)}
          />
          <MoneyRow label="Water" value={formatMoney(bill.waterCharge)} />
          <View style={s.divider} />
          <MoneyRow
            label="Total bill"
            value={formatMoney(bill.totalAmount)}
            strong
          />
          <MoneyRow
            label="Payments recorded"
            value={`− ${formatMoney(paid)}`}
          />
          <View style={s.balance}>
            <Text style={s.balanceLabel}>Outstanding balance</Text>
            <Text style={s.balanceAmount}>
              {formatMoney(bill.outstandingBalance)}
            </Text>
            <Text style={s.balanceDue}>Due {formatDate(bill.dueDate)}</Text>
          </View>
        </View>

        {bill.outstandingBalance > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/payment-submission/[billId]",
                params: { billId: bill.billId },
              })
            }
            style={s.submitPaymentButton}
          >
            <Text style={s.submitPaymentButtonText}>Submit payment proof</Text>
          </Pressable>
        ) : null}

        <Text style={s.sectionTitle}>Recorded payments</Text>
        {bill.payments?.length ? (
          bill.payments.map((payment) => (
            <View style={s.paymentCard} key={payment.paymentId}>
              <View style={s.paymentTop}>
                <Text style={s.paymentAmount}>
                  {formatMoney(payment.amount)}
                </Text>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={21}
                  color={palette.success}
                />
              </View>
              <Text style={s.paymentMeta}>
                {formatDate(payment.paymentDate)}, recorded by{" "}
                {payment.recordedBy ?? "your owner"}
              </Text>
            </View>
          ))
        ) : paid > 0 ? (
          <View style={s.paymentCard}>
            <Text style={s.paymentAmount}>{formatMoney(paid)}</Text>
            <Text style={s.paymentMeta}>
              {bill.settledDate
                ? `Recorded ${formatDate(bill.settledDate)}`
                : "Payment recorded by your owner"}
            </Text>
          </View>
        ) : (
          <View style={s.paymentCard}>
            <Text style={s.muted}>
              No payments have been recorded for this bill yet.
            </Text>
          </View>
        )}
        <View style={s.footerNote}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color={c.muted}
          />
          <Text style={s.footerText}>
            Pay the remaining balance directly to your owner. Payments appear
            here after they’re recorded.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MoneyRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={s.moneyRow}>
      <Text style={[s.moneyLabel, strong && s.strong]}>{label}</Text>
      <Text style={[s.moneyValue, strong && s.strong]}>{value}</Text>
    </View>
  );
}

const badgeTone = {
  paid: { backgroundColor: palette.successSurface, color: palette.success },
  partial: { backgroundColor: palette.warningSurface, color: palette.warning },
  unpaid: { backgroundColor: palette.dangerSurface, color: palette.danger },
} as const;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.canvas },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.canvas },
  topbar: {
    minHeight: 52,
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  topTitle: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: palette.text },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surfaceSelected,
  },
  avatarText: { fontFamily: fonts.semibold, fontSize: 12, color: palette.primary },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, width: "100%", maxWidth: 600, alignSelf: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10 },
  month: { fontFamily: fonts.semibold, fontSize: 22, letterSpacing: -0.4, color: palette.text },
  ref: { fontFamily: fonts.regular, fontSize: 13, color: palette.muted, marginTop: 2 },
  badge: {
    overflow: "hidden",
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  card: { padding: 14, borderWidth: 1, borderColor: palette.border, borderRadius: radius.card, backgroundColor: palette.surface },
  moneyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 },
  moneyLabel: { fontFamily: fonts.regular, fontSize: 14, color: palette.muted },
  moneyValue: { fontFamily: fonts.regular, fontSize: 14, color: palette.text, fontVariant: ["tabular-nums"] },
  strong: { fontFamily: fonts.semibold, color: palette.text, fontSize: 15 },
  divider: { height: 1, backgroundColor: palette.border, marginBottom: 10 },
  balance: { padding: 12, marginTop: 4, borderRadius: radius.inset, backgroundColor: palette.surfaceSelected },
  balanceLabel: { fontFamily: fonts.medium, fontSize: 12, color: palette.primary },
  balanceAmount: { fontFamily: fonts.semibold, fontSize: 24, letterSpacing: -0.5, color: palette.primary, marginTop: 2, fontVariant: ["tabular-nums"] },
  balanceDue: { fontFamily: fonts.regular, fontSize: 12, color: palette.muted, marginTop: 2 },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 15, color: palette.text, marginTop: 20, marginBottom: 8 },
  paymentCard: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.card,
    padding: 12,
    marginBottom: 6,
  },
  paymentTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  paymentAmount: { fontFamily: fonts.semibold, fontSize: 16, color: palette.text, fontVariant: ["tabular-nums"] },
  paymentMeta: { fontFamily: fonts.regular, fontSize: 12, color: palette.muted, marginTop: 4 },
  footerNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 12 },
  footerText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: palette.muted, lineHeight: 18 },
  notice: {
    margin: 16,
    padding: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    gap: 8,
  },
  muted: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: palette.muted, lineHeight: 19 },
  retry: { alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: palette.primary, borderRadius: radius.pill },
  retryText: { fontFamily: fonts.semibold, color: palette.inverse, fontSize: 13 },
  roomNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.card,
  },
  submitPaymentButton: {
    marginTop: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: palette.primary,
  },
  submitPaymentButtonText: { fontFamily: fonts.semibold, color: palette.inverse, fontSize: 14 },
});
