"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, QrCode, Download, Copy, Check, RefreshCw, CalendarDays } from "lucide-react";
import { openWhatsAppPublic } from "@/lib/utils/wa-open";
import { buildCustomerOrderMessage, buildQrisConfirmationMessage } from "@/lib/utils/wa-messages";

interface OrderDetails {
  orderNumber: string;
  orderId?: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  notes?: string;
  customerName: string;
  deliveryDate?: string;
}

interface SuccessActionsProps {
  qrisUrl?: string;
  businessPhone?: string;
  orderNumber: string;
  orderId?: string;
  businessName: string;
  slug: string;
  totalFromUrl?: number;
  isPreorder?: boolean;
  isLangganan?: boolean;
  // Set when Billplz already settled this order. Hides the manual DuitNow
  // QR + claim flow since payment is already confirmed.
  alreadyPaid?: boolean;
}

export function SuccessActions({ qrisUrl, businessPhone, orderNumber, orderId, businessName, slug, totalFromUrl, isPreorder, isLangganan, alreadyPaid }: SuccessActionsProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("tokoflow_last_order");
      if (raw) {
        setOrderDetails(JSON.parse(raw));
        // Keep in sessionStorage so receipt image can include items on re-download
        // It will be naturally cleared when the tab/session ends
      }
    } catch { /* sessionStorage unavailable */ }
  }, []);

  const displayTotal = orderDetails?.total || totalFromUrl || 0;

  async function handleCopyOrderNumber() {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  async function handleClaimPayment() {
    if (!orderId) { setPaidConfirmed(true); return; }
    setClaiming(true);
    try {
      await fetch(`/api/public/orders/${orderId}/claim-payment`, { method: "POST" });
    } catch { /* fire and forget */ }
    setClaiming(false);
    setPaidConfirmed(true);
  }

  function handleWhatsApp() {
    if (orderDetails) {
      const message = qrisUrl
        ? buildQrisConfirmationMessage({
            orderNumber: orderDetails.orderNumber,
            orderId: orderDetails.orderId || orderId,
            items: orderDetails.items,
            total: orderDetails.total,
            customerName: orderDetails.customerName,
            notes: orderDetails.notes,
          })
        : buildCustomerOrderMessage({
            orderNumber: orderDetails.orderNumber,
            orderId: orderDetails.orderId || orderId,
            items: orderDetails.items,
            total: orderDetails.total,
            customerName: orderDetails.customerName,
            notes: orderDetails.notes,
          });
      openWhatsAppPublic(message, businessPhone);
    } else {
      const receiptLink = orderId ? `\n\nReceipt: https://tokoflow.com/r/${orderId}` : "";
      const prefix = alreadyPaid
        ? "I've paid for order"
        : qrisUrl ? "I've paid via DuitNow QR for order" : "I just placed an order";
      const message = `Hi, ${prefix} *${orderNumber}*.${receiptLink}\n\nPlease confirm — thanks!`;
      openWhatsAppPublic(message, businessPhone);
    }
  }

  async function handleSaveReceipt() {
    try {
      const scale = 2; // retina
      const w = 400 * scale;
      const pad = 32 * scale;
      const contentW = w - pad * 2;

      // Load QRIS image first if available (skip for preorder)
      let qrisImg: HTMLImageElement | null = null;
      if (qrisUrl && !isPreorder && !isLangganan) {
        qrisImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = qrisUrl;
        });
      }

      // Calculate height dynamically
      const items = orderDetails?.items || [];
      const fontSize = 13 * scale;
      const smallFont = 11 * scale;
      const tinyFont = 10 * scale;
      const titleFont = 15 * scale;
      const totalFont = 17 * scale;
      const lineH = 18 * scale;
      const sectionGap = 12 * scale;

      let h = pad; // top padding
      h += titleFont + 6 * scale; // business name
      h += smallFont + sectionGap; // order number
      h += lineH; // separator
      if (items.length > 0) {
        h += items.length * lineH; // items
        h += lineH; // separator + total
        h += totalFont + 4 * scale; // total amount
      } else if (displayTotal > 0) {
        h += totalFont + 4 * scale;
      }
      if (orderDetails?.notes) h += lineH + 2 * scale;
      if (orderDetails?.deliveryDate) h += lineH + 2 * scale;
      if (qrisImg) {
        h += sectionGap + smallFont + 6 * scale; // "Bayar via QRIS" label
        const qrisW = contentW * 0.55;
        const qrisAspect = qrisImg.naturalHeight / qrisImg.naturalWidth;
        const qrisH = qrisW * qrisAspect;
        h += qrisH + sectionGap; // QRIS image
      }
      if (orderId) h += lineH + 2 * scale; // receipt URL
      h += sectionGap + tinyFont; // branding
      h += pad; // bottom padding

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      let y = pad;

      // Business name
      ctx.fillStyle = "#1a1a1a";
      ctx.font = `bold ${titleFont}px -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(businessName || "Order", w / 2, y + titleFont);
      y += titleFont + 6 * scale;

      // Order number
      ctx.fillStyle = "#666666";
      ctx.font = `${smallFont}px monospace`;
      ctx.fillText(orderNumber, w / 2, y + smallFont);
      y += smallFont + sectionGap;

      // Separator
      ctx.strokeStyle = "#e5e5e5";
      ctx.lineWidth = scale;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
      y += lineH;

      // Items
      ctx.textAlign = "left";
      if (items.length > 0) {
        for (const item of items) {
          ctx.fillStyle = "#1a1a1a";
          ctx.font = `${fontSize}px -apple-system, sans-serif`;
          ctx.fillText(`${item.name}  x${item.qty}`, pad, y + fontSize);
          const subtotal = `RM ${(item.price * item.qty).toLocaleString("en-MY")}`;
          ctx.textAlign = "right";
          ctx.fillText(subtotal, w - pad, y + fontSize);
          ctx.textAlign = "left";
          y += lineH;
        }

        // Total separator
        ctx.strokeStyle = "#e5e5e5";
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(w - pad, y);
        ctx.stroke();
        y += lineH;

        // Total
        ctx.fillStyle = "#1a1a1a";
        ctx.font = `bold ${totalFont}px -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(`RM ${displayTotal.toLocaleString("en-MY")}`, w / 2, y + totalFont);
        y += totalFont + 4 * scale;
      } else if (displayTotal > 0) {
        ctx.fillStyle = "#1a1a1a";
        ctx.font = `bold ${totalFont}px -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(`RM ${displayTotal.toLocaleString("en-MY")}`, w / 2, y + totalFont);
        y += totalFont + 4 * scale;
      }

      // Notes
      ctx.textAlign = "left";
      if (orderDetails?.notes) {
        y += 2 * scale;
        ctx.fillStyle = "#888888";
        ctx.font = `italic ${smallFont}px -apple-system, sans-serif`;
        ctx.fillText(`Note: ${orderDetails.notes}`, pad, y + smallFont);
        y += lineH;
      }

      // Delivery date
      if (orderDetails?.deliveryDate) {
        y += 2 * scale;
        ctx.fillStyle = "#888888";
        ctx.font = `${smallFont}px -apple-system, sans-serif`;
        const dateStr = new Date(orderDetails.deliveryDate).toLocaleDateString("en-MY", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });
        ctx.fillText(`Delivery: ${dateStr}`, pad, y + smallFont);
        y += lineH;
      }

      // QRIS
      if (qrisImg) {
        y += sectionGap;
        ctx.fillStyle = "#1a1a1a";
        ctx.font = `600 ${smallFont}px -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("Pay via DuitNow QR", w / 2, y + smallFont);
        y += smallFont + 6 * scale;

        const qrisW = contentW * 0.55;
        const qrisAspect = qrisImg.naturalHeight / qrisImg.naturalWidth;
        const qrisH = qrisW * qrisAspect;
        const qrisX = (w - qrisW) / 2;
        ctx.drawImage(qrisImg, qrisX, y, qrisW, qrisH);
        y += qrisH + sectionGap;
      }

      // Receipt URL
      if (orderId) {
        y += 2 * scale;
        ctx.fillStyle = "#999999";
        const urlFont = 8 * scale;
        ctx.font = `${urlFont}px -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(`Receipt: tokoflow.com/r/${orderId}`, w / 2, y + urlFont);
        y += lineH;
      }

      // Branding
      y += sectionGap;
      ctx.fillStyle = "#cccccc";
      ctx.font = `${tinyFont}px -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Made with Tokoflow \u2014 tokoflow.com", w / 2, y + tinyFont);

      // Download as PNG
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `order-${orderNumber}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch {
      // Fallback: download just the QRIS image
      if (qrisUrl) {
        try {
          const res = await fetch(qrisUrl);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `qris-${orderNumber}.jpg`;
          a.click();
          URL.revokeObjectURL(url);
        } catch {
          window.open(qrisUrl, "_blank");
        }
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* Order summary card */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        {/* Order number */}
        {orderNumber && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">{orderNumber}</span>
            <button
              type="button"
              onClick={handleCopyOrderNumber}
              className="p-1 rounded-md hover:bg-muted transition-colors"
              aria-label="Copy order number"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-warm-green" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          </div>
        )}

        {/* Items */}
        {orderDetails && orderDetails.items.length > 0 && (
          <div className="border-t border-border pt-2 space-y-1">
            {orderDetails.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {item.name} <span className="text-muted-foreground">x{item.qty}</span>
                </span>
                <span className="text-foreground tabular-nums">
                  RM {(item.price * item.qty).toLocaleString("en-MY")}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        {displayTotal > 0 && (
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="text-sm font-medium text-foreground">Total</span>
            <span className="text-sm font-bold text-foreground">RM {displayTotal.toLocaleString("en-MY")}</span>
          </div>
        )}

        {/* Notes & delivery */}
        {orderDetails?.notes && (
          <p className="text-xs text-muted-foreground italic">Note: {orderDetails.notes}</p>
        )}
        {orderDetails?.deliveryDate && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {new Date(orderDetails.deliveryDate).toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
      </div>

      {/* QRIS payment — single unified card (hidden for preorder, and when
          Billplz already settled this order in-flow). */}
      {qrisUrl && !paidConfirmed && !isPreorder && !isLangganan && !alreadyPaid && (
        <div className="rounded-xl border bg-card p-5 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
            <QrCode className="w-4 h-4" />
            Pay via DuitNow QR
          </div>

          {displayTotal > 0 && (
            <p className="text-2xl font-bold text-foreground">
              RM {displayTotal.toLocaleString("en-MY")}
            </p>
          )}

          <div className="relative mx-auto max-w-[260px] w-full aspect-square">
            <Image
              src={qrisUrl}
              alt={`DuitNow QR payment for ${businessName}`}
              fill
              className="object-contain rounded-lg border border-border"
              sizes="260px"
              unoptimized
            />
          </div>

          <button
            type="button"
            onClick={handleSaveReceipt}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Save receipt
          </button>

          <ol className="text-xs text-muted-foreground pt-2 border-t border-border space-y-1.5 text-left">
            <li className="flex gap-2">
              <span className="text-warm-green font-semibold shrink-0">1.</span>
              Save the image
            </li>
            <li className="flex gap-2">
              <span className="text-warm-green font-semibold shrink-0">2.</span>
              Pay via your bank or e-wallet
            </li>
            <li className="flex gap-2">
              <span className="text-warm-green font-semibold shrink-0">3.</span>
              Come back here to confirm
            </li>
          </ol>

          {/* Primary CTA — claim payment */}
          <button
            type="button"
            onClick={handleClaimPayment}
            disabled={claiming}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-warm-green text-white text-sm font-semibold hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            {claiming ? "Saving..." : "I've paid"}
          </button>
        </div>
      )}

      {/* After "Sudah Bayar" — confirmation state */}
      {qrisUrl && paidConfirmed && !isPreorder && !isLangganan && !alreadyPaid && (
        <div className="rounded-xl border bg-card p-5 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-warm-green-light flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-warm-green" />
          </div>
          <p className="text-sm font-semibold text-foreground">Waiting for seller to confirm</p>
          <p className="text-xs text-muted-foreground">
            You can also confirm directly via WhatsApp
          </p>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Confirm on WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setPaidConfirmed(false)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Show QR again
          </button>
        </div>
      )}

      {/* Already paid — single confirm-via-WA card. Replaces both QR card
          and next-steps block when Billplz settled the order. */}
      {alreadyPaid && (
        <div className="rounded-xl border bg-card p-5 text-center space-y-3">
          <p className="text-sm font-medium text-foreground">All done</p>
          <p className="text-xs text-muted-foreground">
            Send a quick WhatsApp so {businessName || "the seller"} can prep your order.
          </p>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Message on WhatsApp
          </button>
        </div>
      )}

      {/* Next steps — for preorder and no-QRIS */}
      {!alreadyPaid && (isPreorder || isLangganan || !qrisUrl) && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Next steps</p>
          <ol className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-warm-green font-semibold shrink-0">1.</span>
              Seller reviews your order
            </li>
            <li className="flex gap-2">
              <span className="text-warm-green font-semibold shrink-0">2.</span>
              Confirm & discuss on WhatsApp
            </li>
            <li className="flex gap-2">
              <span className="text-warm-green font-semibold shrink-0">3.</span>
              Pay as agreed
            </li>
          </ol>
        </div>
      )}

      {/* Preorder/Langganan — confirm via WA */}
      {(isPreorder || isLangganan) && businessPhone && (
        <button
          type="button"
          onClick={handleWhatsApp}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors"
        >
          <MessageCircle className="w-4.5 h-4.5" />
          Confirm order on WhatsApp
        </button>
      )}

      {/* No QRIS — single WA button */}
      {!qrisUrl && !isPreorder && businessPhone && (
        <button
          type="button"
          onClick={handleWhatsApp}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors"
        >
          <MessageCircle className="w-4.5 h-4.5" />
          Confirm order on WhatsApp
        </button>
      )}

      {/* Secondary actions */}
      <Link
        href={`/${slug}`}
        className="w-full h-11 flex items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Order again
      </Link>
      <button
        type="button"
        onClick={handleSaveReceipt}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        <Download className="w-3.5 h-3.5" />
        Save receipt
      </button>
    </div>
  );
}
