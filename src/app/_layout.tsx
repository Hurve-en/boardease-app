import {hasSession, onAuthChange} from "@/lib/auth";
import {Stack} from "expo-router";
import {useEffect, useState} from "react";
import {ActivityIndicator, View} from "react-native";

export default function RootLayout() {
	const [signedIn, setSignedIn] = useState(false);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let active = true;
		hasSession()
			.then((value) => {
				if (active) setSignedIn(value);
			})
			.catch(() => {
				if (active) setSignedIn(false);
			})
			.finally(() => {
				if (active) setReady(true);
			});
		const unsubscribe = onAuthChange(setSignedIn);
		return () => {
			active = false;
			unsubscribe();
		};
	}, []);

	if (!ready) {
		return (
			<View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
				<ActivityIndicator accessibilityLabel="Loading session" />
			</View>
		);
	}

	return (
		<Stack screenOptions={{headerShown: false}}>
			<Stack.Protected guard={signedIn}>
				<Stack.Screen name="home" />
			</Stack.Protected>

			<Stack.Protected guard={!signedIn}>
				<Stack.Screen name="index" />
				<Stack.Screen name="login" />
				<Stack.Screen name="register" />
			</Stack.Protected>
		</Stack>
	);
}
