import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

/**
 * GET /api/communities/group-buy
 * Suggests group purchasing opportunities based on what community members order.
 * Gate: community ≥5 members, ≥3 members ordering same ingredient category.
 *
 * Logic: look at cost_price items across community members' products,
 * find common categories/ingredients that multiple members buy.
 * "10 member butuh tepung minggu ini. Total ~250kg. Bareng lebih murah."
 */
export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;

  // Get user's community
  const { data: profile } = await supabase
    .from("profiles")
    .select("community_id")
    .eq("id", userId)
    .single();

  if (!profile?.community_id) {
    return NextResponse.json({ suggestions: [], reason: "not_in_community" });
  }

  // Get community members
  const { data: members } = await supabase
    .from("community_members")
    .select("user_id")
    .eq("community_id", profile.community_id);

  if (!members || members.length < 5) {
    return NextResponse.json({ suggestions: [], reason: "insufficient_members", memberCount: members?.length || 0 });
  }

  const memberIds = members.map(m => m.user_id);

  // Get all active products from community members (with categories)
  const { data: products } = await supabase
    .from("products")
    .select("user_id, category, name, cost_price, unit")
    .in("user_id", memberIds)
    .eq("is_available", true)
    .is("deleted_at", null)
    .not("category", "is", null);

  if (!products || products.length === 0) {
    return NextResponse.json({ suggestions: [], reason: "no_products" });
  }

  // Aggregate: which product categories are shared across ≥3 members?
  // This approximates "common ingredients/supplies"
  const categoryMap = new Map<string, { members: Set<string>; products: { name: string; unit: string | null; costPrice: number | null }[] }>();

  for (const p of products) {
    const cat = p.category;
    if (!cat) continue;
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { members: new Set(), products: [] });
    }
    const entry = categoryMap.get(cat)!;
    entry.members.add(p.user_id);
    entry.products.push({ name: p.name, unit: p.unit, costPrice: p.cost_price });
  }

  // Filter: ≥3 members sharing same category
  const suggestions: {
    category: string;
    memberCount: number;
    totalMembers: number;
    productCount: number;
    avgCostPrice: number | null;
    commonUnit: string | null;
    message: string;
  }[] = [];

  for (const [cat, data] of categoryMap) {
    if (data.members.size < 3) continue;

    const costsWithPrice = data.products.filter(p => p.costPrice && p.costPrice > 0);
    const avgCost = costsWithPrice.length > 0
      ? Math.round(costsWithPrice.reduce((sum, p) => sum + (p.costPrice || 0), 0) / costsWithPrice.length)
      : null;

    // Most common unit
    const unitCounts = new Map<string, number>();
    for (const p of data.products) {
      if (p.unit) unitCounts.set(p.unit, (unitCounts.get(p.unit) || 0) + 1);
    }
    const commonUnit = unitCounts.size > 0
      ? [...unitCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : null;

    suggestions.push({
      category: cat,
      memberCount: data.members.size,
      totalMembers: members.length,
      productCount: data.products.length,
      avgCostPrice: avgCost,
      commonUnit,
      message: `${data.members.size} dari ${members.length} member jual produk "${cat}". Beli bahan bareng bisa lebih murah.`,
    });
  }

  // Sort by member count descending
  suggestions.sort((a, b) => b.memberCount - a.memberCount);

  return NextResponse.json({ suggestions: suggestions.slice(0, 5) });
}
