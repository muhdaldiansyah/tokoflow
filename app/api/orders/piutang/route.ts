import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get accounts receivable (piutang) summary
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all non-cancelled orders with outstanding balance
    const { data: orders, error } = await supabase
      .from("orders")
      .select("customer_id, customer_name, customer_phone, total, paid_amount")
      .eq("user_id", user.id)
      .neq("status", "cancelled")
      .gt("total", 0);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch piutang" }, { status: 500 });
    }

    // Aggregate by customer
    const customerMap = new Map<
      string,
      { customer_id: string; customer_name: string; customer_phone: string; total_debt: number; order_count: number }
    >();
    let totalDebt = 0;

    for (const order of orders || []) {
      const remaining = (order.total || 0) - (order.paid_amount || 0);
      if (remaining <= 0) continue;

      totalDebt += remaining;
      const key = order.customer_id || order.customer_phone || order.customer_name || "unknown";
      const existing = customerMap.get(key);

      if (existing) {
        existing.total_debt += remaining;
        existing.order_count++;
      } else {
        customerMap.set(key, {
          customer_id: order.customer_id || "",
          customer_name: order.customer_name || order.customer_phone || "Tanpa nama",
          customer_phone: order.customer_phone || "",
          total_debt: remaining,
          order_count: 1,
        });
      }
    }

    // Sort by debt descending
    const customers = Array.from(customerMap.values()).sort((a, b) => b.total_debt - a.total_debt);

    return NextResponse.json({
      totalDebt,
      customerCount: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Piutang API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
