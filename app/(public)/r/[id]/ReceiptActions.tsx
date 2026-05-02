"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, MessageCircle, RefreshCw, QrCode, Download } from "lucide-react";

interface ReceiptActionsProps {
  orderId: string;
  orderNumber: string;
  waPhone?: string | null;
  slug?: string | null;
  qrisUrl?: string | null;
  total: number;
  showPayment: boolean;
  businessName: string;
  paymentClaimedAt?: string | null;
  isPreorder?: boolean;
}

export function ReceiptActions({ orderId, orderNumber, waPhone, slug, qrisUrl, total, showPayment, businessName, paymentClaimedAt, isPreorder }: ReceiptActionsProps) {
  const [paidConfirmed, setPaidConfirmed] = useState(!!paymentClaimedAt);
  const [claiming, setClaiming] = useState(false);

  async function handleClaimPayment() {
    setClaiming(true);
    try {
      await fetch(`/api/public/orders/${orderId}/claim-payment`, { method: "POST" });
    } catch { /* fire and forget */ }
    setClaiming(false);
    setPaidConfirmed(true);
  }

  async function handleSaveQris() {
    if (!qrisUrl) return;
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

  return (
    <div className="px-5 py-4 border-t space-y-3">
      {/* QRIS + Sudah Bayar — only if unpaid and QRIS available (hidden for preorder) */}
      {showPayment && qrisUrl && !paidConfirmed && !isPreorder && (
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
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="w-3 h-3" />
            Save QR
          </button>

          <button
            type="button"
            onClick={handleClaimPayment}
            disabled={claiming}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-warm-green text-white text-sm font-semibold hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            {claiming ? "Saving..." : "I've paid"}
          </button>
        </div>
      )}

      {/* Sudah Bayar without QRIS — simple button (hidden for preorder) */}
      {showPayment && !qrisUrl && !paidConfirmed && !isPreorder && (
        <button
          type="button"
          onClick={handleClaimPayment}
          disabled={claiming}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-warm-green text-white text-sm font-semibold hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors disabled:opacity-60"
        >
          <Check className="w-4 h-4" />
          {claiming ? "Menyimpan..." : "Sudah Bayar"}
        </button>
      )}

      {/* After "Sudah Bayar" — confirmation state (hidden for preorder) */}
      {showPayment && paidConfirmed && !isPreorder && (
        <div className="rounded-lg border bg-muted/20 p-4 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-warm-green-light flex items-center justify-center mx-auto">
            <Check className="w-5 h-5 text-warm-green" />
          </div>
          <p className="text-sm font-semibold text-foreground">Waiting for seller to confirm</p>
          <p className="text-xs text-muted-foreground">
            You can also confirm directly via WhatsApp
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

      {/* Hubungi Penjual — always show for preorder, otherwise only if NOT in payment flow */}
      {waPhone && (isPreorder || ((!showPayment || (showPayment && !paidConfirmed && !qrisUrl)) && !paidConfirmed)) && (
        <a
          href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi, I have a question about order *${orderNumber}*`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-warm-green text-white text-sm font-medium hover:bg-warm-green-hover active:bg-warm-green-hover transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Contact seller
        </a>
      )}

      {/* Pesan Lagi */}
      {slug && (
        <Link
          href={`/${slug}`}
          className="w-full h-11 flex items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Order again
        </Link>
      )}
    </div>
  );
}
