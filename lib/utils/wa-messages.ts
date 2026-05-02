import type { Order } from "@/features/orders/types/order.types";
import { ORDER_STATUS_LABELS } from "@/features/orders/types/order.types";

const DIVIDER = "─".repeat(20);
const BRANDING = "_Sent via Tokoflow — https://tokoflow.com_";

function formatItemsDash(items: Order["items"]): string {
  return items
    .map((item) => `- ${item.name} x${item.qty}: RM ${(item.price * item.qty).toLocaleString("en-MY")}`)
    .join("\n");
}

function formatItemsBullet(items: Order["items"]): string {
  return items
    .map((item) => `• ${item.name} x${item.qty}: RM ${(item.price * item.qty).toLocaleString("en-MY")}`)
    .join("\n");
}

function paymentLine(order: Order): string {
  const remaining = order.total - (order.paid_amount || 0);
  if (order.paid_amount > 0 && order.paid_amount < order.total) {
    return `\nPaid: RM ${order.paid_amount.toLocaleString("en-MY")}\n*Balance: RM ${remaining.toLocaleString("en-MY")}*`;
  }
  return "";
}

function deliveryLine(order: Order): string {
  if (!order.delivery_date) return "";
  return `\nDate: ${new Date(order.delivery_date).toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`;
}

function notesLine(order: Order): string {
  if (!order.notes) return "";
  return `\nNote: ${order.notes}`;
}

// Tokoflow MY does not use the IDR-style unique_code mechanism. Payment
// matching is handled by Billplz refs + the reconciliation engine. The
// transfer-amount line is a no-op kept for legacy callers.
function transferLine(_order: Order): string {
  return "";
}

export function buildOrderConfirmation(order: Order): string {
  return `*Order ${order.order_number}*${deliveryLine(order)}
${DIVIDER}
${formatItemsDash(order.items)}
${DIVIDER}
*Total: RM ${order.total.toLocaleString("en-MY")}*${transferLine(order)}${paymentLine(order)}${notesLine(order)}

Thank you!

${BRANDING}`;
}

export function buildOrderWithStatus(order: Order): string {
  const statusText = ORDER_STATUS_LABELS[order.status];
  return `*Order ${order.order_number}*
Status: ${statusText}${deliveryLine(order)}
${DIVIDER}
${formatItemsDash(order.items)}
${DIVIDER}
*Total: RM ${order.total.toLocaleString("en-MY")}*${transferLine(order)}${paymentLine(order)}${notesLine(order)}

Thank you!

${BRANDING}`;
}

export function buildPaymentReminder(order: Order): string {
  const remaining = order.total - (order.paid_amount || 0);
  const dpLine = order.paid_amount > 0 && order.paid_amount < order.total
    ? `\nAlready paid: RM ${order.paid_amount.toLocaleString("en-MY")}`
    : "";

  return `Hi ${order.customer_name || "there"},

Friendly reminder for order *${order.order_number}*:

${formatItemsBullet(order.items)}

Total: RM ${order.total.toLocaleString("en-MY")}${dpLine}
*Balance due: RM ${remaining.toLocaleString("en-MY")}*

Please make payment when you can. Thank you! 🙏

${BRANDING}`;
}

export function buildCustomerOrderMessage(params: {
  orderNumber: string;
  orderId?: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  customerName: string;
  notes?: string;
}): string {
  const itemLines = params.items
    .map((item) => `• ${item.name} x${item.qty} — RM ${(item.price * item.qty).toLocaleString("en-MY")}`)
    .join("\n");

  const notesText = params.notes ? `\n_Note: ${params.notes}_` : "";
  const receiptLink = params.orderId ? `\n\nReceipt: https://tokoflow.com/r/${params.orderId}` : "";

  return `Hi, I'm *${params.customerName}*. I just placed an order:

*${params.orderNumber}*
${itemLines}

*Total: RM ${params.total.toLocaleString("en-MY")}*${notesText}${receiptLink}

Please confirm — thanks!

${BRANDING}`;
}

export function buildQrisConfirmationMessage(params: {
  orderNumber: string;
  orderId?: string;
  items?: { name: string; qty: number; price: number }[];
  total?: number;
  customerName: string;
  notes?: string;
}): string {
  if (params.items && params.items.length > 0) {
    const itemLines = params.items
      .map((item) => `• ${item.name} x${item.qty} — RM ${(item.price * item.qty).toLocaleString("en-MY")}`)
      .join("\n");

    const notesText = params.notes ? `\n_Note: ${params.notes}_` : "";
    const receiptLink = params.orderId ? `\n\nReceipt: https://tokoflow.com/r/${params.orderId}` : "";

    return `Hi, I'm *${params.customerName}*. I've paid via DuitNow QR for this order:

*${params.orderNumber}*
${itemLines}

*Total: RM ${(params.total || 0).toLocaleString("en-MY")}*${notesText}${receiptLink}

Please confirm — thanks!

${BRANDING}`;
  }

  return `Hi, I'm ${params.customerName}. I've paid via DuitNow QR for order *${params.orderNumber}*. Please confirm — thanks!

${BRANDING}`;
}

export function buildPreorderConfirmation(order: Order): string {
  return `*Order ${order.order_number}*${deliveryLine(order)}
${DIVIDER}
${formatItemsDash(order.items)}
${DIVIDER}
*Total: RM ${order.total.toLocaleString("en-MY")}*${transferLine(order)}${paymentLine(order)}${notesLine(order)}

Order received! We'll reach out before delivery. Thank you! 🙏

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
  const sstRate = invoice.sst_rate ?? invoice.ppn_rate ?? 0;
  const sstAmount = invoice.sst_amount ?? invoice.ppn_amount ?? 0;
  const itemLines = invoice.items
    .map((item) => `- ${item.name} x${item.qty}: RM ${(item.price * item.qty).toLocaleString("en-MY")}`)
    .join("\n");

  const remaining = invoice.total - (invoice.paid_amount || 0);
  const netAmount = invoice.subtotal - invoice.discount;

  let paymentInfo = "";
  if (invoice.paid_amount > 0 && remaining > 0) {
    paymentInfo = `\nPaid: RM ${invoice.paid_amount.toLocaleString("en-MY")}\n*Balance: RM ${remaining.toLocaleString("en-MY")}*`;
  }

  const dueLine = invoice.due_date
    ? `\nDue date: ${new Date(invoice.due_date).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}`
    : "";

  const notesText = invoice.notes ? `\nNote: ${invoice.notes}` : "";

  return `*INVOICE ${invoice.invoice_number}*
${DIVIDER}
${itemLines}
${DIVIDER}
Subtotal: RM ${invoice.subtotal.toLocaleString("en-MY")}${invoice.discount > 0 ? `\nDiscount: -RM ${invoice.discount.toLocaleString("en-MY")}` : ""}
Taxable: RM ${netAmount.toLocaleString("en-MY")}
SST ${sstRate}%: RM ${sstAmount.toLocaleString("en-MY")}
*Total: RM ${invoice.total.toLocaleString("en-MY")}*${paymentInfo}${dueLine}${notesText}

Please make payment at your earliest convenience. Thank you! 🙏

${BRANDING}`;
}

export function buildCelebrationConfirmation(order: Order, businessName?: string): string {
  return `*Order ${order.order_number}*${deliveryLine(order)}
${DIVIDER}
${formatItemsDash(order.items)}
${DIVIDER}
*Total: RM ${order.total.toLocaleString("en-MY")}*${transferLine(order)}${paymentLine(order)}${notesLine(order)}

Thank you!
${businessName ? `\n- ${businessName}\n` : ""}
${BRANDING}`;
}
