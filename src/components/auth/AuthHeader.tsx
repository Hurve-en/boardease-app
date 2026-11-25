import { fonts, palette } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";
import LogoMark from "./LogoMark";

export default function AuthHeader() {
  return (
    <View style={styles.brand}>
      <LogoMark size={48} />
      <Text style={styles.name}>BoardEase</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: "center", gap: 10, marginTop: 24 },
  name: { fontFamily: fonts.bold, fontSize: 20, letterSpacing: -0.4, color: palette.text },
});
