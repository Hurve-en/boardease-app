import { colors } from "@/constants/theme";
import { hasSession, signOut } from "@/lib/auth";
import { Bill, getBills } from "@/lib/bills";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect } from "expo-router";
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

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function formatDueDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getNextBill(bills: Bill[]) {
  return [...bills].sort((a, b) => {
    const first = new Date(a.dueDate).getTime();
    const second = new Date(b.dueDate).getTime();
    return (Number.isNaN(first) ? Infinity : first) - (Number.isNaN(second) ? Infinity : second);
  })[0];
}

export default function DashboardScreen() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
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
      const result = await getBills();
      setBills(result);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      setError(
        message === "Failed to fetch"
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

  const totalDue = useMemo(
    () => bills.reduce((total, bill) => total + bill.amount, 0),
    [bills],
  );
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
                <Text style={styles.eyebrow}>BOARDEASE</Text>
                <Text style={styles.title}>Your dashboard</Text>
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

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>TOTAL OUTSTANDING</Text>
              <Text style={styles.summaryAmount}>{currency.format(totalDue)}</Text>
              <Text style={styles.summaryHint}>
                {bills.length === 0 ? "You have no bills yet" : `${bills.length} bill${bills.length === 1 ? "" : "s"} to review`}
              </Text>
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Upcoming payment</Text>
            </View>
            {nextBill ? (
              <View style={styles.nextBillCard}>
                <View style={styles.billIcon}>
                  <Ionicons name="receipt-outline" size={22} color={colors.brown} />
                </View>
                <View style={styles.nextBillCopy}>
                  <Text style={styles.billName}>{nextBill.name}</Text>
                  <Text style={styles.dueDate}>Due {formatDueDate(nextBill.dueDate)}</Text>
                </View>
                <Text style={styles.billAmount}>{currency.format(nextBill.amount)}</Text>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-circle-outline" size={26} color={colors.brown} />
                <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
                <Text style={styles.emptyText}>New bills will appear here when they&apos;re available.</Text>
              </View>
            )}

            <Text style={[styles.sectionTitle, styles.historyTitle]}>Bill history</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.historyRow}>
            <View style={styles.historyIcon}>
              <Ionicons name="document-text-outline" size={19} color={colors.muted} />
            </View>
            <View style={styles.historyCopy}>
              <Text style={styles.billName}>{item.name}</Text>
              <Text style={styles.dueDate}>Due {formatDueDate(item.dueDate)}</Text>
            </View>
            <Text style={styles.historyAmount}>{currency.format(item.amount)}</Text>
          </View>
        )}
        ListFooterComponent={<Text style={styles.pullHint}>Pull down to refresh</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: 24,
  },
  loadingText: { marginTop: 12, color: colors.muted, fontSize: 14 },
  content: { padding: 20, paddingBottom: 32 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 28, fontWeight: "700", marginTop: 5 },
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
  summaryLabel: { color: "#EAD9C9", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  summaryAmount: { color: colors.white, fontSize: 34, fontWeight: "700", marginTop: 8 },
  summaryHint: { color: "#EAD9C9", fontSize: 13, marginTop: 8 },
  sectionHeading: { marginTop: 28, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
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
