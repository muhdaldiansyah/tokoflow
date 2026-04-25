import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Proactive alerts cron — runs daily at 08:00 MYT (01:00 UTC)
// Checks: stock running low, capacity almost full, customer re-order predictions
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
    .select("id, push_token, daily_order_capacity, orders_used, order_credits, unlimited_until")
    .not("push_token", "is", null);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0 });
  }

  // Tomorrow in MYT
  const now = new Date();
  const mytOffset = 8 * 60 * 60 * 1000;
  const tomorrowMYT = new Date(now.getTime() + mytOffset + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrowMYT.toISOString().split("T")[0];

  const pushMessages: { to: string; title: string; body: string; sound: string; data: Record<string, unknown> }[] = [];

  for (const profile of profiles) {
    if (!profile.push_token) continue;

    // Alert 1: Critical stock (products with stock <= 3)
    const { data: lowStock } = await supabase
      .from("products")
      .select("name, stock")
      .eq("user_id", profile.id)
      .eq("is_available", true)
      .gt("stock", 0)
      .lte("stock", 3)
      .is("deleted_at", null)
      .limit(5);

    if (lowStock && lowStock.length > 0) {
      const items = lowStock.map((p) => `${p.name} (${p.stock} left)`).join(", ");
      pushMessages.push({
        to: profile.push_token,
        title: "📦 Low stock",
        body: `${items} — restock soon to avoid running out`,
        sound: "default",
        data: { screen: "products" },
      });
    }

    // Alert 2: Capacity warning for tomorrow (>= 80% full)
    if (profile.daily_order_capacity && profile.daily_order_capacity > 0) {
      const { count: tomorrowOrders } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .gte("delivery_date", `${tomorrowStr}T00:00:00+08:00`)
        .lt("delivery_date", `${tomorrowStr}T23:59:59+08:00`)
        .not("status", "eq", "cancelled")
        .is("deleted_at", null);

      const count = tomorrowOrders || 0;
      const cap = profile.daily_order_capacity;
      const pct = Math.round((count / cap) * 100);

      if (pct >= 80 && count < cap) {
        pushMessages.push({
          to: profile.push_token,
          title: `📋 Tomorrow ${count}/${cap} slots filled`,
          body: `${cap - count} slots left. The rest is your rest time.`,
          sound: "default",
          data: { screen: "production" },
        });
      } else if (count >= cap) {
        pushMessages.push({
          to: profile.push_token,
          title: "✅ Tomorrow is fully booked — rest assured",
          body: `${count}/${cap} orders today. The system is keeping you from overwork — new orders are redirected to another date.`,
          sound: "default",
          data: { screen: "production" },
        });
      }
    }

    // Alert 3: Quota approaching limit (free users only)
    const isUnlimited = profile.unlimited_until && new Date(profile.unlimited_until) > now;
    const hasCredits = (profile.order_credits || 0) > 0;
    const ordersUsed = profile.orders_used || 0;

    if (!isUnlimited && !hasCredits && ordersUsed >= 48 && ordersUsed < 50) {
      pushMessages.push({
        to: profile.push_token,
        title: "⚡ Quota almost used",
        body: `${ordersUsed}/50 free orders used. ${50 - ordersUsed} left. Top up so orders from your store link don't get held back.`,
        sound: "default",
        data: { screen: "settings" },
      });
    } else if (!isUnlimited && !hasCredits && ordersUsed >= 50) {
      pushMessages.push({
        to: profile.push_token,
        title: "🔴 Quota exhausted — orders on hold",
        body: "New orders from your store link are on hold until you top up. Starting from RM 5.",
        sound: "default",
        data: { screen: "settings" },
      });
    }

  }

  // Batch send
  let sent = 0;
  for (let i = 0; i < pushMessages.length; i += 100) {
    const batch = pushMessages.slice(i, i + 100);
    try {
      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(batch),
      });
      sent += batch.length;
    } catch (err) {
      console.error("[alerts] Push send failed:", err);
    }
  }

  return NextResponse.json({ processed: profiles.length, sent });
}
