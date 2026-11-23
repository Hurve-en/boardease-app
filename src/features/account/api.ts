import { getAccessToken } from "@/lib/auth";
import { parseAccount } from "./model";

export class AccountSessionError extends Error {
  constructor() { super("Your session has expired. Please sign in again."); }
}

async function requestAccount(signal: AbortSignal, name?: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!base) throw new Error("Account information is unavailable. Please try again later.");
  const token = await getAccessToken();
  if (!token) throw new AccountSessionError();
  const response = await fetch(`${base}/api/tenant/account`, {
    method: name === undefined ? "GET" : "PATCH",
    body: name === undefined ? undefined : JSON.stringify({name}),
    headers: { ...(name === undefined ? {} : {"Content-Type": "application/json"}), Authorization: `Bearer ${token}`, Accept: "application/json" }, signal,
    cache: "no-store",
  });
  if (response.status === 401) throw new AccountSessionError();
  if (response.status === 403) throw new Error("Your account cannot access tenant information. Please contact your owner.");
  if (name !== undefined && !response.ok) throw new Error("Couldn’t save your display name. Please try again.");
  if (!response.ok) throw new Error("We couldn’t load your account. Please try again.");
  return response;
}

export async function fetchAccount(signal: AbortSignal) {
  const response = await requestAccount(signal);
  try { return parseAccount(await response.json()); }
  catch { throw new Error("We received incomplete account information. Please try again later."); }
}

export async function saveProfileName(name: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await requestAccount(controller.signal, name);
    const profile = await response.json();
    if (profile?.name !== name) throw new Error("Couldn’t confirm the saved display name. Please retry.");
    return name;
  } finally {
    clearTimeout(timeout);
  }
}
