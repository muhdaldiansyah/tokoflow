import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get visitor stats for store analytics
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "daily") as "daily" | "monthly";
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
    const dateParam = searchParams.get("date") || undefined;

    const now = new Date();

    let periodStart: string, periodEnd: string, prevStart: string, prevEnd: string, trendStart: string;
    let periodLabel: string, previousLabel: string;

    if (period === "monthly") {
      const m = month || (now.getMonth() + 1);
      const y = year || now.getFullYear();
      const endMonth = m === 12 ? 1 : m + 1;
      const endYear = m === 12 ? y + 1 : y;
      const prevMonth = m === 1 ? 12 : m - 1;
      const prevYear = m === 1 ? y - 1 : y;

      periodStart = `${y}-${String(m).padStart(2, "0")}-01T00:00:00.000+08:00`;
      periodEnd = `${endYear}-${String(endMonth).padStart(2, "0")}-01T00:00:00.000+08:00`;
      prevStart = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01T00:00:00.000+08:00`;
      prevEnd = periodStart;
      trendStart = periodStart;

      const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      periodLabel = `${MONTH_NAMES[m]} ${y}`;
      previousLabel = `${MONTH_NAMES[prevMonth]} ${prevYear}`;
    } else {
      const targetStr = dateParam || now.toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
      const targetDate = new Date(targetStr + "T12:00:00+08:00");
      const prevDate = new Date(targetDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevStr = prevDate.toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
      const weekAgo = new Date(targetDate);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });

      periodStart = `${targetStr}T00:00:00.000+08:00`;
      periodEnd = `${targetStr}T23:59:59.999+08:00`;
      prevStart = `${prevStr}T00:00:00.000+08:00`;
      prevEnd = `${prevStr}T23:59:59.999+08:00`;
      trendStart = `${weekAgoStr}T00:00:00.000+08:00`;

      const todayStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
      if (targetStr === todayStr) {
        periodLabel = "today";
        previousLabel = "yesterday";
      } else {
        const d = new Date(targetStr + "T12:00:00+08:00");
        periodLabel = d.toLocaleDateString("en-MY", { day: "numeric", month: "short", timeZone: "Asia/Kuala_Lumpur" });
        previousLabel = prevDate.toLocaleDateString("en-MY", { day: "numeric", month: "short", timeZone: "Asia/Kuala_Lumpur" });
      }
    }

    const [
      { data: periodViews },
      { count: prevCount },
      { count: totalCount },
      { data: productViews },
    ] = await Promise.all([
      supabase.from("page_views").select("created_at, referrer")
        .eq("business_id", user.id).gte("created_at", periodStart).lt("created_at", periodEnd)
        .order("created_at", { ascending: true }),
      supabase.from("page_views").select("id", { count: "exact", head: true })
        .eq("business_id", user.id).gte("created_at", prevStart).lt("created_at", prevEnd),
      supabase.from("page_views").select("id", { count: "exact", head: true })
        .eq("business_id", user.id),
      supabase.from("product_views").select("product_name")
        .eq("business_id", user.id).gte("created_at", periodStart).lt("created_at", periodEnd),
    ]);

    // For daily: also fetch 7-day trend
    let trendViews: { created_at: string }[] | null = periodViews;
    if (period === "daily") {
      const { data: weekViews } = await supabase
        .from("page_views").select("created_at")
        .eq("business_id", user.id).gte("created_at", trendStart)
        .order("created_at", { ascending: true });
      trendViews = weekViews;
    }

    const views = periodViews || [];
    const referrerMap = new Map<string, number>();
    const hourMap = new Map<number, number>();
    const dailyMap = new Map<string, number>();

    for (const v of views) {
      const d = new Date(v.created_at);
      const ds = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
      const hour = parseInt(d.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur", hour: "numeric", hour12: false }));

      const ref = v.referrer || "langsung";
      referrerMap.set(ref, (referrerMap.get(ref) || 0) + 1);
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      dailyMap.set(ds, (dailyMap.get(ds) || 0) + 1);
    }

    if (period === "daily" && trendViews) {
      dailyMap.clear();
      for (const v of trendViews) {
        const ds = new Date(v.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
        dailyMap.set(ds, (dailyMap.get(ds) || 0) + 1);
      }
    }

    const productMap = new Map<string, number>();
    for (const pv of (productViews || [])) {
      productMap.set(pv.product_name, (productMap.get(pv.product_name) || 0) + 1);
    }

    let peakHour: { hour: number; count: number } | null = null;
    if (hourMap.size > 1) {
      const entries = Array.from(hourMap.entries());
      const max = entries.reduce((a, b) => a[1] > b[1] ? a : b);
      peakHour = { hour: max[0], count: max[1] };
    }

    return NextResponse.json({
      periodCount: views.length,
      previousPeriodCount: prevCount || 0,
      total: totalCount || 0,
      byReferrer: Array.from(referrerMap.entries())
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count),
      peakHour,
      topProducts: Array.from(productMap.entries())
        .map(([name, views]) => ({ name, views }))
        .sort((a, b) => b.views - a.views).slice(0, 5),
      dailyTrend: Array.from(dailyMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      periodLabel,
      previousLabel,
    });
  } catch (error) {
    console.error("Visitor stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
