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
    const { amount, method, note } = body as {
      amount?: number;
      method?: "cash" | "duitnow_manual";
      note?: string;
    };

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }
    // The order_payments.provider check constraint accepts 'cash' or
    // 'duitnow_manual' for non-Billplz channels. Default to cash — most
    // home F&B merchants take cash on delivery for installments.
    const provider = method === "duitnow_manual" ? "duitnow_manual" : "cash";

    // Get current order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("total, paid_amount, customer_id, customer_name, customer_phone")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Cap at total — over-payment is treated as paid-in-full and the
    // installment row records the actual cleared amount, not the over-tap.
    const previousPaid = order.paid_amount || 0;
    const cappedAmount = Math.min(amount, order.total - previousPaid);
    if (cappedAmount <= 0) {
      return NextResponse.json({ error: "Order already paid in full" }, { status: 400 });
    }
    const newPaidAmount = previousPaid + cappedAmount;
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

    // Append an order_payments row so the audit block can render the
    // installment timeline. Failure here is non-fatal — orders.paid_amount
    // is the source of truth; the audit row is a nice-to-have. We log and
    // continue rather than rolling back the order update.
    const { error: paymentRowError } = await supabase.from("order_payments").insert({
      order_id: id,
      user_id: user.id,
      amount: cappedAmount,
      status: "paid",
      provider,
      payer_name: order.customer_name ?? null,
      payer_phone: order.customer_phone ?? null,
      paid_at: new Date().toISOString(),
      metadata: note ? { note, source: "manual" } : { source: "manual" },
    });
    if (paymentRowError) {
      console.error("order_payments audit row insert failed:", paymentRowError);
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
