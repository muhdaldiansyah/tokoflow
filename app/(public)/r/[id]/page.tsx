import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { Truck, Package, CalendarDays, ChevronRight } from "lucide-react";
import { formatPhoneForWA } from "@/lib/utils/phone";
import { detectCourier, courierTrackUrl } from "@/lib/utils/courier";
import { CopyOrderNumber } from "./CopyOrderNumber";
import { TrackingSection } from "./TrackingSection";
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
const STATUS_CONFIG: Record<string, { label: string; chipClass: string }> = {
  new: { label: "New", chipClass: "bg-warm-blue-light text-warm-blue border-warm-blue/20" },
  menunggu: { label: "Pending", chipClass: "bg-amber-50 text-amber-600 border-amber-200" },
  processed: { label: "Processing", chipClass: "bg-warm-amber-light text-warm-amber border-warm-amber/20" },
  shipped: { label: "Shipped", chipClass: "bg-warm-purple-light text-warm-purple border-warm-purple/20" },
  done: { label: "Completed", chipClass: "bg-warm-green-light text-warm-green border-warm-green/20" },
  cancelled: { label: "Cancelled", chipClass: "bg-warm-rose-light text-warm-rose border-warm-rose/20" },
};

const STATUS_FLOW = ["new", "processed", "shipped", "done"];
const STEP_LABELS: Record<string, string> = {
  new: "Received",
  processed: "Processing",
  shipped: "Shipped",
  done: "Done",
};

