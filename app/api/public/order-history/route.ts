import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getPublicBusinessInfo } from "@/lib/services/public-order.service";
import { normalizePhone } from "@/lib/utils/phone";

/**
 * GET /api/public/order-history?slug=X&phone=Y
 *
 * Returns up to 5 most recent non-cancelled orders placed by a given phone
 * number on a given merchant storefront. Used by the customer-facing
 * /order/[slug] checkout form to surface a "reorder your last order" affordance.
 *
 * No auth required. Rate-limited per IP. Only returns items + totals — no
 * contact info is exposed beyond what the querying client already sent.
 */

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const MAX_ENTRIES = 10_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  // Cap memory: when the map gets large, drop expired entries. Worst case it
  // runs O(n) once per ~10K unique IPs — cheap and bounds growth on a
  // long-lived function instance.
  if (rateLimit.size > MAX_ENTRIES) {
    for (const [k, v] of rateLimit) {
      if (v.resetAt < now) rateLimit.delete(k);
    }
  }
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60_000 }); // 60s window
    return true;
  }
  if (entry.count >= 30) return false;
  entry.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();
  const phoneRaw = searchParams.get("phone")?.trim();

  if (!slug || !phoneRaw) {
    return NextResponse.json({ orders: [] });
  }

  const normalized = normalizePhone(phoneRaw) || phoneRaw;
  if (!normalized || normalized.replace(/\D/g, "").length < 9) {
    return NextResponse.json({ orders: [] });
  }

  const business = await getPublicBusinessInfo(slug);
  if (!business) {
    return NextResponse.json({ orders: [] });
  }

  const supabase = await createServiceClient();

  const { data } = await supabase
    .from("orders")
    .select("id, order_number, items, subtotal, discount, total, created_at, status")
    .eq("user_id", business.businessId)
    .eq("customer_phone", normalized)
    .not("status", "eq", "cancelled")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    orders: (data ?? []).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      items: o.items ?? [],
      subtotal: o.subtotal,
      discount: o.discount,
      total: o.total,
      created_at: o.created_at,
    })),
  });
}
