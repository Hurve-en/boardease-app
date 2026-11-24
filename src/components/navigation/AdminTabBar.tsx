import {historyColors as c, historyFonts as f} from "@/features/billing-history/theme";
import {signOut} from "@/lib/auth";
import Ionicons from "@expo/vector-icons/Ionicons";
import {router} from "expo-router";
import {useState} from "react";
import {Pressable, StyleSheet, Text, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";

export function AdminTabBar({active}: {active: "dashboard" | "payments"}) {
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
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <SafeAreaView edges={["bottom"]} style={styles.bar}>
        <View style={styles.tabs} accessibilityRole="tablist" accessibilityLabel="Admin navigation">
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{selected: active === "dashboard"}}
            onPress={() => active !== "dashboard" && router.replace("/admin")}
            style={({pressed}) => [styles.tab, pressed && styles.pressed]}
          >
            <View style={[styles.icon, active === "dashboard" && styles.selected]}>
              <Ionicons name="grid-outline" size={18} color={active === "dashboard" ? c.brown : c.muted} />
            </View>
            <Text style={[styles.label, active === "dashboard" && styles.selectedLabel]}>Dashboard</Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{selected: active === "payments"}}
            onPress={() => active !== "payments" && router.replace("/admin-payments")}
            style={({pressed}) => [styles.tab, pressed && styles.pressed]}
          >
            <View style={[styles.icon, active === "payments" && styles.selected]}>
              <Ionicons name="card-outline" size={18} color={active === "payments" ? c.brown : c.muted} />
            </View>
            <Text style={[styles.label, active === "payments" && styles.selectedLabel]}>Payments</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={signingOut ? "Signing out" : "Sign out"}
            accessibilityState={{disabled: signingOut}}
            disabled={signingOut}
            onPress={() => void handleSignOut()}
            style={({pressed}) => [styles.tab, pressed && styles.pressed]}
          >
            <View style={styles.icon}>
              <Ionicons name="log-out-outline" size={18} color={c.muted} />
            </View>
            <Text style={styles.label}>{signingOut ? "Signing out…" : "Sign out"}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.border},
  tabs: {width: "100%", maxWidth: 600, alignSelf: "center", flexDirection: "row", paddingVertical: 8},
  tab: {flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", gap: 5},
  icon: {width: 44, height: 26, borderRadius: 16, alignItems: "center", justifyContent: "center"},
  selected: {backgroundColor: c.beige},
  label: {fontFamily: f.regular, fontSize: 11, color: c.muted},
  selectedLabel: {fontFamily: f.bold, color: c.brown},
  pressed: {opacity: 0.7},
  error: {paddingVertical: 8, textAlign: "center", fontFamily: f.regular, fontSize: 12, color: "#9A3529", backgroundColor: c.white},
});
