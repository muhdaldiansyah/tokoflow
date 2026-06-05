import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET — list order_payments rows for one order. Used by the order detail
// page to surface in-flow payment audit (channel, fee, payer, paid_at).
// RLS already scopes to user_id = auth.uid(); the explicit user check below
// is defense in depth for the rare case of stale tokens.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("order_payments")
      .select(
        "id, status, provider, amount, payment_method, billplz_url, payer_name, payer_email, payer_phone, fee_amount, paid_at, refunded_at, created_at",
      )
      .eq("order_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("order_payments fetch failed:", error);
      return NextResponse.json({ payments: [] });
    }

    return NextResponse.json({ payments: data ?? [] });
  } catch (err) {
    console.error("GET /api/orders/[id]/payments error:", err);
    return NextResponse.json({ payments: [] });
  }
}
