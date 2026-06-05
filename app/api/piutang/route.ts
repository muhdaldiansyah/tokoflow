import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get invoice piutang summary
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: invoices } = await supabase
      .from("invoices")
      .select("total, paid_amount, due_date, status")
      .eq("user_id", user.id)
      .neq("status", "cancelled")
      .neq("status", "draft");

    if (!invoices) {
      return NextResponse.json({ totalOutstanding: 0, overdueCount: 0, totalInvoices: 0 });
    }

    let totalOutstanding = 0;
    let overdueCount = 0;
    const now = new Date();

    for (const inv of invoices) {
      const remaining = (inv.total || 0) - (inv.paid_amount || 0);
      if (remaining <= 0) continue;
      totalOutstanding += remaining;
      if (inv.due_date && new Date(inv.due_date) < now) overdueCount++;
    }

    return NextResponse.json({ totalOutstanding, overdueCount, totalInvoices: invoices.length });
  } catch (error) {
    console.error("Piutang API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
