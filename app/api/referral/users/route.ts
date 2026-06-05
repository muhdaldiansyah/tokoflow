import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get list of referred users
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single();

    if (!profile?.referral_code) {
      return NextResponse.json([]);
    }

    const { data: referred } = await supabase
      .from("profiles")
      .select("id, full_name, business_name, referral_expires_at, created_at")
      .eq("referred_by", profile.referral_code)
      .order("created_at", { ascending: false });

    if (!referred || referred.length === 0) {
      return NextResponse.json([]);
    }

    const referredIds = referred.map((r: { id: string }) => r.id);

    const { data: payments } = await supabase
      .from("payment_orders")
      .select("user_id, amount")
      .in("user_id", referredIds)
      .eq("status", "completed");

    const paymentMap = new Map<string, number>();
    (payments || []).forEach((p: { user_id: string; amount: number }) => {
      paymentMap.set(p.user_id, (paymentMap.get(p.user_id) || 0) + (p.amount || 0));
    });

    const result = referred.map((r: { id: string; full_name: string; business_name?: string; referral_expires_at: string | null; created_at: string }) => ({
      id: r.id,
      full_name: r.full_name || "",
      business_name: r.business_name || undefined,
      created_at: r.created_at,
      referral_expires_at: r.referral_expires_at,
      total_paid: paymentMap.get(r.id) || 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Referred users API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
