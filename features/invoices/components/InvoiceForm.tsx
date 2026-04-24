"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type {
  CreateInvoiceInput,
  InvoiceItem,
  PaymentTerms,
  Invoice,
  MyInvoisStatus,
} from "../types/invoice.types";
import {
  MYINVOIS_INDIVIDUAL_THRESHOLD_MYR,
  MYINVOIS_STATUS_LABELS,
  PAYMENT_TERMS_LABELS,
  PAYMENT_TERMS_DAYS,
} from "../types/invoice.types";
import { createInvoice, updateInvoice } from "../services/invoice.service";
import { track } from "@/lib/analytics";

interface InvoiceFormProps {
  prefill?: CreateInvoiceInput;
  existingInvoice?: Invoice;
}

type ProfileSnapshot = {
  default_sst_rate?: number | null;
  bisnis_until?: string | null;
  tin?: string | null;
  brn?: string | null;
};

const SST_OPTIONS: Array<{ rate: 0 | 6; label: string; hint: string }> = [
  { rate: 0, label: "0%", hint: "Exempt / zero-rated goods" },
  { rate: 6, label: "6%", hint: "Service tax (F&B, services, digital)" },
];

// Phone helpers — Malaysian mobile numbers are 10-11 digits after the country
// code (e.g. +60 12 345 6789). Store as the local portion (no leading 0, no
// country code) so downstream code can normalise when needed.
function stripMyPhonePrefix(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("60")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function terminalMyInvoisStatus(status: MyInvoisStatus | null | undefined) {
  return (
    status === "valid"
    || status === "invalid"
    || status === "cancelled"
    || status === "rejected"
  );
}

export function InvoiceForm({ prefill, existingInvoice }: InvoiceFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileSnapshot | null>(null);

  // Buyer identity
  const [buyerName, setBuyerName] = useState(
    prefill?.buyer_name || existingInvoice?.buyer_name || "",
  );
  const [buyerAddress, setBuyerAddress] = useState(
    prefill?.buyer_address || existingInvoice?.buyer_address || "",
  );
  const [buyerPhone, setBuyerPhone] = useState(
    stripMyPhonePrefix(prefill?.buyer_phone || existingInvoice?.buyer_phone || ""),
  );
  const [buyerTin, setBuyerTin] = useState(
    prefill?.buyer_tin || existingInvoice?.buyer_tin || "",
  );
  const [buyerBrn, setBuyerBrn] = useState(
    prefill?.buyer_brn || existingInvoice?.buyer_brn || "",
  );
  const [buyerSstId, setBuyerSstId] = useState(
    prefill?.buyer_sst_id || existingInvoice?.buyer_sst_id || "",
  );

  const [items, setItems] = useState<InvoiceItem[]>(
    prefill?.items
      || existingInvoice?.items
      || [{ name: "", price: 0, qty: 1 }],
  );
  const [discount, setDiscount] = useState(
    prefill?.discount ?? existingInvoice?.discount ?? 0,
  );

  // SST rate resolution — request → existing invoice → profile default → 0.
  const [sstRate, setSstRate] = useState<0 | 6>(() => {
    const existing = existingInvoice?.sst_rate ?? existingInvoice?.ppn_rate;
    if (existing === 0 || existing === 6) return existing;
    if (prefill?.sst_rate === 0 || prefill?.sst_rate === 6) return prefill.sst_rate;
    return 0;
  });

  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(
    prefill?.payment_terms || existingInvoice?.payment_terms || "COD",
  );
  const [dueDate, setDueDate] = useState(
    prefill?.due_date || existingInvoice?.due_date
      ? new Date(
          (prefill?.due_date || existingInvoice?.due_date) as string,
        )
          .toISOString()
          .split("T")[0]
      : "",
  );
  const [notes, setNotes] = useState(
    prefill?.notes || existingInvoice?.notes || "",
  );

  // MyInvois state is only meaningful in edit mode on a persisted invoice.
  const [myInvoisStatus, setMyInvoisStatus] = useState<MyInvoisStatus | null>(
    (existingInvoice?.myinvois_status as MyInvoisStatus | null | undefined) ?? null,
  );
  const [myInvoisUuid, setMyInvoisUuid] = useState<string | null>(
    existingInvoice?.myinvois_uuid ?? null,
  );
  const [myInvoisLongId, setMyInvoisLongId] = useState<string | null>(
    existingInvoice?.myinvois_long_id ?? null,
  );
  const [myInvoisSubmitting, setMyInvoisSubmitting] = useState(false);
  const [myInvoisPolling, setMyInvoisPolling] = useState(false);

  // Load profile once — gives us default_sst_rate + bisnis_until for Pro gate
  // + the merchant's own TIN / BRN (used to validate MyInvois prerequisites).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data = (await res.json()) as ProfileSnapshot;
        if (cancelled) return;
        setProfile(data);
        // Seed the SST rate from the merchant default only when the form has
        // no opinion yet (new invoice with no prefill rate, no existing row).
        const hasExplicitRate =
          existingInvoice?.sst_rate !== undefined
          || prefill?.sst_rate !== undefined;
        if (!hasExplicitRate && (data.default_sst_rate === 0 || data.default_sst_rate === 6)) {
          setSstRate(data.default_sst_rate);
        }
      } catch {
        // Non-blocking — form still works without the profile.
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-calculate due date from payment terms
  useEffect(() => {
    if (paymentTerms === "custom") return;
    const days = PAYMENT_TERMS_DAYS[paymentTerms];
    if (days !== null && days > 0) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      setDueDate(d.toISOString().split("T")[0]);
    } else if (days === 0) {
      setDueDate("");
    }
  }, [paymentTerms]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const taxable = Math.max(0, subtotal - discount);
  const sstAmount = Math.round((taxable * sstRate) / 100);
  const total = taxable + sstAmount;

  const bisnisActive = useMemo(() => {
    const until = profile?.bisnis_until;
    return !!until && new Date(until) > new Date();
  }, [profile?.bisnis_until]);

  const requiresIndividualWithoutTin =
    total >= MYINVOIS_INDIVIDUAL_THRESHOLD_MYR && !buyerTin.trim();

  // Poll MyInvois status until it reaches a terminal state (≤2 minutes).
  useEffect(() => {
    if (!existingInvoice?.id) return;
    if (!myInvoisUuid) return;
    if (terminalMyInvoisStatus(myInvoisStatus)) return;
    if (!myInvoisPolling) return;

    let cancelled = false;
    const started = Date.now();
    const timer = setInterval(async () => {
      if (cancelled) return;
      if (Date.now() - started > 120_000) {
        clearInterval(timer);
        setMyInvoisPolling(false);
        return;
      }
      try {
        const res = await fetch(`/api/invoices/${existingInvoice.id}/myinvois-status`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.status && data.status !== "not_submitted") {
          setMyInvoisStatus(data.status as MyInvoisStatus);
          if (data.longId) setMyInvoisLongId(data.longId);
          if (terminalMyInvoisStatus(data.status)) {
            clearInterval(timer);
            setMyInvoisPolling(false);
            if (data.status === "valid") {
              toast.success("MyInvois validated by LHDN");
            } else if (data.status === "invalid" || data.status === "rejected") {
              toast.error(`MyInvois ${data.status}`);
            }
          }
        }
      } catch {
        // Network hiccup — next tick will retry.
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [existingInvoice?.id, myInvoisUuid, myInvoisStatus, myInvoisPolling]);

  function addItem() {
    setItems([...items, { name: "", price: 0, qty: 1 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  async function handleSave(status: "draft" | "sent") {
    if (items.length === 0 || items.every((i) => !i.name)) {
      toast.error("Add at least one item");
      return;
    }
    if (!buyerName.trim()) {
      toast.error("Buyer name is required");
      return;
    }

    setIsSaving(true);

    const cleanItems = items.filter((i) => i.name.trim());

    const input: CreateInvoiceInput = {
      order_id: prefill?.order_id,
      customer_id: prefill?.customer_id,
      buyer_name: buyerName.trim(),
      buyer_address: buyerAddress.trim(),
      buyer_phone: buyerPhone.trim(),
      buyer_tin: buyerTin.trim(),
      buyer_brn: buyerBrn.trim(),
      buyer_sst_id: buyerSstId.trim(),
      items: cleanItems,
      discount,
      sst_rate: sstRate,
      payment_terms: paymentTerms,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      notes: notes.trim(),
      status,
    };

    const result = existingInvoice
      ? await updateInvoice(existingInvoice.id, {
          buyer_name: input.buyer_name,
          buyer_address: input.buyer_address,
          buyer_phone: input.buyer_phone,
          buyer_tin: input.buyer_tin,
          buyer_brn: input.buyer_brn,
          buyer_sst_id: input.buyer_sst_id,
          items: input.items,
          discount: input.discount,
          sst_rate: input.sst_rate,
          payment_terms: input.payment_terms,
          due_date: input.due_date,
          notes: input.notes,
          status: input.status,
          sent_at: status === "sent" ? new Date().toISOString() : existingInvoice.sent_at,
        })
      : await createInvoice(input);

    setIsSaving(false);

    if (result) {
      track("invoice_created", { status, hasOrder: !!prefill?.order_id });
      toast.success(status === "draft" ? "Draft saved" : "Invoice created & ready to send");
      router.push(`/invoices/${result.id}`);
    } else {
      toast.error("Failed to save invoice");
    }
  }

  async function handleSubmitMyInvois() {
    if (!existingInvoice?.id) return;
    if (!bisnisActive) {
      toast.error("MyInvois submission requires the Pro plan");
      return;
    }
    if (requiresIndividualWithoutTin) {
      toast.error(
        `Invoices ≥ RM ${MYINVOIS_INDIVIDUAL_THRESHOLD_MYR.toLocaleString("en-MY")} need the buyer's TIN for LHDN submission`,
      );
      return;
    }

    setMyInvoisSubmitting(true);
    try {
      const res = await fetch(
        `/api/invoices/${existingInvoice.id}/myinvois-submit`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "MyInvois submission failed");
        return;
      }
      setMyInvoisStatus((data.status as MyInvoisStatus) ?? "submitted");
      setMyInvoisUuid(data.uuid ?? null);
      setMyInvoisLongId(data.longId ?? null);
      setMyInvoisPolling(true);
      track("myinvois_submitted", { invoiceId: existingInvoice.id });
      toast.success("Submitted to LHDN — awaiting validation");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "MyInvois submission failed");
    } finally {
      setMyInvoisSubmitting(false);
    }
  }

  const missingSellerTaxIdentity = !profile?.tin || !profile?.brn;
  const canSubmitMyInvois =
    !!existingInvoice
    && existingInvoice.status !== "draft"
    && existingInvoice.status !== "cancelled"
    && !missingSellerTaxIdentity
    && !requiresIndividualWithoutTin;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/invoices"
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">
          {existingInvoice ? "Edit invoice" : "New invoice"}
        </h1>
      </div>

      {/* Buyer */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Buyer</p>
        <div className="rounded-lg border bg-card transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
          <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">
            Buyer name <span className="text-warm-rose">*</span>
          </label>
          <input
            type="text"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            placeholder="e.g. Kedai Runcit Aisyah"
            className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          />
        </div>
        <div className="rounded-lg border bg-card transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
          <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">
            Address
          </label>
          <input
            type="text"
            value={buyerAddress}
            onChange={(e) => setBuyerAddress(e.target.value)}
            placeholder="Buyer address"
            className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-card transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
            <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">
              Phone
            </label>
            <div className="flex items-center px-3 pb-2 pt-0 gap-1">
              <span className="text-xs text-muted-foreground shrink-0 select-none">🇲🇾+60</span>
              <span className="w-px h-3.5 bg-border shrink-0" />
              <input
                type="tel"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(stripMyPhonePrefix(e.target.value))}
                placeholder="12 345 6789"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
              />
            </div>
          </div>
          <div className="rounded-lg border bg-card transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
            <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">
              TIN
            </label>
            <input
              type="text"
              value={buyerTin}
              onChange={(e) => setBuyerTin(e.target.value)}
              placeholder="e.g. C25805324050"
              className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-card transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
            <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">
              BRN (Sdn Bhd no.)
            </label>
            <input
              type="text"
              value={buyerBrn}
              onChange={(e) => setBuyerBrn(e.target.value)}
              placeholder="e.g. 202301012345"
              className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
          </div>
          <div className="rounded-lg border bg-card transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
            <label className="block px-3 pt-1.5 text-[10px] font-medium text-muted-foreground">
              SST registration
            </label>
            <input
              type="text"
              value={buyerSstId}
              onChange={(e) => setBuyerSstId(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 pb-2 pt-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
          </div>
        </div>
        {requiresIndividualWithoutTin && (
          <div className="flex items-start gap-2 text-[11px] text-warm-rose bg-rose-50 rounded-md p-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              LHDN requires the buyer&apos;s TIN for any invoice at or above RM{" "}
              {MYINVOIS_INDIVIDUAL_THRESHOLD_MYR.toLocaleString("en-MY")}.
            </span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Items</p>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Item name"
                value={item.name}
                onChange={(e) => updateItem(index, "name", e.target.value)}
                className="flex-1 h-11 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
              />
              <input
                type="number"
                placeholder="Price"
                value={item.price || ""}
                onChange={(e) => updateItem(index, "price", parseInt(e.target.value) || 0)}
                className="w-28 h-11 px-3 bg-card border rounded-lg shadow-sm text-sm text-right focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.qty || ""}
                min={1}
                onChange={(e) => updateItem(index, "qty", parseInt(e.target.value) || 1)}
                className="w-16 h-11 px-3 bg-card border rounded-lg shadow-sm text-sm text-right focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="h-11 w-11 flex items-center justify-center rounded-lg border border-border hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-lg border border-dashed border-border hover:bg-muted transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add item
        </button>
      </div>

      {/* Calculation */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Calculation</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">RM {subtotal.toLocaleString("en-MY")}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Discount</span>
            <input
              type="number"
              value={discount || ""}
              onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-32 h-9 px-3 bg-card border rounded-lg shadow-sm text-sm text-right focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
            />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxable</span>
            <span className="font-medium">RM {taxable.toLocaleString("en-MY")}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">SST</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                  {SST_OPTIONS.map((opt) => (
                    <button
                      key={opt.rate}
                      type="button"
                      onClick={() => setSstRate(opt.rate)}
                      className={`h-7 px-2.5 text-xs font-medium rounded transition-colors ${
                        sstRate === opt.rate
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <span className="text-sm font-medium w-28 text-right">
                  RM {sstAmount.toLocaleString("en-MY")}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-right">
              {SST_OPTIONS.find((o) => o.rate === sstRate)?.hint}
            </p>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-base">RM {total.toLocaleString("en-MY")}</span>
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Payment</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(PAYMENT_TERMS_LABELS) as PaymentTerms[]).map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setPaymentTerms(term)}
              className={`h-8 px-3 text-xs font-medium rounded-full border transition-colors ${
                paymentTerms === term
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              {PAYMENT_TERMS_LABELS[term]}
            </button>
          ))}
        </div>
        {paymentTerms !== "COD" && (
          <div>
            <label className="text-xs text-muted-foreground">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-11 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors mt-1"
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-2">
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Notes</p>
        <textarea
          placeholder="Additional notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-card border rounded-lg shadow-sm text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
        />
      </div>

      {/* MyInvois — edit mode on a persisted, non-draft invoice */}
      {existingInvoice && existingInvoice.status !== "draft" && (
        <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-warm-green" />
              <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                LHDN MyInvois
              </p>
            </div>
            {myInvoisStatus && (
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  myInvoisStatus === "valid"
                    ? "bg-green-50 text-green-700"
                    : myInvoisStatus === "invalid" || myInvoisStatus === "rejected"
                      ? "bg-red-50 text-red-700"
                      : myInvoisStatus === "cancelled"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-blue-50 text-blue-700"
                }`}
              >
                {MYINVOIS_STATUS_LABELS[myInvoisStatus]}
              </span>
            )}
          </div>

          {!bisnisActive && (
            <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted rounded-md p-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                MyInvois submission requires the Pro plan (RM 49/mo). Upgrade in{" "}
                <Link href="/settings" className="underline">
                  Settings
                </Link>
                .
              </span>
            </div>
          )}

          {bisnisActive && missingSellerTaxIdentity && (
            <div className="flex items-start gap-2 text-[11px] text-warm-rose bg-rose-50 rounded-md p-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                Your TIN and BRN are missing. Set them in{" "}
                <Link href="/settings" className="underline">
                  Settings → Tax identity
                </Link>{" "}
                before submitting.
              </span>
            </div>
          )}

          {myInvoisUuid && (
            <div className="text-[11px] text-muted-foreground space-y-0.5">
              <div>
                <span className="uppercase tracking-wider">UUID</span> ·{" "}
                <span className="font-mono text-foreground">{myInvoisUuid}</span>
              </div>
              {myInvoisLongId && (
                <div className="flex items-center gap-1">
                  <span className="uppercase tracking-wider">Long ID</span> ·{" "}
                  <span className="font-mono text-foreground">{myInvoisLongId}</span>
                  <a
                    href={`https://preprod.myinvois.hasil.gov.my/${myInvoisUuid}/share/${myInvoisLongId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-primary hover:underline"
                    title="View on MyInvois"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {!myInvoisUuid && bisnisActive && (
            <button
              type="button"
              onClick={handleSubmitMyInvois}
              disabled={!canSubmitMyInvois || myInvoisSubmitting}
              className="w-full h-11 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {myInvoisSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Submit to MyInvois
                </>
              )}
            </button>
          )}

          {myInvoisPolling && !terminalMyInvoisStatus(myInvoisStatus) && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Checking LHDN validation status…
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4 lg:static lg:bg-transparent lg:backdrop-blur-none lg:border-0 lg:p-0 lg:pb-6">
        <div className="max-w-2xl mx-auto flex gap-2">
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={isSaving}
            className="flex-1 h-11 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSave("sent")}
            disabled={isSaving}
            className="flex-1 h-11 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save & send"}
          </button>
        </div>
      </div>
    </div>
  );
}
