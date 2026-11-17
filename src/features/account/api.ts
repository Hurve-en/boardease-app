import { getAccessToken } from "@/lib/auth";
import { parseAccount } from "./model";

export class AccountSessionError extends Error {
  constructor() { super("Your session has expired. Please sign in again."); }
}

export async function fetchAccount(signal: AbortSignal) {
  const base = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!base) throw new Error("Account information is unavailable. Please try again later.");
  const token = await getAccessToken();
  if (!token) throw new AccountSessionError();
  const response = await fetch(`${base}/api/tenant/account`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, signal,
    cache: "no-store",
  });
  if (response.status === 401) throw new AccountSessionError();
  if (response.status === 403) throw new Error("Your account cannot access tenant information. Please contact your owner.");
  if (!response.ok) throw new Error("We couldn’t load your account. Please try again.");
  try { return parseAccount(await response.json()); }
  catch { throw new Error("We received incomplete account information. Please try again later."); }
}
