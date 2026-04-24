"use client";

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { getPiutangSummary, getPiutangByCustomer, type InvoicePiutangSummary, type PiutangByCustomer } from "../services/piutang.service";

export function PiutangDashboard() {
  const [summary, setSummary] = useState<InvoicePiutangSummary | null>(null);
  const [customers, setCustomers] = useState<PiutangByCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, c] = await Promise.all([getPiutangSummary(), getPiutangByCustomer()]);
      setSummary(s);
      setCustomers(c);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!summary || summary.totalOutstanding === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Tidak ada piutang faktur saat ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-foreground">RM {summary.totalOutstanding.toLocaleString("en-MY")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Piutang</p>
        </div>
        <div className="rounded-xl border bg-card shadow-sm p-4 text-center">
          <p className={`text-2xl font-bold ${summary.overdueCount > 0 ? "text-red-600" : "text-foreground"}`}>
            {summary.overdueCount}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Jatuh Tempo</p>
        </div>
      </div>

      {/* Per-customer breakdown */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="px-4 py-3 border-b">
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Per customer</p>
        </div>
        <div className="divide-y divide-border">
          {customers.map((customer, i) => (
            <div key={i} className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">{customer.buyerName}</p>
                  <p className="text-xs text-muted-foreground">{customer.invoiceCount} faktur</p>
                </div>
                <p className="text-sm font-bold text-red-600">RM {customer.totalOutstanding.toLocaleString("en-MY")}</p>
              </div>
              {/* Aging bars */}
              <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
                {customer.aging.current > 0 && (
                  <div
                    className="bg-green-400 rounded-full"
                    style={{ width: `${(customer.aging.current / customer.totalOutstanding) * 100}%` }}
                    title="0-7 hari"
                  />
                )}
                {customer.aging.week2 > 0 && (
                  <div
                    className="bg-yellow-400 rounded-full"
                    style={{ width: `${(customer.aging.week2 / customer.totalOutstanding) * 100}%` }}
                    title="8-14 hari"
                  />
                )}
                {customer.aging.month > 0 && (
                  <div
                    className="bg-orange-400 rounded-full"
                    style={{ width: `${(customer.aging.month / customer.totalOutstanding) * 100}%` }}
                    title="15-30 hari"
                  />
                )}
                {customer.aging.overMonth > 0 && (
                  <div
                    className="bg-red-500 rounded-full"
                    style={{ width: `${(customer.aging.overMonth / customer.totalOutstanding) * 100}%` }}
                    title=">30 hari"
                  />
                )}
              </div>
              <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
                {customer.aging.current > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" />0-7h</span>}
                {customer.aging.week2 > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" />8-14h</span>}
                {customer.aging.month > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" />15-30h</span>}
                {customer.aging.overMonth > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />&gt;30h</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {summary.overdueCount > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">
            {summary.overdueCount} faktur sudah jatuh tempo. Kirim pengingat via WhatsApp dari halaman detail faktur.
          </p>
        </div>
      )}
    </div>
  );
}
