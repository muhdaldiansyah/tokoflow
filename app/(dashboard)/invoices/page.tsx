"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, FileText, Loader2, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { getProfile } from "@/features/receipts/services/receipt.service";
import { isBisnis, BISNIS_CODE, BISNIS_PRICE } from "@/config/plans";
import { getInvoices } from "@/features/invoices/services/invoice.service";
import { InvoiceCard } from "@/features/invoices/components/InvoiceCard";
import { PiutangDashboard } from "@/features/invoices/components/PiutangDashboard";
import type { Invoice, InvoiceStatus } from "@/features/invoices/types/invoice.types";
import type { Profile } from "@/features/receipts/types/receipt.types";
import { track } from "@/lib/analytics";

type Tab = "invoices" | "receivables";
type FilterStatus = "all" | InvoiceStatus;

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
];

export default function InvoicesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [tab, setTab] = useState<Tab>("invoices");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await getProfile();
      setProfile(p);
      setIsLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!profile) return;
    async function loadInvoices() {
      setInvoicesLoading(true);
      const data = await getInvoices({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
      });
      setInvoices(data);
      setInvoicesLoading(false);
    }
    loadInvoices();
  }, [profile, statusFilter, search]);

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

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-7 w-32 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  const bisnisActive = profile ? isBisnis(profile) : false;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Invoices, receivables, and LHDN MyInvois submissions
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
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
              Upgrade to <span className="font-semibold">Pro</span> to submit invoices to LHDN
              MyInvois with one click.
            </span>
          </p>
          <button
            onClick={handleBuyBisnis}
            disabled={isBuying}
            className="shrink-0 h-7 px-3 text-xs font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isBuying ? <Loader2 className="w-3 h-3 animate-spin" /> : `RM ${BISNIS_PRICE}/mo`}
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
                  ? "No matching invoices."
                  : "No invoices yet. Create your first invoice!"}
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
  );
}
