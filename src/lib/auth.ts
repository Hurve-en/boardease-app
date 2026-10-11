import * as SecureStore from "expo-secure-store";

const API = process.env.EXPO_PUBLIC_API_URL!;
const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

type Listener = (signedIn: boolean) => void;
const listeners = new Set<Listener>();
const notify = (signedIn: boolean) => listeners.forEach((fn) => fn(signedIn));

export function onAuthChange(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export async function hasSession() {
  return (await SecureStore.getItemAsync(ACCESS_KEY)) !== null;
}

async function callLogout(accessToken: string, refreshToken: string) {
  try {
    await fetch(`${API}/api/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, refreshToken }),
    });
  } catch {}
}

// Returns an error message, or null on success
export async function signIn(email: string, password: string) {
  try {
    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "Sign in failed.";

    if (data.user?.role !== "tenant") {
      await callLogout(data.accessToken, data.refreshToken);
      return "This app is for tenants only.";
    }

    await SecureStore.setItemAsync(ACCESS_KEY, data.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
    notify(true);
    return null;
  } catch {
    return "Can't reach the server.";
  }
}

export async function signOut() {
  const accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);

  // Clear the phone first, so logout works even if the server is unreachable
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  notify(false);

  if (accessToken && refreshToken) await callLogout(accessToken, refreshToken);
}
