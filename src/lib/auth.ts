import {supabase} from "./supabase";

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
	if (!supabase) return false;
	const {data, error} = await supabase.auth.getUser();
	if (error) throw error;
	return data.user !== null;
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
		notify(true);
		return null;
	} catch {
		return "Can't reach the authentication service.";
	}
}

export async function signOut() {
	if (supabase) {
		await supabase.auth.signOut();
	}
	notify(false);
}
