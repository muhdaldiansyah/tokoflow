import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { aiRateLimitResponseInit, checkAiRateLimit } from "@/lib/rate-limit/ai";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const period = searchParams.get("period");

    if (!type || !period) {
      return NextResponse.json({ error: "type and period required" }, { status: 400 });
    }

    const { data } = await supabase
      .from("ai_analyses")
      .select("insights, data_snapshot")
      .eq("user_id", user.id)
      .eq("analysis_type", type)
      .eq("period_key", period)
      .single();

    const snapshot = data?.data_snapshot as { totalOrders?: number } | null;

    return NextResponse.json({
      insights: data?.insights || null,
      cached: !!data,
      cachedTotalOrders: snapshot?.totalOrders ?? null,
    });
  } catch {
    return NextResponse.json({ insights: null, cached: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = checkAiRateLimit(user.id);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error:
            limit.reason === "day"
              ? "Daily AI usage limit reached. Try again tomorrow."
              : "Too many AI requests. Slow down for a moment.",
        },
        aiRateLimitResponseInit(limit),
      );
    }

    const { type, period, force } = await request.json();

    if (!type || !period || !["daily", "monthly"].includes(type)) {
      return NextResponse.json({ error: "Invalid type or period" }, { status: 400 });
    }

    // Check cache first (skip if force regenerate)
    if (!force) {
      const { data: cached } = await supabase
        .from("ai_analyses")
        .select("insights")
        .eq("user_id", user.id)
        .eq("analysis_type", type)
        .eq("period_key", period)
        .single();

      if (cached?.insights) {
        return NextResponse.json({ insights: cached.insights, cached: true });
      }
    }

    // Fetch current period data
    let currentOrders;
    let comparisonData: { avgOrders: number; avgRevenue: number; samePeriodOrders: number; samePeriodRevenue: number } | null = null;

    if (type === "daily") {
      // Current day orders
      const startOfDay = `${period}T00:00:00.000+08:00`;
      const endOfDay = `${period}T23:59:59.999+08:00`;

      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay);

      currentOrders = orders || [];

      // Last 7 days for comparison
      const targetDate = new Date(period + "T00:00:00+08:00");
      const sevenDaysAgo = new Date(targetDate);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(sevenDaysAgo.getDate()).padStart(2, "0")}`;

      const { data: pastOrders } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", `${sevenDaysAgoStr}T00:00:00.000+08:00`)
        .lt("created_at", startOfDay);

      const pastList = pastOrders || [];
      const daysWithData = new Set(
        pastList.map((o) => {
          const d = new Date(o.created_at);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        })
      ).size || 1;

      const pastRevenue = pastList
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + (o.total || 0), 0);

      comparisonData = {
        avgOrders: Math.round(pastList.length / daysWithData),
        avgRevenue: Math.round(pastRevenue / daysWithData),
        samePeriodOrders: 0,
        samePeriodRevenue: 0,
      };

      // Same day last week
      const lastWeek = new Date(targetDate);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekStr = `${lastWeek.getFullYear()}-${String(lastWeek.getMonth() + 1).padStart(2, "0")}-${String(lastWeek.getDate()).padStart(2, "0")}`;
      const lastWeekOrders = pastList.filter((o) => {
        const d = new Date(o.created_at);
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return ds === lastWeekStr;
      });
      comparisonData.samePeriodOrders = lastWeekOrders.length;
      comparisonData.samePeriodRevenue = lastWeekOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + (o.total || 0), 0);
    } else {
      // Monthly: current month
      const [yearStr, monthStr] = period.split("-");
      const startOfMonth = `${period}-01T00:00:00.000+08:00`;
      const nextMonth = parseInt(monthStr) === 12
        ? `${parseInt(yearStr) + 1}-01-01T00:00:00.000+08:00`
        : `${yearStr}-${String(parseInt(monthStr) + 1).padStart(2, "0")}-01T00:00:00.000+08:00`;

      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth)
        .lt("created_at", nextMonth);

      currentOrders = orders || [];

      // Previous month for comparison
      const prevMonth = parseInt(monthStr) === 1
        ? `${parseInt(yearStr) - 1}-12`
        : `${yearStr}-${String(parseInt(monthStr) - 1).padStart(2, "0")}`;
      const prevMonthStart = `${prevMonth}-01T00:00:00.000+08:00`;

      const { data: prevOrders } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", prevMonthStart)
        .lt("created_at", startOfMonth);

      const prevList = prevOrders || [];
      const prevRevenue = prevList
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + (o.total || 0), 0);

      comparisonData = {
        avgOrders: prevList.length,
        avgRevenue: prevRevenue,
        samePeriodOrders: prevList.length,
        samePeriodRevenue: prevRevenue,
      };
    }

    // Aggregate current data
    const activeOrders = currentOrders.filter((o) => o.status !== "cancelled");
    const totalOrders = currentOrders.length;
    const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const collectedRevenue = activeOrders.reduce((sum, o) => sum + (o.paid_amount || 0), 0);

    const paidOrders = activeOrders.filter((o) => o.payment_status === "paid");
    const partialOrders = activeOrders.filter((o) => o.payment_status === "partial");
    const unpaidOrders = activeOrders.filter((o) => o.payment_status === "unpaid");

    const paidRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const partialRevenue = partialOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const unpaidRevenue = unpaidOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Top items
    const itemMap = new Map<string, { qty: number; revenue: number }>();
    for (const order of activeOrders) {
      const items = order.items as { name: string; price: number; qty: number }[] | null;
      if (items) {
        for (const item of items) {
          const key = item.name.toLowerCase();
          const existing = itemMap.get(key) || { qty: 0, revenue: 0 };
          existing.qty += item.qty;
          existing.revenue += item.price * item.qty;
          itemMap.set(key, existing);
        }
      }
    }
    const topItems = Array.from(itemMap.entries())
      .map(([name, data]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // New customers count
    let newCustomers = 0;
    if (type === "daily") {
      const startOfDay = `${period}T00:00:00.000+08:00`;
      const endOfDay = `${period}T23:59:59.999+08:00`;
      const { count } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay);
      newCustomers = count || 0;
    }

    const dataSnapshot = {
      totalOrders,
      totalRevenue,
      collectedRevenue,
      paidRevenue,
      paidCount: paidOrders.length,
      partialRevenue,
      partialCount: partialOrders.length,
      unpaidRevenue,
      unpaidCount: unpaidOrders.length,
      topItems,
      newCustomers,
      comparison: comparisonData,
    };

    // Build prompt
    const fmtRp = (n: number) => `RM ${n.toLocaleString("en-MY")}`;

    let systemPrompt: string;
    let userPrompt: string;

    if (type === "daily") {
      systemPrompt = `You are a Malaysian SMB consultant. Analyze the order data and give actionable insights in plain English.