export default async function PublicReceiptPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createServiceClient();

  // Fetch order with status, delivery_date, payment info
  const { data: order } = await supabase
    .from("orders")
    .select("order_number, customer_name, items, subtotal, discount, total, delivery_fee, unique_code, transfer_amount, paid_amount, notes, status, delivery_date, delivery_address, tracking_number, courier_name, is_preorder, is_langganan, payment_claimed_at, created_at, user_id, deleted_at")
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

  const businessName = profile?.business_name || "Store";
  const initials = businessName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  const items = (order.items || []) as { name: string; qty: number; price: number }[];
  const status = (order.status || "new") as string;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  const createdAt = new Date(order.created_at).toLocaleDateString("id-ID", {
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
  const deliveryFee = Math.max(0, Number(order.delivery_fee ?? 0) || 0);
  const isPaid = paidAmount >= total && total > 0;
  const isPartial = paidAmount > 0 && paidAmount < total;

  // Status progress
  const currentStepIndex = STATUS_FLOW.indexOf(status);
  const isCancelled = status === "cancelled";
  const isMenunggu = status === "menunggu";

  // Delivery date
  const deliveryDate = order.delivery_date
    ? new Date(order.delivery_date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  // Delivery vs pickup label — delivery_address present → delivery, else pickup for preorders
  const dateLabel = order.delivery_address ? "Delivery:" : order.is_preorder ? "Pickup:" : "Date:";

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
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
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

          {/* Progress bar + step labels — only for normal flow */}
          {!isCancelled && !isMenunggu && (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                {STATUS_FLOW.map((step, i) => (
                  <div
                    key={step}
                    className={`flex-1 h-1.5 rounded-full ${i <= currentStepIndex ? "bg-warm-green" : "bg-border"}`}
                  />
                ))}
              </div>
              <div className="flex items-center">
                {STATUS_FLOW.map((step, i) => (
                  <p
                    key={step}
                    className={`flex-1 text-center text-[9px] ${i <= currentStepIndex ? "text-warm-green font-medium" : "text-muted-foreground/40"}`}
                  >
                    {STEP_LABELS[step]}
                  </p>
                ))}
              </div>
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
            <div className="flex items-center justify-between gap-3 mt-1">
              <span className="shrink-0 text-xs text-muted-foreground">Customer</span>
              <span className="min-w-0 truncate text-right text-xs font-medium text-foreground">{order.customer_name}</span>
            </div>
          )}
        </div>

        {/* Delivery date */}
        {deliveryDate && (
          <div className="px-5 py-2.5 border-b flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="shrink-0 text-xs text-muted-foreground">{dateLabel}</span>
            <span className="min-w-0 text-xs font-medium text-foreground">{deliveryDate}</span>
          </div>
        )}

        {/* Delivery address */}
        {order.delivery_address && (
          <div className="px-5 py-2.5 border-b flex items-start gap-2">
            <Truck className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Address</p>
              <p className="text-xs text-foreground whitespace-pre-line break-words">{order.delivery_address}</p>
            </div>
          </div>
        )}

        {/* Shipment — when shipped, always reassure the customer it's on the way,
            even without a trackable number (own rider / Lalamove / Grab). With a
            number we show the full tracking card; without one, a simple "On the
            way" card. For other statuses we show a compact row only if a number
            exists. */}
        {(() => {
          const detected = order.tracking_number ? detectCourier(order.tracking_number) : null;
          const merchantCourier = order.courier_name?.trim() || null;
          const courier = merchantCourier || detected?.name || null;
          // Prefer the courier the merchant picked for the portal link; only fall
          // back to number-pattern detection when none was named.
          const trackUrl = merchantCourier
            ? courierTrackUrl(merchantCourier, order.tracking_number)
            : (detected?.trackUrl ?? null);

          if (status === "shipped") {
            if (order.tracking_number) {
              return (
                <TrackingSection
                  trackingNumber={order.tracking_number}
                  courierName={courier}
                  trackUrl={trackUrl}
                />
              );
            }
            // Shipped without a tracking number — reassure with a simple card.
            return (
              <div className="px-5 py-4 border-b bg-warm-purple-light/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-warm-purple/10 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4 text-warm-purple" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">On the way</p>
                    <p className="text-xs text-muted-foreground">
                      {courier
                        ? `Out for delivery via ${courier}`
                        : order.delivery_address
                          ? "Your order is out for delivery"
                          : "Your order is on its way"}
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          if (order.tracking_number) {
            return (
              <div className="px-5 py-2.5 border-b flex items-start gap-2">
                <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">Tracking{courier ? ` · ${courier}` : ""}</p>
                  <p className="text-xs">
                    {trackUrl ? (
                      <a
                        href={trackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-warm-green underline underline-offset-2"
                      >
                        {order.tracking_number}
                      </a>
                    ) : (
                      <span className="text-foreground">{order.tracking_number}</span>
                    )}
                  </p>
                </div>
              </div>
            );
          }

          return null;
        })()}

        {/* Items */}
        <div className="px-5 py-3 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-foreground break-words">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.qty} x Rp {item.price.toLocaleString("id-ID")}
                </p>
              </div>
              <p className="text-sm font-medium text-foreground shrink-0 tabular-nums">
                Rp {(item.qty * item.price).toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-5 py-3 border-t space-y-1.5">
          {(order.discount > 0 || deliveryFee > 0) && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Subtotal</span>
              <span className="text-xs text-muted-foreground">Rp {order.subtotal.toLocaleString("id-ID")}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Discount</span>
              <span className="text-xs text-warm-green">-Rp {order.discount.toLocaleString("id-ID")}</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Delivery</span>
              <span className="text-xs text-muted-foreground">Rp {deliveryFee.toLocaleString("id-ID")}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-sm font-bold text-foreground">Rp {order.total.toLocaleString("id-ID")}</span>
          </div>
          {isPartial && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Paid</span>
              <span className="text-xs text-foreground">Rp {paidAmount.toLocaleString("id-ID")}</span>
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

        {/* Next steps — only shown when order is brand-new so customer knows what to expect */}
        {status === "new" && (
          <div className="px-5 py-3 border-t bg-muted/20">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">What happens next</p>
            <ol className="space-y-1.5">
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <ChevronRight className="w-3.5 h-3.5 text-warm-green shrink-0 mt-0.5" />
                {businessName} will review and confirm via WhatsApp
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <ChevronRight className="w-3.5 h-3.5 text-warm-green shrink-0 mt-0.5" />
                {isPaid
                  ? "Payment is already received"
                  : order.payment_claimed_at
                    ? "Your payment claim will be checked"
                    : "Pay once confirmed"}
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <ChevronRight className="w-3.5 h-3.5 text-warm-green shrink-0 mt-0.5" />
                {order.delivery_address ? "Your order will be delivered" : "Pick up your order at the agreed time"}
              </li>
            </ol>
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
          deliveryFee={deliveryFee}
          items={items}
          deliveryDate={order.delivery_date ?? null}
          notes={order.notes ?? null}
          showPayment={!isPaid && status !== "done" && status !== "cancelled"}
          businessName={businessName}
          paymentClaimedAt={order.payment_claimed_at}
          orderStatus={status}
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
