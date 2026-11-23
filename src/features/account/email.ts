import { supabase } from "@/lib/supabase";

export async function requestEmailChange(current: string, draft: string) {
  const email = draft.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (email === current.trim().toLowerCase()) throw new Error("Enter a different email address.");
  if (!supabase) throw new Error("Email changes are unavailable.");

  const { data, error } = await supabase.auth.updateUser({ email });
  if (error) {
    if (error.status === 429) throw new Error("Please wait before requesting another email change.");
    throw new Error("Couldn’t change your email. Check the address and try again.");
  }
  return { email, confirmed: data.user?.email?.toLowerCase() === email };
}
