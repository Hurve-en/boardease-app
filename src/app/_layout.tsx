import { hasSession, onAuthChange } from "@/lib/auth";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";

export default function RootLayout() {
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hasSession().then((value) => {
      setSignedIn(value);
      setReady(true);
    });
    return onAuthChange(setSignedIn);
  }, []);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="home" />
      </Stack.Protected>

      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}