RULES:
1. Maximum 5 insight points, each 1-2 sentences
2. Start with a performance summary (up/down/stable vs average)
3. If there are unpaid orders, mention the count and total RM amount
4. If there's an interesting product pattern, call it out
5. End with one concrete action for tomorrow
6. Everyday language, not finance jargon
7. Currency format: RM 1,000
8. IMPORTANT: Every insight MUST be separated by a newline (\\n). Don't merge everything into one paragraph.

Respond as JSON: {"insights": "point 1\\n\\npoint 2\\n\\npoint 3"}`;

      const topItemsStr = topItems.map((i) => `${i.name} (${i.qty} pcs, ${fmtRp(i.revenue)})`).join(", ");

      userPrompt = `Date: ${period}
Total orders: ${totalOrders}
Total revenue: ${fmtRp(totalRevenue)}
Collected: ${fmtRp(collectedRevenue)}
Paid: ${paidOrders.length} orders (${fmtRp(paidRevenue)})
Deposit: ${partialOrders.length} orders (${fmtRp(partialRevenue)})
Unpaid: ${unpaidOrders.length} orders (${fmtRp(unpaidRevenue)})
Top products: ${topItemsStr || "none"}
New customers: ${newCustomers}
7-day average: ${comparisonData?.avgOrders || 0} orders, ${fmtRp(comparisonData?.avgRevenue || 0)}
Same day last week: ${comparisonData?.samePeriodOrders || 0} orders, ${fmtRp(comparisonData?.samePeriodRevenue || 0)}`;
    } else {
      systemPrompt = `You are a Malaysian SMB consultant. Analyze monthly order data and give insights in plain English.

FORMAT:
Produce 4 short sections, each separated by two newlines:
1. SUMMARY - this month vs last month (up/down by what %)
2. CUSTOMERS - insights on customers and payment behavior
3. PRODUCTS - best-sellers and interesting patterns
4. NEXT STEPS - 1-2 concrete actions for next month

RULES:
- Maximum 300 words total
- Everyday language, not finance jargon
- Currency format: RM 1,000
- If there's significant unpaid balance, flag it as a priority
- IMPORTANT: Every section MUST be separated by two newlines (\\n\\n). Don't merge everything into one paragraph.

Respond as JSON: {"insights": "SUMMARY:\\ntext...\\n\\nCUSTOMERS:\\ntext...\\n\\nPRODUCTS:\\ntext...\\n\\nNEXT STEPS:\\ntext..."}`;

      const topItemsStr = topItems.map((i) => `${i.name} (${i.qty} pcs, ${fmtRp(i.revenue)})`).join(", ");

      userPrompt = `Period: ${period}
Total orders: ${totalOrders}
Total revenue: ${fmtRp(totalRevenue)}
Collected: ${fmtRp(collectedRevenue)}
Paid: ${paidOrders.length} orders (${fmtRp(paidRevenue)})
Deposit: ${partialOrders.length} orders (${fmtRp(partialRevenue)})
Unpaid: ${unpaidOrders.length} orders (${fmtRp(unpaidRevenue)})
Top products: ${topItemsStr || "none"}
Last month: ${comparisonData?.samePeriodOrders || 0} orders, ${fmtRp(comparisonData?.samePeriodRevenue || 0)}`;
    }

    // Call OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ insights: null, cached: false });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ insights: null, cached: false });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);
    const insights = parsed.insights || null;

    if (!insights) {
      return NextResponse.json({ insights: null, cached: false });
    }

    // Save to cache
    await supabase.from("ai_analyses").upsert(
      {
        user_id: user.id,
        analysis_type: type,
        period_key: period,
        insights,
        data_snapshot: dataSnapshot,
      },
      { onConflict: "user_id,analysis_type,period_key" }
    );

    return NextResponse.json({ insights, cached: false });
  } catch {
    return NextResponse.json({ insights: null, cached: false });
  }
}
