import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { Check, MessageCircle } from "lucide-react";
import { formatPhoneForWA } from "@/lib/utils/phone";
import { ConfirmReceiptButton } from "./ConfirmReceiptButton";

// Customer ack pages contain order detail (items, total, customer name).
// Discoverable only via direct token URL — keep out of search engines.
export const metadata: Metadata = {
  title: "Confirm receipt",
  robots: { index: false, follow: false, nocache: true },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CustomerAckPage({ params }: PageProps) {
  const { token } = await params;

  if (!UUID_RE.test(token)) return notFound();

  const supabase = await createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, items, total, status, delivery_date, customer_ack_at, user_id, deleted_at"
    )
    .eq("customer_ack_token", token)
    .is("deleted_at", null)
    .single();

  if (!order) return notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, logo_url, business_phone")
    .eq("id", order.user_id)
    .single();

  const businessName = profile?.business_name || "Toko";
  const initials = businessName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const items = (order.items || []) as { name: string; qty: number; price: number }[];
  const itemCount = items.reduce((sum, it) => sum + (it.qty || 0), 0);
  const itemSummary = items.length === 1
    ? `${items[0].name}${items[0].qty > 1 ? ` x${items[0].qty}` : ""}`
    : `${itemCount} item${itemCount > 1 ? "s" : ""}`;
  const acked = order.customer_ack_at !== null;
  const ackedAt = acked
    ? new Date(order.customer_ack_at).toLocaleString("en-MY", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const merchantWa = formatPhoneForWA(profile?.business_phone);
  const issueWaUrl = merchantWa
    ? `https://wa.me/${merchantWa}?text=${encodeURIComponent(
        `Hi ${businessName}, there's an issue with order ${order.order_number}.`
      )}`
    : null;

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Merchant header — brand front, Tokoflow invisible */}
        <div className="px-5 pt-6 pb-5 text-center border-b">
          <div className="relative w-14 h-14 rounded-full bg-warm-green-light flex items-center justify-center mx-auto mb-3 overflow-hidden">
            {profile?.logo_url ? (
              <Image
                src={profile.logo_url}
                alt=""
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <span className="text-base font-semibold text-warm-green">
                {initials}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground">{businessName}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Order {order.order_number}
          </p>
        </div>

        {/* Body — different states */}
        {acked ? (
          <div className="px-5 py-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-warm-green-light flex items-center justify-center mb-3">
              <Check className="w-7 h-7 text-warm-green" />
            </div>
            <h1 className="text-base font-semibold text-foreground mb-1">
              Confirmed
            </h1>
            <p className="text-sm text-muted-foreground">
              Thank you! {ackedAt && `Confirmed on ${ackedAt}.`}
            </p>
          </div>
        ) : (
          <>
            <div className="px-5 pt-5 pb-3 text-center">
              <h1 className="text-base font-semibold text-foreground mb-1">
                Did your order arrive?
              </h1>
              <p className="text-sm text-muted-foreground">
                {order.customer_name ? `Hi ${order.customer_name}, ` : ""}tap
                below to confirm when you've received your order.
              </p>
            </div>

            <div className="mx-5 mb-4 rounded-lg border bg-muted/30 px-3.5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Order</span>
                <span className="text-xs font-medium text-foreground">
                  {itemSummary}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-xs font-bold text-foreground">
                  RM {(order.total || 0).toLocaleString("en-MY")}
                </span>
              </div>
            </div>

            <div className="px-5 pb-5 space-y-2.5">
              <ConfirmReceiptButton token={token} />
              {issueWaUrl && (
                <a
                  href={issueWaUrl}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Not arrived / report an issue
                </a>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-muted/20 text-center">
          <p className="text-[10px] text-muted-foreground/60">
            Made with{" "}
            <a
              href="https://tokoflow.com"
              className="underline hover:text-muted-foreground"
            >
              Tokoflow
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
