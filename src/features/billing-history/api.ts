import { getAccessToken } from "@/lib/auth";
import { parseBillingHistory } from "./model";
import { BillingHistorySessionError } from "./errors";

export async function fetchBillingHistory(signal: AbortSignal) {
  const api = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!api)
    throw new Error("Billing history is unavailable. Please try again later.");
  const token = await getAccessToken();
  if (!token)
    throw new BillingHistorySessionError();
  // Tenant-scoped endpoint in boardingbills-web; /api/bills remains admin-only.
  const response = await fetch(`${api}/api/tenant/bills`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal,
  });
  if (response.status === 401)
    throw new BillingHistorySessionError();
  if (response.status === 403) {
    const problem = await response.json().catch(() => null);
    if (problem?.code === "TENANT_NOT_LINKED") {
      throw new Error(
        "Your account isn’t linked to a tenant record yet. Please contact your owner.",
      );
    }
    throw new Error(
      "Your account cannot access billing history. Please contact your owner.",
    );
  }
  if (response.status === 404 || response.status === 501)
    throw new Error(
      "Billing history is not available yet. Please try again later.",
    );
  if (!response.ok)
    throw new Error("We couldn’t load your bills. Please try again.");
  try {
    return parseBillingHistory(await response.json());
  } catch {
    throw new Error(
      "We received incomplete billing information. Please try again later.",
    );
  }
}
