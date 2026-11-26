import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { loadInbox } from "@/lib/notifications";
import { TabItem } from "./TabItem";

export function InboxTab() {
  const [unread, setUnread] = useState(0);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const page = await loadInbox(controller.signal);
        if (!controller.signal.aborted) setUnread(page.unread);
      } catch { /* The inbox screen offers a retry if the network is unavailable. */ }
    }
    void refresh();
    const timer = setInterval(refresh, 60000);
    return () => { clearInterval(timer); controller.abort(); };
  }, []));
  return <TabItem label={unread ? `Inbox (${unread})` : "Inbox"} icon="notifications-outline"
    onPress={() => router.push("/notifications")} />;
}
