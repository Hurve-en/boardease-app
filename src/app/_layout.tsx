import { palette } from "@/constants/theme";
import { getAuthState, onAuthChange, type UserRole } from "@/lib/auth";
import { markRead, registerForPush, savePushToken } from "@/lib/notifications";
import {
	InterTight_400Regular,
	InterTight_500Medium,
	InterTight_600SemiBold,
	InterTight_700Bold,
	useFonts,
} from "@expo-google-fonts/inter-tight";
import * as Notifications from "expo-notifications";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export const unstable_settings = { anchor: "history" };

export default function RootLayout() {
  const [authState, setAuthState] = useState<{
    signedIn: boolean;
    role: UserRole | null;
  }>({ signedIn: false, role: null });
  const [ready, setReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold,
  });

  useEffect(() => {
    let active = true;
    getAuthState()
      .then((state) => {
        if (active) setAuthState(state);
      })
      .catch(() => {
        if (active) setAuthState({ signedIn: false, role: null });
      })
      .finally(() => {
        if (active) setReady(true);
      });
    const unsubscribe = onAuthChange(setAuthState);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Register this device for push once the user is signed in
  useEffect(() => {
    if (!authState.signedIn) return;
    registerForPush()
      .then((token) => {
        if (token) return savePushToken(token);
      })
      .catch((e) => console.warn("push registration failed", e));
  }, [authState.signedIn]);

  // Handle taps on a notification
  useEffect(() => {
    if (!authState.signedIn) return;
    const tapped = Notifications.addNotificationResponseReceivedListener(
      (res) => {
        const data = res.notification.request.content.data as {
          noticeId?: number;
          billId?: string;
        };
        if (data.noticeId) markRead(data.noticeId).catch(() => {});
        router.push("/notifications");
      },
    );
    return () => tapped.remove();
  }, [authState.signedIn]);

  if (!ready || (!fontsLoaded && !fontError)) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.canvas,
        }}
      >
        <ActivityIndicator
          color={palette.primary}
          accessibilityLabel="Loading session"
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.canvas },
      }}
    >
      <Stack.Protected guard={authState.signedIn && authState.role === "admin"}>
        <Stack.Screen name="admin" />
        <Stack.Screen name="admin-payments" />
      </Stack.Protected>

      <Stack.Protected guard={authState.signedIn && authState.role !== "admin"}>
        <Stack.Screen name="history" />
        <Stack.Screen name="account" />
        <Stack.Screen name="home" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="bill/[billId]" />
        <Stack.Screen name="payment-submission/[billId]" />
      </Stack.Protected>

      <Stack.Protected guard={authState.signedIn}>
        <Stack.Screen name="notifications" />
      </Stack.Protected>

      <Stack.Protected guard={!authState.signedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}
