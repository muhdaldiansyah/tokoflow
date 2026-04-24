import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

/**
 * GET /api/tax/summary?year=YYYY
 *
 * Annual tax overview for the merchant, Malaysia-localised:
 *   - revenue YTD (from non-cancelled orders)
 *   - SST collected YTD (from invoices)
 *   - MyInvois submission stats (pending / submitted / valid / invalid)
 *   - SST threshold warning (RM 500,000/year → SST registration required)
 *
 * Used by /tax and as the data source for reminder copy.
 */

// Annual turnover threshold above which a merchant must register for SST
// (service tax). Goods-side SST threshold differs by category; we surface
// the lower service-tax threshold because most Tokoflow merchants sell
// services or mixed-category.
const SST_REGISTRATION_THRESHOLD_MYR = 500_000;

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    if (!Number.isFinite(year) || year < 2020 || year > 2100) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const yearStart = `${year}-01-01T00:00:00+08:00`;
    const yearEnd = `${year + 1}-01-01T00:00:00+08:00`;

    // Revenue — count non-cancelled orders. Matches the semantics used by
    // rekap / dashboard metrics elsewhere.
    const { data: orders } = await supabase
      .from("orders")
      .select("total, created_at")
      .eq("user_id", user.id)
      .not("status", "eq", "cancelled")
      .is("deleted_at", null)
      .gte("created_at", yearStart)
      .lt("created_at", yearEnd);

    // Invoices — pull SST + MyInvois status for the same window.
    const { data: invoices } = await supabase
      .from("invoices")
      .select(
        "total, subtotal, discount, sst_rate, sst_amount, ppn_rate, ppn_amount, status, myinvois_status, myinvois_uuid, created_at",
      )
      .eq("user_id", user.id)
      .gte("created_at", yearStart)
      .lt("created_at", yearEnd);

    // Profile — TIN/BRN/SST reg state for the upsell panel.
    const { data: profile } = await supabase
      .from("profiles")
      .select("tin, brn, sst_registration_id, bisnis_until")
      .eq("id", user.id)
      .single();

    // Monthly breakdown: revenue + sst_collected.
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0,
      invoice_count: 0,
      sst_collected: 0,
    }));

    let revenueYtd = 0;
    let sstYtd = 0;

    for (const o of orders ?? []) {
      const m = new Date(o.created_at).getUTCMonth();
      const rev = Number(o.total ?? 0);
      months[m].revenue += rev;
      revenueYtd += rev;
    }
    for (const inv of invoices ?? []) {
      const m = new Date(inv.created_at).getUTCMonth();
      // Prefer sst_amount, fall back to ppn_amount for pre-077 rows.
      const sst = Number(inv.sst_amount ?? inv.ppn_amount ?? 0);
      months[m].sst_collected += sst;
      months[m].invoice_count += 1;
      sstYtd += sst;
    }

    // MyInvois stats across the year's invoices.
    const myInvoisStats = {
      total: invoices?.length ?? 0,
      submitted: 0,
      validated: 0,
      pending: 0,
      rejected: 0,
      not_submitted: 0,
    };
    for (const inv of invoices ?? []) {
      if (!inv.myinvois_uuid) {
        myInvoisStats.not_submitted += 1;
        continue;
      }
      const s = (inv.myinvois_status as string | null) ?? null;
      if (s === "valid") myInvoisStats.validated += 1;
      else if (s === "submitted" || s === "pending") myInvoisStats.pending += 1;
      else if (s === "invalid" || s === "rejected") myInvoisStats.rejected += 1;
      else myInvoisStats.submitted += 1;
    }

    const sstThresholdReached = revenueYtd >= SST_REGISTRATION_THRESHOLD_MYR;
    const sstRegistrationMissing = sstThresholdReached && !profile?.sst_registration_id;
    const proActive = !!profile?.bisnis_until && new Date(profile.bisnis_until) > new Date();

    return NextResponse.json({
      year,
      revenue_ytd: revenueYtd,
      sst_collected_ytd: sstYtd,
      sst_registration_threshold_myr: SST_REGISTRATION_THRESHOLD_MYR,
      sst_threshold_reached: sstThresholdReached,
      sst_registration_required: sstRegistrationMissing,
      months,
      myinvois: myInvoisStats,
      merchant: {
        tin: profile?.tin ?? null,
        brn: profile?.brn ?? null,
        sst_registration_id: profile?.sst_registration_id ?? null,
        pro_active: proActive,
      },
    });
  } catch (err) {
    console.error("Tax summary API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
