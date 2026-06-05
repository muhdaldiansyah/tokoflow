import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { derivePaymentStatus } from "@/features/orders/types/order.types";

// POST - Record payment for an invoice
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

    // Get current invoice
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("total, paid_amount")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const newPaidAmount = Math.min((invoice.paid_amount || 0) + amount, invoice.total);
    const newPaymentStatus = derivePaymentStatus(newPaidAmount, invoice.total);

    const updates: Record<string, unknown> = {
      paid_amount: newPaidAmount,
      payment_status: newPaymentStatus,
      updated_at: new Date().toISOString(),
    };

    // If fully paid, also set status to paid
    if (newPaymentStatus === "paid") {
      updates.status = "paid";
    }

    const { data, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Record invoice payment API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
