import { NextResponse, type NextRequest } from "next/server";
import { getPublicBusinessInfo, createPublicOrder } from "@/lib/services/public-order.service";
import { createServiceClient } from "@/lib/supabase/server";

// Simple in-memory rate limiter — best-effort on serverless
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
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
            error: `Stok ${catalogItem.name} tidak cukup (tersisa ${catalogItem.stock})`
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
      const startOfDay = `${deliveryDate}T00:00:00.000+07:00`;
      const endOfDay = `${deliveryDate}T23:59:59.999+07:00`;

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
      return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
    }

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
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      transferAmount: result.transferAmount,
    });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
