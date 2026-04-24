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

    // Get orders to calculate amounts
    const { data: orders, error: fetchError } = await supabase
      .from("orders")
      .select("id, total, paid_amount, customer_id")
      .eq("user_id", user.id)
      .in("id", ids)
      .neq("status", "cancelled");

    if (fetchError || !orders) {
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    let successCount = 0;

    for (const order of orders) {
      const { error } = await supabase
        .from("orders")
        .update({
          paid_amount: order.total,
          payment_status: "paid",
        })
        .eq("id", order.id)
        .eq("user_id", user.id);

      if (!error) {
        successCount++;

        // Update customer stats
        if (order.customer_id) {
          const { data: customerOrders } = await supabase
            .from("orders")
            .select("paid_amount")
            .eq("customer_id", order.customer_id)
            .eq("user_id", user.id);

          if (customerOrders) {
            const totalSpent = customerOrders.reduce(
              (sum: number, o: { paid_amount: number }) => sum + (o.paid_amount || 0),
              0
            );
            await supabase
              .from("customers")
              .update({ total_spent: totalSpent })
              .eq("id", order.customer_id);
          }
        }
      }
    }

    return NextResponse.json({ successCount });
  } catch (error) {
    console.error("Bulk mark paid API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
