import { createClient } from "@/lib/supabase/client";

/**
 * Track that the user opened a WA share link.
 * Sets `first_wa_sent_at` on profile if not already set.
 * Called from all wa.me share functions across the app.
 */
export async function trackWaSent(): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ first_wa_sent_at: new Date().toISOString() })
      .eq("id", user.id)
      .is("first_wa_sent_at", null);
  } catch (error) {
    // Non-critical — don't block the WA share flow
    console.error("Error tracking WA sent:", error);
  }
}
