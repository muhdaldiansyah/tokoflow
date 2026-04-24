import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";

// GET — list all users with referral data
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  const supabase = await createServiceClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, business_name, role, referral_code, referral_balance, referral_total_earned, referral_total_paid, referred_by, created_at")
    .not("referral_code", "is", null)
    .order("referral_total_earned", { ascending: false });

  if (!profiles) return NextResponse.json([]);

  // Get emails
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map<string, string>();
  authUsers?.forEach((u) => { if (u.email) emailMap.set(u.id, u.email); });

  // Count referred users per referral code
  const referralCounts: Record<string, number> = {};
  for (const p of profiles) {
    if (p.referred_by) {
      referralCounts[p.referred_by] = (referralCounts[p.referred_by] || 0) + 1;
    }
  }

  const result = profiles.map((p) => ({
    id: p.id,
    full_name: p.business_name || p.full_name || "—",
    email: emailMap.get(p.id) || "—",
    role: p.role || "user",
    referral_code: p.referral_code,
    referral_balance: p.referral_balance || 0,
    referral_total_earned: p.referral_total_earned || 0,
    referral_total_paid: p.referral_total_paid || 0,
    referred_count: referralCounts[p.referral_code!] || 0,
    created_at: p.created_at,
  }));

  return NextResponse.json(result);
}

// PATCH — process payout
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  const body = await request.json();
  const { userId, amount } = body;

  if (!userId || !amount || amount <= 0) {
    return NextResponse.json({ error: "userId and amount (> 0) are required" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // Get current balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_balance, referral_total_paid")
    .eq("id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (amount > (profile.referral_balance || 0)) {
    return NextResponse.json({ error: `Saldo tidak cukup (saldo: RM ${profile.referral_balance?.toLocaleString()})` }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      referral_balance: (profile.referral_balance || 0) - amount,
      referral_total_paid: (profile.referral_total_paid || 0) + amount,
    })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
