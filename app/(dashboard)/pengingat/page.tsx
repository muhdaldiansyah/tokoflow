import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { RemindersClient } from "@/features/orders/components/RemindersClient";
import type { ReminderWithSource } from "@/features/receipts/types/receipt.types";

export default async function RemindersPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [{ data: orderReminders }, { data: receiptReminders }] = await Promise.all([
    supabase
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
      .order("scheduled_at", { ascending: true }),
    supabase
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
      .order("scheduled_at", { ascending: true }),
  ]);

  const reminders = [
    ...(orderReminders ?? []),
    ...(receiptReminders ?? []),
  ].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
  ) as ReminderWithSource[];

  return <RemindersClient initialReminders={reminders} />;
}
