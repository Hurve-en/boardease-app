import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";

export type Notice = {
  id: number;
  billId: string;
  kind: string;
  eventKey: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type Inbox = { items: Notice[]; unread: number; next: number | null };

export function loadInbox(signal?: AbortSignal, before?: number) {
  return api<Inbox>(
    "/api/notifications" + (before ? `?before=${before}` : ""),
    { signal },
  );
}

// ---- Push notifications ----

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: 5 as any, // 5 = MAX (avoids Notifications.AndroidImportance)
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

export const savePushToken = (token: string) =>
  api("/api/push-token", {
    method: "POST",
    body: JSON.stringify({ token, platform: Platform.OS }),
  });

export const removePushToken = (token: string) =>
  api("/api/push-token", {
    method: "DELETE",
    body: JSON.stringify({ token }),
  });

export const markRead = (id: number) =>
  api("/api/notifications", {
    method: "PATCH",
    body: JSON.stringify({ id }),
  });
