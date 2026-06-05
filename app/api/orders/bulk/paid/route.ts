import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// POST - Bulk mark orders as paid
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Order IDs are required" }, { status: 400 });
    }

    const { data: orders, error: fetchError } = await supabase
      .from("orders")
      .select("id, total, paid_amount, payment_status")
      .eq("user_id", user.id)
      .in("id", ids)
      .neq("status", "cancelled");

    if (fetchError || !orders) {
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    // Parallel updates — payment_status derived by trg_derive_payment_status trigger.
    // customer stats are handled by trg_recalculate_customer_stats trigger.
    const results = await Promise.all(
      orders.map((order) =>
        supabase
          .from("orders")
          .update({ paid_amount: order.total })
          .eq("id", order.id)
          .eq("user_id", user.id),
      ),
    );

    const successfulOrders = orders.filter((_, i) => !results[i].error);
    const successCount = successfulOrders.length;

    // Fire-and-forget order_status_logs for the payment timeline.
    if (successfulOrders.length > 0) {
      const now = new Date().toISOString();
      const logs = successfulOrders.map((order) => ({
        order_id: order.id,
        from_status: order.payment_status ?? "unpaid",
        to_status: "payment_paid",
        changed_by: user.id,
        changed_by_name: null,
        changed_at: now,
      }));
      supabase.from("order_status_logs").insert(logs).then(() => {});
    }

    return NextResponse.json({ successCount });
  } catch (error) {
    console.error("Bulk mark paid API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
