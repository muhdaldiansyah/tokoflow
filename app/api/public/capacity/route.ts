import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/public/capacity?userId=xxx&date=2026-03-15
 * Returns { capacity, used, remaining } for a delivery date.
 * No auth required (public form uses this).
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const date = request.nextUrl.searchParams.get("date");

  if (!userId || !date) {
    return NextResponse.json({ error: "Missing userId or date" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // Get capacity setting
  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_order_capacity")
    .eq("id", userId)
    .maybeSingle();

  const capacity = profile?.daily_order_capacity ?? null;

  // If no capacity set, unlimited
  if (capacity === null) {
    return NextResponse.json({ capacity: null, used: 0, remaining: null });
  }

  // Count orders for this delivery date
  const startOfDay = `${date}T00:00:00.000+07:00`;
  const endOfDay = `${date}T23:59:59.999+07:00`;

  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("delivery_date", startOfDay)
    .lte("delivery_date", endOfDay)
    .neq("status", "cancelled");

  const used = count ?? 0;
  const remaining = Math.max(0, capacity - used);

  return NextResponse.json({ capacity, used, remaining }, {
    headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" },
  });
}
