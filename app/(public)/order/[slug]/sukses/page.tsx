import { Check, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { getPublicBusinessInfo } from "@/lib/services/public-order.service";
import { createServiceClient } from "@/lib/supabase/server";
import { SuccessActions } from "./SuccessActions";

export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false, follow: false, nocache: true },
};

interface PageProps {
  params: Promise<{ slug: string }>;
  // Only oid, order, preorder, langganan, pay drive logic.
  // name, phone, total are legacy URL params kept for backward-compat with
  // existing redirect URLs — they are NOT used for display; server-fetched
  // data takes precedence so these can't be spoofed to alter what renders.
  searchParams: Promise<{
    order?: string;
    oid?: string;
    preorder?: string;
    langganan?: string;
    pay?: string;
  }>;
}

function paymentChannelLabel(channel: string | null | undefined): string {
  if (!channel) return "online payment";
  const map: Record<string, string> = {
    FPX: "FPX online banking",
    DUITNOWQR: "DuitNow QR",
    DUITNOW_QR: "DuitNow QR",
    BOOST: "Boost",
    GRABPAY: "GrabPay",
    SHOPEEPAY: "ShopeePay",
    TNG: "Touch 'n Go eWallet",
    CARD: "card",
    CREDITCARD: "card",
    DEBITCARD: "card",
  };
  return map[channel.toUpperCase()] ?? channel;
}

// Fetch Billplz payment row for this order.
// Merchant validation via user_id prevents cross-merchant status reads.
async function fetchPaidStatus(orderId: string, merchantId: string): Promise<{
  status: "paid" | "pending" | "failed" | null;
  channel: string | null;
  paidAmount: number | null;
} | null> {
  if (!orderId || !merchantId) return null;
  try {
    const svc = await createServiceClient();
    const { data } = await svc
      .from("order_payments")
      .select("status, payment_method, amount")
      .eq("order_id", orderId)
      .eq("provider", "billplz")
      .eq("user_id", merchantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return {
      status: data.status as "paid" | "pending" | "failed",
      channel: data.payment_method ?? null,
      paidAmount: data.amount ? Number(data.amount) : null,
    };
  } catch {
    return null;
  }
}

// Fetch order detail rows for display.
// Merchant validation prevents cross-merchant order reads.
async function fetchOrderDetails(orderId: string, merchantId: string): Promise<{
  orderNumber: string | null;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number;
  deliveryFee: number;
  deliveryDate: string | null;
  notes: string | null;
  customerName: string | null;
  isPreorder: boolean;
  isLangganan: boolean;
} | null> {
  if (!orderId || !merchantId) return null;
  try {
    const svc = await createServiceClient();
    const { data } = await svc
      .from("orders")
      .select("order_number, items, total, delivery_fee, delivery_date, notes, customer_name, is_preorder, is_langganan")
      .eq("id", orderId)
      .eq("user_id", merchantId)
      .maybeSingle();
    if (!data) return null;
    return {
      orderNumber: data.order_number ?? null,
      items: Array.isArray(data.items)
        ? (data.items as Array<{ name: string; qty: number; price: number }>)
        : [],
      total: Number(data.total) || 0,
      deliveryFee: Number(data.delivery_fee) || 0,
      deliveryDate: data.delivery_date ?? null,
      notes: data.notes || null,
      customerName: data.customer_name ?? null,
      isPreorder: Boolean(data.is_preorder),
      isLangganan: Boolean(data.is_langganan),
    };
  } catch {
    return null;
  }
}

export default async function OrderSuccessPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { order, oid, preorder, langganan, pay } = await searchParams;

  // Fetch business info first — everything else is keyed off businessId.
  const business = await getPublicBusinessInfo(slug);

  // Parallel: payment status + order details, both merchant-scoped.
  const [paid, orderDetails] = await Promise.all([
    business ? fetchPaidStatus(oid ?? "", business.businessId) : Promise.resolve(null),
    business ? fetchOrderDetails(oid ?? "", business.businessId) : Promise.resolve(null),
  ]);

  const qrisUrl = business?.qrisUrl;
  const businessPhone = business?.businessPhone;
  const businessName = business?.businessName ?? "";

  const isPreorder = preorder === "1" || Boolean(orderDetails?.isPreorder);
  const isLangganan = langganan === "1" || Boolean(orderDetails?.isLangganan);
  const paidViaBillplz = paid?.status === "paid";
  const payLater = pay === "later";
  const payQr = pay === "qr" && !!qrisUrl && !paidViaBillplz;
  const channelLabel = paymentChannelLabel(paid?.channel);
  // Prefer actual paid amount from DB; fall back to order total.
  const displayPaidAmount = paid?.paidAmount ?? orderDetails?.total ?? 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header — the QR (payFirst) flow renders its OWN header inside
          SuccessActions so it can react to the client-side "payment sent"
          state; only the server-knowable headers stay here. */}
      {!payQr && (
        <div className="text-center mb-4">
          <div className="w-14 h-14 rounded-full bg-warm-green-light flex items-center justify-center mx-auto mb-3">
            <Check className="w-7 h-7 text-warm-green" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
            {paidViaBillplz ? "Payment received!" : "Order received!"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {paidViaBillplz
              ? `${businessName || "The business"} has been notified — they'll confirm via WhatsApp shortly.`
              : isLangganan
                ? `Your order is with ${businessName || "the business"}. They'll WhatsApp you to confirm.`
                : isPreorder
                  ? `Your order is with ${businessName || "the business"}. They'll WhatsApp you to confirm.`
                  : `Your order is with ${businessName || "the business"}. They'll WhatsApp you shortly.`
            }
          </p>
        </div>
      )}

      {/* Billplz paid badge */}
      {paidViaBillplz && (
        <div className="mb-4 rounded-xl border border-warm-green/20 bg-warm-green-light/40 px-4 py-3 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-warm-green shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 text-xs leading-relaxed">
            <p className="font-medium text-foreground">Paid via {channelLabel}</p>
            {displayPaidAmount > 0 && (
              <p className="text-muted-foreground mt-0.5">
                RM {displayPaidAmount.toLocaleString("en-MY")} settled directly to {businessName || "the business"}.
              </p>
            )}
          </div>
        </div>
      )}

      <SuccessActions
        qrisUrl={payLater ? undefined : qrisUrl}
        businessPhone={businessPhone}
        orderNumber={order || orderDetails?.orderNumber || ""}
        orderId={oid}
        businessName={businessName}
        slug={slug}
        isPreorder={isPreorder || payLater}
        isLangganan={isLangganan}
        alreadyPaid={paidViaBillplz}
        payFirst={payQr}
        serverOrderDetails={orderDetails ?? undefined}
        deliveryEnabled={business?.deliveryEnabled}
        pickupEnabled={business?.pickupEnabled}
      />

      <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
        Made with <a href="https://tokoflow.com" className="underline hover:text-muted-foreground">Tokoflow</a>
      </p>
    </div>
  );
}
