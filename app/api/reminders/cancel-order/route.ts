import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// POST - Cancel all pending reminders for an order
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("reminders")
      .update({ status: "cancelled" })
      .eq("order_id", orderId)
      .eq("status", "pending");

    if (error) {
      return NextResponse.json({ error: "Failed to cancel reminders" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel order reminders API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
