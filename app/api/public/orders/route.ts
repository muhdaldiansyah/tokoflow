import { NextResponse, type NextRequest } from "next/server";
import { getPublicBusinessInfo, createPublicOrder } from "@/lib/services/public-order.service";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/utils/email";
import { createBill, ringgitToCents } from "@/lib/billplz";
import { decryptSecret } from "@/lib/crypto/secret-box";

// ADR 0001 — When the merchant has connected Billplz AND has the in-flow
// payment toggle on, create a bill on THEIR Billplz account at order submit
// time. Customer is redirected to Billplz hosted checkout; funds settle
// directly to merchant's bank. Tokoflow records every transition via webhook.
//
// Returns { paymentUrl, billId } on success; returns null on any failure
// (caller falls back to static DuitNow QR + manual verify).
async function maybeCreateBillplzBill(params: {
  businessId: string;
  orderId: string;
  orderNumber: string;
  total: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  slug: string;
}): Promise<{ paymentUrl: string; billId: string } | null> {
  try {
    const svc = await createServiceClient();
    const { data: profile } = await svc
      .from("profiles")
      .select("billplz_payment_enabled, billplz_api_key_enc, billplz_collection_id")
      .eq("id", params.businessId)
      .maybeSingle();

    if (!profile?.billplz_payment_enabled) return null;
    if (!profile.billplz_api_key_enc || !profile.billplz_collection_id) return null;

    const apiKey = decryptSecret(profile.billplz_api_key_enc);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tokoflow.com";

    const bill = await createBill(
      {
        collectionId: profile.billplz_collection_id,
        email: params.customerEmail || `noreply+${params.orderId}@tokoflow.com`,
        mobile: params.customerPhone,
        name: params.customerName,
        amountCents: ringgitToCents(params.total),
        description: `Order ${params.orderNumber}`,
        callbackUrl: `${appUrl}/api/public/orders/billplz-webhook`,
        redirectUrl: `${appUrl}/${params.slug}/sukses?oid=${params.orderId}`,
        reference1Label: "Order ID",
        reference1: params.orderId,
        reference2Label: "Merchant ID",
        reference2: params.businessId,
      },
      apiKey,
    );

    // Persist the order_payments row so the webhook handler has somewhere to
    // write to. Status starts pending; webhook flips to paid/failed.
    await svc.from("order_payments").insert({
      order_id: params.orderId,
      user_id: params.businessId,
      amount: params.total,
      status: "pending",
      provider: "billplz",
      billplz_bill_id: bill.id,
      billplz_url: bill.url,
      payer_name: params.customerName,
      payer_email: params.customerEmail || null,
      payer_phone: params.customerPhone,
    });

    return { paymentUrl: bill.url, billId: bill.id };
  } catch (err) {
    // Never block order creation on payment failure — the order is real,
    // payment falls back to DuitNow QR + manual verify.
    console.error("Billplz bill creation failed:", err);
    return null;
  }
}

