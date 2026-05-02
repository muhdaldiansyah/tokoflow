"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Receipt, Pencil, Camera, ChevronDown, ChevronUp, MessageSquare, CircleDollarSign, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { buildOrderWithStatus, buildPaymentReminder } from "@/lib/utils/wa-messages";
import { WAPreviewSheet } from "./WAPreviewSheet";
import { getOrder, uploadPaymentProof, updateOrderStatus, recordPayment } from "../services/order.service";
import { hapticSuccess } from "@/lib/utils/haptics";
import { track } from "@/lib/analytics";
import type { Order, OrderStatus } from "../types/order.types";
import { ORDER_STATUS_LABELS, ORDER_STATUS_FLOW, PAYMENT_STATUS_LABELS } from "../types/order.types";

interface OrderDetailProps {
  orderId: string;
}

export function OrderDetail({ orderId }: OrderDetailProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProof, setShowProof] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isQuickUpdating, setIsQuickUpdating] = useState(false);
  const [waPreview, setWaPreview] = useState<{ message: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<"advance" | "markpaid" | null>(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    setIsLoading(true);
    const data = await getOrder(orderId);
    setOrder(data);
    if (data) track("order_detail_viewed", { order_id: data.id, status: data.status, total: data.total });
    setIsLoading(false);
  }

  function shareToWhatsApp() {
    if (!order) return;
    setWaPreview({ message: buildOrderWithStatus(order) });
  }

  function sendPaymentReminder() {
    if (!order) return;
    setWaPreview({ message: buildPaymentReminder(order) });
  }

  function handleProofFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleStandaloneProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !order) return;
    setIsUploadingProof(true);
    const proofUrl = await uploadPaymentProof(order.id, file);
    setIsUploadingProof(false);
    if (proofUrl) {
      const refreshed = await getOrder(order.id);
      setOrder(refreshed || { ...order, proof_url: proofUrl });
    }
  }

  async function handleSaveStandaloneProof() {
    if (!order || !proofFile) return;
    setIsUploadingProof(true);
    const proofUrl = await uploadPaymentProof(order.id, proofFile);
    setIsUploadingProof(false);
    if (proofUrl) {
      const refreshed = await getOrder(order.id);
      setOrder(refreshed || { ...order, proof_url: proofUrl });
      setProofFile(null);
      setProofPreview(null);
    }
  }

  // Quick actions — derive next status
  const currentStatusIndex = order ? ORDER_STATUS_FLOW.indexOf(order.status) : -1;
  const nextStatus: OrderStatus | null =
    order && currentStatusIndex >= 0 && currentStatusIndex < ORDER_STATUS_FLOW.length - 1
      ? ORDER_STATUS_FLOW[currentStatusIndex + 1]
      : null;

  async function handleMarkPaid() {
    if (!order || isQuickUpdating) return;
    setIsQuickUpdating(true);
    const remaining = order.total - (order.paid_amount || 0);
    const updated = await recordPayment(order.id, remaining);
    if (updated) {
      hapticSuccess();
      setOrder(updated);
      track("order_marked_paid", { order_id: order.id, amount: remaining });
      toast.success("Order marked as paid");
    } else {
      toast.error("Failed to update payment");
    }
    setIsQuickUpdating(false);
  }

  async function handleAdvanceStatus() {
    if (!order || !nextStatus || isQuickUpdating) return;
    setIsQuickUpdating(true);
    const updated = await updateOrderStatus(order.id, nextStatus);
    if (updated) {
      hapticSuccess();
      setOrder(updated);
      track("order_status_changed", { order_id: order.id, from: order.status, to: nextStatus });
      toast.success(`Status diubah ke ${ORDER_STATUS_LABELS[nextStatus]}`);
    } else {
      toast.error("Failed to update status");
    }
    setIsQuickUpdating(false);
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Order not found</p>
        <Link href="/orders" className="text-foreground underline">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {order.customer_name || order.customer_phone || "Order"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {order.order_number} · {new Date(order.created_at).toLocaleDateString("en-MY", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/orders" className="h-9 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium bg-card border border-border shadow-sm hover:bg-muted transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={shareToWhatsApp}
          className="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-warm-green/30 bg-warm-green-light text-warm-green text-xs font-medium hover:bg-warm-green-light/80 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Send WA
        </button>
        <Link
          href={`/orders/${order.id}/struk`}
          className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-card border border-border shadow-sm text-xs font-medium hover:bg-muted transition-colors"
        >
          <Receipt className="w-3.5 h-3.5" />
          Kirim Struk
        </Link>
        {order.payment_status !== "paid" && order.status !== "cancelled" && (
          <button
            onClick={sendPaymentReminder}
            className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-card border border-border shadow-sm text-xs font-medium hover:bg-muted transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            Ingatkan Bayar
          </button>
        )}
        <Link
          href={`/orders/${order.id}/edit`}
          className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-card border border-border shadow-sm text-xs font-medium hover:bg-muted transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Link>
      </div>

      {/* Quick status actions */}
      {order.status !== "cancelled" && order.status !== "done" && (
        <div className="flex items-center gap-2">
          {nextStatus && (
            <button
              type="button"
              onClick={() => setConfirmAction("advance")}
              disabled={isQuickUpdating}
              className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-card border border-border shadow-sm text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              {ORDER_STATUS_LABELS[nextStatus]}
            </button>
          )}
          {order.payment_status !== "paid" && (
            <button
              type="button"
              onClick={() => setConfirmAction("markpaid")}
              disabled={isQuickUpdating}
              className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-card border border-border shadow-sm text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              <CircleDollarSign className="w-3.5 h-3.5" />
              Mark as paid
            </button>
          )}
        </div>
      )}

      {/* Card: Read-only display */}
      <div className="rounded-lg border bg-card px-4 py-4 space-y-4 shadow-sm">

      {/* Table Number (Dine-in) */}
      {order.is_dine_in && order.table_number && (
        <div className="space-y-1">
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Table number</p>
          <p className="text-sm text-foreground">Meja {order.table_number}</p>
        </div>
      )}

      {/* Delivery Date */}
      {order.delivery_date && (
        <div className="space-y-1">
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Delivery / pickup date</p>
          <p className="text-sm text-foreground">
            {new Date(order.delivery_date).toLocaleDateString("en-MY", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}

      {/* Customer */}
      {(order.customer_name || order.customer_phone) && (
        <div className="space-y-1">
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Customers</p>
          {order.customer_name && (
            <p className="text-sm text-foreground">{order.customer_name}</p>
          )}
          {order.customer_phone && (
            <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
          )}
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Item</p>
        <div>
          {order.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-1.5 border-b last:border-0"
            >
              <div>
                <span className="text-xs font-medium text-foreground">
                  {item.name}
                </span>
                <span className="text-xs text-muted-foreground ml-1.5">x{item.qty}</span>
              </div>
              <span className="text-xs text-foreground">
                RM {(item.price * item.qty).toLocaleString("en-MY")}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t space-y-1.5">
          {order.discount > 0 && (
            <div className="flex justify-between text-xs text-warm-rose">
              <span>Discount</span>
              <span>-RM {order.discount.toLocaleString("en-MY")}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className={`inline-flex h-5 px-1.5 text-[10px] font-medium rounded-full border items-center ${
                order.payment_status === "paid"
                  ? "bg-warm-green-light border-warm-green/30 text-warm-green"
                  : order.payment_status === "partial"
                    ? "bg-warm-amber-light border-warm-amber/30 text-warm-amber"
                    : "bg-warm-rose-light border-warm-rose/30 text-warm-rose"
              }`}>
                {PAYMENT_STATUS_LABELS[order.payment_status]}
              </span>
            </div>
            <span className="text-sm font-bold text-foreground">RM {order.total.toLocaleString("en-MY")}</span>
          </div>
          {order.payment_status === "partial" && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Paid</span>
              <span className="text-foreground">RM {(order.paid_amount || 0).toLocaleString("en-MY")}</span>
            </div>
          )}
          {order.payment_status === "partial" && (
            <div className="flex justify-between text-xs font-medium">
              <span className="text-warm-rose">Sisa</span>
              <span className="text-warm-rose">RM {(order.total - (order.paid_amount || 0)).toLocaleString("en-MY")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="space-y-1">
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Note</p>
          <p className="text-sm text-muted-foreground">{order.notes}</p>
        </div>
      )}

      {/* Photo Attachments */}
      {order.image_urls && order.image_urls.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Reference Photos</p>
          <div className="flex gap-2 flex-wrap">
            {order.image_urls.map((url, i) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Payment Proof — collapsible */}
      {order.proof_url && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setShowProof(!showProof)}
            className="flex items-center gap-1.5 text-xs font-bold text-foreground/80 uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <span>Bukti Transfer</span>
            {showProof ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showProof && (
            <div className="space-y-3">
              <a href={order.proof_url} target="_blank" rel="noopener noreferrer">
                <img src={order.proof_url} alt="Bukti transfer" className="w-full rounded-lg" />
              </a>
              {order.status !== "cancelled" && (
                <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  <Camera className="w-4 h-4" />
                  <span>Change proof</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleStandaloneProofUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}
        </div>
      )}

      {/* Standalone proof upload — for paid orders without proof */}
      {!order.proof_url && order.status !== "cancelled" && order.payment_status === "paid" && (
        <div className="space-y-1">
          {proofPreview ? (
            <div className="space-y-3">
              <img src={proofPreview} alt="Payment proof preview" className="w-full rounded-lg" />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveStandaloneProof}
                  disabled={isUploadingProof}
                  className="flex-1 h-11 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isUploadingProof ? "Uploading..." : "Save proof"}
                </button>
                <button
                  type="button"
                  onClick={() => { setProofFile(null); setProofPreview(null); }}
                  className="h-11 px-4 text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <label className="w-full flex items-center justify-center gap-2 cursor-pointer text-sm font-medium text-foreground hover:text-foreground/80 transition-colors">
              <Camera className="w-4 h-4" />
              <span>Lampirkan Bukti Transfer</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleProofFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}

      </div>{/* End card */}

      {/* Confirmation modal for status/payment actions */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center" onClick={() => !isQuickUpdating && setConfirmAction(null)}>
          <div className="bg-card rounded-t-2xl lg:rounded-2xl p-6 pb-8 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                confirmAction === "markpaid" ? "bg-warm-green-light" : "bg-warm-blue-light"
              }`}>
                {confirmAction === "markpaid"
                  ? <CircleDollarSign className="w-6 h-6 text-warm-green" />
                  : <ArrowRight className="w-6 h-6 text-warm-blue" />}
              </div>
              <h2 className="text-base font-semibold text-foreground mb-1">
                {confirmAction === "markpaid"
                  ? "Tandai lunas?"
                  : `Ubah status ke ${nextStatus ? ORDER_STATUS_LABELS[nextStatus] : ""}?`}
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                {confirmAction === "markpaid"
                  ? `Pembayaran RM ${((order?.total || 0) - (order?.paid_amount || 0)).toLocaleString("en-MY")} will be recorded as paid.`
                  : `Order status will change to "${nextStatus ? ORDER_STATUS_LABELS[nextStatus] : ""}".`}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  disabled={isQuickUpdating}
                  className="flex-1 h-11 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirmAction === "advance") await handleAdvanceStatus();
                    else await handleMarkPaid();
                    setConfirmAction(null);
                  }}
                  disabled={isQuickUpdating}
                  className={`flex-1 h-11 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 ${
                    confirmAction === "markpaid"
                      ? "bg-warm-green hover:bg-warm-green-hover"
                      : "bg-warm-blue hover:bg-warm-blue/90"
                  }`}
                >
                  {isQuickUpdating ? "Processing..." : "Yes, continue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WA Preview Sheet */}
      {waPreview && (
        <WAPreviewSheet
          open={!!waPreview}
          onClose={() => setWaPreview(null)}
          customerName={order?.customer_name}
          customerPhone={order?.customer_phone}
          initialMessage={waPreview.message}
        />
      )}
    </div>
  );
}
