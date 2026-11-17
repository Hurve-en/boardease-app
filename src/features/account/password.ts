import { supabase } from "@/lib/supabase";

export async function changePassword(currentPassword: string, password: string) {
  if (!supabase) throw new Error("Password changes are unavailable. Please try again later.");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) throw new Error("Please sign in again before changing your password.");
  // Verify against the authenticated identity, never an editable email field.
  const verified = await supabase.auth.signInWithPassword({ email: data.user.email, password: currentPassword });
  if (verified.error) throw new Error("We couldn’t verify your current password. Check it and try again.");
  const updated = await supabase.auth.updateUser({ password, current_password: currentPassword });
  if (updated.error) {
    if (updated.error.code === "weak_password") throw new Error("Choose a stronger password. Use a mix of letters, numbers, and symbols.");
    throw new Error("We couldn’t change your password. Please try again, or sign in again if the problem continues.");
  }
}
