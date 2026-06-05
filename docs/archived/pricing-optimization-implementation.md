# Pricing Optimization — Implementation Guide

> All code changes needed to implement the 6 pricing optimizations.
> Each section = 1 file with exact changes.

---

## Overview

| # | Optimization | Files |
|---|---|---|
| 1 | Unlimited Rp35K → Rp39K | `config/plans.ts` |
| 2 | Add Medium Pack Rp25K/100 | `config/plans.ts`, `pengaturan/page.tsx`, `billing/payments/route.ts`, `billing/webhook/route.ts`, `pricing/page.tsx`, `mitra/page.tsx`, migration `044` |
| 3 | Per-order price framing on nudges | `pengaturan/page.tsx` |
| 4 | Per-order subtitle on purchase buttons | `pengaturan/page.tsx` |
| 5 | Value anchoring on pricing page | `pricing/page.tsx` |
| 6 | Update mitra commission examples | `mitra/page.tsx` |

---

## File 1: `config/plans.ts`

**Changes:** Raise unlimited price + add medium pack constants

```ts
// Order quota pricing constants
export const FREE_MONTHLY_ORDERS = 50;
export const PACK_ORDERS = 50;
export const PACK_PRICE = 15000;
export const PACK_CODE = "pack";
export const UNLIMITED_PACK_THRESHOLD = 3; // 3rd pack = unlimited rest of month

// Medium pack
export const MEDIUM_PACK_ORDERS = 100;
export const MEDIUM_PACK_PRICE = 25000;
export const MEDIUM_PACK_CODE = "medium_pack";

// Unlimited monthly plan
export const UNLIMITED_CODE = "unlimited";
export const UNLIMITED_PRICE = 39000;

// Nudge thresholds (orders used in free tier)
export const NUDGE_SOFT = 40;    // "bisnis lagi rame!"
export const NUDGE_MEDIUM = 45;  // "5 pesanan gratis tersisa"
export const NUDGE_URGENT = 48;  // "2 pesanan gratis tersisa"

// Helper: get total orders remaining (free + pack credits)
export function getOrdersRemaining(profile: {
  orders_used?: number;
  order_credits?: number;
  unlimited_until?: string | null;
}): number {
  // Unlimited
  if (profile.unlimited_until && new Date(profile.unlimited_until) > new Date()) {
    return Infinity;
  }
  const used = profile.orders_used ?? 0;
  const credits = profile.order_credits ?? 0;
  const freeRemaining = Math.max(0, FREE_MONTHLY_ORDERS - used);
  return freeRemaining + credits;
}

// Helper: check if unlimited is active
export function isUnlimited(profile: {
  unlimited_until?: string | null;
}): boolean {
  if (!profile.unlimited_until) return false;
  return new Date(profile.unlimited_until) > new Date();
}

// Helper: check if order quota is exhausted
export function isOrderQuotaExhausted(profile: {
  orders_used?: number;
  order_credits?: number;
  unlimited_until?: string | null;
}): boolean {
  return getOrdersRemaining(profile) <= 0;
}

// Helper: get free orders used this month
export function getFreeOrdersUsed(profile: {
  orders_used?: number;
}): number {
  return Math.min(profile.orders_used ?? 0, FREE_MONTHLY_ORDERS);
}

// Helper: get nudge level based on usage
export function getNudgeLevel(profile: {
  orders_used?: number;
  order_credits?: number;
  unlimited_until?: string | null;
}): "none" | "soft" | "medium" | "urgent" | "exhausted" {
  if (isUnlimited(profile)) return "none";
  const used = profile.orders_used ?? 0;
  const credits = profile.order_credits ?? 0;

  // If they have pack credits, no nudge on free tier
  if (credits > 0) return "none";

  if (used >= FREE_MONTHLY_ORDERS) return "exhausted";
  if (used >= NUDGE_URGENT) return "urgent";
  if (used >= NUDGE_MEDIUM) return "medium";
  if (used >= NUDGE_SOFT) return "soft";
  return "none";
}

export function formatPrice(price: number): string {
  if (price === 0) return "Rp0";
  if (price >= 1000) return `Rp${Math.round(price / 1000)}K`;
  return `Rp${price.toLocaleString("id-ID")}`;
}
```

