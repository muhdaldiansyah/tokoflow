import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { TaxClient } from "@/features/tax/components/TaxClient";
import type { TaxSummary, SstMonthlySummary } from "@/features/tax/types/tax.types";

// Indonesia PKP (PPN) registration threshold: Rp 4.8 billion/year omzet.
// (Field is still named *_myr for backward-compat with the TaxSummary type.)
const SST_REGISTRATION_THRESHOLD_MYR = 4_800_000_000;

export default async function TaxPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const sstMonth = `${year}-${String(month).padStart(2, "0")}`;

  const yearStart = `${year}-01-01T00:00:00+08:00`;
  const yearEnd = `${year + 1}-01-01T00:00:00+08:00`;
  const mm = String(month).padStart(2, "0");
  const monthStart = `${year}-${mm}-01T00:00:00+08:00`;
  const monthEnd =
    month === 12
      ? `${year + 1}-01-01T00:00:00+08:00`
      : `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00+08:00`;

  const supabase = await createClient();

  const [
    { data: orders },
    { data: invoices },
    { data: profile },
    { data: monthInvoices },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total, created_at")
      .eq("user_id", user.id)
      // exclude awaiting-payment QR ghosts (migration 109)
      .eq("awaiting_payment", false)
      .not("status", "eq", "cancelled")
      .is("deleted_at", null)
      .gte("created_at", yearStart)
      .lt("created_at", yearEnd),
    supabase
      .from("invoices")
      .select(
        "total, subtotal, discount, sst_rate, sst_amount, ppn_rate, ppn_amount, status, myinvois_status, myinvois_uuid, created_at",
      )
      .eq("user_id", user.id)
      .gte("created_at", yearStart)
      .lt("created_at", yearEnd),
    supabase
      .from("profiles")
      .select("tin, brn, sst_registration_id, bisnis_until")
      .eq("id", user.id)
      .single(),
    supabase
      .from("invoices")
      .select(
        "subtotal, discount, total, sst_amount, ppn_amount, paid_amount, myinvois_status, myinvois_uuid",
      )
      .eq("user_id", user.id)
      .gte("created_at", monthStart)
      .lt("created_at", monthEnd),
  ]);

  // Build annual tax summary
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
    const sst = Number(inv.sst_amount ?? inv.ppn_amount ?? 0);
    months[m].sst_collected += sst;
    months[m].invoice_count += 1;
    sstYtd += sst;
  }

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
  const proActive =
    !!profile?.bisnis_until && new Date(profile.bisnis_until) > new Date();

  const summary: TaxSummary = {
    year,
    revenue_ytd: revenueYtd,
    sst_collected_ytd: sstYtd,
    sst_registration_threshold_myr: SST_REGISTRATION_THRESHOLD_MYR,
    sst_threshold_reached: sstThresholdReached,
    sst_registration_required: sstThresholdReached && !profile?.sst_registration_id,
    months,
    myinvois: myInvoisStats,
    merchant: {
      tin: profile?.tin ?? null,
      brn: profile?.brn ?? null,
      sst_registration_id: profile?.sst_registration_id ?? null,
      pro_active: proActive,
    },
  };

  // Build monthly SST summary
  let monthlySst: SstMonthlySummary | null = null;
  if (monthInvoices && monthInvoices.length > 0) {
    let subtotalTotal = 0,
      discountTotal = 0,
      taxableTotal = 0,
      sstTotal = 0,
      grossTotal = 0,
      paidTotal = 0,
      submittedCount = 0,
      validatedCount = 0;

    for (const inv of monthInvoices) {
      const subtotal = Number((inv as { subtotal?: number }).subtotal ?? 0);
      const discount = Number((inv as { discount?: number }).discount ?? 0);
      const sst = Number(inv.sst_amount ?? inv.ppn_amount ?? 0);
      const gross = Number((inv as { total?: number }).total ?? 0);
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

    monthlySst = {
      year,
      month,
      invoice_count: monthInvoices.length,
      subtotal_total: subtotalTotal,
      discount_total: discountTotal,
      taxable_total: taxableTotal,
      sst_total: sstTotal,
      gross_total: grossTotal,
      paid_total: paidTotal,
      outstanding_total: Math.max(0, grossTotal - paidTotal),
      myinvois_submitted_count: submittedCount,
      myinvois_validated_count: validatedCount,
    };
  }

  return (
    <TaxClient
      initialSummary={summary}
      initialMonthlySst={monthlySst}
      initialYear={year}
      initialSstMonth={sstMonth}
    />
  );
}
