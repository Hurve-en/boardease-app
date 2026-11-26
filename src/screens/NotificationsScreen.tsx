import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fonts, palette, radius } from "@/constants/theme";
import { api } from "@/lib/api";
import { loadInbox, type Inbox, type Notice } from "@/lib/notifications";

export default function NotificationsScreen() {
  const [page, setPage] = useState<Inbox | null>(null);
  const [error, setError] = useState("");
  const activeRequest = useRef<AbortController | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(() => {
    activeRequest.current?.abort();
    setRefreshing(true);
    const controller = new AbortController();
    activeRequest.current = controller;
    loadInbox(controller.signal).then(result => {
      if (!controller.signal.aborted) { setPage(result); setError(""); }
    }).catch(() => { if (!controller.signal.aborted) setError("Couldn’t load your inbox."); })
      .finally(() => { if (!controller.signal.aborted) setRefreshing(false); });
  }, []);
  useFocusEffect(useCallback(() => {
    refresh();
    return () => activeRequest.current?.abort();
  }, [refresh]));

  async function select(item: Notice) {
    setBusy(true);
    try {
      await api("/api/notifications", { method: "PATCH", body: JSON.stringify({ id: item.id }) });
      if (item.kind === "proof_submitted") {
        router.push({ pathname: "/admin-payments", params: { proof: item.eventKey } });
      } else {
        router.push({ pathname: item.kind === "proof_needs_update" ? "/payment-submission/[billId]" : "/bill/[billId]", params: { billId: item.billId } });
      }
    } catch { setError("Couldn’t open this notification."); }
    finally { setBusy(false); }
  }

  async function more() {
    if (!page?.next || busy) return;
    setBusy(true);
    try {
      const older = await loadInbox(undefined, page.next);
      setPage({ ...older, items: [...page.items, ...older.items] });
      setError("");
    } catch { setError("Couldn’t load older notifications."); }
    finally { setBusy(false); }
  }

  return <SafeAreaView style={styles.screen}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.canGoBack() ? router.back() : router.replace("/")}><Text>Back</Text></Pressable>
      <Text accessibilityRole="header" style={styles.heading}>Notifications</Text>
    </View>
    {error ? <Pressable accessibilityRole="button" onPress={refresh}><Text style={styles.message}>{error} Tap to retry.</Text></Pressable> : null}
    {!page && !error && <ActivityIndicator />}
    {page && <FlatList data={page.items} keyExtractor={item => String(item.id)}
      contentContainerStyle={styles.list}
      refreshing={refreshing} onRefresh={refresh}
      ListEmptyComponent={<Text>No notifications yet.</Text>}
      ListFooterComponent={page.next ? <Pressable disabled={busy} accessibilityRole="button" onPress={more}><Text style={styles.message}>Load older notifications</Text></Pressable> : undefined}
      renderItem={({item}) => <Pressable disabled={busy} accessibilityRole="button" style={styles.row} onPress={() => select(item)}>
        <Text style={styles.title}>{!item.readAt && "● "}{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </Pressable>} />}
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.canvas },
  header: { padding: 20, gap: 16 },
  heading: { fontFamily: fonts.bold, fontSize: 28, color: palette.text },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  row: { backgroundColor: palette.surface, borderRadius: radius.card, padding: 16, gap: 5 },
  title: { fontFamily: fonts.semibold, fontSize: 16, color: palette.primary },
  body: { fontFamily: fonts.regular, color: palette.textSecondary },
  date: { fontSize: 12, color: palette.muted },
  message: { padding: 16, color: palette.primary },
});
