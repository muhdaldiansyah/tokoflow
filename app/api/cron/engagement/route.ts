import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Engagement push notifications.
//
// Voice rules from docs/positioning/02-product-soul.md:
//   warm, personal, dignifying — never compare to peers, never shame inaction.
// Anti-patterns explicitly removed from these strings:
//   • "tidier than 90% of SMBs" → comparison shaming
//   • "Science says habits form by day 66" → robotic factoid
//   • "No orders yet?" → anxiety question to a struggling merchant
const DEATH_VALLEY_MESSAGES: Record<string, { title: string; body: (ctx: MessageContext) => string }> = {
  day1_inactive: {
    title: "Your shop is live",
    body: () => "Send the link to one customer — orders land here automatically.",
  },
  day3_active: {
    title: "First order is in",
    body: (ctx) => `${ctx.ordersUsed} order${ctx.ordersUsed === 1 ? "" : "s"} so far. Have a peek at today's recap when you have a moment.`,
  },
  day3_inactive: {
    title: "Still here when you need it",
    body: () => "Whenever you're ready, share your shop link with one customer — that's all it takes to start.",
  },
  day7_active: {
    title: "One week in",
    body: (ctx) => `${ctx.ordersUsed} order${ctx.ordersUsed === 1 ? "" : "s"} recorded. Quietly building.`,
  },
  day7_inactive: {
    title: "Your shop is still ready",
    body: (ctx) => ctx.slug ? `tokoflow.com/${ctx.slug} — customers can order any time you're open.` : "Your shop link is open whenever you are.",
  },
  day14_active: {
    title: "Two weeks",
    body: (ctx) => `${ctx.ordersUsed} order${ctx.ordersUsed === 1 ? "" : "s"}, ${ctx.customerCount} customer${ctx.customerCount === 1 ? "" : "s"}. Trust grows from here.`,
  },
  day14_inactive: {
    title: "Welcome back any time",
    body: () => "Everything you set up is still here.",
  },
  day21: {
    title: "Three weeks",
    body: (ctx) => `${ctx.ordersUsed} order${ctx.ordersUsed === 1 ? "" : "s"} recorded. The rhythm starts to settle in around now.`,
  },
  day30: {
    title: "One month",
    body: (ctx) => `${ctx.ordersUsed} order${ctx.ordersUsed === 1 ? "" : "s"}, ${ctx.customerCount} customer${ctx.customerCount === 1 ? "" : "s"}. That's a real start.`,
  },
  day45: {
    title: "Forty-five days",
    body: (ctx) => `${ctx.ordersUsed} order${ctx.ordersUsed === 1 ? "" : "s"} this month — you're finding the groove.`,
  },
  day66: {
    title: "Two months in",
    body: () => "Tokoflow's part of your routine now. We're glad to be along.",
  },
};

const MILESTONE_MESSAGES: Record<number, { title: string; body: string }> = {
  10: { title: "Ten orders", body: "A real start — and only growing from here." },
  50: { title: "Fifty orders", body: "Fifty customers fed by your work. That counts." },
  100: { title: "One hundred", body: "A hundred orders. This is no longer a side thing." },
  500: { title: "Five hundred", body: "You've quietly served hundreds of families. Take a moment." },
  1000: { title: "One thousand orders", body: "A thousand. Not just selling — running a business." },
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
          body: `${orderCount} order${orderCount === 1 ? "" : "s"}${revenueStr ? `, ${revenueStr}` : ""}. ${customerCount || 0} customer${customerCount === 1 ? "" : "s"} along the way.`,
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

    // Pre-Ramadan rush trigger — fires on the dates listed below (14 days before
    // each Ramadan 1st). Update annually as moon-sighting predictions firm up.
    // Source: Astronomical estimates from islamicfinder.org (verify before each
    // production cron run for the upcoming year).
    const RAMADAN_PREP_DATES: Record<string, string> = {
      "2027-01-24": "2027",
      "2028-01-13": "2028",
      "2029-01-02": "2029",
      "2029-12-23": "2030",
    };
    const todayMytStr = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const ramadanYear = RAMADAN_PREP_DATES[todayMytStr];
    if (ramadanYear && profile.push_token) {
      const ramadanKey = `pre_ramadan_${ramadanYear}`;
      if (!drip[ramadanKey]) {
        pushMessages.push({
          to: profile.push_token,
          title: "Ramadan in two weeks",
          body: "Want a hand sketching out a Ramadan menu? Reply to this when you're ready.",
          sound: "default",
          data: { screen: "products" },
        });
        const updatedDrip = updates.find((u) => u.id === profile.id)?.drip || { ...drip };
        updatedDrip[ramadanKey] = now.toISOString();
        const existing = updates.find((u) => u.id === profile.id);
        if (existing) {
          existing.drip = updatedDrip;
        } else {
          updates.push({ id: profile.id, drip: updatedDrip });
        }
      }
    }

    // Customer Returns recognition — when a customer has 3+ orders and the
    // merchant hasn't been told yet, surface that customer as a regular.
    // Cap one recognition per cron run per merchant so the inbox doesn't burst.
    if (profile.push_token) {
      const { data: loyalCustomers } = await supabase
        .from("customers")
        .select("id, name, total_orders")
        .eq("user_id", profile.id)
        .gte("total_orders", 3)
        .order("total_orders", { ascending: false })
        .limit(10);
      const newRegular = (loyalCustomers || []).find(
        (c: { id: string }) => !drip[`loyal_${c.id}`],
      );
      if (newRegular) {
        const loyalKey = `loyal_${newRegular.id}`;
        pushMessages.push({
          to: profile.push_token,
          title: `${newRegular.name} is back`,
          body: `That's order #${newRegular.total_orders} from ${newRegular.name}. Want to tag them as a regular?`,
          sound: "default",
          data: { screen: "customers" },
        });
        const updatedDrip = updates.find((u) => u.id === profile.id)?.drip || { ...drip };
        updatedDrip[loyalKey] = now.toISOString();
        const existing = updates.find((u) => u.id === profile.id);
        if (existing) {
          existing.drip = updatedDrip;
        } else {
          updates.push({ id: profile.id, drip: updatedDrip });
        }
      }
    }

    // Anniversary recognition — 1, 3, 5 years since the merchant joined.
    // Dignifying tone per docs/positioning/02-product-soul.md "Moment 7".
    const ageYears = Math.floor(ageDays / 365);
    if ([1, 3, 5].includes(ageYears) && profile.push_token) {
      const anniversaryKey = `anniversary_${ageYears}`;
      if (!drip[anniversaryKey]) {
        const businessName = profile.business_name || profile.full_name || "your shop";
        const yearLabel = ageYears === 1 ? "One year" : `${ageYears} years`;
        pushMessages.push({
          to: profile.push_token,
          title: `${yearLabel} since you started`,
          body: `${ageYears === 1 ? "A year" : `${ageYears} years`} ago you began with one shop link. ${customerCount || 0} customer${customerCount === 1 ? "" : "s"} later — happy anniversary, ${businessName}.`,
          sound: "default",
          data: { screen: "recap" },
        });
        const updatedDrip = updates.find((u) => u.id === profile.id)?.drip || { ...drip };
        updatedDrip[anniversaryKey] = now.toISOString();
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
