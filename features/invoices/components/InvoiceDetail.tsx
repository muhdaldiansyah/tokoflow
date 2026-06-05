"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Pencil,
  CheckCircle,
  Trash2,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Send,
  XOctagon,
} from "lucide-react";
import { toast } from "sonner";
import type { Invoice, MyInvoisStatus } from "../types/invoice.types";
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  PAYMENT_TERMS_LABELS,
  MYINVOIS_STATUS_LABELS,
  MYINVOIS_INDIVIDUAL_THRESHOLD_MYR,
} from "../types/invoice.types";
import {
  updateInvoiceStatus,
  recordInvoicePayment,
  deleteInvoice,
} from "../services/invoice.service";
import { generateInvoicePDF } from "@/lib/pdf/generate-invoice";
import { buildInvoiceMessage } from "@/lib/utils/wa-messages";
import { openWhatsApp } from "@/lib/utils/wa-open";
import { track } from "@/lib/analytics";

interface InvoiceDetailProps {
  invoice: Invoice;
  isBisnisActive?: boolean;
}

const MYINVOIS_CANCEL_WINDOW_HOURS = 72;

function terminal(status: MyInvoisStatus | null | undefined) {
  return (
    status === "valid"
    || status === "invalid"
    || status === "cancelled"
    || status === "rejected"
  );
}

function hoursSince(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60);
}

