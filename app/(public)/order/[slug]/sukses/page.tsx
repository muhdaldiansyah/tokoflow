import { Check, ShieldCheck } from "lucide-react";
import { getPublicBusinessInfo } from "@/lib/services/public-order.service";
import { createServiceClient } from "@/lib/supabase/server";
import { SuccessActions } from "./SuccessActions";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ name?: string; order?: string; phone?: string; oid?: string; total?: string; ta?: string; preorder?: string; langganan?: string }>;
}

// Map Billplz payment_channel → human label. Defensive default for channels
// not in our list (Billplz adds new ones occasionally).
function paymentChannelLabel(channel: string | null | undefined): string {
  if (!channel) return "online payment";
  const map: Record<string, string> = {
    FPX: "FPX online banking",
    DUITNOWQR: "DuitNow QR",
    DUITNOW_QR: "DuitNow QR",
    BOOST: "Boost",
    GRABPAY: "GrabPay",
    SHOPEEPAY: "ShopeePay",
    TNG: "Touch ’n Go eWallet",
    CARD: "card",
    CREDITCARD: "card",
    DEBITCARD: "card",
  };
  const upper = channel.toUpperCase();
  return map[upper] ?? channel;
}

// Pull the latest payment row for this order. Billplz fires the webhook
// server-to-server *before* redirecting the browser, so by the time this
// page renders the order_payments row should already be marked paid. If
// not, we degrade silently — the merchant's dashboard will catch up via
// realtime when the webhook lands.
async function fetchPaidStatus(orderId: string): Promise<{
  status: "paid" | "pending" | "failed" | null;
  channel: string | null;
  paidAt: string | null;
} | null> {
  if (!orderId) return null;
  try {
    const svc = await createServiceClient();
    const { data } = await svc
      .from("order_payments")
      .select("status, payment_method, paid_at, provider")
      .eq("order_id", orderId)
      .eq("provider", "billplz")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return {
      status: data.status as "paid" | "pending" | "failed",
      channel: data.payment_method ?? null,
      paidAt: data.paid_at ?? null,
    };
  } catch {
    return null;
  }
}

export default async function OrderSuccessPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { name, order, phone, oid, total, preorder, langganan } = await searchParams;

  const [business, paid] = await Promise.all([
    getPublicBusinessInfo(slug),
    fetchPaidStatus(oid ?? ""),
  ]);
  const qrisUrl = business?.qrisUrl;
  const businessPhone = phone || business?.businessPhone;
  const totalAmount = total ? parseInt(total, 10) : 0;
  const isPreorder = preorder === "1";
  const isLangganan = langganan === "1";

  const paidViaBillplz = paid?.status === "paid";
  const channelLabel = paymentChannelLabel(paid?.channel);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Success header */}
      <div className="text-center mb-4">
        <div className="w-14 h-14 rounded-full bg-warm-green-light flex items-center justify-center mx-auto mb-3">
          <Check className="w-7 h-7 text-warm-green" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-1">
          {paidViaBillplz ? "Payment received!" : "Order received!"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {paidViaBillplz
            ? `${name || "The seller"} has been notified — they’ll confirm via WhatsApp shortly.`
            : isLangganan
              ? "Your order is recorded. Payment as agreed."
              : isPreorder
                ? "Your order is recorded. Confirm via WhatsApp for next steps."
                : `${name || "The seller"} will confirm via WhatsApp shortly.`
          }
        </p>
      </div>

      {/* Payment confirmation badge — only when Billplz webhook has marked
          this order paid. Sits above SuccessActions so customer sees the
          receipt before the WhatsApp button. */}
      {paidViaBillplz && (
        <div className="mb-4 rounded-xl border border-warm-green/20 bg-warm-green-light/40 px-4 py-3 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-warm-green shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 text-xs leading-relaxed">
            <p className="font-medium text-foreground">
              Paid via {channelLabel}
            </p>
            {totalAmount > 0 && (
              <p className="text-muted-foreground mt-0.5">
                RM {totalAmount.toLocaleString("en-MY")} settled directly to {name || "the seller"}.
              </p>
            )}
          </div>
        </div>
      )}

      <SuccessActions
        qrisUrl={qrisUrl}
        businessPhone={businessPhone}
        orderNumber={order || ""}
        orderId={oid}
        businessName={name || ""}
        slug={slug}
        totalFromUrl={totalAmount}
        isPreorder={isPreorder}
        isLangganan={isLangganan}
        alreadyPaid={paidViaBillplz}
      />

      {/* Subtle branding */}
      <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
        Made with <a href="https://tokoflow.com" className="underline hover:text-muted-foreground">Tokoflow</a>
      </p>
    </div>
  );
}
