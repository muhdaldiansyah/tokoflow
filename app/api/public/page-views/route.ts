import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Rate limiter — 60 views per IP per hour
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = rateLimit.get(ip);
  if (!window || now > window.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (window.count >= 60) return false;
  window.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, sessionId, referrer, products } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Rate limit
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ ok: true }); // silent accept
    }

    const supabase = await createServiceClient();

    // Resolve slug → business_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const businessId = profile.id;

    // Insert page view
    await supabase.from("page_views").insert({
      business_id: businessId,
      referrer: typeof referrer === "string" ? referrer.slice(0, 200) : null,
      session_id: typeof sessionId === "string" ? sessionId.slice(0, 64) : null,
    });

    // Insert product views (if provided)
    if (Array.isArray(products) && products.length > 0) {
      const productRows = products.slice(0, 50).map((name: string) => ({
        business_id: businessId,
        product_name: String(name).slice(0, 200),
        session_id: typeof sessionId === "string" ? sessionId.slice(0, 64) : null,
      }));
      await supabase.from("product_views").insert(productRows);
    }

    // Update counters on profile (fire-and-forget)
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const { data: current } = await supabase
      .from("profiles")
      .select("total_views, views_today, views_today_date")
      .eq("id", businessId)
      .single();

    if (current) {
      const isToday = current.views_today_date === todayStr;
      await supabase.from("profiles").update({
        total_views: (current.total_views || 0) + 1,
        views_today: isToday ? (current.views_today || 0) + 1 : 1,
        views_today_date: todayStr,
      }).eq("id", businessId);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // silent fail
  }
}