export function InvoiceDetail({ invoice: initialInvoice, isBisnisActive }: InvoiceDetailProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState(initialInvoice);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const [myInvoisSubmitting, setMyInvoisSubmitting] = useState(false);
  const [myInvoisPolling, setMyInvoisPolling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const remaining = invoice.total - (invoice.paid_amount || 0);
  const effectiveSstRate = invoice.sst_rate ?? invoice.ppn_rate ?? 0;
  const effectiveSstAmount = invoice.sst_amount ?? invoice.ppn_amount ?? 0;
  const myInvoisStatus = (invoice.myinvois_status as MyInvoisStatus | null | undefined) ?? null;

  const cancelWindowOpen = useMemo(() => {
    const h = hoursSince(invoice.myinvois_submitted_at);
    return h !== null && h <= MYINVOIS_CANCEL_WINDOW_HOURS;
  }, [invoice.myinvois_submitted_at]);

  const requiresIndividualWithoutTin =
    invoice.total >= MYINVOIS_INDIVIDUAL_THRESHOLD_MYR
    && !(invoice.buyer_tin || invoice.buyer_npwp);

  // Poll the LHDN status endpoint while the submission is in flight.
  useEffect(() => {
    if (!myInvoisPolling) return;
    if (!invoice.myinvois_uuid) return;
    if (terminal(myInvoisStatus)) return;

    const started = Date.now();
    const tick = async () => {
      if (Date.now() - started > 120_000) {
        setMyInvoisPolling(false);
        return;
      }
      try {
        const res = await fetch(`/api/invoices/${invoice.id}/myinvois-status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status && data.status !== "not_submitted") {
            setInvoice((prev) => ({
              ...prev,
              myinvois_status: data.status,
              myinvois_long_id: data.longId ?? prev.myinvois_long_id,
              myinvois_validated_at:
                data.validatedAt ?? prev.myinvois_validated_at,
            }));
            if (terminal(data.status as MyInvoisStatus)) {
              setMyInvoisPolling(false);
              if (data.status === "valid") {
                toast.success("MyInvois validated by LHDN");
              } else if (data.status === "invalid" || data.status === "rejected") {
                toast.error(`MyInvois ${data.status}`);
              }
              return;
            }
          }
        }
      } catch {
        // non-fatal
      }
      pollTimeoutRef.current = setTimeout(tick, 5000);
    };
    pollTimeoutRef.current = setTimeout(tick, 2000);

    return () => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [myInvoisPolling, invoice.id, invoice.myinvois_uuid, myInvoisStatus]);

  async function handleDownloadPDF() {
    try {
      const pdf = generateInvoicePDF(invoice);
      pdf.save(`${invoice.invoice_number}.pdf`);
      track("invoice_pdf_downloaded", { invoiceNumber: invoice.invoice_number });
    } catch {
      toast.error("Failed to generate PDF");
    }
  }

  async function handleSendWA() {
    if (!invoice.buyer_phone) {
      toast.error("Buyer phone is not available");
      return;
    }
    const message = buildInvoiceMessage(invoice);
    openWhatsApp(message, invoice.buyer_phone);
    track("invoice_wa_sent", { invoiceNumber: invoice.invoice_number });

    if (invoice.status === "draft") {
      const updated = await updateInvoiceStatus(invoice.id, "sent");
      if (updated) setInvoice(updated);
    }
  }

  async function handleMarkPaid() {
    setIsProcessing(true);
    const updated = await recordInvoicePayment(invoice.id, remaining);
    if (updated) {
      setInvoice(updated);
      toast.success("Invoice marked as paid");
      track("invoice_marked_paid", { invoiceNumber: invoice.invoice_number });
    } else {
      toast.error("Failed to update status");
    }
    setIsProcessing(false);
  }

  async function handleRecordPayment() {
    const amount = parseInt(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a payment amount");
      return;
    }
    setIsProcessing(true);
    const updated = await recordInvoicePayment(invoice.id, amount);
    if (updated) {
      setInvoice(updated);
      setShowPaymentInput(false);
      setPaymentAmount("");
      toast.success("Payment recorded");
    } else {
      toast.error("Failed to record payment");
    }
    setIsProcessing(false);
  }

  async function handleDelete() {
    if (invoice.status !== "draft") {
      toast.error("Only drafts can be deleted");
      return;
    }
    setIsProcessing(true);
    const success = await deleteInvoice(invoice.id);
    if (success) {
      toast.success("Draft deleted");
      router.push("/invoices");
    } else {
      toast.error("Failed to delete");
    }
    setIsProcessing(false);
  }

  async function handleSubmitMyInvois() {
    if (!isBisnisActive) {
      toast.error("MyInvois submission requires the Pro plan");
      return;
    }
    if (requiresIndividualWithoutTin) {
      toast.error(
        `Invoices ≥ RM ${MYINVOIS_INDIVIDUAL_THRESHOLD_MYR.toLocaleString("en-MY")} need the buyer's TIN`,
      );
      return;
    }
    setMyInvoisSubmitting(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/myinvois-submit`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "MyInvois submission failed");
        return;
      }
      setInvoice((prev) => ({
        ...prev,
        myinvois_uuid: data.uuid ?? prev.myinvois_uuid,
        myinvois_submission_uid: data.submissionUid ?? prev.myinvois_submission_uid,
        myinvois_long_id: data.longId ?? prev.myinvois_long_id,
        myinvois_status: (data.status as MyInvoisStatus) ?? "submitted",
        myinvois_submitted_at: new Date().toISOString(),
      }));
      setMyInvoisPolling(true);
      track("myinvois_submitted", { invoiceId: invoice.id });
      toast.success("Submitted to LHDN — awaiting validation");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "MyInvois submission failed");
    } finally {
      setMyInvoisSubmitting(false);
    }
  }

  async function handleCancelMyInvois() {
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      toast.error("Cancellation reason must be at least 5 characters");
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/myinvois-cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Cancellation failed");
        return;
      }
      setInvoice((prev) => ({ ...prev, myinvois_status: "cancelled" }));
      setShowCancelModal(false);
      setCancelReason("");
      toast.success("MyInvois document cancelled");
      track("myinvois_cancelled", { invoiceId: invoice.id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancellation failed");
    } finally {
      setCancelling(false);
    }
  }

  const showMyInvoisCard = invoice.status !== "draft";
  const canSubmitMyInvois =
    showMyInvoisCard
    && !invoice.myinvois_uuid
    && !!isBisnisActive
    && !requiresIndividualWithoutTin;
  const canCancelMyInvois =
    !!invoice.myinvois_uuid
    && (myInvoisStatus === "valid" || myInvoisStatus === "submitted")
    && cancelWindowOpen;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{invoice.invoice_number}</h1>
            <span
              className={`inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full items-center ${INVOICE_STATUS_COLORS[invoice.status]}`}
            >
              {INVOICE_STATUS_LABELS[invoice.status]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDownloadPDF}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          {invoice.status !== "cancelled" && invoice.status !== "paid" && (
            <Link
              href={`/invoices/${invoice.id}/edit`}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="flex items-center gap-1 text-xs">
        {(["draft", "sent", "paid"] as const).map((s, i) => {
          const statusOrder = ["draft", "sent", "paid"];
          const currentIdx = statusOrder.indexOf(
            invoice.status === "overdue" ? "sent" : invoice.status,
          );
          const isActive = i <= currentIdx;
          return (
            <React.Fragment key={s}>
              {i > 0 && (
                <div className={`flex-1 h-0.5 ${isActive ? "bg-warm-green" : "bg-border"}`} />
              )}
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                  isActive
                    ? "bg-warm-green-light text-warm-green font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {s === "draft" ? "Draft" : s === "sent" ? "Sent" : "Paid"}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={handleDownloadPDF}
          className="h-8 px-3 text-xs font-medium rounded-full border border-border hover:bg-muted transition-colors flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          PDF
        </button>
        {invoice.buyer_phone && (
          <button
            onClick={handleSendWA}
            className="h-8 px-3 text-xs font-medium rounded-full border border-border hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            Send via WhatsApp
          </button>
        )}
        {remaining > 0 && invoice.status !== "cancelled" && (
          <>
            <button
              onClick={handleMarkPaid}
              disabled={isProcessing}
              className="h-8 px-3 text-xs font-medium rounded-full bg-warm-green text-white hover:bg-warm-green/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Mark as paid
            </button>
            <button
              onClick={() => setShowPaymentInput(!showPaymentInput)}
              className="h-8 px-3 text-xs font-medium rounded-full border border-border hover:bg-muted transition-colors"
            >
              Record payment
            </button>
          </>
        )}
        {invoice.status === "draft" && (
          <button
            onClick={handleDelete}
            disabled={isProcessing}
            className="h-8 px-3 text-xs font-medium rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
      </div>

      {/* Record payment input */}
      {showPaymentInput && (
        <div className="rounded-xl border bg-card shadow-sm p-4 space-y-2">
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
            Record payment
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder={`Max RM ${remaining.toLocaleString("en-MY")}`}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="flex-1 h-11 px-3 bg-card border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-colors"
            />
            <button
              onClick={handleRecordPayment}
              disabled={isProcessing}
              className="h-11 px-4 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green/90 transition-colors disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Seller & Buyer */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              From
            </p>
            <p className="text-sm font-semibold">{invoice.seller_name || "-"}</p>
            {invoice.seller_address && (
              <p className="text-xs text-muted-foreground">{invoice.seller_address}</p>
            )}
            {invoice.seller_phone && (
              <p className="text-xs text-muted-foreground">{invoice.seller_phone}</p>
            )}
            {(invoice.seller_tin || invoice.seller_npwp) && (
              <p className="text-xs text-muted-foreground">
                TIN: {invoice.seller_tin || invoice.seller_npwp}
              </p>
            )}
            {invoice.seller_brn && (
              <p className="text-xs text-muted-foreground">BRN: {invoice.seller_brn}</p>
            )}
            {invoice.seller_sst_registration_id && (
              <p className="text-xs text-muted-foreground">
                SST: {invoice.seller_sst_registration_id}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              To
            </p>
            <p className="text-sm font-semibold">{invoice.buyer_name || "-"}</p>
            {invoice.buyer_address && (
              <p className="text-xs text-muted-foreground">{invoice.buyer_address}</p>
            )}
            {invoice.buyer_phone && (
              <p className="text-xs text-muted-foreground">{invoice.buyer_phone}</p>
            )}
            {(invoice.buyer_tin || invoice.buyer_npwp) && (
              <p className="text-xs text-muted-foreground">
                TIN: {invoice.buyer_tin || invoice.buyer_npwp}
              </p>
            )}
            {invoice.buyer_brn && (
              <p className="text-xs text-muted-foreground">BRN: {invoice.buyer_brn}</p>
            )}
            {invoice.buyer_sst_id && (
              <p className="text-xs text-muted-foreground">SST: {invoice.buyer_sst_id}</p>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="font-medium">
              {new Date(invoice.created_at).toLocaleDateString("en-MY", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          {invoice.due_date && (
            <div>
              <p className="text-xs text-muted-foreground">Due date</p>
              <p
                className={`font-medium ${
                  new Date(invoice.due_date) < new Date() && remaining > 0 ? "text-red-600" : ""
                }`}
              >
                {new Date(invoice.due_date).toLocaleDateString("en-MY", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
          {invoice.payment_terms && (
            <div>
              <p className="text-xs text-muted-foreground">Terms</p>
              <p className="font-medium">{PAYMENT_TERMS_LABELS[invoice.payment_terms]}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Items</p>
        <div className="divide-y divide-border">
          {invoice.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.qty} x RM {item.price.toLocaleString("en-MY")}
                </p>
              </div>
              <p className="text-sm font-medium">
                RM {(item.price * item.qty).toLocaleString("en-MY")}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>RM {invoice.subtotal.toLocaleString("en-MY")}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-RM {invoice.discount.toLocaleString("en-MY")}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxable</span>
            <span>RM {(invoice.subtotal - invoice.discount).toLocaleString("en-MY")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">SST {effectiveSstRate}%</span>
            <span>RM {effectiveSstAmount.toLocaleString("en-MY")}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-1 border-t">
            <span>Total</span>
            <span>RM {invoice.total.toLocaleString("en-MY")}</span>
          </div>
        </div>

        {/* Payment status */}
        {invoice.paid_amount > 0 && (
          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <span className="text-warm-green font-medium">
                RM {invoice.paid_amount.toLocaleString("en-MY")}
              </span>
            </div>
            {remaining > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance</span>
                <span className="text-red-600 font-medium">
                  RM {remaining.toLocaleString("en-MY")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MyInvois */}
      {showMyInvoisCard && (
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

          {!isBisnisActive && !invoice.myinvois_uuid && (
            <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted rounded-md p-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                MyInvois submission requires the Pro plan (RM 49/mo).{" "}
                <Link href="/settings" className="underline">
                  Upgrade
                </Link>
                .
              </span>
            </div>
          )}

          {requiresIndividualWithoutTin && !invoice.myinvois_uuid && (
            <div className="flex items-start gap-2 text-[11px] text-warm-rose bg-rose-50 rounded-md p-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                LHDN requires the buyer&apos;s TIN for any invoice at or above RM{" "}
                {MYINVOIS_INDIVIDUAL_THRESHOLD_MYR.toLocaleString("en-MY")}. Edit the invoice to add
                it before submitting.
              </span>
            </div>
          )}

          {invoice.myinvois_uuid && (
            <div className="text-[11px] text-muted-foreground space-y-1">
              <div>
                <span className="uppercase tracking-wider">UUID</span> ·{" "}
                <span className="font-mono text-foreground break-all">{invoice.myinvois_uuid}</span>
              </div>
              {invoice.myinvois_long_id && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="uppercase tracking-wider">Long ID</span> ·{" "}
                  <span className="font-mono text-foreground break-all">
                    {invoice.myinvois_long_id}
                  </span>
                  <a
                    href={`https://preprod.myinvois.hasil.gov.my/${invoice.myinvois_uuid}/share/${invoice.myinvois_long_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-primary hover:underline"
                    title="View on MyInvois"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {invoice.myinvois_submitted_at && (
                <div>
                  <span className="uppercase tracking-wider">Submitted</span> ·{" "}
                  {new Date(invoice.myinvois_submitted_at).toLocaleString("en-MY")}
                </div>
              )}
            </div>
          )}

          {canSubmitMyInvois && (
            <button
              type="button"
              onClick={handleSubmitMyInvois}
              disabled={myInvoisSubmitting}
              className="w-full h-10 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {myInvoisSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit to MyInvois
                </>
              )}
            </button>
          )}

          {myInvoisPolling && !terminal(myInvoisStatus) && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Checking LHDN validation status…
            </p>
          )}

          {canCancelMyInvois && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="w-full h-9 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <XOctagon className="w-3.5 h-3.5" />
              Cancel MyInvois (within 72 h window)
            </button>
          )}

          {invoice.myinvois_uuid
            && !cancelWindowOpen
            && myInvoisStatus !== "cancelled"
            && (myInvoisStatus === "valid" || myInvoisStatus === "submitted") && (
              <p className="text-[11px] text-muted-foreground">
                72-hour cancellation window has passed. Issue a credit note if correction is needed.
              </p>
            )}
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="rounded-xl border bg-card shadow-sm p-4">
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-1">
            Notes
          </p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Cancel MyInvois modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-card rounded-xl shadow-lg p-4 space-y-3">
            <h2 className="text-sm font-semibold">Cancel MyInvois document</h2>
            <p className="text-xs text-muted-foreground">
              LHDN requires a reason for cancellation (min. 5 characters). This action is final and
              cannot be undone.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="e.g. Duplicate invoice submitted in error"
              className="w-full px-3 py-2 bg-card border rounded-lg shadow-sm text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                disabled={cancelling}
                className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                Keep document
              </button>
              <button
                onClick={handleCancelMyInvois}
                disabled={cancelling}
                className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {cancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Cancel document"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