async function notifyMerchantOfNewOrder(params: {
  businessId: string;
  orderNumber: string;
  orderId: string;
  total: number;
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

  await sendEmail({
    to: profile.email,
    subject: `New order — ${params.customerName} · RM ${params.total.toLocaleString("en-MY")}`,
    text: [
      `${params.customerName} just placed an order through your Tokoflow store link.`,
      ``,
      `Order: ${params.orderNumber}`,
      itemLines,
      ``,
      `Total: RM ${params.total.toLocaleString("en-MY")}`,
      ``,
      `Open in dashboard: https://tokoflow.com/orders/${params.orderId}`,
      ``,
      `— Tokoflow`,
    ].join("\n"),
  });
}

// Simple in-memory rate limiter — best-effort on serverless
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const MAX_ENTRIES = 10_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (rateLimit.size > MAX_ENTRIES) {
    for (const [k, v] of rateLimit) {
      if (v.resetAt < now) rateLimit.delete(k);
    }
  }
  const window = rateLimit.get(ip);
  if (!window || now > window.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 3_600_000 }); // 1 hour window
    return true;
  }
  if (window.count >= 10) return false;
  window.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Honeypot check — bots fill hidden fields
    if (body.website) {
      return NextResponse.json({ success: true, orderNumber: "OK" }); // silent 200
    }

    // Rate limit
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    // Validate slug
    const { slug, customerName, customerPhone, items, notes } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    // Resolve business
    const business = await getPublicBusinessInfo(slug);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    if (!business.orderFormEnabled) {
      return NextResponse.json({ error: "Order form is inactive" }, { status: 403 });
    }
    // Validate required fields
    if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!customerPhone || typeof customerPhone !== "string" || !customerPhone.trim()) {
      return NextResponse.json({ error: "WhatsApp number is required" }, { status: 400 });
    }

    // Validate phone format — Malaysian mobile numbers (+60 ...).
    const phoneDigits = String(customerPhone).replace(/\D/g, "");
    if (
      phoneDigits.length < 9
      || phoneDigits.length > 13
      || !(phoneDigits.startsWith("0") || phoneDigits.startsWith("60"))
    ) {
      return NextResponse.json({ error: "Invalid WhatsApp number format" }, { status: 400 });
    }

    // At least one item OR notes
    const validItems = Array.isArray(items)
      ? items.filter((i: { name?: string; qty?: number; price?: number }) =>
          i.name && typeof i.name === "string" && (i.qty || 0) > 0
        )
      : [];
    const hasNotes = notes && typeof notes === "string" && notes.trim().length > 0;

    if (validItems.length === 0 && !hasNotes) {
      return NextResponse.json({ error: "Pick at least one item or describe your order" }, { status: 400 });
    }

    // Sanitize
    const sanitizedItems = validItems.map((i: { name: string; qty: number; price: number }) => ({
      name: String(i.name).trim().slice(0, 100),
      qty: Math.min(Math.max(1, Math.floor(Number(i.qty) || 1)), 999),
      price: Math.max(0, Math.floor(Number(i.price) || 0)),
    }));

    // Validate stock availability
    for (const item of sanitizedItems) {
      const catalogItem = business.frequentItems.find(
        fi => fi.name.toLowerCase() === item.name.toLowerCase()
      );
      if (catalogItem && catalogItem.stock !== null && catalogItem.stock !== undefined) {
        if (item.qty > catalogItem.stock) {
          return NextResponse.json({
            error: `Insufficient stock for ${catalogItem.name} (${catalogItem.stock} left)`
          }, { status: 400 });
        }
      }
    }

    // Create order
    const { deliveryDate } = body;
    const isPreorder = business.preorderEnabled;
    const isLangganan = business.langgananEnabled;

    // Preorder requires delivery date (but langganan makes it optional)
    if (isPreorder && !isLangganan) {
      if (!deliveryDate || typeof deliveryDate !== "string") {
        return NextResponse.json({ error: "Delivery date is required for pre-orders" }, { status: 400 });
      }
    }

    // Capacity check (if set and delivery date provided)
    if (business.dailyOrderCapacity !== null && deliveryDate) {
      const svc = await createServiceClient();
      const startOfDay = `${deliveryDate}T00:00:00.000+08:00`;
      const endOfDay = `${deliveryDate}T23:59:59.999+08:00`;

      const { count } = await svc
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", business.businessId)
        .gte("delivery_date", startOfDay)
        .lte("delivery_date", endOfDay)
        .neq("status", "cancelled");

      if ((count ?? 0) >= business.dailyOrderCapacity) {
        return NextResponse.json({
          error: `Orders for this date are full (max ${business.dailyOrderCapacity}/day). Please pick another date.`
        }, { status: 400 });
      }
    }

    // Referral source tracking (directory, etc.)
    const referralSource = body.referralSource && typeof body.referralSource === "string"
      ? String(body.referralSource).slice(0, 50)
      : undefined;

    const result = await createPublicOrder({
      businessId: business.businessId,
      customerName: String(customerName).trim().slice(0, 100),
      customerPhone: String(customerPhone).trim().slice(0, 20),
      items: sanitizedItems,
      notes: hasNotes ? String(notes).trim().slice(0, 500) : "",
      deliveryDate: deliveryDate && typeof deliveryDate === "string" ? deliveryDate : undefined,
      isPreorder,
      isLangganan,
      referralSource,
    });

    if (!result) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // ADR 0001 — try to spin up an in-flow Billplz bill on the merchant's
    // own account. Returns null when disconnected/disabled/error → caller
    // falls back to DuitNow QR + manual verify on the success page.
    const customerEmail = typeof body.customerEmail === "string"
      ? String(body.customerEmail).trim().slice(0, 100)
      : "";
    const billplzResult = await maybeCreateBillplzBill({
      businessId: business.businessId,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      total: result.total,
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      customerEmail,
      slug,
    });

    // Fire-and-forget analytics
    try {
      const svc = await createServiceClient();
      await svc.from("events").insert({
        user_id: business.businessId,
        event: "public_order_received",
        properties: {
          slug,
          item_count: sanitizedItems.length,
          subtotal: sanitizedItems.reduce((s, i) => s + i.price * i.qty, 0),
          has_notes: Boolean(hasNotes),
          payment_inflow: Boolean(billplzResult),
        },
      });
    } catch {}

    // Email the merchant — covers the "dashboard tab closed" gap that
    // realtime in-app toast can't catch (Ariff feedback 2026-05-02).
    void notifyMerchantOfNewOrder({
      businessId: business.businessId,
      orderNumber: result.orderNumber,
      orderId: result.orderId,
      total: result.total,
      customerName,
      items: sanitizedItems,
    }).catch(() => undefined);

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      total: result.total,
      paymentUrl: billplzResult?.paymentUrl ?? null,
    });
  } catch {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
