import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  const { id } = await params;
  const supabase = await createServiceClient();

  // Parallel: profile, orders, products, customers, page views
  const [profileRes, ordersRes, productsRes, customersRes, pageViewsRes, invoicesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.from("orders").select("id, order_number, customer_name, total, paid_amount, status, source, referral_source, is_preorder, is_dine_in, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("products").select("id, name, price, category, is_available, stock, image_url, cost_price").eq("user_id", id).is("deleted_at", null).order("sort_order"),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("user_id", id),
    supabase.from("page_views").select("id", { count: "exact", head: true }).eq("business_id", id),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("user_id", id),
  ]);

  if (!profileRes.data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get email from auth
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1 });
  let email = "";
  try {
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(id);
    email = authUser?.email || "";
  } catch { /* ignore */ }

  const orders = ordersRes.data || [];
  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);
  const totalCollected = orders.reduce((s, o) => s + (o.paid_amount || 0), 0);
  const ordersByStatus: Record<string, number> = {};
  const ordersBySource: Record<string, number> = {};
  for (const o of orders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    ordersBySource[o.source || "manual"] = (ordersBySource[o.source || "manual"] || 0) + 1;
  }

  // Onboarding progress
  const profile = profileRes.data;
  const onboarding = {
    hasAccount: true,
    hasProducts: (productsRes.data?.length || 0) > 0,
    hasProfile: !!(profile.business_name && profile.logo_url),
    hasCityCategory: !!(profile.city && profile.business_category),
    hasOrders: orders.length > 0,
    hasWaSent: !!profile.first_wa_sent_at,
  };
  const onboardingComplete = Object.values(onboarding).filter(Boolean).length;
  const onboardingTotal = Object.keys(onboarding).length;

  return NextResponse.json({
    profile: { ...profile, email },
    stats: {
      totalOrders: orders.length,
      totalRevenue,
      totalCollected,
      totalProducts: productsRes.data?.length || 0,
      totalCustomers: customersRes.count || 0,
      totalPageViews: pageViewsRes.count || 0,
      totalInvoices: invoicesRes.count || 0,
      ordersByStatus,
      ordersBySource,
    },
    onboarding: { ...onboarding, complete: onboardingComplete, total: onboardingTotal },
    orders: orders.slice(0, 20),
    products: productsRes.data || [],
  });
}
