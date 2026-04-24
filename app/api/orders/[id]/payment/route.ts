import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { derivePaymentStatus } from "@/features/orders/types/order.types";

// POST - Record a payment for an order
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

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }

    // Get current order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("total, paid_amount, customer_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const newPaidAmount = Math.min((order.paid_amount || 0) + amount, order.total);
    const newPaymentStatus = derivePaymentStatus(newPaidAmount, order.total);

    const { data, error } = await supabase
      .from("orders")
      .update({
        paid_amount: newPaidAmount,
        payment_status: newPaymentStatus,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
    }

    // Update customer stats if linked
    if (order.customer_id) {
      const { data: customerOrders } = await supabase
        .from("orders")
        .select("total, paid_amount")
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

    return NextResponse.json(data);
  } catch (error) {
    console.error("Record payment API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
