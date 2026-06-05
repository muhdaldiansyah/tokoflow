import type { Order } from "@/features/orders/types/order.types";
import { ORDER_STATUS_LABELS } from "@/features/orders/types/order.types";
import { detectCourier } from "./courier";
import { formatMoney } from "@/lib/currency/format";

// Money helper — country-aware, defaults to ID → "Rp 75.000".
const money = (amount: number) => formatMoney(amount);

const DIVIDER = "─".repeat(20);
const BRANDING = "_Dikirim via Tokoflow — https://tokoflow.co.id_";

function formatItemsDash(items: Order["items"]): string {
  return items
    .map((item) => `- ${item.name} x${item.qty}: ${money(item.price * item.qty)}`)
    .join("\n");
}

function formatItemsBullet(items: Order["items"]): string {
  return items
    .map((item) => `• ${item.name} x${item.qty}: ${money(item.price * item.qty)}`)
    .join("\n");
}

function paymentLine(order: Order): string {
  const remaining = order.total - (order.paid_amount || 0);
  if (order.paid_amount > 0 && order.paid_amount < order.total) {
    return `\nDibayar: ${money(order.paid_amount)}\n*Sisa: ${money(remaining)}*`;
  }
  return "";
}

function deliveryLine(order: Order): string {
  if (!order.delivery_date) return "";
  return `\nTanggal: ${new Date(order.delivery_date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`;
}

// Dine-in orders skip address rendering — they're not going anywhere.
// Pickup orders (delivery_address NULL) also skip; "Pickup at store" is
// implied by the order context.
function addressLine(order: Order): string {
  if (order.is_dine_in) return "";
  if (!order.delivery_address) return "";
  return `\nAlamat: ${order.delivery_address}`;
}

// Renders tracking as "Resi: <number> (<courier>)" when both are known.
// Prefers the courier the merchant picked; falls back to detecting from the
// number prefix; if neither, prints the number alone.
function trackingLine(order: Order): string {
  if (!order.tracking_number) return "";
  const trimmed = order.tracking_number.trim();
  if (!trimmed) return "";
  const detected = detectCourier(trimmed);
  const courier = order.courier_name?.trim() || detected?.name || null;
  return courier
    ? `\nResi: ${trimmed} (${courier})`
    : `\nResi: ${trimmed}`;
}

function notesLine(order: Order): string {
  if (!order.notes) return "";
  return `\nCatatan: ${order.notes}`;
}

function chargeLines(order: Order): string {
  const deliveryFee = Math.max(0, Number(order.delivery_fee ?? 0) || 0);
  const lines: string[] = [];
  if ((order.discount && order.discount > 0) || deliveryFee > 0) {
    lines.push(`Subtotal: ${money(order.subtotal)}`);
  }
  if (order.discount && order.discount > 0) {
    lines.push(`Diskon: -${money(order.discount)}`);
  }
  if (deliveryFee > 0) {
    lines.push(`Ongkir: ${money(deliveryFee)}`);
  }
  return lines.length > 0 ? `\n${lines.join("\n")}` : "";
}

// Tokoflow ID uses Midtrans (QRIS / VA / e-wallet) for gateway payments; payment
// matching is handled by gateway refs + the reconciliation engine. The
// transfer-amount line is a no-op kept for legacy callers.
function transferLine(_order: Order): string {
  return "";
}

export function buildOrderConfirmation(order: Order): string {
  return `*Order ${order.order_number}*${deliveryLine(order)}
${DIVIDER}
${formatItemsDash(order.items)}
${DIVIDER}${chargeLines(order)}
*Total: ${money(order.total)}*${transferLine(order)}${paymentLine(order)}${notesLine(order)}

Terima kasih!

${BRANDING}`;
}

export function buildOrderWithStatus(order: Order): string {
  const statusText = ORDER_STATUS_LABELS[order.status];
  return `*Order ${order.order_number}*
Status: ${statusText}${deliveryLine(order)}${addressLine(order)}${trackingLine(order)}
${DIVIDER}
${formatItemsDash(order.items)}
${DIVIDER}${chargeLines(order)}
*Total: ${money(order.total)}*${transferLine(order)}${paymentLine(order)}${notesLine(order)}

Terima kasih!

${BRANDING}`;
}

export function buildPaymentReminder(order: Order): string {
  const remaining = order.total - (order.paid_amount || 0);
  const dpLine = order.paid_amount > 0 && order.paid_amount < order.total
    ? `\nSudah dibayar: ${money(order.paid_amount)}`
    : "";

  return `Halo ${order.customer_name || "kak"},

Pengingat ramah untuk order *${order.order_number}*:

${formatItemsBullet(order.items)}

Total: ${money(order.total)}${dpLine}
*Sisa tagihan: ${money(remaining)}*

Mohon lakukan pembayaran ya. Terima kasih! 🙏

${BRANDING}`;
}

export function buildCustomerOrderMessage(params: {
  orderNumber: string;
  orderId?: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  deliveryFee?: number;
  customerName: string;
  notes?: string;
}): string {
  const itemLines = params.items
    .map((item) => `• ${item.name} x${item.qty} — ${money(item.price * item.qty)}`)
    .join("\n");

  const deliveryFee = Math.max(0, Number(params.deliveryFee ?? 0) || 0);
  const subtotal = params.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryText = deliveryFee > 0
    ? `\nSubtotal: ${money(subtotal)}\nOngkir: ${money(deliveryFee)}`
    : "";
  const notesText = params.notes ? `\n_Catatan: ${params.notes}_` : "";
  const receiptLink = params.orderId ? `\n\nResi/Struk: https://tokoflow.co.id/r/${params.orderId}` : "";

  return `Halo, saya *${params.customerName}*. Saya baru saja pesan:

*${params.orderNumber}*
${itemLines}
${deliveryText}

*Total: ${money(params.total)}*${notesText}${receiptLink}

Mohon dikonfirmasi ya — terima kasih!

${BRANDING}`;
}

