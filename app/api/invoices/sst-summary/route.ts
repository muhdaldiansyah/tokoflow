import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

/**
 * GET /api/invoices/sst-summary?year=YYYY&month=MM
 *
 * SST reporting summary for a single month. Mirrors the annual /api/tax/summary
 * layout but scoped to one period, used by the /tax SST breakdown UI and by
 * the copy-for-RMCD helper.
 */
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid year/month" }, { status: 400 });
    }

    const mm = String(month).padStart(2, "0");
    const monthStart = `${year}-${mm}-01T00:00:00+08:00`;
    const next = month === 12
      ? `${year + 1}-01-01T00:00:00+08:00`
      : `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00+08:00`;

    const { data: invoices } = await supabase
      .from("invoices")
      .select(
        "subtotal, discount, total, sst_rate, sst_amount, ppn_rate, ppn_amount, paid_amount, myinvois_status, myinvois_uuid, created_at",
      )
      .eq("user_id", user.id)
      .gte("created_at", monthStart)
      .lt("created_at", next);

    let subtotalTotal = 0;
    let discountTotal = 0;
    let taxableTotal = 0;
    let sstTotal = 0;
    let grossTotal = 0;
    let paidTotal = 0;
    let submittedCount = 0;
    let validatedCount = 0;

    for (const inv of invoices ?? []) {
      const subtotal = Number(inv.subtotal ?? 0);
      const discount = Number(inv.discount ?? 0);
      const sst = Number(inv.sst_amount ?? inv.ppn_amount ?? 0);
      const gross = Number(inv.total ?? 0);
      const paid = Number(inv.paid_amount ?? 0);
      subtotalTotal += subtotal;
      discountTotal += discount;
      taxableTotal += Math.max(0, subtotal - discount);
      sstTotal += sst;
      grossTotal += gross;
      paidTotal += paid;
      if (inv.myinvois_uuid) submittedCount += 1;
      if (inv.myinvois_status === "valid") validatedCount += 1;
    }

    const outstanding = Math.max(0, grossTotal - paidTotal);

    return NextResponse.json({
      year,
      month,
      invoice_count: invoices?.length ?? 0,
      subtotal_total: subtotalTotal,
      discount_total: discountTotal,
      taxable_total: taxableTotal,
      sst_total: sstTotal,
      gross_total: grossTotal,
      paid_total: paidTotal,
      outstanding_total: outstanding,
      myinvois_submitted_count: submittedCount,
      myinvois_validated_count: validatedCount,
    });
  } catch (err) {
    console.error("SST summary API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
