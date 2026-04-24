import { createServiceClient } from "@/lib/supabase/server";
import { REFERRAL_SIGNUP_BONUS } from "@/lib/utils/constants";

/**
 * Credit referrer Rp5.000 when a referred user makes their first order.
 * Called after order creation — best-effort, never blocks order flow.
 *
 * Guards:
 * - User must have referred_by set
 * - referral_signup_bonus_credited must be false (prevents double-credit)
 * - referral_expires_at must be in the future
 */
export async function creditReferralSignupBonus(userId: string): Promise<void> {
  try {
    const supabase = await createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("referred_by, referral_expires_at, referral_signup_bonus_credited")
      .eq("id", userId)
      .single();

    if (
      !profile?.referred_by ||
      profile.referral_signup_bonus_credited ||
      !profile.referral_expires_at ||
      new Date(profile.referral_expires_at) <= new Date()
    ) {
      return;
    }

    // Credit the referrer
    await supabase.rpc("increment_referral_commission", {
      p_referral_code: profile.referred_by,
      p_amount: REFERRAL_SIGNUP_BONUS,
    });

    // Mark as credited so it never fires again
    await supabase
      .from("profiles")
      .update({ referral_signup_bonus_credited: true })
      .eq("id", userId);
  } catch {
    // best-effort — never block order creation
  }
}
