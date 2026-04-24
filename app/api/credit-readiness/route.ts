import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

/**
 * GET /api/credit-readiness
 * Internal credit readiness score — prepares for financial inclusion pathway.
 * Gate: only show after ≥3 months active.
 * Framed as "Kesehatan Bisnis" not "credit score".
 *
 * Metrics: months_active, order_consistency, collection_rate, customer_diversity, growth_trend
 * Score: 0-100
 */
export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", userId)
    .single();

  if (!profile?.created_at) {
    return NextResponse.json({ score: null, reason: "no_profile" });
  }

  // Calculate months active
  const createdAt = new Date(profile.created_at);
  const now = new Date();
  const monthsActive = Math.floor((now.getTime() - createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000));

  // Gate: ≥3 months
  if (monthsActive < 3) {
    return NextResponse.json({
      score: null,
      reason: "too_early",
      monthsActive,
      threshold: 3,
      message: `Butuh ${3 - monthsActive} bulan lagi untuk melihat Kesehatan Bisnis.`,
    });
  }

  // Get all orders (non-cancelled)
  const { data: orders } = await supabase
    .from("orders")
    .select("id, total, paid_amount, delivery_date, customer_name, created_at")
    .eq("user_id", userId)
    .not("status", "eq", "cancelled")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (!orders || orders.length === 0) {
    return NextResponse.json({ score: null, reason: "no_orders" });
  }

  // --- Metric 1: Months Active (max 20 points) ---
  const monthsScore = Math.min(monthsActive, 12) / 12 * 20;

  // --- Metric 2: Order Consistency (max 25 points) ---
  // How many of the last N months had at least 1 order?
  const monthsToCheck = Math.min(monthsActive, 6);
  let monthsWithOrders = 0;
  for (let i = 0; i < monthsToCheck; i++) {
    const checkDate = new Date(now);
    checkDate.setMonth(checkDate.getMonth() - i);
    const monthStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}`;
    const hasOrder = orders.some(o => o.created_at?.startsWith(monthStr));
    if (hasOrder) monthsWithOrders++;
  }
  const consistencyScore = (monthsWithOrders / monthsToCheck) * 25;

  // --- Metric 3: Collection Rate (max 25 points) ---
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalPaid = orders.reduce((sum, o) => sum + (o.paid_amount || 0), 0);
  const collectionRate = totalRevenue > 0 ? totalPaid / totalRevenue : 0;
  const collectionScore = collectionRate * 25;

  // --- Metric 4: Customer Diversity (max 15 points) ---
  const uniqueCustomers = new Set(orders.map(o => o.customer_name?.toLowerCase()).filter(Boolean)).size;
  const diversityScore = Math.min(uniqueCustomers, 15) / 15 * 15;

  // --- Metric 5: Growth Trend (max 15 points) ---
  // Compare last 3 months revenue vs previous 3 months
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentRevenue = orders
    .filter(o => new Date(o.created_at) >= threeMonthsAgo)
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const priorRevenue = orders
    .filter(o => new Date(o.created_at) >= sixMonthsAgo && new Date(o.created_at) < threeMonthsAgo)
    .reduce((sum, o) => sum + (o.total || 0), 0);

  let growthScore = 7.5; // neutral
  if (priorRevenue > 0) {
    const growthRate = (recentRevenue - priorRevenue) / priorRevenue;
    if (growthRate > 0.1) growthScore = 15; // growing
    else if (growthRate > -0.1) growthScore = 10; // stable
    else growthScore = 3; // declining
  }

  // --- Total Score ---
  const totalScore = Math.round(monthsScore + consistencyScore + collectionScore + diversityScore + growthScore);

  const level = totalScore >= 80 ? "Sangat Sehat" : totalScore >= 60 ? "Sehat" : totalScore >= 40 ? "Perlu Perhatian" : "Perlu Perbaikan";
  const emoji = totalScore >= 80 ? "🟢" : totalScore >= 60 ? "🟡" : "🔴";

  return NextResponse.json({
    score: {
      total: totalScore,
      level,
      emoji,
      breakdown: {
        monthsActive: { value: monthsActive, score: Math.round(monthsScore), max: 20 },
        orderConsistency: { value: `${monthsWithOrders}/${monthsToCheck} bulan`, score: Math.round(consistencyScore), max: 25 },
        collectionRate: { value: `${Math.round(collectionRate * 100)}%`, score: Math.round(collectionScore), max: 25 },
        customerDiversity: { value: `${uniqueCustomers} pelanggan`, score: Math.round(diversityScore), max: 15 },
        growthTrend: { value: recentRevenue > priorRevenue ? "Naik" : recentRevenue === priorRevenue ? "Stabil" : "Turun", score: Math.round(growthScore), max: 15 },
      },
      totalOrders: orders.length,
    },
  });
}
