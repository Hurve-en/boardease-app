import {useRouter} from "expo-router";
import {Pressable, Text, View} from "react-native";

export default function HomeScreen() {
	const router = useRouter();

	return (
		<View style={{paddingTop: 60, paddingHorizontal: 24}}>
			<Text>Welcome to BoardEase</Text>

			<Pressable
				style={({pressed}) => [pressed && {opacity: 0.7}]}
				onPress={() => router.push("/login")}>
				<Text>Go to Login</Text>
			</Pressable>
		</View>
	);
}
