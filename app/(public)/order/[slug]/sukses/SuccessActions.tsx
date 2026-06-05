"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { MessageCircle, QrCode, Download, Copy, Check, CalendarDays, Eye, ImageUp } from "lucide-react";
import { openWhatsAppPublic } from "@/lib/utils/wa-open";
import { buildCustomerOrderMessage, buildQrisConfirmationMessage } from "@/lib/utils/wa-messages";

interface OrderDetails {
  orderNumber: string;
  orderId?: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  deliveryFee?: number;
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
  isPreorder?: boolean;
  isLangganan?: boolean;
  alreadyPaid?: boolean;
  payFirst?: boolean;
  deliveryEnabled?: boolean;
  pickupEnabled?: boolean;
  // Server-fetched fallback — used when sessionStorage is unavailable
  // (new tab, page refresh, shared URL). Populated by page.tsx server component.
  serverOrderDetails?: {
    orderNumber: string | null;
    items: Array<{ name: string; qty: number; price: number }>;
    total: number;
    deliveryFee: number;
    deliveryDate: string | null;
    notes: string | null;
    customerName: string | null;
    isPreorder?: boolean;
    isLangganan?: boolean;
  };
}

export function SuccessActions({
  qrisUrl,
  businessPhone,
  orderNumber,
  orderId,
  businessName,
  slug,
  isPreorder,
  isLangganan,
  alreadyPaid,
  payFirst,
  serverOrderDetails,
  deliveryEnabled,
  pickupEnabled,
}: SuccessActionsProps) {
  // Try sessionStorage first (richest — populated at order submit time in the
  // same tab). Fall back to server-fetched data so refreshes, new tabs, and
  // shared URLs all show a complete order card instead of a blank one.
  const orderDetails = useMemo<OrderDetails | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem("tokoflow_last_order");
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<OrderDetails>;
          const matchesCurrentOrder = Boolean(
            (orderId && parsed.orderId === orderId)
            || (orderNumber && parsed.orderNumber === orderNumber)
          );
          if (matchesCurrentOrder) return parsed as OrderDetails;
        }
      } catch { /* continue to server fallback */ }
    }
    if (serverOrderDetails) {
      return {
        // Prefer URL param (already has it from order submit); fall back to
        // DB value for Billplz redirects where order= param is absent.
        orderNumber: orderNumber || serverOrderDetails.orderNumber || "",
        orderId,
        items: serverOrderDetails.items,
        total: serverOrderDetails.total,
        deliveryFee: serverOrderDetails.deliveryFee,
        deliveryDate: serverOrderDetails.deliveryDate ?? undefined,
        notes: serverOrderDetails.notes ?? undefined,
        customerName: serverOrderDetails.customerName ?? "",
      };
    }
    return null;
  }, [serverOrderDetails, orderNumber, orderId]);

  const [copied, setCopied] = useState(false);
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [proofUploading, setProofUploading] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [proofUploadedUrl, setProofUploadedUrl] = useState<string | null>(null);
  const [proofViewOpen, setProofViewOpen] = useState(false);
  const [proofError, setProofError] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [saving, setSaving] = useState(false);

  // Two separate refs — QR-first card and bottom "Already paid?" card are both
  // mounted simultaneously in payFirst mode, so they need independent inputs.
  const proofInputRefQr = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const displayTotal = orderDetails?.total ?? 0;
  const deliveryFee = Math.max(0, Number(orderDetails?.deliveryFee ?? 0) || 0);
  const orderSubtotal = orderDetails?.items.reduce((sum, item) => sum + item.price * item.qty, 0) ?? 0;
  // One-line "what you're paying for" summary, shown under the amount in the
  // QR-first flow so the customer confirms the order before transferring.
  const itemsLabel = orderDetails?.items?.length
    ? orderDetails.items.map((item) => (item.qty > 1 ? `${item.name} ×${item.qty}` : item.name)).join(", ")
    : "";

  async function handleCopyOrderNumber() {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  async function handleClaimPayment() {
    if (!orderId) {
      setClaimError("Could not save payment status. Please message on WhatsApp instead.");
      return;
    }
    setClaiming(true);
    setClaimError("");
    try {
      const res = await fetch(`/api/public/orders/${orderId}/claim-payment`, { method: "POST" });
      if (!res.ok) throw new Error("claim_failed");
      setPaidConfirmed(true);
    } catch {
      setClaimError("Could not save payment status. Try again or message on WhatsApp.");
    } finally {
      setClaiming(false);
    }
  }

  async function handleUploadProof(file: File) {
    if (!orderId) {
      setProofError(true);
      return;
    }
    setProofUploading(true);
    setProofError(false);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/public/orders/${orderId}/upload-proof`, { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        setProofUploaded(true);
        setProofUploadedUrl(data.url ?? null);
      } else setProofError(true);
    } catch {
      setProofError(true);
    }
    setProofUploading(false);
  }

  function handleWhatsApp() {
    if (orderDetails) {
      const message = qrisUrl
        ? buildQrisConfirmationMessage({
            orderNumber: orderDetails.orderNumber,
            orderId: orderDetails.orderId || orderId,
            items: orderDetails.items,
            total: orderDetails.total,
            deliveryFee: orderDetails.deliveryFee,
            customerName: orderDetails.customerName,
            notes: orderDetails.notes,
          })
        : buildCustomerOrderMessage({
            orderNumber: orderDetails.orderNumber,
            orderId: orderDetails.orderId || orderId,
            items: orderDetails.items,
            total: orderDetails.total,
            deliveryFee: orderDetails.deliveryFee,
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
    if (saving) return;
    setSaving(true);
    try {
      const scale = 2;
      const w = 400 * scale;
      const pad = 32 * scale;
      const contentW = w - pad * 2;

      let qrisImg: HTMLImageElement | null = null;
      if (qrisUrl && !isLangganan) {
        qrisImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = qrisUrl;
        });
      }

      let trackingQrImg: HTMLImageElement | null = null;
      if (orderId) {
        const trackingUrl = `https://tokoflow.com/r/${orderId}`;
        const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
          width: 240 * scale,
          margin: 1,
          color: { dark: "#1a1a1a", light: "#ffffff" },
        });
        trackingQrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = qrDataUrl;
        });
      }

      const items = orderDetails?.items || [];
      const fontSize = 13 * scale;
      const smallFont = 11 * scale;
      const tinyFont = 10 * scale;
      const titleFont = 15 * scale;
      const totalFont = 17 * scale;
      const lineH = 18 * scale;
      const sectionGap = 12 * scale;

      let h = pad;
      h += titleFont + 6 * scale;
      h += smallFont + sectionGap;
      h += lineH;
      if (items.length > 0) {
        h += items.length * lineH;
        h += lineH;
        h += totalFont + 4 * scale;
      } else if (displayTotal > 0) {
        h += totalFont + 4 * scale;
      }
      if (orderDetails?.notes) h += lineH + 2 * scale;
      if (orderDetails?.deliveryDate) h += lineH + 2 * scale;
      if (qrisImg) {
        h += sectionGap + smallFont + 6 * scale;
        const qrisW = contentW * 0.55;
        const qrisAspect = qrisImg.naturalHeight / qrisImg.naturalWidth;
        h += qrisW * qrisAspect + sectionGap;
      }
      const trackingQrSize = contentW * 0.4;
      if (trackingQrImg) {
        h += sectionGap + smallFont + 6 * scale;
        h += trackingQrSize + 4 * scale;
        h += tinyFont + sectionGap;
      } else if (orderId) {
        h += lineH + 2 * scale;
      }
      h += sectionGap + tinyFont;
      h += pad;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      let y = pad;

      // Business name — use prop which is server-fetched, not URL param
      ctx.fillStyle = "#1a1a1a";
      ctx.font = `bold ${titleFont}px -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(businessName || "Order receipt", w / 2, y + titleFont);
      y += titleFont + 6 * scale;

      ctx.fillStyle = "#666666";
      ctx.font = `${smallFont}px monospace`;
      ctx.fillText(orderNumber, w / 2, y + smallFont);
      y += smallFont + sectionGap;

      ctx.strokeStyle = "#e5e5e5";
      ctx.lineWidth = scale;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
      y += lineH;

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
        ctx.strokeStyle = "#e5e5e5";
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(w - pad, y);
        ctx.stroke();
        y += lineH;
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

      ctx.textAlign = "left";
      if (orderDetails?.notes) {
        y += 2 * scale;
        ctx.fillStyle = "#888888";
        ctx.font = `italic ${smallFont}px -apple-system, sans-serif`;
        ctx.fillText(`Note: ${orderDetails.notes}`, pad, y + smallFont);
        y += lineH;
      }

      if (orderDetails?.deliveryDate) {
        y += 2 * scale;
        ctx.fillStyle = "#888888";
        ctx.font = `${smallFont}px -apple-system, sans-serif`;
        const dateStr = new Date(orderDetails.deliveryDate).toLocaleDateString("en-MY", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });
        ctx.fillText(`Date: ${dateStr}`, pad, y + smallFont);
        y += lineH;
      }

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
        ctx.drawImage(qrisImg, (w - qrisW) / 2, y, qrisW, qrisH);
        y += qrisH + sectionGap;
      }

      if (trackingQrImg) {
        y += sectionGap;
        ctx.fillStyle = "#1a1a1a";
        ctx.font = `600 ${smallFont}px -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("Scan to check order status", w / 2, y + smallFont);
        y += smallFont + 6 * scale;
        ctx.drawImage(trackingQrImg, (w - trackingQrSize) / 2, y, trackingQrSize, trackingQrSize);
        y += trackingQrSize + 4 * scale;
        ctx.fillStyle = "#999999";
        const urlFont = 8 * scale;
        ctx.font = `${urlFont}px -apple-system, sans-serif`;
        ctx.fillText(`tokoflow.com/r/${orderId}`, w / 2, y + urlFont);
        y += urlFont + sectionGap;
      } else if (orderId) {
        y += 2 * scale;
        ctx.fillStyle = "#999999";
        const urlFont = 8 * scale;
        ctx.font = `${urlFont}px -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(`Receipt: tokoflow.com/r/${orderId}`, w / 2, y + urlFont);
        y += lineH;
      }

      y += sectionGap;
      ctx.fillStyle = "#cccccc";
      ctx.font = `${tinyFont}px -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Made with Tokoflow — tokoflow.com", w / 2, y + tinyFont);

      canvas.toBlob((blob) => {
        if (!blob) {
          setSaving(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tokoflow-receipt-${orderNumber}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSaving(false);
      }, "image/png");
    } catch {
      setSaving(false);
      if (qrisUrl) {
        try {
          const res = await fetch(qrisUrl);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `tokoflow-duitnow-qr-${orderNumber}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch {
          window.open(qrisUrl, "_blank");
        }
      }
    }
  }

  return (
    <div className="space-y-3">

      {/* QR-first header — owned here (not page.tsx) so it reflects the live
          payment state: "pay now" while paying; once the receipt is sent it's
          hidden and the green "Payment receipt sent!" card becomes the hero. */}
      {payFirst && !alreadyPaid && !paidConfirmed && (
        <div className="text-center mb-1">
          <div className="w-14 h-14 rounded-full bg-warm-green-light flex items-center justify-center mx-auto mb-3">
            <QrCode className="w-7 h-7 text-warm-green" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-1.5">
            Order placed — pay now
          </h1>
          <p className="text-sm text-muted-foreground">
            Scan the QR below, then upload your payment receipt to complete.
          </p>
        </div>
      )}

      {/* ── QR-FIRST FLOW ──────────────────────────────────────────────────── */}
      {payFirst && qrisUrl && !alreadyPaid && !paidConfirmed && (
        <div className="rounded-2xl border border-warm-green/30 bg-card p-5 space-y-4">
          {/* Amount + what you're paying for — confirm before transferring */}
          {displayTotal > 0 && (
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground tabular-nums">
                RM {displayTotal.toLocaleString("en-MY")}
              </p>
              {itemsLabel && (
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{itemsLabel}</p>
              )}
            </div>
          )}

          {/* Step 1 — Pay via DuitNow QR */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-warm-green text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
              <p className="text-sm font-semibold text-foreground">Pay with DuitNow QR</p>
            </div>

            <div className="relative mx-auto max-w-[240px] w-full aspect-square">
              <Image
                src={qrisUrl}
                alt="DuitNow QR payment"
                fill
                className="object-contain rounded-2xl border border-border"
                sizes="240px"
                unoptimized
              />
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch(qrisUrl);
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `duitnow-qr-${orderNumber}.jpg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch {
                  window.open(qrisUrl, "_blank");
                }
              }}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-warm-green/40 bg-warm-green/5 text-warm-green text-sm font-semibold hover:bg-warm-green/10 transition-colors"
            >
              <Download className="w-4 h-4" />
              Save QR Code to Gallery
            </button>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Open your banking or e-wallet app, choose <span className="font-medium text-foreground">Scan QR</span> → upload the saved image, then pay{displayTotal > 0 ? ` RM ${displayTotal.toLocaleString("en-MY")}` : ""}.
            </p>
          </div>

          {/* Step 2 — Upload payment receipt */}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-full bg-warm-green text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                <p className="text-sm font-semibold text-foreground truncate">Upload payment receipt</p>
              </div>
              <span className="text-[10px] font-medium text-warm-green bg-warm-green/15 px-2 py-0.5 rounded-full shrink-0">Required</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Screenshot the transfer confirmation, then upload it here.</p>

            {/* Separate ref from the bottom card's input to avoid ref collision */}
            <input
              ref={proofInputRefQr}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadProof(file);
                e.target.value = "";
              }}
            />
            {proofUploaded ? (
              <button
                type="button"
                onClick={() => proofUploadedUrl && setProofViewOpen(true)}
                className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-warm-green hover:text-warm-green/80 transition-colors w-full"
              >
                <Check className="w-4 h-4" />
                Receipt uploaded {proofUploadedUrl && <span className="text-xs opacity-70">· Tap to view</span>}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => proofInputRefQr.current?.click()}
                  disabled={proofUploading}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-warm-green text-white text-sm font-semibold hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors disabled:opacity-50"
                >
                  <ImageUp className="w-4 h-4" />
                  {proofUploading ? "Uploading..." : "Upload payment screenshot"}
                </button>
                {proofError && (
                  <p className="text-xs text-warm-rose text-center">Upload failed — tap to try again</p>
                )}
              </>
            )}
          </div>

          {/* Step 3 — Confirm payment */}
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${proofUploaded ? "bg-warm-green text-white" : "bg-muted text-muted-foreground"}`}>3</span>
              <p className={`text-sm font-semibold ${proofUploaded ? "text-foreground" : "text-muted-foreground"}`}>Confirm payment</p>
            </div>
            <button
              type="button"
              onClick={handleClaimPayment}
              disabled={claiming || !proofUploaded}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-warm-green text-white text-sm font-semibold hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              {claiming ? "Saving..." : "Payment done"}
            </button>
            {claimError && (
              <p className="text-center text-xs text-warm-rose">{claimError}</p>
            )}
            {!proofUploaded && (
              <p className="text-center text-[10px] text-muted-foreground">
                Upload your receipt above to enable this
              </p>
            )}
          </div>
        </div>
      )}

      {/* QR-first — after payment confirmed */}
      {payFirst && paidConfirmed && !alreadyPaid && (
        <div className="rounded-2xl border border-warm-green/30 bg-warm-green-light/40 p-5 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-warm-green flex items-center justify-center mx-auto">
            <Check className="w-7 h-7 text-white" />
          </div>
          <p className="text-base font-semibold text-foreground">Payment receipt sent!</p>
          <p className="text-xs text-muted-foreground">
            {businessName || "The business"} will verify and confirm your order shortly.
          </p>
          {orderId && (
            <a
              href={`/r/${orderId}`}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-warm-green/30 text-warm-green text-sm font-semibold hover:bg-warm-green-light/60 transition-colors"
            >
              <Eye className="w-4 h-4" />
              View order status
            </a>
          )}
          {businessPhone && (
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Message {businessName || "the business"} on WhatsApp
            </button>
          )}
        </div>
      )}

      {/* Order summary card */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        {orderNumber && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">{orderNumber}</span>
            <button
              type="button"
              onClick={handleCopyOrderNumber}
              className="p-1 rounded-md hover:bg-muted transition-colors"
              aria-label="Copy order number"
            >
              {copied
                ? <Check className="w-3.5 h-3.5 text-warm-green" />
                : <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              }
            </button>
          </div>
        )}

        {orderDetails && orderDetails.items.length > 0 && (
          <div className="border-t border-border pt-2 space-y-1">
            {orderDetails.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-foreground">
                  {item.name} <span className="text-muted-foreground">x{item.qty}</span>
                </span>
                <span className="shrink-0 text-foreground tabular-nums">
                  RM {(item.price * item.qty).toLocaleString("en-MY")}
                </span>
              </div>
            ))}
            {deliveryFee > 0 && (
              <>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-muted-foreground tabular-nums">RM {orderSubtotal.toLocaleString("en-MY")}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-muted-foreground tabular-nums">RM {deliveryFee.toLocaleString("en-MY")}</span>
                </div>
              </>
            )}
          </div>
        )}

        {displayTotal > 0 && (
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="text-sm font-medium text-foreground">Total</span>
            <span className="text-sm font-bold text-foreground">RM {displayTotal.toLocaleString("en-MY")}</span>
          </div>
        )}

        {orderDetails?.notes && (
          <p className="text-xs text-muted-foreground italic">Note: {orderDetails.notes}</p>
        )}
        {orderDetails?.deliveryDate && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {isPreorder
              ? deliveryEnabled && !pickupEnabled ? "Delivery:"
                : pickupEnabled && !deliveryEnabled ? "Pickup:"
                : "Date:"
              : "Date:"}{" "}
            {new Date(orderDetails.deliveryDate).toLocaleDateString("en-MY", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* DuitNow QR payment card — legacy flow (hidden in payFirst which shows QR above) */}
      {qrisUrl && !paidConfirmed && !isLangganan && !alreadyPaid && !payFirst && (
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

          <button
            type="button"
            onClick={handleClaimPayment}
            disabled={claiming}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-warm-green text-white text-sm font-semibold hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            {claiming ? "Saving..." : "I've paid"}
          </button>
          {claimError && (
            <p className="text-xs text-warm-rose">{claimError}</p>
          )}
        </div>
      )}

      {/* After QR claim */}
      {qrisUrl && paidConfirmed && !isLangganan && !alreadyPaid && !payFirst && (
        <div className="rounded-xl border bg-card p-5 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-warm-green-light flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-warm-green" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {businessName || "The business"} will verify and confirm your order shortly
          </p>
          {businessPhone && (
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Message on WhatsApp
            </button>
          )}
          <button
            type="button"
            onClick={() => setPaidConfirmed(false)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Show QR again
          </button>
        </div>
      )}

      {/* Billplz already paid — single WA card */}
      {alreadyPaid && (
        <div className="rounded-xl border bg-card p-5 text-center space-y-3">
          <p className="text-sm font-medium text-foreground">All done</p>
          <p className="text-xs text-muted-foreground">
            Send a quick WhatsApp so {businessName || "the business"} can prep your order.
          </p>
          {businessPhone && (
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Message on WhatsApp
            </button>
          )}
        </div>
      )}

      {/* Next steps — shown for preorder / langganan / no-payment-method flows */}
      {!alreadyPaid && !payFirst && (isPreorder || isLangganan || !qrisUrl) && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Next steps</p>
          <ol className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-warm-green font-semibold shrink-0">1.</span>
              {businessName || "The business"} reviews your order
            </li>
            <li className="flex gap-2">
              <span className="text-warm-green font-semibold shrink-0">2.</span>
              They&apos;ll WhatsApp you to confirm
            </li>
            <li className="flex gap-2">
              <span className="text-warm-green font-semibold shrink-0">3.</span>
              Pay once confirmed
            </li>
          </ol>
        </div>
      )}

      {/* WhatsApp CTA — one button, one condition. Merged from the two
          duplicate blocks that previously caused two buttons for langganan
          merchants with no QR. */}
      {businessPhone && !payFirst && !alreadyPaid && (isPreorder || isLangganan || !qrisUrl) && (
        <button
          type="button"
          onClick={handleWhatsApp}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors"
        >
          <MessageCircle className="w-4.5 h-4.5" />
          Confirm order on WhatsApp
        </button>
      )}

      {/* Already paid? — only shown for QR-payment merchants where the customer
          may have already scanned and paid. Hidden for non-QR flows because
          payment hasn't been requested yet (Next steps: "Pay once confirmed"). */}
      {orderId && !alreadyPaid && !paidConfirmed && !payFirst && !!qrisUrl && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <input
            ref={proofInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadProof(file);
              e.target.value = "";
            }}
          />
          {proofUploaded ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-10 h-10 rounded-full bg-warm-green-light flex items-center justify-center">
                <Check className="w-5 h-5 text-warm-green" />
              </div>
              <button
                type="button"
                onClick={() => proofUploadedUrl && setProofViewOpen(true)}
                className="text-sm font-medium text-foreground hover:text-warm-green transition-colors"
              >
                Payment proof sent! {proofUploadedUrl && <span className="text-xs text-muted-foreground">· Tap to view</span>}
              </button>
              <p className="text-xs text-muted-foreground">{businessName || "The business"} will verify and confirm your order</p>
              {businessPhone && (
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="mt-1 w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message {businessName || "the business"} on WhatsApp
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <ImageUp className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Already paid?</p>
                  <p className="text-xs text-muted-foreground">Attach proof so {businessName || "the business"} can confirm faster</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => proofInputRef.current?.click()}
                disabled={proofUploading}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 text-sm font-medium text-muted-foreground hover:border-warm-green/40 hover:text-warm-green hover:bg-warm-green/5 transition-colors disabled:opacity-50"
              >
                <ImageUp className="w-4 h-4" />
                {proofUploading ? "Uploading..." : "Tap to attach screenshot"}
              </button>
              {proofError && (
                <p className="text-xs text-destructive text-center">Upload failed — try again</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Save receipt + View status — equal weight side by side.
          Save receipt is the customer's persistent proof; View status lets
          them track without saving. Both secondary, same visual weight.
          Hidden in the QR-first (payFirst) flow until payment is confirmed —
          the customer must upload a receipt + tap "Payment done" first, so they
          can't skip straight to "View status" without paying. */}
      {(!payFirst || paidConfirmed) && (orderId ? (
        <>
          {payFirst && paidConfirmed ? (
            // Post-payment: the green card already has "View order status", so
            // the bottom row offers only the unique action — Save receipt.
            <button
              type="button"
              onClick={handleSaveReceipt}
              disabled={saving}
              className="w-full h-11 flex items-center justify-center gap-1.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {saving ? "Saving..." : "Save receipt"}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSaveReceipt}
                disabled={saving}
                className="h-11 flex items-center justify-center gap-1.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {saving ? "Saving..." : "Save receipt"}
              </button>
              <Link
                href={`/r/${orderId}`}
                className="h-11 flex items-center justify-center gap-1.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Eye className="w-4 h-4" />
                View status
              </Link>
            </div>
          )}
          <p className="text-center text-[11px] text-muted-foreground/60">
            Receipt has a QR — scan anytime to check your order status.
          </p>
        </>
      ) : (
        <button
          type="button"
          onClick={handleSaveReceipt}
          disabled={saving}
          className="w-full h-11 flex items-center justify-center gap-1.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {saving ? "Saving..." : "Save receipt"}
        </button>
      ))}

      {/* Proof view modal — customer can verify their upload was correct */}
      {proofViewOpen && proofUploadedUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setProofViewOpen(false)}
        >
          <div
            className="bg-background rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Your Payment Proof</p>
              <button
                type="button"
                onClick={() => setProofViewOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <Eye className="w-0 h-0 hidden" aria-hidden />
                <span className="text-muted-foreground text-sm">✕</span>
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-border bg-muted/30">
              <img
                src={proofUploadedUrl}
                alt="Your payment proof"
                className="w-full object-contain max-h-[60vh]"
              />
            </div>
            <a
              href={proofUploadedUrl}
              download={`payment-proof-${orderNumber}.jpg`}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-warm-green text-white text-sm font-semibold hover:bg-warm-green-hover transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
            <button
              type="button"
              onClick={() => setProofViewOpen(false)}
              className="w-full h-10 flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
