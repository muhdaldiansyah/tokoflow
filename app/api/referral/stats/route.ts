import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get referral stats for current user
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code, referral_balance, referral_total_earned, referral_total_paid")
      .eq("id", user.id)
      .single();

    if (!profile?.referral_code) {
      return NextResponse.json(null);
    }

    const [{ count: referredCount }, { count: activeCount }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", profile.referral_code),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", profile.referral_code)
        .gt("referral_expires_at", new Date().toISOString()),
    ]);

    return NextResponse.json({
      referral_code: profile.referral_code,
      referral_balance: profile.referral_balance ?? 0,
      referral_total_earned: profile.referral_total_earned ?? 0,
      referral_total_paid: profile.referral_total_paid ?? 0,
      referred_count: referredCount ?? 0,
      active_referred_count: activeCount ?? 0,
    });
  } catch (error) {
    console.error("Referral stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
