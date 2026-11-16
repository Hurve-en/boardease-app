import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

type Props = { size?: number };

export default function LogoMark({ size = 36 }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: colors.brown,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name="home-outline" size={size * 0.55} color={colors.white} />
    </View>
  );
}