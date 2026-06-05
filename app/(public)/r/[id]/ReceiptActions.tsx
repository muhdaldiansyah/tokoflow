"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { Check, MessageCircle, ShoppingCart, QrCode, Download, ImageUp, X } from "lucide-react";

interface ReceiptActionsProps {
  orderId: string;
  orderNumber: string;
  waPhone?: string | null;
  slug?: string | null;
  qrisUrl?: string | null;
  total: number;
  deliveryFee?: number;
  items?: Array<{ name: string; qty: number; price: number }>;
  deliveryDate?: string | null;
  notes?: string | null;
  showPayment: boolean;
  businessName: string;
  paymentClaimedAt?: string | null;
  orderStatus?: string;
}

export function ReceiptActions({ orderId, orderNumber, waPhone, slug, qrisUrl, total, deliveryFee, items, deliveryDate, notes, showPayment, businessName, paymentClaimedAt, orderStatus }: ReceiptActionsProps) {
  const [paidConfirmed, setPaidConfirmed] = useState(!!paymentClaimedAt);
  const [claiming, setClaiming] = useState(false);
  const [proofUploading, setProofUploading] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [proofUploadedUrl, setProofUploadedUrl] = useState<string | null>(null);
  const [proofViewOpen, setProofViewOpen] = useState(false);
  const [proofError, setProofError] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [saving, setSaving] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);

  // Phone verification — gates all write actions (upload + claim) so only
  // the customer who placed the order can use them, not random link holders.
  const sessionKey = `receipt_verified_${orderId}`;
  const [phoneVerified, setPhoneVerified] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(sessionKey) === "1";
  });
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  async function handleVerifyPhone() {
    if (!verifyPhone.trim()) return;
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch(`/api/public/orders/${orderId}/verify-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: verifyPhone.trim() }),
      });
      const data = await res.json();
      if (data.verified) {
        sessionStorage.setItem(sessionKey, "1");
        setPhoneVerified(true);
      } else {
        setVerifyError("Number doesn't match. Please enter the WhatsApp number you used when ordering.");
      }
    } catch {
      setVerifyError("Could not verify — check your connection and try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleClaimPayment() {
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
      } else {
        setProofError(true);
      }
    } catch {
      setProofError(true);
    } finally {
      setProofUploading(false);
    }
  }

  async function handleDownloadUploadedProof() {
    if (!proofUploadedUrl) return;
    try {
      const res = await fetch(proofUploadedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment-proof-${orderNumber}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(proofUploadedUrl, "_blank");
    }
  }

  async function handleDownloadReceipt() {
    if (saving) return;
    setSaving(true);
    try {
      const scale = 2;
      const w = 400 * scale;
      const pad = 32 * scale;
      const contentW = w - pad * 2;
      const lineH = 18 * scale;
      const sectionGap = 12 * scale;
      const fontSize = 13 * scale;
      const smallFont = 11 * scale;
      const tinyFont = 10 * scale;
      const titleFont = 15 * scale;
      const totalFont = 17 * scale;
      const orderItems = items ?? [];
      const fee = Math.max(0, Number(deliveryFee ?? 0) || 0);
      const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);

      // Generate tracking QR
      let trackingQrImg: HTMLImageElement | null = null;
      const trackingUrl = `https://tokoflow.com/r/${orderId}`;
      const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
        width: 240 * scale, margin: 1,
        color: { dark: "#1a1a1a", light: "#ffffff" },
      });
      trackingQrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = qrDataUrl;
      });
      const trackingQrSize = contentW * 0.4;

      // Calculate height
      let h = pad;
      h += titleFont + 6 * scale;           // business name
      h += smallFont + sectionGap;          // order number
      h += lineH;                           // separator
      if (orderItems.length > 0) {
        h += orderItems.length * lineH;
        if (fee > 0) h += lineH * 2;
        h += lineH;
        h += totalFont + 4 * scale;
      } else {
        h += totalFont + 4 * scale;
      }
      if (notes) h += lineH + 2 * scale;
      if (deliveryDate) h += lineH + 2 * scale;
      h += sectionGap + smallFont + 6 * scale; // QR label
      h += trackingQrSize + 4 * scale;
      h += tinyFont + sectionGap;
      h += sectionGap + tinyFont;
      h += pad;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      let y = pad;

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
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
      y += lineH;

      ctx.textAlign = "left";
      if (orderItems.length > 0) {
        for (const item of orderItems) {
          ctx.fillStyle = "#1a1a1a";
          ctx.font = `${fontSize}px -apple-system, sans-serif`;
          ctx.fillText(`${item.name}  x${item.qty}`, pad, y + fontSize);
          ctx.textAlign = "right";
          ctx.fillText(`RM ${(item.price * item.qty).toLocaleString("en-MY")}`, w - pad, y + fontSize);
          ctx.textAlign = "left";
          y += lineH;
        }
        if (fee > 0) {
          ctx.fillStyle = "#888888";
          ctx.font = `${smallFont}px -apple-system, sans-serif`;
          ctx.fillText("Subtotal", pad, y + smallFont);
          ctx.textAlign = "right";
          ctx.fillText(`RM ${subtotal.toLocaleString("en-MY")}`, w - pad, y + smallFont);
          ctx.textAlign = "left";
          y += lineH;
          ctx.fillText("Delivery", pad, y + smallFont);
          ctx.textAlign = "right";
          ctx.fillText(`RM ${fee.toLocaleString("en-MY")}`, w - pad, y + smallFont);
          ctx.textAlign = "left";
          y += lineH;
        }
        ctx.strokeStyle = "#e5e5e5";
        ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
        y += lineH;
      }
      ctx.fillStyle = "#1a1a1a";
      ctx.font = `bold ${totalFont}px -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`RM ${total.toLocaleString("en-MY")}`, w / 2, y + totalFont);
      y += totalFont + 4 * scale;

      ctx.textAlign = "left";
      if (notes) {
        y += 2 * scale;
        ctx.fillStyle = "#888888";
        ctx.font = `italic ${smallFont}px -apple-system, sans-serif`;
        ctx.fillText(`Note: ${notes}`, pad, y + smallFont);
        y += lineH;
      }
      if (deliveryDate) {
        y += 2 * scale;
        ctx.fillStyle = "#888888";
        ctx.font = `${smallFont}px -apple-system, sans-serif`;
        const dateStr = new Date(deliveryDate).toLocaleDateString("en-MY", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });
        ctx.fillText(`Date: ${dateStr}`, pad, y + smallFont);
        y += lineH;
      }

      y += sectionGap;
      ctx.fillStyle = "#1a1a1a";
      ctx.font = `600 ${smallFont}px -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Scan to check order status", w / 2, y + smallFont);
      y += smallFont + 6 * scale;
      ctx.drawImage(trackingQrImg, (w - trackingQrSize) / 2, y, trackingQrSize, trackingQrSize);
      y += trackingQrSize + 4 * scale;
      ctx.fillStyle = "#999999";
      ctx.font = `${8 * scale}px -apple-system, sans-serif`;
      ctx.fillText(`tokoflow.com/r/${orderId}`, w / 2, y + 8 * scale);
      y += 8 * scale + sectionGap;

      y += sectionGap;
      ctx.fillStyle = "#cccccc";
      ctx.font = `${tinyFont}px -apple-system, sans-serif`;
      ctx.fillText("Made with Tokoflow — tokoflow.com", w / 2, y + tinyFont);

      canvas.toBlob((blob) => {
        if (!blob) { setSaving(false); return; }
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
    }
  }

  async function handleSaveQris() {
    if (!qrisUrl) return;
    try {
      const res = await fetch(qrisUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tokoflow-duitnow-qr-${orderNumber}.jpg`;
      // Anchor must be in DOM before click(), else Chrome/Safari ignore the
      // `download` attr and save the file as the blob URL's UUID with no
      // extension. Append → click → remove is the canonical pattern.
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(qrisUrl, "_blank");
    }
  }

  return (
    <div className="px-5 py-4 border-t space-y-3">
      {/* Phone verification gate — only for unpaid orders with pending actions.
          Prevents random link holders from uploading garbage or false payment claims. */}
      {showPayment && !paidConfirmed && !phoneVerified && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Confirm it&apos;s you</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter the WhatsApp number you used when placing this order
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="tel"
              value={verifyPhone}
              onChange={(e) => { setVerifyPhone(e.target.value); setVerifyError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyPhone()}
              placeholder="01X XXXX XXXX"
              className="flex-1 h-10 px-3 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-warm-green/20 focus:border-warm-green/40"
            />
            <button
              type="button"
              onClick={handleVerifyPhone}
              disabled={verifying || !verifyPhone.trim()}
              className="h-10 px-4 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover transition-colors disabled:opacity-50"
            >
              {verifying ? "..." : "Verify"}
            </button>
          </div>
          {verifyError && (
            <p className="text-xs text-warm-rose">{verifyError}</p>
          )}
        </div>
      )}

      {/* DuitNow QR + claim-payment — shown while order is unpaid and QR is available. */}
      {showPayment && qrisUrl && !paidConfirmed && phoneVerified && (
        <div className="rounded-lg border bg-muted/20 p-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-foreground">
            <QrCode className="w-3.5 h-3.5" />
            Pay via DuitNow QR
          </div>

          {total > 0 && (
            <p className="text-lg font-bold text-foreground">
              RM {total.toLocaleString("en-MY")}
            </p>
          )}

          <div className="relative mx-auto max-w-[200px] w-full aspect-square">
            <Image
              src={qrisUrl}
              alt={`DuitNow QR ${businessName}`}
              fill
              className="object-contain rounded-lg border border-border"
              sizes="200px"
              unoptimized
            />
          </div>

          <button
            type="button"
            onClick={handleSaveQris}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            Save QR Code
          </button>

          {/* Payment screenshot upload — prominent */}
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

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
            <p className="text-xs font-semibold text-amber-800 text-center">Upload payment receipt</p>
            <p className="text-[10px] text-amber-700 text-center">Take a screenshot of your transfer, then upload here</p>
            {proofUploaded ? (
              <button
                type="button"
                onClick={() => proofUploadedUrl && setProofViewOpen(true)}
                className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-warm-green hover:text-warm-green/80 transition-colors"
              >
                <Check className="w-4 h-4" />
                Payment proof sent! {proofUploadedUrl && <span className="text-xs opacity-70">· Tap to view</span>}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => proofInputRef.current?.click()}
                  disabled={proofUploading}
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 active:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <ImageUp className="w-4 h-4" />
                  {proofUploading ? "Uploading..." : "Upload receipt screenshot"}
                </button>
                {proofError && (
                  <p className="text-xs text-warm-rose text-center">Upload failed — tap to try again</p>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleClaimPayment}
            disabled={claiming || !proofUploaded}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-warm-green text-white text-sm font-semibold hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            {claiming ? "Saving..." : proofUploaded ? "I've paid" : "Upload receipt first"}
          </button>
          {claimError && (
            <p className="text-xs text-warm-rose text-center">{claimError}</p>
          )}
          {!proofUploaded && (
            <p className="text-[10px] text-muted-foreground text-center">
              Upload your payment receipt above to enable this button
            </p>
          )}
        </div>
      )}

      {/* Claim-payment without QR — optional proof upload + I've paid button.
          Upload is optional here (cash / manual bank transfer customers may
          not have a digital screenshot), so the button stays enabled regardless. */}
      {showPayment && !qrisUrl && !paidConfirmed && phoneVerified && (
        <div className="space-y-3">
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
            <div className="flex items-center justify-center gap-2 py-1 text-sm font-medium text-warm-green">
              <Check className="w-4 h-4" />
              Payment proof sent!
            </div>
          ) : (
            <button
              type="button"
              onClick={() => proofInputRef.current?.click()}
              disabled={proofUploading}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 text-sm text-muted-foreground hover:border-warm-green/40 hover:text-warm-green hover:bg-warm-green/5 transition-colors disabled:opacity-50"
            >
              <ImageUp className="w-4 h-4" />
              {proofUploading ? "Uploading..." : "Attach payment screenshot (optional)"}
            </button>
          )}
          <button
            type="button"
            onClick={handleClaimPayment}
            disabled={claiming}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-warm-green text-white text-sm font-semibold hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            {claiming ? "Saving..." : "I've paid"}
          </button>
          {proofError && (
            <p className="text-xs text-warm-rose text-center">Upload failed — try again</p>
          )}
          {claimError && (
            <p className="text-xs text-warm-rose text-center">{claimError}</p>
          )}
        </div>
      )}

      {/* After claim — confirmation state. */}
      {showPayment && paidConfirmed && (
        <div className="rounded-lg border bg-muted/20 p-4 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-warm-green-light flex items-center justify-center mx-auto">
            <Check className="w-5 h-5 text-warm-green" />
          </div>
          <p className="text-sm font-semibold text-foreground">Waiting for {businessName} to confirm</p>
          <p className="text-xs text-muted-foreground">
            {waPhone ? "You can also confirm directly via WhatsApp" : "Your payment claim was saved"}
          </p>
          {waPhone && (
            <a
              href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi, I've paid for order *${orderNumber}*. Please confirm — thanks!`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Confirm on WhatsApp
            </a>
          )}
          {qrisUrl && (
            <button
              type="button"
              onClick={() => setPaidConfirmed(false)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Show QR again
            </button>
          )}
        </div>
      )}

      {/* Contact merchant — always available while payment hasn't been confirmed. */}
      {waPhone && !paidConfirmed && (
        <a
          href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi, I have a question about order *${orderNumber}*`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-11 flex items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Message on WhatsApp
        </a>
      )}

      {/* Download receipt — available to both customer and merchant */}
      <button
        type="button"
        onClick={handleDownloadReceipt}
        disabled={saving}
        className="w-full h-11 flex items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {saving ? "Saving..." : "Download receipt"}
      </button>

      {/* Order again — only meaningful once the current order is done or cancelled */}
      {slug && (orderStatus === "done" || orderStatus === "cancelled") && (
        <Link
          href={`/${slug}`}
          className="w-full h-11 flex items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          Order again
        </Link>
      )}

      {/* Payment proof view modal */}
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
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="rounded-xl overflow-hidden border border-border bg-muted/30">
            <img
              src={proofUploadedUrl}
              alt="Your payment proof"
              className="w-full object-contain max-h-[60vh]"
            />
          </div>
          <button
            type="button"
            onClick={handleDownloadUploadedProof}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-warm-green text-white text-sm font-semibold hover:bg-warm-green-hover transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
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
