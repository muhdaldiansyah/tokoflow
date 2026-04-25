import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get today's order summary
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use MYT (UTC+8) for "today" to match monthly recap
    const now = new Date();
    const mytOffset = 8 * 60 * 60 * 1000;
    const mytNow = new Date(now.getTime() + mytOffset);
    const mytDate = `${mytNow.getUTCFullYear()}-${String(mytNow.getUTCMonth() + 1).padStart(2, "0")}-${String(mytNow.getUTCDate()).padStart(2, "0")}`;
    const startOfDay = `${mytDate}T00:00:00.000+08:00`;
    const endOfDay = `${mytDate}T23:59:59.999+08:00`;

    // Fetch orders created today + orders with delivery today + all unpaid
    const [createdResult, deliveryResult, unpaidResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id, status, total, delivery_date, source")
        .eq("user_id", user.id)
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay),
      supabase
        .from("orders")
        .select("id, status, total, delivery_date, source")
        .eq("user_id", user.id)
        .gte("delivery_date", startOfDay)
        .lte("delivery_date", endOfDay),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("status", "cancelled")
        .in("payment_status", ["unpaid", "partial"]),
    ]);

    // Deduplicate by id
    const orderMap = new Map<string, { id: string; status: string; total: number; source?: string }>();
    for (const o of [...(createdResult.data || []), ...(deliveryResult.data || [])]) {
      if (!orderMap.has(o.id)) orderMap.set(o.id, o);
    }

    const allOrders = Array.from(orderMap.values());
    const nonCancelled = allOrders.filter((o) => o.status !== "cancelled");

    const pendingCount = nonCancelled.filter((o) => o.status === "new" || o.status === "processed").length;
    const todayRevenue = nonCancelled.reduce((sum, o) => sum + (o.total || 0), 0);
    const todayOrderCount = nonCancelled.length;
    const allTodayDone = todayOrderCount > 0 && nonCancelled.every((o) => o.status === "done");
    const linkOrderCount = nonCancelled.filter((o) => o.source === "order_link").length;

    return NextResponse.json({
      pendingCount,
      todayRevenue,
      todayOrderCount,
      allTodayDone,
      linkOrderCount,
      unpaidCount: unpaidResult.count ?? 0,
    }, {
      headers: { "Cache-Control": "private, s-maxage=15, stale-while-revalidate=30" },
    });
  } catch (error) {
    console.error("Today summary API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
