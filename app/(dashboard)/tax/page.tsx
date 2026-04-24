"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, Copy, ShieldCheck } from "lucide-react";
import { track } from "@/lib/analytics";
import { getTaxSummary, getSstMonthlySummary } from "@/features/tax/services/tax.service";
import type { TaxSummary, SstMonthlySummary } from "@/features/tax/types/tax.types";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function rm(n: number) {
  return `RM ${n.toLocaleString("en-MY", { maximumFractionDigits: 2 })}`;
}

export default function PajakPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [sstMonth, setSstMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [monthlySst, setMonthlySst] = useState<SstMonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const s = await getTaxSummary(year);
      setSummary(s);
      setLoading(false);
      if (s) {
        track("pajak_viewed", { year, revenueYtd: s.revenue_ytd });
      }
    }
    load();
  }, [year]);

  useEffect(() => {
    async function load() {
      setMonthlyLoading(true);
      const [y, m] = sstMonth.split("-").map(Number);
      const data = await getSstMonthlySummary(y, m);
      setMonthlySst(data);
      setMonthlyLoading(false);
    }
    load();
  }, [sstMonth]);

  const currentMonth = new Date().getMonth() + 1;

  const progressPct = useMemo(() => {
    if (!summary) return 0;
    return Math.min(
      100,
      Math.round((summary.revenue_ytd / summary.sst_registration_threshold_myr) * 100),
    );
  }, [summary]);

  if (loading || !summary) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-7 w-32 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
        <div className="h-60 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  const taxIdentityMissing = !summary.merchant.tin || !summary.merchant.brn;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Tax</h1>
          <p className="text-sm text-muted-foreground">
            Revenue, SST, and LHDN MyInvois submissions for {year}
          </p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="h-9 px-3 bg-card border rounded-lg shadow-sm text-sm"
        >
          {[new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Tax identity banner */}
      {taxIdentityMissing && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
          <div className="flex-1 text-sm text-amber-900">
            <p className="font-semibold">Tax identity incomplete</p>
            <p className="text-xs mt-1">
              Add your TIN and BRN in{" "}
              <Link href="/settings" className="underline font-medium">
                Settings → Tax identity
              </Link>{" "}
              to enable LHDN MyInvois submission.
            </p>
          </div>
        </div>
      )}

      {/* Revenue YTD + SST threshold */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Revenue {year}</p>
          {summary.sst_threshold_reached ? (
            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              SST registration threshold crossed
            </span>
          ) : (
            <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              Below SST threshold
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{rm(summary.revenue_ytd)}</span>
            <span>{rm(summary.sst_registration_threshold_myr)}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                summary.sst_threshold_reached ? "bg-amber-500" : "bg-green-500"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {!summary.sst_threshold_reached && (
            <p className="text-xs text-muted-foreground">
              {rm(summary.sst_registration_threshold_myr - summary.revenue_ytd)} remaining before
              the SST registration threshold
            </p>
          )}
        </div>

        {/* Monthly revenue grid */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {summary.months
            .filter((m) => m.month <= currentMonth || m.revenue > 0)
            .map((m) => (
              <div key={m.month} className="text-center">
                <p className="text-xs text-muted-foreground">{MONTH_NAMES[m.month - 1]}</p>
                <p className="text-xs font-medium">
                  {m.revenue > 0 ? rm(m.revenue) : "-"}
                </p>
              </div>
            ))}
        </div>

        <p className="text-xs text-muted-foreground pt-1">
          Threshold applies to taxable services (RMCD). Goods thresholds differ by category.
        </p>

        {summary.sst_registration_required && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            You&apos;ve crossed RM 500,000 in annual revenue but haven&apos;t added an SST
            registration id yet. Register with RMCD and update{" "}
            <Link href="/settings" className="underline">
              Settings → Tax identity
            </Link>
            .
          </div>
        )}
      </div>

      {/* SST YTD */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-2">
        <p className="text-sm font-semibold">SST collected {year}</p>
        <p className="text-2xl font-bold">{rm(summary.sst_collected_ytd)}</p>
        <p className="text-xs text-muted-foreground">
          Only includes invoices issued this year. Adjust the default rate in Settings.
        </p>
      </div>

      {/* MyInvois stats */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-warm-green" />
          <p className="text-sm font-semibold">LHDN MyInvois {year}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Validated</p>
            <p className="text-xl font-bold text-green-700">{summary.myinvois.validated}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Not submitted</p>
            <p className="text-xl font-bold text-amber-700">{summary.myinvois.not_submitted}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Pending validation</p>
            <p className="text-xl font-bold text-blue-700">
              {summary.myinvois.pending + summary.myinvois.submitted}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Invalid / rejected</p>
            <p className="text-xl font-bold text-red-700">{summary.myinvois.rejected}</p>
          </div>
        </div>
        <Link
          href="/invoices"
          className="inline-flex items-center text-xs font-medium text-warm-green hover:underline"
        >
          Review invoices →
        </Link>
      </div>

      {/* Monthly SST summary (RMCD SST-02 reference) */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Monthly SST summary</p>
          <input
            type="month"
            value={sstMonth}
            onChange={(e) => setSstMonth(e.target.value)}
            className="h-9 px-3 bg-card border rounded-lg shadow-sm text-sm"
          />
        </div>

        {monthlyLoading ? (
          <div className="h-20 rounded-xl bg-muted animate-pulse" />
        ) : !monthlySst || monthlySst.invoice_count === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices in this period.</p>
        ) : (
          <>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoices</span>
                <span className="font-medium">{monthlySst.invoice_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxable value</span>
                <span className="font-medium">{rm(monthlySst.taxable_total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SST collected</span>
                <span className="font-medium">{rm(monthlySst.sst_total)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Gross total</span>
                <span>{rm(monthlySst.gross_total)}</span>
              </div>
              <div className="flex justify-between text-xs border-t pt-1.5">
                <span className="text-muted-foreground">Collected (paid)</span>
                <span className="text-green-700 font-medium">
                  {rm(monthlySst.paid_total)}
                </span>
              </div>
              {monthlySst.outstanding_total > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Outstanding</span>
                  <span className="text-red-700 font-medium">
                    {rm(monthlySst.outstanding_total)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs border-t pt-1.5">
                <span className="text-muted-foreground">MyInvois submitted</span>
                <span className="font-medium">
                  {monthlySst.myinvois_submitted_count}/{monthlySst.invoice_count}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                const [y, m] = sstMonth.split("-").map(Number);
                const monthName = new Date(y, m - 1).toLocaleDateString("en-MY", {
                  month: "long",
                });
                const lines = [
                  `Tokoflow — SST summary ${monthName} ${y}`,
                  `Merchant TIN: ${summary.merchant.tin || "-"}`,
                  `SST registration: ${summary.merchant.sst_registration_id || "-"}`,
                  ``,
                  `Invoices: ${monthlySst.invoice_count}`,
                  `Taxable value: ${rm(monthlySst.taxable_total)}`,
                  `SST collected: ${rm(monthlySst.sst_total)}`,
                  `Gross total: ${rm(monthlySst.gross_total)}`,
                  `Collected (paid): ${rm(monthlySst.paid_total)}`,
                  `Outstanding: ${rm(monthlySst.outstanding_total)}`,
                  `MyInvois submitted: ${monthlySst.myinvois_submitted_count}/${monthlySst.invoice_count}`,
                ];
                navigator.clipboard.writeText(lines.join("\n"));
                toast.success("SST summary copied — paste into MySST / RMCD SST-02");
                track("sst_summary_copied", { year: y, month: m });
              }}
              className="w-full h-10 rounded-lg border bg-card hover:bg-muted transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy for RMCD SST-02
            </button>

            <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
              File your SST-02 return at <span className="font-semibold">mysst.customs.gov.my</span>
              {" "}— SST is filed bi-monthly in Malaysia.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
