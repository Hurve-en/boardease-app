import {supabase} from "./supabase";

export type UserRole = "admin" | "tenant";
export type AuthState = {signedIn: boolean; role: UserRole | null};

type Listener = (state: AuthState) => void;
const listeners = new Set<Listener>();
const notify = (state: AuthState) => listeners.forEach((fn) => fn(state));

export function onAuthChange(fn: Listener) {
	listeners.add(fn);
	return () => {
		listeners.delete(fn);
	};
}

export async function getAuthState(): Promise<AuthState> {
	if (!supabase) return {signedIn: false, role: null};
	const {data, error} = await supabase.auth.getUser();
	if (error) throw error;
	if (!data.user) return {signedIn: false, role: null};
	return {signedIn: true, role: await getUserRole()};
}

export async function hasSession() {
	const state = await getAuthState();
	return state.signedIn;
}

export async function getUserRole(): Promise<UserRole> {
	if (!supabase) return "tenant";
	const {data, error} = await supabase.auth.getClaims();
	if (error) throw error;
	const role = (data?.claims as {user_role?: string | null} | undefined)
		?.user_role;
	return role === "admin" ? "admin" : "tenant";
}

// Use the same persisted/refreshed Supabase session as the dashboard API client.
export async function getAccessToken() {
	if (!supabase) return null;
	const {data, error} = await supabase.auth.getSession();
	if (error) throw error;
	return data.session?.access_token ?? null;
}

// Returns an error message, or null on success.
export async function signIn(email: string, password: string) {
	if (!supabase) {
		return "Sign in is not configured. Please contact the administrator.";
	}

	try {
		const {error} = await supabase.auth.signInWithPassword({
			email: email.trim(),
			password,
		});
		if (error) return error.message;
		const role = await getUserRole();
		notify({signedIn: true, role});
		return null;
	} catch {
		return "Can't reach the authentication service.";
	}
}

export async function signOut() {
	if (supabase) {
		const {error} = await supabase.auth.signOut({scope: "local"});
		if (error) throw error;
	}
	notify({signedIn: false, role: null});
}
