import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing config" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Get all users with push tokens
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, push_token, business_name, full_name, business_type")
    .not("push_token", "is", null);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0 });
  }

  // Today in MYT (UTC+8)
  const now = new Date();
  const mytOffset = 8 * 60 * 60 * 1000;
  const todayMYT = new Date(now.getTime() + mytOffset);
  const todayStr = todayMYT.toISOString().split("T")[0]; // YYYY-MM-DD

  let sent = 0;
  const pushMessages: { to: string; title: string; body: string; sound: string; data: Record<string, unknown> }[] = [];

  for (const profile of profiles) {
    // Get today's orders for this user
    const { data: todayOrders } = await supabase
      .from("orders")
      .select("id, items, total, paid_amount, customer_name, status")
      .eq("user_id", profile.id)
      .gte("delivery_date", `${todayStr}T00:00:00+08:00`)
      .lt("delivery_date", `${todayStr}T23:59:59+08:00`)
      .not("status", "eq", "cancelled")
      .is("deleted_at", null);

    // Get unpaid orders count
    const { count: unpaidCount } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("paid_amount", 0)
      .not("status", "in", "(cancelled,menunggu)")
      .is("deleted_at", null);

    const orderCount = todayOrders?.length || 0;

    // Only send if there's something to say
    if (orderCount === 0 && (unpaidCount || 0) === 0) continue;

    // Aggregate items for today
    let topItems = "";
    if (todayOrders && todayOrders.length > 0) {
      const itemMap = new Map<string, number>();
      for (const order of todayOrders) {
        const items = order.items as { name: string; qty: number }[];
        if (Array.isArray(items)) {
          for (const item of items) {
            itemMap.set(item.name, (itemMap.get(item.name) || 0) + (item.qty || 1));
          }
        }
      }
      const sorted = [...itemMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
      topItems = sorted.map(([name, qty]) => `${name} x${qty}`).join(", ");
    }

    // Calculate unpaid amount for today
    let unpaidAmount = 0;
    if (todayOrders) {
      for (const order of todayOrders) {
        const remaining = (order.total || 0) - (order.paid_amount || 0);
        if (remaining > 0) unpaidAmount += remaining;
      }
    }

    // Build notification
    let title = "";
    let body = "";

    if (orderCount > 0) {
      title = `📋 Today: ${orderCount} orders`;
      const parts: string[] = [];
      if (topItems) parts.push(topItems);
      if (unpaidAmount > 0) {
        parts.push(`${unpaidCount || 0} unpaid (RM ${unpaidAmount.toLocaleString("en-MY")})`);
      }
      body = parts.join("\n");
    } else if ((unpaidCount || 0) > 0) {
      title = "💰 Money not yet collected";
      body = `${unpaidCount} orders still unpaid — the longer you wait, the harder it gets to collect`;
    }

    // Cost trend alert: compare this month's avg food cost % vs last month's
    if (orderCount > 0) {
      const thisMonthStart = `${todayStr.slice(0, 7)}-01`;
      const lastMonthDate = new Date(todayMYT);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      const lastMonthStart = `${lastMonthDate.toISOString().slice(0, 7)}-01`;
      const lastMonthEnd = thisMonthStart;

      const { data: thisMonthOrders } = await supabase
        .from("orders")
        .select("total, items")
        .eq("user_id", profile.id)
        .gte("delivery_date", `${thisMonthStart}T00:00:00+08:00`)
        .not("status", "eq", "cancelled")
        .is("deleted_at", null);

      const { data: lastMonthOrders } = await supabase
        .from("orders")
        .select("total, items")
        .eq("user_id", profile.id)
        .gte("delivery_date", `${lastMonthStart}T00:00:00+08:00`)
        .lt("delivery_date", `${lastMonthEnd}T00:00:00+08:00`)
        .not("status", "eq", "cancelled")
        .is("deleted_at", null);

      const calcAvgFoodCostPct = (orders: { total: number; items: unknown }[] | null) => {
        if (!orders || orders.length === 0) return null;
        let totalRevenue = 0;
        let totalCost = 0;
        for (const o of orders) {
          totalRevenue += o.total || 0;
          const items = o.items as { cost_price?: number; qty?: number }[];
          if (Array.isArray(items)) {
            for (const item of items) {
              if (item.cost_price) totalCost += item.cost_price * (item.qty || 1);
            }
          }
        }
        return totalRevenue > 0 && totalCost > 0 ? Math.round((totalCost / totalRevenue) * 100) : null;
      };

      const thisMonthPct = calcAvgFoodCostPct(thisMonthOrders);
      const lastMonthPct = calcAvgFoodCostPct(lastMonthOrders);

      if (thisMonthPct !== null && lastMonthPct !== null && lastMonthPct > 0) {
        const delta = thisMonthPct - lastMonthPct;
        if (delta >= 5) {
          body += `\n🔴 Food cost naik ${delta}pp dari bulan lalu — margin tergerus`;
        }
      }
    }

    if (title && profile.push_token) {
      pushMessages.push({
        to: profile.push_token,
        title,
        body,
        sound: "default",
        data: { screen: "production" },
      });
    }
  }

  // Batch send to Expo (max 100 per request)
  for (let i = 0; i < pushMessages.length; i += 100) {
    const batch = pushMessages.slice(i, i + 100);
    try {
      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(batch),
      });
      sent += batch.length;
    } catch (err) {
      console.error("[morning-brief] Push send failed:", err);
    }
  }

  return NextResponse.json({
    processed: profiles.length,
    sent,
    today: todayStr,
  });
}
