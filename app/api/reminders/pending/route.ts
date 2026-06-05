import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get all pending reminders (both order and receipt)
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch pending order reminders
    const { data: orderReminders } = await supabase
      .from("reminders")
      .select(`
        *,
        order:orders!reminders_order_id_fkey (
          order_number,
          customer_name,
          customer_phone,
          total,
          paid_amount
        )
      `)
      .eq("status", "pending")
      .not("order_id", "is", null)
      .order("scheduled_at", { ascending: true });

    // Fetch pending receipt reminders
    const { data: receiptReminders } = await supabase
      .from("reminders")
      .select(`
        *,
        receipt:receipts!reminders_receipt_id_fkey (
          receipt_number,
          customer_name,
          customer_phone,
          total
        )
      `)
      .eq("status", "pending")
      .not("receipt_id", "is", null)
      .order("scheduled_at", { ascending: true });

    // Merge and sort
    const all = [
      ...(orderReminders || []),
      ...(receiptReminders || []),
    ].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

    return NextResponse.json(all);
  } catch (error) {
    console.error("Pending reminders API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
