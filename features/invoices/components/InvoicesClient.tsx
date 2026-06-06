"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, FileText, Loader2, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { isBisnis as _isBisnis, BISNIS_CODE } from "@/config/plans";
import { getInvoices } from "@/features/invoices/services/invoice.service";
import { InvoiceCard } from "@/features/invoices/components/InvoiceCard";
import { PiutangDashboard } from "@/features/invoices/components/PiutangDashboard";
import type { Invoice, InvoiceStatus } from "@/features/invoices/types/invoice.types";
import { track } from "@/lib/analytics";
import { copy } from "@/lib/copy";

type Tab = "invoices" | "receivables";
type FilterStatus = "all" | InvoiceStatus;

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
];

interface InvoicesClientProps {
  initialInvoices: Invoice[];
  bisnisActive: boolean;
}

export function InvoicesClient({ initialInvoices, bisnisActive }: InvoicesClientProps) {
  const [isBuying, setIsBuying] = useState(false);
  const [tab, setTab] = useState<Tab>("invoices");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    setInvoicesLoading(true);
    getInvoices({
      status: statusFilter === "all" ? undefined : statusFilter,
      search: search || undefined,
    }).then((data) => {
      setInvoices(data);
      setInvoicesLoading(false);
    });
  }, [statusFilter, search]);

  const handleBuyBisnis = useCallback(async () => {
    setIsBuying(true);
    try {
      const res = await fetch("/api/billing/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode: BISNIS_CODE }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Could not create payment");
        setIsBuying(false);
        return;
      }
      const { url } = await res.json();
      if (!url) {
        toast.error("No payment URL returned");
        setIsBuying(false);
        return;
      }
      track("bisnis_purchase_started", {});
      window.location.href = url;
    } catch {
      toast.error("Something went wrong while starting payment");
      setIsBuying(false);
    }
  }, []);

  const allInvoices = initialInvoices;
  const totalValue = allInvoices.reduce((s, i) => s + (i.total ?? 0), 0);
  const totalCollected = allInvoices.reduce((s, i) => s + (i.paid_amount ?? 0), 0);
  const totalOutstanding = totalValue - totalCollected;
  const overdueCount = allInvoices.filter((i) => i.status === "overdue").length;

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,780px)_360px] md:items-start xl:justify-center">
      <div className="min-w-0 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between min-h-9">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Invoices</h1>
          <p className="text-xs text-muted-foreground">
            Invoices, receivables, and DJP MyInvois submissions
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-warm-green text-white text-xs font-medium hover:bg-warm-green/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New invoice
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("invoices")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "invoices"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Invoice list
        </button>
        <button
          onClick={() => setTab("receivables")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "receivables"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Receivables
        </button>
      </div>

      {/* Pro upgrade banner — only shown to non-Pro merchants with existing invoices */}
      {tab === "invoices" && !bisnisActive && invoices.length > 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 flex items-center justify-between gap-3">
          <p className="text-xs text-blue-800 flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Upgrade to <span className="font-semibold">Pro</span> to submit invoices to DJP
              MyInvois with one click.
            </span>
          </p>
          <button
            onClick={handleBuyBisnis}
            disabled={isBuying}
            className="shrink-0 h-7 px-3 text-xs font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isBuying ? <Loader2 className="w-3 h-3 animate-spin" /> : "Rp 99.000/bln"}
          </button>
        </div>
      )}

      {tab === "invoices" ? (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
            />
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`h-7 px-2.5 text-xs font-medium rounded-full border transition-colors ${
                  statusFilter === f.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Invoice list */}
          {invoicesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== "all"
                  ? copy.empty.invoicesNoMatch()
                  : copy.empty.invoices()}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card shadow-sm divide-y divide-border">
              {invoices.map((inv) => (
                <InvoiceCard key={inv.id} invoice={inv} />
              ))}
            </div>
          )}
        </>
      ) : (
        <PiutangDashboard />
      )}
      </div>

      <aside className="hidden md:block">
        <div className="sticky top-4 space-y-3">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Summary</p>
            </div>
            <div className="p-4 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Invoices</span>
                <span className="tabular-nums text-foreground">{allInvoices.length}</span>
              </div>
              {totalValue > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total value</span>
                  <span className="tabular-nums text-foreground font-medium">Rp {totalValue.toLocaleString("id-ID")}</span>
                </div>
              )}
              {totalCollected > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Collected</span>
                  <span className="tabular-nums text-foreground">Rp {totalCollected.toLocaleString("id-ID")}</span>
                </div>
              )}
              {totalOutstanding > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-warm-rose">Outstanding</span>
                  <span className="tabular-nums text-warm-rose font-medium">Rp {totalOutstanding.toLocaleString("id-ID")}</span>
                </div>
              )}
              {overdueCount > 0 && (
                <div className="flex items-center justify-between text-sm border-t pt-1.5 mt-1.5">
                  <span className="text-warm-rose">Overdue</span>
                  <span className="tabular-nums text-warm-rose">{overdueCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

    </div>
  );
}
