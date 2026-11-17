import { supabase } from "./supabase";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!BASE_URL) {
    throw new Error("The API URL is not configured.");
  }

  const { data, error: sessionError } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null }, error: null };
  if (sessionError) throw sessionError;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(data.session?.access_token
        ? { Authorization: `Bearer ${data.session.access_token}` }
        : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {
      // Keep the status message when the backend does not return JSON.
    }
    throw new Error(message);
  }

  return res.json();
}
