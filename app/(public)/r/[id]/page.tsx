import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { Check, Clock, Truck, Package, CircleDot, Ban, CalendarDays } from "lucide-react";
import { formatPhoneForWA } from "@/lib/utils/phone";
import { CopyOrderNumber } from "./CopyOrderNumber";
import { CopyTransferAmount } from "./CopyTransferAmount";
import { ReceiptActions } from "./ReceiptActions";

// Receipts contain customer PII (name, phone, items, total). Keep them
// out of search engines — discovery is by direct WhatsApp share only.
export const metadata: Metadata = {
  title: "Order receipt",
  robots: { index: false, follow: false, nocache: true },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

// Match exact colors from OrderStatusBadge + OrderCard in dashboard
const STATUS_CONFIG: Record<string, { label: string; chipClass: string; icon: string }> = {
  new: { label: "New", chipClass: "bg-warm-blue-light text-warm-blue border-warm-blue/20", icon: "dot" },
  menunggu: { label: "Pending", chipClass: "bg-amber-50 text-amber-600 border-amber-200", icon: "clock" },
  processed: { label: "Processing", chipClass: "bg-warm-amber-light text-warm-amber border-warm-amber/20", icon: "package" },
  shipped: { label: "Shipped", chipClass: "bg-warm-purple-light text-warm-purple border-warm-purple/20", icon: "truck" },
  done: { label: "Completed", chipClass: "bg-warm-green-light text-warm-green border-warm-green/20", icon: "check" },
  cancelled: { label: "Cancelled", chipClass: "bg-warm-rose-light text-warm-rose border-warm-rose/20", icon: "ban" },
};

const STATUS_FLOW = ["new", "processed", "shipped", "done"];

function StatusIcon({ icon, className }: { icon: string; className?: string }) {
  const props = { className: className || "w-4 h-4" };
  switch (icon) {
    case "dot": return <CircleDot {...props} />;
    case "clock": return <Clock {...props} />;
    case "package": return <Package {...props} />;
    case "truck": return <Truck {...props} />;
    case "check": return <Check {...props} />;
    case "ban": return <Ban {...props} />;
    default: return <CircleDot {...props} />;
  }
}

export default async function PublicReceiptPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createServiceClient();

  // Fetch order with status, delivery_date, payment info
  const { data: order } = await supabase
    .from("orders")
    .select("order_number, customer_name, items, subtotal, discount, total, unique_code, transfer_amount, paid_amount, notes, status, delivery_date, is_preorder, is_langganan, payment_claimed_at, created_at, user_id, deleted_at")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!order) return notFound();

  // Fetch business profile with slug and phone
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, logo_url, slug, business_phone, qris_url")
    .eq("id", order.user_id)
    .single();

  const businessName = profile?.business_name || "Toko";
  const initials = businessName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  const items = (order.items || []) as { name: string; qty: number; price: number }[];
  const status = (order.status || "new") as string;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  const createdAt = new Date(order.created_at).toLocaleDateString("en-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Payment status derivation
  const paidAmount = order.paid_amount || 0;
  const total = order.total || 0;
  const isPaid = paidAmount >= total && total > 0;
  const isPartial = paidAmount > 0 && paidAmount < total;

  // Status progress
  const currentStepIndex = STATUS_FLOW.indexOf(status);
  const isCancelled = status === "cancelled";
  const isMenunggu = status === "menunggu";

  // Delivery date
  const deliveryDate = order.delivery_date
    ? new Date(order.delivery_date).toLocaleDateString("en-MY", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  // WA link — normalize via the shared MY (+60) helper. The previous
  // inline regex was hardcoded to Indonesia (+62) — every "Confirm on
  // WhatsApp" link from a shared receipt was pointing at a non-existent
  // Indonesian number. CatatOrder ID leftover.
  const waPhone = formatPhoneForWA(profile?.business_phone) || null;

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 text-center border-b">
          <div className="relative w-12 h-12 rounded-full bg-warm-green-light flex items-center justify-center mx-auto mb-2 overflow-hidden">
            {profile?.logo_url ? (
              <Image src={profile.logo_url} alt="" fill className="object-cover" sizes="48px" />
            ) : (
              <span className="text-sm font-semibold text-warm-green">{initials}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground">{businessName}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{createdAt}</p>
        </div>

        {/* Status badge + progress */}
        <div className="px-5 py-3 border-b">
          {/* Current status + payment — same style as dashboard OrderCard */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {order.is_preorder && (
              <span className="inline-flex h-6 px-2 text-[11px] font-medium rounded-full border items-center bg-violet-50 text-violet-700 border-violet-200">
                Pre-order
              </span>
            )}
            {order.is_langganan && (
              <span className="inline-flex h-6 px-2 text-[11px] font-medium rounded-full border items-center bg-blue-50 text-blue-700 border-blue-200">
                Subscription
              </span>
            )}
            <span className={`inline-flex h-6 px-2 text-[11px] font-medium rounded-full border items-center ${statusConfig.chipClass}`}>
              {statusConfig.label}
            </span>
            {isPaid && (
              <span className="inline-flex h-6 px-2 text-[11px] font-medium rounded-full border items-center bg-warm-green-light text-warm-green border-warm-green/20">
                Paid
              </span>
            )}
            {isPartial && (
              <span className="inline-flex h-6 px-2 text-[11px] font-medium rounded-full border items-center bg-warm-amber-light text-warm-amber border-warm-amber/20">
                Partial payment
              </span>
            )}
            {!isPaid && !isPartial && total > 0 && (
              <span className="inline-flex h-6 px-2 text-[11px] font-medium rounded-full border items-center bg-warm-rose-light text-warm-rose border-warm-rose/20">
                Unpaid
              </span>
            )}
          </div>

          {/* Progress bar — only for normal flow */}
          {!isCancelled && !isMenunggu && (
            <div className="flex items-center gap-1">
              {STATUS_FLOW.map((step, i) => (
                <div
                  key={step}
                  className={`flex-1 h-1.5 rounded-full ${i <= currentStepIndex ? "bg-warm-green" : "bg-border"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Order number + customer */}
        <div className="px-5 py-3 bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Order no.</span>
            <CopyOrderNumber orderNumber={order.order_number} />
          </div>
          {order.customer_name && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">Customer</span>
              <span className="text-xs font-medium text-foreground">{order.customer_name}</span>
            </div>
          )}
        </div>

        {/* Delivery date */}
        {deliveryDate && (
          <div className="px-5 py-2.5 border-b flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">Delivery:</span>
            <span className="text-xs font-medium text-foreground">{deliveryDate}</span>
          </div>
        )}

        {/* Items */}
        <div className="px-5 py-3 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.qty} x RM {item.price.toLocaleString("en-MY")}
                </p>
              </div>
              <p className="text-sm font-medium text-foreground shrink-0">
                RM {(item.qty * item.price).toLocaleString("en-MY")}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-5 py-3 border-t space-y-1.5">
          {order.discount > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Subtotal</span>
                <span className="text-xs text-muted-foreground">RM {order.subtotal.toLocaleString("en-MY")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Discount</span>
                <span className="text-xs text-warm-green">-RM {order.discount.toLocaleString("en-MY")}</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-sm font-bold text-foreground">RM {order.total.toLocaleString("en-MY")}</span>
          </div>
          {isPartial && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Paid</span>
              <span className="text-xs text-foreground">RM {paidAmount.toLocaleString("en-MY")}</span>
            </div>
          )}
          {order.unique_code && !isPaid && (
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-dashed">
              <span className="text-sm font-semibold text-foreground">Transfer amount</span>
              <CopyTransferAmount amount={order.transfer_amount ?? order.total} />
            </div>
          )}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="px-5 py-3 border-t">
            <p className="text-xs text-muted-foreground mb-0.5">Note</p>
            <p className="text-sm text-foreground">{order.notes}</p>
          </div>
        )}

        {/* Actions */}
        <ReceiptActions
          orderId={id}
          orderNumber={order.order_number}
          waPhone={waPhone}
          slug={profile?.slug}
          qrisUrl={profile?.qris_url}
          total={order.total}
          showPayment={!isPaid && status !== "done" && status !== "cancelled"}
          businessName={businessName}
          paymentClaimedAt={order.payment_claimed_at}
          isPreorder={order.is_preorder || false}
        />

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-muted/20 text-center">
          <p className="text-[10px] text-muted-foreground/60">
            Made with <a href="https://tokoflow.com" className="underline hover:text-muted-foreground">Tokoflow</a>
          </p>
        </div>
      </div>
    </div>
  );
}
