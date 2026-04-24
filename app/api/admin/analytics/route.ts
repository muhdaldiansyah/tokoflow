import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  const supabase = await createServiceClient();

  // Funnel: unique users per event type
  const { data: signupUsers } = await supabase
    .from("events")
    .select("user_id")
    .eq("event", "signup");

  const { data: orderCreatedUsers } = await supabase
    .from("events")
    .select("user_id")
    .eq("event", "order_created");

  const { data: waSentUsers } = await supabase
    .from("events")
    .select("user_id")
    .eq("event", "wa_sent");

  const funnel = {
    signup: new Set(signupUsers?.map((r) => r.user_id)).size,
    order_created: new Set(orderCreatedUsers?.map((r) => r.user_id)).size,
    wa_sent: new Set(waSentUsers?.map((r) => r.user_id)).size,
  };

  // Retention: D1/D7/D30
  // Fetch signup events and all events once, compute retention in-memory
  const { data: signupEvents } = await supabase
    .from("events")
    .select("user_id, created_at")
    .eq("event", "signup");

  const { data: allEvents } = await supabase
    .from("events")
    .select("user_id, event, properties, created_at");

  const retention: Record<string, number> = {};

  // Build first-signup map
  const firstSignup = new Map<string, Date>();
  if (signupEvents) {
    for (const row of signupEvents) {
      const existing = firstSignup.get(row.user_id);
      const created = new Date(row.created_at);
      if (!existing || created < existing) {
        firstSignup.set(row.user_id, created);
      }
    }
  }

  const now = new Date();
  for (const [label, days] of [["d1", 1], ["d7", 7], ["d30", 30]] as const) {
    let retained = 0;
    let eligible = 0;

    for (const [userId, signupDate] of firstSignup) {
      const daysSinceSignup = (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSignup < days) continue;
      eligible++;

      const hasLaterEvent = allEvents?.some((e) => {
        if (e.user_id !== userId) return false;
        const eventDate = new Date(e.created_at);
        const daysDiff = (eventDate.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff >= days;
      });

      if (hasLaterEvent) retained++;
    }

    retention[label] = eligible > 0 ? Math.round((retained / eligible) * 100) : 0;
  }

  // Time to first order
  const { data: orderEvents } = await supabase
    .from("events")
    .select("user_id, created_at")
    .eq("event", "order_created");

  const firstOrder = new Map<string, Date>();
  if (orderEvents) {
    for (const row of orderEvents) {
      const existing = firstOrder.get(row.user_id);
      const created = new Date(row.created_at);
      if (!existing || created < existing) {
        firstOrder.set(row.user_id, created);
      }
    }
  }

  const hoursToFirstOrder: number[] = [];
  for (const [userId, signupDate] of firstSignup) {
    const orderDate = firstOrder.get(userId);
    if (!orderDate) continue;
    const hours = (orderDate.getTime() - signupDate.getTime()) / (1000 * 60 * 60);
    if (hours >= 0) hoursToFirstOrder.push(hours);
  }

  hoursToFirstOrder.sort((a, b) => a - b);
  const medianHours =
    hoursToFirstOrder.length > 0
      ? hoursToFirstOrder[Math.floor(hoursToFirstOrder.length / 2)]
      : 0;
  const averageHours =
    hoursToFirstOrder.length > 0
      ? hoursToFirstOrder.reduce((a, b) => a + b, 0) / hoursToFirstOrder.length
      : 0;

  const time_to_first_order = {
    median_hours: Math.round(medianHours * 10) / 10,
    average_hours: Math.round(averageHours * 10) / 10,
    total_users: hoursToFirstOrder.length,
  };

  // UTM sources — aggregate unique users per utm_source
  const utmMap = new Map<string, Set<string>>();
  if (allEvents) {
    for (const e of allEvents) {
      const props = e.properties as Record<string, unknown> | null;
      const utm = props?.utm as Record<string, string> | undefined;
      const source = utm?.utm_source;
      if (source && e.user_id) {
        if (!utmMap.has(source)) utmMap.set(source, new Set());
        utmMap.get(source)!.add(e.user_id);
      }
    }
  }

  const utmSources = Array.from(utmMap.entries())
    .map(([source, users]) => ({ source, users: users.size }))
    .sort((a, b) => b.users - a.users);

  // Daily orders — configurable range
  const daysParam = Number(request.nextUrl.searchParams.get("days")) || 14;
  const numDays = Math.min(Math.max(daysParam, 7), 90);
  const dailyOrdersMap = new Map<string, number>();
  const today = new Date();
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dailyOrdersMap.set(d.toISOString().slice(0, 10), 0);
  }

  if (allEvents) {
    for (const e of allEvents) {
      if (e.event !== "order_created") continue;
      const date = new Date(e.created_at).toISOString().slice(0, 10);
      if (dailyOrdersMap.has(date)) {
        dailyOrdersMap.set(date, (dailyOrdersMap.get(date) ?? 0) + 1);
      }
    }
  }

  const daily_orders = Array.from(dailyOrdersMap.entries()).map(
    ([date, count]) => ({ date, count })
  );

  // Recent events (last 50)
  const { data: recentEvents } = await supabase
    .from("events")
    .select("id, user_id, event, properties, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    funnel,
    retention,
    time_to_first_order,
    utm: utmSources,
    daily_orders,
    recent_events: recentEvents ?? [],
  });
}
