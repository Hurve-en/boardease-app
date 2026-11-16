import { colors } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";
import LogoMark from "./LogoMark";

export default function AuthHeader() {
  return (
    <>
      <View style={styles.logoRow}>
        <LogoMark size={36} />
        <Text style={styles.brand}>BoardEase</Text>
      </View>

      <View style={styles.hero}>
        <LogoMark size={66} />
        <Text style={styles.heroLabel}>TENANT WORKSPACE</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  brand: { fontSize: 24, fontWeight: "700", color: colors.brown },
  hero: {
    marginTop: 28,
    height: 148,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLabel: {
    marginTop: 14,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: colors.brown,
  },
});