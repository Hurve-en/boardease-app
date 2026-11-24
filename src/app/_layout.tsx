import { getAuthState, onAuthChange, type UserRole } from "@/lib/auth";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export const unstable_settings = {anchor: "history"};

export default function RootLayout() {
	const [authState, setAuthState] = useState<{
		signedIn: boolean;
		role: UserRole | null;
	}>({signedIn: false, role: null});
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let active = true;
		getAuthState()
			.then((state) => {
				if (active) setAuthState(state);
			})
			.catch(() => {
				if (active) setAuthState({signedIn: false, role: null});
			})
			.finally(() => {
				if (active) setReady(true);
			});
		const unsubscribe = onAuthChange(setAuthState);
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
			<Stack.Protected guard={authState.signedIn && authState.role === "admin"}>
				<Stack.Screen name="admin" />
				<Stack.Screen name="admin-payments" />
			</Stack.Protected>

			<Stack.Protected guard={authState.signedIn && authState.role !== "admin"}>
				<Stack.Screen name="history" />
				<Stack.Screen name="account" />
				<Stack.Screen name="home" />
				<Stack.Screen name="dashboard" />
				<Stack.Screen name="bill/[billId]" />
				<Stack.Screen name="payment-submission/[billId]" />
			</Stack.Protected>

			<Stack.Protected guard={!authState.signedIn}>
				<Stack.Screen name="index" />
				<Stack.Screen name="login" />
				<Stack.Screen name="register" />
			</Stack.Protected>
		</Stack>
	);
}
