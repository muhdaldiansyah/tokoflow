import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

const BRANDING = "\n\n_Dibuat dengan Tokoflow — tokoflow.com_";
const DAY_OFFSETS = [1, 3, 7];

function buildReminderMessage(
  customerName: string,
  outstanding: number,
  orderNumber: string,
  dayOffset: number
): string {
  const amount = `RM ${outstanding.toLocaleString("en-MY")}`;
  const urgency =
    dayOffset === 1 ? "Ini pengingat"
    : dayOffset === 3 ? "Ini pengingat kedua"
    : "Ini pengingat terakhir";

  return `Halo ${customerName},\n\n${urgency} bahwa ada sisa pembayaran sebesar *${amount}* untuk pesanan *${orderNumber}*.\n\nMohon segera melakukan pembayaran ya. Terima kasih! 🙏${BRANDING}`;
}

// POST - Schedule order reminders (1, 3, 7 day offsets)
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

    // Fetch the order
    const { data: order } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, total, paid_amount, status")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Skip if paid, cancelled, or no phone
    const outstanding = (order.total || 0) - (order.paid_amount || 0);
    if (outstanding <= 0 || order.status === "cancelled" || !order.customer_phone) {
      return NextResponse.json({ success: true, scheduled: 0 });
    }

    const customerName = order.customer_name || order.customer_phone;

    // Check existing pending reminders for this order
    const { data: existing } = await supabase
      .from("reminders")
      .select("day_offset")
      .eq("order_id", orderId)
      .eq("status", "pending");

    const existingOffsets = new Set((existing || []).map((r: { day_offset: number }) => r.day_offset));

    const now = new Date();
    const remindersToInsert = [];

    for (const offset of DAY_OFFSETS) {
      if (existingOffsets.has(offset)) continue;

      const scheduledAt = new Date(now);
      scheduledAt.setDate(scheduledAt.getDate() + offset);
      scheduledAt.setHours(9, 0, 0, 0);

      remindersToInsert.push({
        order_id: orderId,
        reminder_type: "order",
        day_offset: offset,
        scheduled_at: scheduledAt.toISOString(),
        status: "pending",
        message_text: buildReminderMessage(customerName, outstanding, order.order_number, offset),
      });
    }

    if (remindersToInsert.length > 0) {
      await supabase.from("reminders").insert(remindersToInsert);
    }

    return NextResponse.json({ success: true, scheduled: remindersToInsert.length });
  } catch (error) {
    console.error("Schedule order reminders API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
