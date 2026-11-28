import { fonts, palette } from "@/constants/theme";
import { signOut } from "@/lib/auth";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { InboxTab } from "./InboxTab";
import { TabItem, tabBarStyles } from "./TabItem";

export function AdminTabBar({
  active,
}: {
  active: "dashboard" | "payments" | "notifications";
}) {
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError("");
    try {
      await signOut();
    } catch {
      setError("We couldn’t sign you out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <SafeAreaView edges={["bottom"]} style={tabBarStyles.bar}>
        <View
          style={tabBarStyles.tabs}
          accessibilityRole="tablist"
          accessibilityLabel="Admin navigation"
        >
          <TabItem
            label="Dashboard"
            icon="grid-outline"
            activeIcon="grid"
            selected={active === "dashboard"}
            onPress={() => active !== "dashboard" && router.replace("/admin")}
          />
          <TabItem
            label="Payments"
            icon="card-outline"
            activeIcon="card"
            selected={active === "payments"}
            onPress={() =>
              active !== "payments" && router.replace("/admin-payments")
            }
          />
          <InboxTab />
          <TabItem
            role="button"
            label={signingOut ? "Signing out…" : "Sign out"}
            accessibilityLabel={signingOut ? "Signing out" : "Sign out"}
            icon="log-out-outline"
            disabled={signingOut}
            onPress={() => void handleSignOut()}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  error: {
    paddingVertical: 8,
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 12,
    color: palette.danger,
    backgroundColor: palette.dangerSurface,
  },
});
