import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <div>
      <h1>Welcome to BoardEase</h1>

      <Pressable
        style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        onPress={() => router.push("/login")}
      >
        <Text>Back to Login</Text>
      </Pressable>
    </div>
  );
}
