import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {Platform} from "react-native";

const API = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

type Listener = (signedIn: boolean) => void;
const listeners = new Set<Listener>();
const notify = (signedIn: boolean) => listeners.forEach((fn) => fn(signedIn));

async function getItem(key: string): Promise<string | null> {
	return Platform.OS === "web"
		? AsyncStorage.getItem(key)
		: SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
	if (Platform.OS === "web") {
		await AsyncStorage.setItem(key, value);
	} else {
		await SecureStore.setItemAsync(key, value);
	}
}

async function deleteItem(key: string): Promise<void> {
	if (Platform.OS === "web") {
		await AsyncStorage.removeItem(key);
	} else {
		await SecureStore.deleteItemAsync(key);
	}
}

export function onAuthChange(fn: Listener) {
	listeners.add(fn);
	return () => {
		listeners.delete(fn);
	};
}

export async function hasSession() {
	return (await getItem(ACCESS_KEY)) !== null;
}

async function callLogout(accessToken: string, refreshToken: string) {
	if (!API) return;

	try {
		await fetch(`${API}/api/logout`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({accessToken, refreshToken}),
		});
	} catch {
		// Local sign-out should still succeed if the server cannot be reached.
	}
}

// Returns an error message, or null on success.
export async function signIn(email: string, password: string) {
	if (!API) return "Missing EXPO_PUBLIC_API_URL in the environment.";

	try {
		const res = await fetch(`${API}/api/login`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({email: email.trim(), password}),
		});

		const data = await res.json().catch(() => null);
		if (!res.ok) return data?.error ?? "Sign in failed.";

		if (
			typeof data?.accessToken !== "string" ||
			typeof data?.refreshToken !== "string"
		) {
			return "The server response did not include valid session tokens.";
		}

		if (data.user?.role !== "tenant") {
			await callLogout(data.accessToken, data.refreshToken);
			return "This app is for tenants only.";
		}

		await setItem(ACCESS_KEY, data.accessToken);
		await setItem(REFRESH_KEY, data.refreshToken);
		notify(true);
		return null;
	} catch {
		return "Can't reach the server.";
	}
}

export async function signOut() {
	const [accessToken, refreshToken] = await Promise.all([
		getItem(ACCESS_KEY),
		getItem(REFRESH_KEY),
	]);

	// Clear local tokens first, so sign-out works when the server is unreachable.
	await Promise.all([deleteItem(ACCESS_KEY), deleteItem(REFRESH_KEY)]);
	notify(false);

	if (accessToken && refreshToken) {
		await callLogout(accessToken, refreshToken);
	}
}
