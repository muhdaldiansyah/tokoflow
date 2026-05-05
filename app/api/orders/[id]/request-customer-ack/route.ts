import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// POST /api/orders/[id]/request-customer-ack
//
// Returns the customer-facing ack URL for an order. Generates the token
// lazily (idempotent — repeat calls return the existing token). Only the
// merchant who owns the order can request a token. Status must be
// "shipped" or "done": asking for receipt confirmation before the
// merchant has handed the order off to the courier doesn't make sense.
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

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, customer_ack_token, customer_ack_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "shipped" && order.status !== "done") {
      return NextResponse.json(
        { error: "Order must be shipped before requesting confirmation" },
        { status: 400 }
      );
    }

    let token: string = order.customer_ack_token;
    if (!token) {
      token = randomUUID();
      const { error: updateError } = await supabase
        .from("orders")
        .update({ customer_ack_token: token })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to generate ack token" },
          { status: 500 }
        );
      }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name")
      .eq("id", user.id)
      .single();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tokoflow.com";
    const ackUrl = `${baseUrl}/a/${token}`;

    return NextResponse.json({
      ackUrl,
      businessName: profile?.business_name ?? null,
      alreadyAcked: order.customer_ack_at !== null,
    });
  } catch (error) {
    console.error("Request customer ack API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
