import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

/**
 * GET /api/benchmark?category=Nasi+Box
 * Returns pricing benchmark for products in same category + city cluster.
 * Gate: only returns data if ≥10 distinct users in cluster.
 * All data anonymized — no user IDs exposed.
 */
export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  // Get user's city
  const { data: profile } = await supabase
    .from("profiles")
    .select("city, business_type")
    .eq("id", userId)
    .single();

  if (!profile?.city) {
    return NextResponse.json({ benchmark: null, reason: "no_city" });
  }

  // Step 1: Get all user IDs in same city (excluding self)
  const { data: cityUsers } = await supabase
    .from("profiles")
    .select("id")
    .eq("city", profile.city)
    .neq("id", userId);

  if (!cityUsers || cityUsers.length === 0) {
    return NextResponse.json({ benchmark: null, reason: "no_peers" });
  }

  const cityUserIds = cityUsers.map(u => u.id);

  // Step 2: Get products from those users, filtered by category
  let query = supabase
    .from("products")
    .select("price, cost_price, user_id")
    .in("user_id", cityUserIds)
    .eq("is_available", true)
    .is("deleted_at", null)
    .gt("price", 0);

  if (category) {
    query = query.eq("category", category);
  }

  const { data: products } = await query;

  if (!products || products.length === 0) {
    return NextResponse.json({ benchmark: null, reason: "no_products" });
  }

  // Gate: ≥10 distinct users
  const distinctUsers = new Set(products.map(p => p.user_id));
  if (distinctUsers.size < 10) {
    return NextResponse.json({
      benchmark: null,
      reason: "insufficient_users",
      usersInCluster: distinctUsers.size,
      threshold: 10,
    });
  }

  // Calculate stats
  const prices = products.map(p => p.price).sort((a, b) => a - b);
  const foodCosts = products
    .filter(p => p.cost_price && p.cost_price > 0 && p.price > 0)
    .map(p => Math.round(((p.cost_price as number) / p.price) * 100));

  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const median = prices[Math.floor(prices.length / 2)];
  const min = prices[0];
  const max = prices[prices.length - 1];
  const p25 = prices[Math.floor(prices.length * 0.25)];
  const p75 = prices[Math.floor(prices.length * 0.75)];

  const avgFoodCost = foodCosts.length >= 5
    ? Math.round(foodCosts.reduce((a, b) => a + b, 0) / foodCosts.length)
    : null;

  return NextResponse.json({
    benchmark: {
      category: category || "all",
      city: profile.city,
      usersInCluster: distinctUsers.size,
      productCount: products.length,
      price: { avg, median, min, max, p25, p75 },
      avgFoodCostPct: avgFoodCost,
    },
  });
}
