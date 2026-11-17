export type TenantAccount = {
  profile: { name: string; email: string };
  tenancy: { roomNumber: string | null; boardingHouseName: string | null } | null;
  owner: { name: string | null; phone: string | null; email: string | null } | null;
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid account response");
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("Invalid account response");
  return value.trim();
}
function optionalText(value: unknown): string | null {
  return value === null ? null : text(value);
}

export function parseAccount(value: unknown): TenantAccount {
  const account = object(value);
  const profile = object(account.profile);
  const tenancy = account.tenancy === null ? null : object(account.tenancy);
  const owner = account.owner === null ? null : object(account.owner);
  return {
    profile: { name: text(profile.name), email: text(profile.email) },
    tenancy: tenancy ? { roomNumber: optionalText(tenancy.roomNumber), boardingHouseName: optionalText(tenancy.boardingHouseName) } : null,
    owner: owner ? { name: optionalText(owner.name), phone: optionalText(owner.phone), email: optionalText(owner.email) } : null,
  };
}

// Only construct contact links from the expected data fields, never arbitrary URLs.
export function ownerContacts(owner: TenantAccount["owner"]) {
  const contacts: { label: string; url: string }[] = [];
  const phone = owner?.phone?.replace(/[\s().-]/g, "");
  if (phone && /^\+?[0-9]{7,15}$/.test(phone)) contacts.push({ label: "Call owner", url: `tel:${phone}` });
  const email = owner?.email;
  if (email && /^[^\s@?&#:]+@[^\s@?&#:]+\.[^\s@?&#:]+$/.test(email)) contacts.push({ label: "Email owner", url: `mailto:${encodeURIComponent(email)}` });
  return contacts;
}

export function passwordProblem(current: string, password: string, confirmation: string) {
  if (!current) return "Enter your current password.";
  if (password.length < 8) return "Use at least 8 characters for your new password.";
  if (password === current) return "Choose a different password from your current password.";
  if (password !== confirmation) return "Your new passwords don’t match.";
  return null;
}
