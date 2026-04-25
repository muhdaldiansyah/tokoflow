import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Messages keyed by trigger
const DEATH_VALLEY_MESSAGES: Record<string, { title: string; body: (ctx: MessageContext) => string }> = {
  day1_inactive: {
    title: "Your store link is ready",
    body: () => "Share it with one customer — orders land in your dashboard automatically",
  },
  day3_active: {
    title: "Your first order is in!",
    body: (ctx) => `${ctx.ordersUsed} orders recorded. Check today's recap`,
  },
  day3_inactive: {
    title: "No orders yet?",
    body: () => "Try sending your store link to a nearby customer — free, no hassle",
  },
  day7_active: {
    title: "7 days on Tokoflow",
    body: (ctx) => `${ctx.ordersUsed} orders recorded. You're already tidier than 90% of SMBs`,
  },
  day7_inactive: {
    title: "Your store link is still active",
    body: (ctx) => ctx.slug ? `https://tokoflow.com/${ctx.slug} — customers can order anytime` : "Customers can order anytime via your store link",
  },
  day14_active: {
    title: "2 weeks!",
    body: (ctx) => `${ctx.ordersUsed} orders, ${ctx.customerCount} customers. Tidier, more trustworthy`,
  },
  day14_inactive: {
    title: "Welcome back anytime",
    body: () => "Your orders are still saved. We're here when you need us",
  },
  day21: {
    title: "3 weeks — past the hump",
    body: (ctx) => `${ctx.ordersUsed} orders recorded. Most merchants feel at home by now`,
  },
  day30: {
    title: "1 month on Tokoflow!",
    body: (ctx) => `${ctx.ordersUsed} orders, ${ctx.customerCount} customers. Next month will be even better`,
  },
  day45: {
    title: "45 days — nearly a habit",
    body: (ctx) => `${ctx.ordersUsed} orders this month. Keep going!`,
  },
  day66: {
    title: "66 days — new habit formed",
    body: () => "Science says habits form by day 66. Tokoflow is part of your routine now",
  },
};

const MILESTONE_MESSAGES: Record<number, { title: string; body: string }> = {
  10: { title: "10th order!", body: "Great start. From selling to a real business" },
  50: { title: "50 orders recorded!", body: "That's 50 pages of notes — all tidy" },
  100: { title: "100 orders!", body: "From selling to a real business — for real" },
  500: { title: "500 orders!", body: "You've served hundreds of families" },
  1000: { title: "1,000 orders!", body: "You're not just selling — you're running a business" },
};

