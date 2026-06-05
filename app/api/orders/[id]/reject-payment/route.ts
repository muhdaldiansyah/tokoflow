import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// POST - Reject a customer's payment proof for a QR order.
//
// Sends the order back to the "Menunggu bayar" bucket (awaiting_payment = true)
// and clears the claim, so it leaves the active list until the customer pays
// correctly. Reversible: a fresh receipt upload reveals it again. The merchant
// is expected to WhatsApp the customer to re-pay (handled client-side).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ awaiting_payment: true, payment_claimed_at: null })
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to reject payment" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Reject payment API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