---

## File 2: `app/api/billing/payments/route.ts`

**Changes:** Add medium pack branch

```ts
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createSnapTransaction } from "@/features/billing/services/payment-service";
import { PACK_CODE, PACK_PRICE, PACK_ORDERS, MEDIUM_PACK_CODE, MEDIUM_PACK_PRICE, MEDIUM_PACK_ORDERS, UNLIMITED_CODE, UNLIMITED_PRICE } from "@/config/plans";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planCode } = body;

    // Determine plan details
    let code: string;
    let name: string;
    let amount: number;

    if (planCode === PACK_CODE) {
      code = PACK_CODE;
      name = `Paket ${PACK_ORDERS} Pesanan`;
      amount = PACK_PRICE;
    } else if (planCode === MEDIUM_PACK_CODE) {
      code = MEDIUM_PACK_CODE;
      name = `Paket ${MEDIUM_PACK_ORDERS} Pesanan`;
      amount = MEDIUM_PACK_PRICE;
    } else if (planCode === UNLIMITED_CODE) {
      code = UNLIMITED_CODE;
      name = "Unlimited 1 Bulan";
      amount = UNLIMITED_PRICE;
    } else {
      return NextResponse.json(
        { error: "Invalid plan code" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const { orderId, snapToken, redirectUrl } = await createSnapTransaction({
      userId: user.id,
      userEmail: user.email!,
      userName: profile?.full_name || undefined,
      planCode: code,
      planName: name,
      amount,
      billingCycle: "monthly",
    });

    const serviceClient = await createServiceClient();

    const { data: paymentOrder, error: orderError } = await serviceClient
      .from("payment_orders")
      .insert({
        user_id: user.id,
        plan_code: code,
        billing_cycle: "monthly",
        status: "pending",
        amount,
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Error creating payment order:", orderError);
      return NextResponse.json(
        { error: "Failed to create payment order" },
        { status: 500 }
      );
    }

    const { error: txError } = await serviceClient
      .from("transactions")
      .insert({
        payment_order_id: paymentOrder.id,
        midtrans_order_id: orderId,
        status: "pending",
        gross_amount: amount,
      });

    if (txError) {
      console.error("Error creating transaction:", txError);
    }

    return NextResponse.json({ orderId, snapToken, redirectUrl });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## File 3: `app/api/billing/webhook/route.ts`

**Changes:** Handle medium pack in webhook + use correct price for referral commission

```ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySignature } from "@/lib/midtrans/client";
import {
  mapMidtransStatusToOrderStatus,
  type MidtransNotification,
  type MidtransTransactionStatus,
} from "@/lib/midtrans/types";
import { PACK_CODE, MEDIUM_PACK_CODE, UNLIMITED_CODE, PACK_PRICE, MEDIUM_PACK_PRICE, UNLIMITED_PRICE } from "@/config/plans";
import { REFERRAL_COMMISSION_RATE } from "@/lib/utils/constants";