interface MessageContext {
  ordersUsed: number;
  customerCount: number;
  slug: string;
  businessName: string;
}

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

  // Fetch all profiles with push tokens
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, push_token, full_name, business_name, slug, orders_used, onboarding_drip, created_at")
    .not("push_token", "is", null);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0 });
  }

  const now = new Date();
  const pushMessages: { to: string; title: string; body: string; sound: string; data: Record<string, unknown> }[] = [];
  const updates: { id: string; drip: Record<string, string> }[] = [];

  for (const profile of profiles) {
    const drip: Record<string, string> = profile.onboarding_drip || {};
    const createdAt = new Date(profile.created_at);
    const ageDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    // Get customer count and lifetime order count for context
    const [{ count: customerCount }, { count: lifetimeOrders }] = await Promise.all([
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .not("status", "eq", "cancelled")
        .is("deleted_at", null),
    ]);

    const totalOrders = lifetimeOrders || 0;

    const ctx: MessageContext = {
      ordersUsed: totalOrders,
      customerCount: customerCount || 0,
      slug: profile.slug || "",
      businessName: profile.business_name || profile.full_name || "",
    };

    // Determine which message to send
    let messageKey: string | null = null;
    const isActive = totalOrders > 0;

    if (ageDays >= 1 && ageDays < 3 && !drip.day1 && !isActive) {
      messageKey = "day1_inactive";
    } else if (ageDays >= 3 && ageDays < 7 && !drip.day3) {
      messageKey = isActive ? "day3_active" : "day3_inactive";
    } else if (ageDays >= 7 && ageDays < 14 && !drip.day7) {
      messageKey = isActive ? "day7_active" : "day7_inactive";
    } else if (ageDays >= 14 && ageDays < 21 && !drip.day14) {
      messageKey = isActive ? "day14_active" : "day14_inactive";
    } else if (ageDays >= 21 && ageDays < 30 && !drip.day21 && isActive) {
      messageKey = "day21";
    } else if (ageDays >= 30 && ageDays < 45 && !drip.day30 && isActive) {
      messageKey = "day30";
    } else if (ageDays >= 45 && ageDays < 66 && !drip.day45 && isActive) {
      messageKey = "day45";
    } else if (ageDays >= 66 && !drip.day66 && isActive) {
      messageKey = "day66";
    }

    // Send death valley message
    if (messageKey) {
      const template = DEATH_VALLEY_MESSAGES[messageKey];
      if (template && profile.push_token) {
        pushMessages.push({
          to: profile.push_token,
          title: template.title,
          body: template.body(ctx),
          sound: "default",
          data: { screen: "home" },
        });

        // Mark as sent in drip
        const dripKey = messageKey.replace(/_active|_inactive/, "");
        const updatedDrip = { ...drip, [dripKey]: now.toISOString() };
        updates.push({ id: profile.id, drip: updatedDrip });
      }
    }

    // Monthly review — send on 1st of each month (MYT)
    const mytOffset = 8 * 60 * 60 * 1000;
    const nowMYT = new Date(now.getTime() + mytOffset);
    const isFirstOfMonth = nowMYT.getDate() === 1;
    const monthReviewKey = `monthly_review_${nowMYT.getUTCFullYear()}_${String(nowMYT.getUTCMonth() + 1).padStart(2, "0")}`;

    if (isFirstOfMonth && !drip[monthReviewKey] && totalOrders > 0 && profile.push_token) {
      // Get last month's stats
      const lastMonth = new Date(nowMYT);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStart = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-01T00:00:00+08:00`;
      const thisMonthStart = `${nowMYT.getFullYear()}-${String(nowMYT.getMonth() + 1).padStart(2, "0")}-01T00:00:00+08:00`;
      const monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][lastMonth.getMonth()];

      const [{ count: monthOrders }, { data: monthRevenue }] = await Promise.all([
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .gte("created_at", lastMonthStart)
          .lt("created_at", thisMonthStart)
          .not("status", "eq", "cancelled")
          .is("deleted_at", null),
        supabase
          .from("orders")
          .select("total")
          .eq("user_id", profile.id)
          .gte("created_at", lastMonthStart)
          .lt("created_at", thisMonthStart)
          .not("status", "eq", "cancelled")
          .is("deleted_at", null),
      ]);

      const orderCount = monthOrders || 0;
      const revenue = (monthRevenue || []).reduce((sum: number, o: { total: number }) => sum + (o.total || 0), 0);

      if (orderCount > 0) {
        const revenueStr = revenue > 0 ? `RM ${revenue.toLocaleString("en-MY")}` : "";
        pushMessages.push({
          to: profile.push_token,
          title: `${monthName} recap`,
          body: `${orderCount} customers served${revenueStr ? `, ${revenueStr} revenue` : ""}. ${customerCount || 0} customers trust you. From selling to running a business.`,
          sound: "default",
          data: { screen: "recap" },
        });

        const updatedDrip = updates.find((u) => u.id === profile.id)?.drip || { ...drip };
        updatedDrip[monthReviewKey] = now.toISOString();
        const existing = updates.find((u) => u.id === profile.id);
        if (existing) {
          existing.drip = updatedDrip;
        } else {
          updates.push({ id: profile.id, drip: updatedDrip });
        }
      }
    }

    // Check for milestones
    for (const [threshold, msg] of Object.entries(MILESTONE_MESSAGES)) {
      const milestoneKey = `milestone_${threshold}`;
      const thresholdNum = parseInt(threshold);
      if (totalOrders >= thresholdNum && !drip[milestoneKey] && profile.push_token) {
        pushMessages.push({
          to: profile.push_token,
          title: msg.title,
          body: msg.body,
          sound: "default",
          data: { screen: "recap" },
        });
        const updatedDrip = updates.find((u) => u.id === profile.id)?.drip || { ...drip };
        updatedDrip[milestoneKey] = now.toISOString();
        const existing = updates.find((u) => u.id === profile.id);
        if (existing) {
          existing.drip = updatedDrip;
        } else {
          updates.push({ id: profile.id, drip: updatedDrip });
        }
      }
    }
  }

  // Save drip updates
  for (const update of updates) {
    await supabase
      .from("profiles")
      .update({ onboarding_drip: update.drip })
      .eq("id", update.id);
  }

  // Batch send pushes
  let sent = 0;
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
      console.error("[engagement] Push send failed:", err);
    }
  }

  return NextResponse.json({
    processed: profiles.length,
    sent,
    updates: updates.length,
  });
}