export function buildQrisConfirmationMessage(params: {
  orderNumber: string;
  orderId?: string;
  items?: { name: string; qty: number; price: number }[];
  total?: number;
  deliveryFee?: number;
  customerName: string;
  notes?: string;
}): string {
  if (params.items && params.items.length > 0) {
    const itemLines = params.items
      .map((item) => `• ${item.name} x${item.qty} — ${money(item.price * item.qty)}`)
      .join("\n");

    const deliveryFee = Math.max(0, Number(params.deliveryFee ?? 0) || 0);
    const subtotal = params.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const deliveryText = deliveryFee > 0
      ? `\nSubtotal: ${money(subtotal)}\nOngkir: ${money(deliveryFee)}`
      : "";
    const notesText = params.notes ? `\n_Catatan: ${params.notes}_` : "";
    const receiptLink = params.orderId ? `\n\nResi/Struk: https://tokoflow.co.id/r/${params.orderId}` : "";

    return `Halo, saya *${params.customerName}*. Saya sudah bayar via QRIS untuk order ini:

*${params.orderNumber}*
${itemLines}
${deliveryText}

*Total: ${money(params.total || 0)}*${notesText}${receiptLink}

Mohon dikonfirmasi ya — terima kasih!

${BRANDING}`;
  }

  return `Halo, saya ${params.customerName}. Saya sudah bayar via QRIS untuk order *${params.orderNumber}*. Mohon dikonfirmasi ya — terima kasih!

${BRANDING}`;
}

export function buildPreorderConfirmation(order: Order): string {
  return `*Order ${order.order_number}*${deliveryLine(order)}
${DIVIDER}
${formatItemsDash(order.items)}
${DIVIDER}${chargeLines(order)}
*Total: ${money(order.total)}*${transferLine(order)}${paymentLine(order)}${notesLine(order)}

Pesanan diterima! Kami akan menghubungi sebelum pengiriman. Terima kasih! 🙏

${BRANDING}`;
}

export function buildInvoiceMessage(invoice: {
  invoice_number: string;
  buyer_name?: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  sst_rate?: number;
  sst_amount?: number;
  ppn_rate?: number;
  ppn_amount?: number;
  total: number;
  paid_amount: number;
  due_date?: string | null;
  payment_terms?: string;
  notes?: string;
}): string {
  // ppn_* is the ID (active) field; sst_* is the dormant MY mirror.
  const ppnRate = invoice.ppn_rate ?? invoice.sst_rate ?? 0;
  const ppnAmount = invoice.ppn_amount ?? invoice.sst_amount ?? 0;
  const itemLines = invoice.items
    .map((item) => `- ${item.name} x${item.qty}: ${money(item.price * item.qty)}`)
    .join("\n");

  const remaining = invoice.total - (invoice.paid_amount || 0);
  const netAmount = invoice.subtotal - invoice.discount;

  let paymentInfo = "";
  if (invoice.paid_amount > 0 && remaining > 0) {
    paymentInfo = `\nDibayar: ${money(invoice.paid_amount)}\n*Sisa: ${money(remaining)}*`;
  }

  const dueLine = invoice.due_date
    ? `\nJatuh tempo: ${new Date(invoice.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
    : "";

  const notesText = invoice.notes ? `\nCatatan: ${invoice.notes}` : "";

  return `*FAKTUR ${invoice.invoice_number}*
${DIVIDER}
${itemLines}
${DIVIDER}
Subtotal: ${money(invoice.subtotal)}${invoice.discount > 0 ? `\nDiskon: -${money(invoice.discount)}` : ""}
Dasar pengenaan: ${money(netAmount)}
PPN ${ppnRate}%: ${money(ppnAmount)}
*Total: ${money(invoice.total)}*${paymentInfo}${dueLine}${notesText}

Mohon lakukan pembayaran secepatnya. Terima kasih! 🙏

${BRANDING}`;
}

export function buildDeliveryAckRequest(params: {
  order: Pick<Order, "order_number" | "customer_name" | "items" | "total">;
  ackUrl: string;
  businessName?: string;
}): string {
  const { order, ackUrl, businessName } = params;
  const itemCount = order.items.reduce((sum, it) => sum + (it.qty || 0), 0);
  const itemSummary =
    order.items.length === 1
      ? `${order.items[0].name}${order.items[0].qty > 1 ? ` x${order.items[0].qty}` : ""}`
      : `${itemCount} item`;
  const greeting = order.customer_name ? `Halo ${order.customer_name}` : "Halo";
  const fromLine = businessName ? ` dari *${businessName}*` : "";

  return `${greeting}, pesananmu${fromLine} sedang dalam perjalanan.

*${order.order_number}*
${itemSummary} — ${money(order.total)}

Tap untuk konfirmasi saat sudah sampai:
${ackUrl}

Terima kasih! 🙏

${BRANDING}`;
}

export function buildCelebrationConfirmation(order: Order, businessName?: string): string {
  return `*Order ${order.order_number}*${deliveryLine(order)}
${DIVIDER}
${formatItemsDash(order.items)}
${DIVIDER}${chargeLines(order)}
*Total: ${money(order.total)}*${transferLine(order)}${paymentLine(order)}${notesLine(order)}

Terima kasih!
${businessName ? `\n- ${businessName}\n` : ""}
${BRANDING}`;
}
