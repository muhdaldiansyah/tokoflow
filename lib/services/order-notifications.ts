import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/utils/email";

/**
 * Email the merchant that a new store-link order has landed.
 *
 * Covers the "dashboard tab closed" gap that realtime in-app toast can't catch
 * (Ariff feedback 2026-05-02). Fire-and-forget — callers should not block order
 * flow on this.
 *
 * For QR (DuitNow) orders this is deferred until the customer uploads a payment
 * receipt (upload-proof flips awaiting_payment → false), so the merchant is only
 * notified once the order is real and visible. Non-QR orders are notified at
 * creation time.
 */
export async function notifyMerchantOfNewOrder(params: {
  businessId: string;
  orderNumber: string;
  orderId: string;
  total: number;
  deliveryFee?: number;
  customerName: string;
  items: Array<{ name: string; qty: number; price: number }>;
}): Promise<void> {
  const svc = await createServiceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("email, business_name, notify_new_order_email")
    .eq("id", params.businessId)
    .maybeSingle();
  if (!profile?.email) return;
  // Default ON when the column doesn't exist yet — column will land in a
  // settings migration. Merchant can opt out via /settings.
  if (profile.notify_new_order_email === false) return;

  const itemLines = params.items
    .map((i) => `  • ${i.qty}× ${i.name} — RM ${(i.price * i.qty).toLocaleString("en-MY")}`)
    .join("\n");
  const deliveryLine = params.deliveryFee && params.deliveryFee > 0
    ? `  Delivery — RM ${params.deliveryFee.toLocaleString("en-MY")}`
    : "";

  await sendEmail({
    to: profile.email,
    subject: `New order — ${params.customerName} · RM ${params.total.toLocaleString("en-MY")}`,
    text: [
      `${params.customerName} just placed an order through your Tokoflow store link.`,
      ``,
      `Order: ${params.orderNumber}`,
      itemLines,
      deliveryLine,
      ``,
      `Total: RM ${params.total.toLocaleString("en-MY")}`,
      ``,
      `Open in dashboard: https://tokoflow.com/orders/${params.orderId}`,
      ``,
      `— Tokoflow`,
    ].join("\n"),
  });
}

/**
 * Email the merchant that the customer RE-uploaded a payment receipt after the
 * merchant rejected the previous one (the order is back in the active list).
 * Distinct from notifyMerchantOfNewOrder so the merchant isn't told a re-payment
 * is a "new order". Fire-and-forget; gated by the same notify_new_order_email
 * preference.
 */
export async function notifyMerchantOfReuploadedProof(params: {
  businessId: string;
  orderNumber: string;
  orderId: string;
  total: number;
  customerName: string;
}): Promise<void> {
  const svc = await createServiceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("email, notify_new_order_email")
    .eq("id", params.businessId)
    .maybeSingle();
  if (!profile?.email) return;
  if (profile.notify_new_order_email === false) return;

  await sendEmail({
    to: profile.email,
    subject: `Payment receipt re-uploaded — ${params.customerName} · ${params.orderNumber}`,
    text: [
      `${params.customerName} re-uploaded their payment receipt for order ${params.orderNumber} after you asked them to pay again.`,
      ``,
      `Total: RM ${params.total.toLocaleString("en-MY")}`,
      ``,
      `Re-check it in your dashboard: https://tokoflow.com/orders/${params.orderId}`,
      ``,
      `— Tokoflow`,
    ].join("\n"),
  });
}