// Direct supabase-js client for webhook (no cookie context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const notification: MidtransNotification = await request.json();
    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      status_code,
      signature_key,
      payment_type,
    } = notification;

    // Log webhook
    await supabase.from("webhook_logs").insert({
      order_id,
      event_type: transaction_status,
      payload: notification,
      status: "success",
    });

    // Verify signature
    const isValid = verifySignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );

    if (!isValid) {
      await supabase.from("webhook_logs").insert({
        order_id,
        event_type: "signature_verification_failed",
        payload: notification,
        status: "failed",
        error_message: "Invalid signature",
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Map Midtrans status to our status
    const orderStatus = mapMidtransStatusToOrderStatus(
      transaction_status as MidtransTransactionStatus,
      fraud_status
    );

    // Get transaction with payment order
    const { data: transaction } = await supabase
      .from("transactions")
      .select("*, payment_orders(*)")
      .eq("midtrans_order_id", order_id)
      .single();

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Idempotency — don't re-process completed payments
    if (transaction.status === "settlement" || transaction.status === "capture") {
      return NextResponse.json({ message: "Already processed" });
    }

    // Update transaction
    await supabase
      .from("transactions")
      .update({
        status: transaction_status,
        payment_type,
        gross_amount: parseInt(gross_amount),
        raw_response: notification,
      })
      .eq("midtrans_order_id", order_id);

    // Update payment order
    await supabase
      .from("payment_orders")
      .update({ status: orderStatus })
      .eq("id", transaction.payment_order_id);

    // If payment successful, activate plan
    if (orderStatus === "completed") {
      const paymentOrder = transaction.payment_orders;
      if (paymentOrder) {
        if (paymentOrder.plan_code === PACK_CODE) {
          await supabase.rpc("add_order_pack", {
            p_user_id: paymentOrder.user_id,
          });
        } else if (paymentOrder.plan_code === MEDIUM_PACK_CODE) {
          await supabase.rpc("add_order_pack_with_credits", {
            p_user_id: paymentOrder.user_id,
            p_credits: 100,
          });
        } else if (paymentOrder.plan_code === UNLIMITED_CODE) {
          await supabase.rpc("activate_unlimited", {
            p_user_id: paymentOrder.user_id,
          });
        }

        // Referral commission — check if paying user was referred
        try {
          const { data: payerProfile } = await supabase
            .from("profiles")
            .select("referred_by, referral_expires_at")
            .eq("id", paymentOrder.user_id)
            .single();

          if (
            payerProfile?.referred_by &&
            payerProfile.referral_expires_at &&
            new Date(payerProfile.referral_expires_at) > new Date()
          ) {
            // Use actual payment amount for commission
            const priceMap: Record<string, number> = {
              [PACK_CODE]: PACK_PRICE,
              [MEDIUM_PACK_CODE]: MEDIUM_PACK_PRICE,
              [UNLIMITED_CODE]: UNLIMITED_PRICE,
            };
            const paymentAmount = priceMap[paymentOrder.plan_code] ?? 0;
            const commission = Math.floor(paymentAmount * REFERRAL_COMMISSION_RATE);

            // Credit the referrer
            const { data: referrer } = await supabase
              .from("profiles")
              .select("id, referral_balance, referral_total_earned")
              .eq("referral_code", payerProfile.referred_by)
              .single();

            if (referrer) {
              await supabase
                .from("profiles")
                .update({
                  referral_balance: (referrer.referral_balance ?? 0) + commission,
                  referral_total_earned: (referrer.referral_total_earned ?? 0) + commission,
                })
                .eq("id", referrer.id);
            }
          }
        } catch {
          // best-effort — don't block payment processing for commission errors
        }
      }
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## File 4: `app/(dashboard)/pengaturan/page.tsx`

**Changes:**
- Import medium pack constants
- Add `isBuyingMediumPack` state
- Add `handleBuyMediumPack` handler
- Update nudge messages with per-order pricing
- Add per-order subtitle on pack buttons
- Add medium pack purchase button between pack and unlimited

### 4a. Update imports (line 14)

```ts
import { PACK_PRICE, PACK_ORDERS, PACK_CODE, MEDIUM_PACK_PRICE, MEDIUM_PACK_ORDERS, MEDIUM_PACK_CODE, UNLIMITED_CODE, UNLIMITED_PRICE, FREE_MONTHLY_ORDERS, getOrdersRemaining, isOrderQuotaExhausted, getNudgeLevel, isUnlimited } from "@/config/plans";
```

### 4b. Add state (after line 92)

```ts
  const [isBuyingPack, setIsBuyingPack] = useState(false);
  const [isBuyingMediumPack, setIsBuyingMediumPack] = useState(false);
  const [isBuyingUnlimited, setIsBuyingUnlimited] = useState(false);
```

### 4c. Add handleBuyMediumPack (after handleBuyPack function, after line 274)

```ts
  const handleBuyMediumPack = useCallback(async () => {
    setIsBuyingMediumPack(true);
    try {
      const res = await fetch("/api/billing/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode: MEDIUM_PACK_CODE }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Gagal membuat pembayaran");
        setIsBuyingMediumPack(false);
        return;
      }
      const { snapToken } = await res.json();

      await loadSnapScript();

      window.snap!.pay(snapToken, {
        onSuccess: () => {
          toast.success(`${MEDIUM_PACK_ORDERS} pesanan berhasil ditambahkan!`);
          getProfile().then((data) => {
            if (data) setProfile(data);
          });
          setIsBuyingMediumPack(false);
        },
        onPending: () => router.push("/pembayaran/pending"),
        onError: () => {
          toast.error("Pembayaran gagal. Silakan coba lagi.");
          setIsBuyingMediumPack(false);
        },
        onClose: () => {
          setIsBuyingMediumPack(false);
        },
      });
    } catch {
      toast.error("Terjadi kesalahan saat memproses pembayaran");
      setIsBuyingMediumPack(false);
    }
  }, [router]);
```

### 4d. Update nudge messages + purchase buttons (lines 643-729)

Replace the entire nudge + purchase buttons section with:

```tsx
        {(nudgeLevel === "soft" || nudgeLevel === "medium") && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-center mb-3">
            <p className="text-xs font-medium text-blue-800">
              Bisnis lagi rame! Tambah pesanan mulai Rp{Math.round(PACK_PRICE / PACK_ORDERS).toLocaleString("id-ID")}/pesanan.
            </p>
          </div>
        )}

        {nudgeLevel === "urgent" && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-center mb-3">
            <p className="text-xs font-medium text-amber-800">
              {FREE_MONTHLY_ORDERS - freeUsed} pesanan gratis tersisa. Tambah mulai Rp{(PACK_PRICE / 1000).toFixed(0)}rb supaya tidak terhenti.
            </p>
          </div>
        )}

        {quotaExhausted && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-center mb-3">
            <p className="text-xs font-medium text-amber-800">
              Kuota habis — pesanan baru menunggu. Tambah mulai Rp{(PACK_PRICE / 1000).toFixed(0)}rb untuk {PACK_ORDERS} pesanan.
            </p>
          </div>
        )}

        {!unlimited && (
          <div className="space-y-2">
            {/* Pack Kecil */}
            <button
              onClick={handleBuyPack}
              disabled={isBuyingPack}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-warm-green/10 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-warm-green" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Isi Ulang {PACK_ORDERS} Pesanan</p>
                    <p className="text-[10px] text-muted-foreground">Rp{Math.round(PACK_PRICE / PACK_ORDERS).toLocaleString("id-ID")}/pesanan · tidak kadaluarsa</p>
                  </div>
                </div>
                <div className="text-right">
                  {isBuyingPack ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <p className="text-sm font-bold text-foreground">Rp{(PACK_PRICE / 1000).toFixed(0)}rb</p>
                      <p className="text-[10px] text-muted-foreground">QRIS</p>
                    </>
                  )}
                </div>
              </div>
            </button>

            {/* Pack Besar (Decoy) */}
            <button
              onClick={handleBuyMediumPack}
              disabled={isBuyingMediumPack}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-warm-green/10 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-warm-green" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Isi Ulang {MEDIUM_PACK_ORDERS} Pesanan</p>
                    <p className="text-[10px] text-muted-foreground">Rp{Math.round(MEDIUM_PACK_PRICE / MEDIUM_PACK_ORDERS).toLocaleString("id-ID")}/pesanan · tidak kadaluarsa</p>
                  </div>
                </div>
                <div className="text-right">
                  {isBuyingMediumPack ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <p className="text-sm font-bold text-foreground">Rp{(MEDIUM_PACK_PRICE / 1000).toFixed(0)}rb</p>
                      <p className="text-[10px] text-muted-foreground">QRIS</p>
                    </>
                  )}
                </div>
              </div>
            </button>

            {/* Unlimited */}
            <button
              onClick={handleBuyUnlimited}
              disabled={isBuyingUnlimited}
              className="w-full rounded-xl border-2 border-warm-green/30 bg-warm-green/5 px-3.5 py-3 text-left hover:bg-warm-green/10 active:bg-warm-green/15 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-warm-green/10 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-warm-green" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Unlimited 1 Bulan</p>
                    <p className="text-[10px] text-muted-foreground">Pesanan tak terbatas · paling hemat</p>
                  </div>
                </div>
                <div className="text-right">
                  {isBuyingUnlimited ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <p className="text-sm font-bold text-warm-green">Rp{(UNLIMITED_PRICE / 1000).toFixed(0)}rb</p>
                      <p className="text-[10px] text-muted-foreground">QRIS</p>
                    </>
                  )}
                </div>
              </div>
            </button>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center mt-3">
          Semua fitur gratis tanpa batas: link toko, struk, AI, rekap.
        </p>
```

---

## File 5: `app/(marketing)/pricing/page.tsx`

**Changes:** Add medium pack section + value anchoring comparison

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/supabase/server";
import { FREE_MONTHLY_ORDERS, PACK_ORDERS, PACK_PRICE, MEDIUM_PACK_ORDERS, MEDIUM_PACK_PRICE, UNLIMITED_PRICE } from "@/config/plans";

export const metadata: Metadata = {
  title: "Harga — 50 Pesanan/Bulan Tanpa Biaya | CatatOrder UMKM",
  description:
    "50 pesanan per bulan tanpa biaya. Butuh lebih? Tambah 50 pesanan Rp15.000. Semua fitur termasuk: link toko, struk digital, AI, rekap, lacak pembayaran.",
  alternates: {
    canonical: "https://catatorder.id/pricing",
  },
};

const faqs = [
  {
    question: "Apakah benar-benar gratis?",
    answer:
      "Ya. Semua fitur gratis selamanya — link toko, struk, AI, rekap, lacak bayar. Kamu dapat 50 pesanan per bulan tanpa bayar apa-apa. Bukan uji coba.",
  },
  {
    question: `Kalau lebih dari ${FREE_MONTHLY_ORDERS} pesanan?`,
    answer:
      `Tiga pilihan: Isi Ulang Rp${(PACK_PRICE / 1000).toFixed(0)} ribu per ${PACK_ORDERS} pesanan, Rp${(MEDIUM_PACK_PRICE / 1000).toFixed(0)} ribu per ${MEDIUM_PACK_ORDERS} pesanan (lebih hemat), atau Unlimited Rp${(UNLIMITED_PRICE / 1000).toFixed(0)} ribu untuk pesanan tak terbatas selama 1 bulan. Semua paket tidak kadaluarsa. Bayar lewat QRIS.`,
  },
  {
    question: "Kalau tidak beli paket, apa yang terjadi?",
    answer:
      "Pesanan dari pelanggan tetap masuk lewat link toko, tapi statusnya \"menunggu\" sampai kamu tambah paket. Pelanggan tidak tahu ada batas — mereka tetap bisa pesan kapan saja.",
  },
  {
    question: "Pesanan dari paket bisa hangus?",
    answer:
      "Tidak. Pesanan dari paket aktif selamanya, tidak ada batas waktu. Pakai kapan saja.",
  },
  {
    question: "Bagaimana cara pembayaran?",
    answer:
      "Bayar lewat QRIS — scan pakai GoPay, OVO, Dana, ShopeePay, atau m-banking. Cepat dan tanpa biaya tambahan.",
  },
  {
    question: "Apakah fitur AI (paste chat, suara, foto) gratis?",
    answer:
      "Ya, semua fitur AI 100% gratis tanpa batas. Paste chat WA, catat pakai suara, foto screenshot — semuanya langsung jadi pesanan.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default async function PricingPage() {
  const user = await getUser();
  const ctaHref = user ? "/pengaturan" : "/login";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Pricing */}
      <section className="pt-24 lg:pt-28 pb-12 lg:pb-16">
        <div className="max-w-sm mx-auto px-4 text-center">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-[#1E293B]">
            Semua Fitur Gratis. Bayar Hanya Kalau Rame.
          </h1>

          <div className="mt-8 space-y-6">
            {/* Free */}
            <div>
              <p className="text-xs font-semibold text-[#05A660] uppercase tracking-wider">Gratis selamanya</p>
              <p className="mt-1 text-2xl font-bold text-[#1E293B]">{FREE_MONTHLY_ORDERS} pesanan/bulan</p>
              <p className="mt-1 text-sm text-[#475569]">Semua fitur termasuk, tanpa batas waktu.</p>
            </div>

            <div className="border-t border-[#E2E8F0]" />

            {/* Isi Ulang - Pack Kecil */}
            <div>
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider">Isi Ulang</p>
              <p className="mt-1 text-2xl font-bold text-[#1E293B]">Rp{(PACK_PRICE / 1000).toFixed(0)}rb <span className="text-sm font-normal text-[#475569]">/ {PACK_ORDERS} pesanan</span></p>
              <p className="mt-1 text-sm text-[#475569]">Rp{Math.round(PACK_PRICE / PACK_ORDERS).toLocaleString("id-ID")}/pesanan. Bayar QRIS. Tidak kadaluarsa.</p>
            </div>

            <div className="border-t border-[#E2E8F0]" />

            {/* Isi Ulang - Pack Besar */}
            <div>
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider">Isi Ulang Hemat</p>
              <p className="mt-1 text-2xl font-bold text-[#1E293B]">Rp{(MEDIUM_PACK_PRICE / 1000).toFixed(0)}rb <span className="text-sm font-normal text-[#475569]">/ {MEDIUM_PACK_ORDERS} pesanan</span></p>
              <p className="mt-1 text-sm text-[#475569]">Rp{Math.round(MEDIUM_PACK_PRICE / MEDIUM_PACK_ORDERS).toLocaleString("id-ID")}/pesanan. Lebih hemat 17%. Tidak kadaluarsa.</p>
            </div>

            <div className="border-t border-[#E2E8F0]" />

            {/* Unlimited */}
            <div>
              <p className="text-xs font-semibold text-[#05A660] uppercase tracking-wider">Unlimited</p>
              <p className="mt-1 text-2xl font-bold text-[#1E293B]">Rp{(UNLIMITED_PRICE / 1000).toFixed(0)}rb <span className="text-sm font-normal text-[#475569]">/ bulan</span></p>
              <p className="mt-1 text-sm text-[#475569]">Pesanan tak terbatas. Paling hemat untuk bisnis rame.</p>
            </div>

            <Button
              size="default"
              className="w-full h-11 text-sm font-semibold bg-[#05A660] text-white hover:bg-[#048C51]"
              asChild
            >
              <Link href={ctaHref}>
                Mulai Gratis Sekarang
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <p className="text-xs text-[#475569]">
              <Link href="/features" className="text-[#05A660] font-medium hover:underline">
                Lihat semua fitur →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Value anchoring */}
      <section className="border-t border-[#E2E8F0] py-10 lg:py-12">
        <div className="max-w-sm mx-auto px-4">
          <p className="text-xs font-bold text-[#1E293B]/70 uppercase tracking-wider text-center mb-4">Dibanding alternatif lain</p>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#475569]">Rekap manual (30 mnt/hari)</span>
              <span className="font-semibold text-[#1E293B] line-through decoration-[#94A3B8]">~Rp300rb/bln</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#475569]">Kasir Pintar Pro</span>
              <span className="font-semibold text-[#1E293B] line-through decoration-[#94A3B8]">Rp55rb/bln</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#475569]">Komisi GoFood per pesanan</span>
              <span className="font-semibold text-[#1E293B] line-through decoration-[#94A3B8]">20%</span>
            </div>
            <div className="border-t border-[#E2E8F0] pt-2.5 flex items-center justify-between">
              <span className="font-semibold text-[#05A660]">CatatOrder</span>
              <span className="font-bold text-[#05A660]">Rp{Math.round(PACK_PRICE / PACK_ORDERS).toLocaleString("id-ID")}/pesanan</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-[2rem] border border-[#E2E8F0] bg-white p-6 sm:p-8 lg:p-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F6F0]">
                  <HelpCircle className="h-6 w-6 text-[#05A660]" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-lg lg:text-xl font-bold text-[#1E293B]">
                    Pertanyaan Seputar Harga
                  </h2>
                  <p className="text-sm lg:text-base text-[#475569]">
                    Hal-hal yang sering ditanyakan tentang harga CatatOrder.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {faqs.map((faq) => (
                  <div
                    key={faq.question}
                    className="border-b border-[#E2E8F0] pb-5 last:border-0 last:pb-0"
                  >
                    <h3 className="text-sm lg:text-base font-semibold text-[#1E293B]">
                      {faq.question}
                    </h3>
                    <p className="mt-1.5 text-sm lg:text-base leading-relaxed text-[#475569]">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
```

---

## File 6: `app/(marketing)/mitra/page.tsx`

**Changes:** Update commission examples with medium pack + new unlimited price

```tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Program Mitra — CatatOrder",
  description: "Bergabung sebagai mitra CatatOrder. Dapatkan komisi 30% dari setiap pembayaran pengguna yang kamu referensikan selama 6 bulan.",
};

export default function MitraPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1E293B] mb-4">
              Program Mitra CatatOrder
            </h1>
            <p className="text-lg text-[#475569] max-w-xl mx-auto">
              Bantu UMKM Indonesia kelola pesanan lebih baik. Dapatkan komisi dari setiap pengguna yang kamu referensikan.
            </p>
          </div>

          {/* How it works */}
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm text-center">
              <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">1</div>
              <h3 className="font-semibold text-[#1E293B] mb-1">Daftar Gratis</h3>
              <p className="text-sm text-[#475569]">Buat akun CatatOrder gratis. Link referral otomatis tersedia di Pengaturan.</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm text-center">
              <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">2</div>
              <h3 className="font-semibold text-[#1E293B] mb-1">Bagikan Link</h3>
              <p className="text-sm text-[#475569]">Salin link dari Pengaturan, kirim ke teman UMKM via WhatsApp.</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm text-center">
              <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">3</div>
              <h3 className="font-semibold text-[#1E293B] mb-1">Dapat Komisi</h3>
              <p className="text-sm text-[#475569]">Dapatkan 30% dari setiap pembayaran mereka selama 6 bulan.</p>
            </div>
          </div>

          {/* Commission details */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm mb-12">
            <h2 className="text-xl font-semibold text-[#1E293B] mb-4">Detail Komisi</h2>
            <div className="space-y-3 text-sm text-[#475569]">
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold shrink-0">30%</span>
                <div>
                  <p>Komisi dari setiap pembayaran paket:</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-[#64748B]">
                    <li>Isi Ulang 50 pesanan Rp15.000 &rarr; komisi Rp4.500</li>
                    <li>Isi Ulang 100 pesanan Rp25.000 &rarr; komisi Rp7.500</li>
                    <li>Unlimited Rp39.000 &rarr; komisi Rp11.700</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold shrink-0">6 bln</span>
                <p>Durasi komisi aktif per pengguna yang kamu referensikan</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold shrink-0">&infin;</span>
                <p>Tidak ada batas jumlah pengguna yang bisa kamu referensikan</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/register"
              className="inline-flex h-12 px-8 items-center justify-center rounded-xl bg-green-600 text-white font-semibold text-base hover:bg-green-700 transition-colors"
            >
              Daftar Gratis
            </Link>
            <p className="text-sm text-[#475569] mt-3">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-[#1E293B] font-medium hover:underline">
                Masuk
              </Link>
            </p>
          </div>
      </div>
    </div>
  );
}
```

---

## File 7: `supabase/migrations/044_medium_order_pack.sql`

**Changes:** New RPC that accepts a credits parameter for medium pack

```sql
-- 044: Medium Order Pack
-- Add RPC that accepts variable credit amount for medium pack (100 credits).
-- Original add_order_pack (50 credits) remains unchanged for backward compatibility.

CREATE OR REPLACE FUNCTION public.add_order_pack_with_credits(
  p_user_id UUID,
  p_credits INTEGER DEFAULT 50
)
RETURNS JSONB AS $$
DECLARE
  v_packs INTEGER;
  v_unlimited BOOLEAN := FALSE;
  v_reset_at TIMESTAMPTZ;
BEGIN
  -- Reset check first
  SELECT counter_reset_at, COALESCE(packs_bought_this_month, 0)
  INTO v_reset_at, v_packs
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false);
  END IF;

  -- Monthly reset if needed
  IF v_reset_at IS NULL
     OR to_char(v_reset_at, 'YYYY-MM') != to_char(NOW(), 'YYYY-MM') THEN
    UPDATE profiles SET
      orders_used = 0,
      receipts_used = 0,
      packs_bought_this_month = 0,
      counter_reset_at = NOW()
    WHERE id = p_user_id;
    v_packs := 0;
  END IF;

  v_packs := v_packs + 1;

  -- 3rd pack = unlimited rest of month
  IF v_packs >= 3 THEN
    v_unlimited := TRUE;
    UPDATE profiles SET
      order_credits = COALESCE(order_credits, 0) + p_credits,
      packs_bought_this_month = v_packs,
      unlimited_until = date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second'
    WHERE id = p_user_id;
  ELSE
    UPDATE profiles SET
      order_credits = COALESCE(order_credits, 0) + p_credits,
      packs_bought_this_month = v_packs
    WHERE id = p_user_id;
  END IF;

  -- Activate all "menunggu" orders for this user
  UPDATE orders SET status = 'new'
  WHERE user_id = p_user_id AND status = 'menunggu';

  RETURN jsonb_build_object(
    'success', true,
    'credits_added', p_credits,
    'packs_this_month', v_packs,
    'unlimited', v_unlimited
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_order_pack_with_credits(UUID, INTEGER) TO authenticated;
```

---

## Checklist

- [ ] `config/plans.ts` — add medium pack constants, raise unlimited to 39000
- [ ] `app/api/billing/payments/route.ts` — add medium_pack branch
- [ ] `app/api/billing/webhook/route.ts` — handle medium_pack, use priceMap for commission
- [ ] `app/(dashboard)/pengaturan/page.tsx` — new imports, state, handler, nudge copy, 3 purchase buttons
- [ ] `app/(marketing)/pricing/page.tsx` — medium pack section, value anchoring, updated FAQ
- [ ] `app/(marketing)/mitra/page.tsx` — updated commission examples with all 3 tiers
- [ ] `supabase/migrations/044_medium_order_pack.sql` — new RPC with variable credits
- [ ] Run migration: `supabase db push` or apply via Supabase dashboard
- [ ] Test: buy pack kecil, pack besar, unlimited via Midtrans sandbox
- [ ] Verify referral commission calculates correctly for all 3 plan codes
