import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cron job: Auto-mark overdue invoices + log for WA reminder
// Called daily by Vercel Cron or external scheduler
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date().toISOString();

  // Find invoices past due_date that are not yet marked overdue
  const { data: overdueInvoices, error } = await supabase
    .from("invoices")
    .select("id, user_id, invoice_number, buyer_name, buyer_phone, total, paid_amount, due_date")
    .in("status", ["sent"])
    .lt("due_date", now)
    .gt("due_date", "2000-01-01"); // has due_date

  if (error) {
    console.error("Error fetching overdue invoices:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  let updatedCount = 0;

  for (const inv of overdueInvoices || []) {
    const remaining = (inv.total || 0) - (inv.paid_amount || 0);
    if (remaining <= 0) continue;

    // Mark as overdue
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ status: "overdue", updated_at: now })
      .eq("id", inv.id);

    if (!updateError) updatedCount++;
  }

  return NextResponse.json({
    message: "OK",
    checked: overdueInvoices?.length || 0,
    updated: updatedCount,
  });
}
