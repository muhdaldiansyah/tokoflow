import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  const supabase = await createServiceClient();

  const [usersRes, ordersRes, orderRevenueRes, tokoflowRevenueRes, customersRes, pageViewsRes, recentSignupsRes, recentOrdersRes, featureRes] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("total").neq("status", "cancelled"),
      supabase.from("transactions").select("gross_amount").eq("status", "paid"),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("page_views").select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id, full_name, business_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("orders")
        .select("id, order_number, total, status, created_at, customers(name)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("profiles")
        .select("id, slug, order_form_enabled, preorder_enabled, langganan_enabled, qris_url, total_views, city, business_category"),
    ]);

  // User order revenue
  const totalOrderRevenue = (orderRevenueRes.data || []).reduce(
    (sum: number, o: { total: number | null }) => sum + (o.total || 0),
    0
  );

  // Tokoflow subscription revenue
  const totalTokoflowRevenue = (tokoflowRevenueRes.data || []).reduce(
    (sum: number, t: { gross_amount: number | null }) => sum + (t.gross_amount || 0),
    0
  );

  // Feature adoption
  const profiles = featureRes.data || [];
  const totalProfiles = profiles.length;
  const adoption = {
    storeLinkActive: profiles.filter(p => p.order_form_enabled !== false && p.slug).length,
    qrUploaded: profiles.filter(p => !!p.qris_url).length,
    preorderMode: profiles.filter(p => p.preorder_enabled === true || p.preorder_enabled === null).length,
    subscriptionMode: profiles.filter(p => p.langganan_enabled === true).length,
    defaultMode: profiles.filter(p => p.preorder_enabled === false && !p.langganan_enabled).length,
    withViews: profiles.filter(p => (p.total_views || 0) > 0).length,
    total: totalProfiles,
  };

  // Parallel batch 2: source breakdown, product adoption, trends
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [orderSourcesRes, productUsersRes, hppProductsRes, trendOrdersRes, menungguRes] = await Promise.all([
    supabase.from("orders").select("source").limit(10000),
    supabase.from("products").select("user_id").is("deleted_at", null).limit(5000),
    supabase.from("products").select("user_id").not("cost_price", "is", null).limit(5000),
    supabase.from("orders").select("total, status, created_at").gte("created_at", fourteenDaysAgo.toISOString()).limit(10000),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "menunggu"),
  ]);

  const sourceBreakdown: Record<string, number> = {};
  for (const o of (orderSourcesRes.data || [])) {
    const src = o.source || "manual";
    sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
  }

  const usersWithProducts = new Set((productUsersRes.data || []).map(p => p.user_id)).size;
  const usersWithCostPrice = new Set((hppProductsRes.data || []).map(p => p.user_id)).size;
  const trendOrders = trendOrdersRes.data;

  const dailyTrends: { date: string; orders: number; revenue: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dailyTrends.push({ date: dateStr, orders: 0, revenue: 0 });
  }
  for (const o of (trendOrders || [])) {
    const dateStr = new Date(o.created_at).toISOString().split("T")[0];
    const bucket = dailyTrends.find(t => t.date === dateStr);
    if (bucket) {
      bucket.orders++;
      if (o.status !== "cancelled") bucket.revenue += (o.total || 0);
    }
  }

  // --- MARKETPLACE METRICS ---
  // Merchants by city
  const cityBreakdown: Record<string, number> = {};
  for (const p of profiles) {
    if (p.city) cityBreakdown[p.city] = (cityBreakdown[p.city] || 0) + 1;
  }

  // Merchants by category
  const categoryBreakdown: Record<string, number> = {};
  for (const p of profiles) {
    if (p.business_category) categoryBreakdown[p.business_category] = (categoryBreakdown[p.business_category] || 0) + 1;
  }

  // Profile completion rate
  const profilesWithCity = profiles.filter(p => !!p.city).length;
  const profilesWithCategory = profiles.filter(p => !!p.business_category).length;

  const pendingCount = menungguRes.count;

  return NextResponse.json({
    totalUsers: usersRes.count || 0,
    totalOrders: ordersRes.count || 0,
    totalOrderRevenue,
    totalTokoflowRevenue,
    totalCustomers: customersRes.count || 0,
    totalPageViews: pageViewsRes.count || 0,
    adoption: { ...adoption, usersWithProducts, usersWithCostPrice },
    sourceBreakdown,
    dailyTrends,
    marketplace: {
      cityBreakdown,
      categoryBreakdown,
      profilesWithCity,
      profilesWithCategory,
      pendingCount: pendingCount || 0,
    },
    recentSignups: (recentSignupsRes.data || []).map((p) => ({
      id: p.id,
      name: p.business_name || p.full_name || "—",
      created_at: p.created_at,
    })),
    recentOrders: (recentOrdersRes.data || []).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customer: (o.customers as any)?.name || "—",
      total: o.total,
      status: o.status,
      created_at: o.created_at,
    })),
  });
}
