import { AdminScreenHeader } from "@/components/navigation/AdminScreenHeader";
import { AdminTabBar } from "@/components/navigation/AdminTabBar";
import { palette, radius } from "@/constants/theme";
import {
  historyColors as c,
  historyFonts as f,
} from "@/features/billing-history/theme";
import { getAuthState } from "@/lib/auth";
import {
  loadInbox,
  markRead,
  type Inbox,
  type Notice,
} from "@/lib/notifications";
import {
  Inter_400Regular,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Notifications from "expo-notifications";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function iconFor(kind: string): IconName {
  switch (kind) {
    case "bill_issued":
      return "receipt-outline";
    case "bill_revised":
      return "create-outline";
    case "payment_recorded":
      return "checkmark-circle-outline";
    case "proof_submitted":
      return "image-outline";
    case "proof_needs_update":
      return "alert-circle-outline";
    default:
      return "notifications-outline";
  }
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function NotificationsScreen() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });
  // null = role not known yet, so we don't flash the wrong header
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [page, setPage] = useState<Inbox | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    getAuthState()
      .then((state) => {
        if (active) setIsAdmin(state.role === "admin");
      })
      .catch(() => {
        if (active) setIsAdmin(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(() => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setRefreshing(true);
    loadInbox(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setPage(result);
        setError("");
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("Couldn’t load your inbox.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setRefreshing(false);
      });
  }, []);

  // Reload every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
      return () => activeRequest.current?.abort();
    }, [refresh]),
  );

  // Reload when a push arrives while this screen is open
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Notifications.addNotificationReceivedListener(() => refresh());
    return () => sub.remove();
  }, [refresh]);

  function open(item: Notice) {
    // Mark as read on screen right away, and tell the server in the background
    if (!item.readAt) {
      setPage((current) =>
        current
          ? {
              ...current,
              unread: Math.max(0, current.unread - 1),
              items: current.items.map((n) =>
                n.id === item.id
                  ? { ...n, readAt: new Date().toISOString() }
                  : n,
              ),
            }
          : current,
      );
      markRead(item.id).catch(() => {});
    }

    // Navigate even if marking as read fails
    if (item.kind === "proof_submitted") {
      router.push({
        pathname: "/admin-payments",
        params: { proof: item.eventKey },
      });
    } else if (item.kind === "proof_needs_update") {
      router.push({
        pathname: "/payment-submission/[billId]",
        params: { billId: item.billId },
      });
    } else {
      router.push({
        pathname: "/bill/[billId]",
        params: { billId: item.billId },
      });
    }
  }

  async function loadMore() {
    if (!page?.next || loadingMore || refreshing) return;
    setLoadingMore(true);
    try {
      const older = await loadInbox(undefined, page.next);
      setPage((current) => {
        if (!current) return older;
        const seen = new Set(current.items.map((n) => n.id));
        return {
          ...older,
          unread: current.unread,
          items: [
            ...current.items,
            ...older.items.filter((n) => !seen.has(n.id)),
          ],
        };
      });
      setError("");
    } catch {
      setError("Couldn’t load older notifications.");
    } finally {
      setLoadingMore(false);
    }
  }

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          color={c.brown}
          accessibilityLabel="Loading notifications"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {isAdmin === true ? (
        <View style={styles.adminHeader}>
          <AdminScreenHeader
            title="Notifications"
            onRefresh={refresh}
            refreshing={refreshing}
          />
        </View>
      ) : isAdmin === false ? (
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={c.brown} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>
            Notifications
          </Text>
          {page && page.unread > 0 ? (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>
                {page.unread > 99 ? "99+" : `${page.unread} new`}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
          <Pressable onPress={refresh} style={styles.retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {!page && !error ? (
        <View style={styles.state}>
          <ActivityIndicator color={c.brown} />
          <Text style={styles.body}>Loading notifications…</Text>
        </View>
      ) : null}

      {page ? (
        <FlatList
          style={styles.flex}
          data={page.items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={refresh}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            error ? undefined : (
              <View style={styles.state}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color={c.brown}
                  />
                </View>
                <Text style={styles.emptyTitle}>You’re all caught up</Text>
                <Text style={[styles.body, styles.center]}>
                  New bills and payment updates will show up here.
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footer} color={c.brown} />
            ) : undefined
          }
          renderItem={({ item }) => {
            const unread = !item.readAt;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${unread ? "Unread. " : ""}${item.title}. ${item.body}`}
                onPress={() => open(item)}
                style={({ pressed }) => [
                  styles.card,
                  unread && styles.cardUnread,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.icon}>
                  <Ionicons
                    name={iconFor(item.kind)}
                    size={20}
                    color={c.brown}
                  />
                </View>
                <View style={styles.copy}>
                  <View style={styles.cardTop}>
                    <Text
                      style={[
                        styles.cardTitle,
                        !unread && styles.cardTitleRead,
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.date}>
                      {formatWhen(item.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.body} numberOfLines={3}>
                    {item.body}
                  </Text>
                </View>
                {unread ? <View style={styles.dot} /> : null}
                <Ionicons name="chevron-forward" size={17} color={c.muted} />
              </Pressable>
            );
          }}
        />
      ) : (
        <View style={styles.flex} />
      )}

      {isAdmin ? <AdminTabBar active="payments" /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  flex: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.background,
  },
  pressed: { opacity: 0.68 },
  adminHeader: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.white,
    borderWidth: 1,
    borderColor: c.border,
  },
  title: { flex: 1, fontFamily: f.bold, fontSize: 20, color: c.text },
  unreadPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: c.brown,
  },
  unreadPillText: { fontFamily: f.bold, fontSize: 12, color: c.white },
  list: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.white,
  },
  cardUnread: {
    backgroundColor: palette.surfaceSelected,
    borderColor: palette.borderStrong,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.beige,
  },
  copy: { flex: 1, gap: 4 },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: { flex: 1, fontFamily: f.bold, fontSize: 14, color: c.text },
  cardTitleRead: { fontFamily: f.regular },
  date: { fontFamily: f.regular, fontSize: 12, color: c.muted },
  body: { fontFamily: f.regular, fontSize: 13, lineHeight: 20, color: c.muted },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.brown },
  state: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
  },
  center: { textAlign: "center" },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.beige,
  },
  emptyTitle: { fontFamily: f.bold, fontSize: 15, color: c.text },
  errorBox: { alignItems: "center", gap: 12, padding: 16 },
  error: {
    fontFamily: f.regular,
    fontSize: 13,
    lineHeight: 20,
    color: palette.danger,
  },
  retry: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: c.brown,
  },
  retryText: { fontFamily: f.bold, fontSize: 13, color: c.white },
  footer: { paddingVertical: 16 },
});
