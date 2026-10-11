import { supabase } from "@/lib/supabase";
import { Button, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 24 }}>Tenant Home</Text>
        <Button title="Logout" onPress={handleLogout} />
      </View>
    </SafeAreaView>
  );
}
