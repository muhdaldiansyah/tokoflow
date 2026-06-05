import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);

  const supabase = await createServiceClient();

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Fetch profiles registered within the period
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, business_name, slug, order_form_enabled, city, business_category, business_type, orders_used, first_wa_sent_at, referred_by, community_id, created_at"
    )
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get auth emails
  const {
    data: { users: authUsers },
  } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  const emailMap = new Map<string, string>();
  const providerMap = new Map<string, string>();
  authUsers?.forEach((u) => {
    if (u.email) emailMap.set(u.id, u.email);
    const provider = u.app_metadata?.provider || "email";
    providerMap.set(u.id, provider);
  });

  // Get product counts per user
  const userIds = (profiles || []).map((p) => p.id);
  const { data: productCounts } = userIds.length > 0
    ? await supabase
        .from("products")
        .select("user_id")
        .in("user_id", userIds)
        .is("deleted_at", null)
    : { data: [] };

  const productCountMap = new Map<string, number>();
  for (const p of productCounts || []) {
    productCountMap.set(p.user_id, (productCountMap.get(p.user_id) || 0) + 1);
  }

  // Get order counts per user
  const { data: orderCounts } = userIds.length > 0
    ? await supabase
        .from("orders")
        .select("user_id")
        .in("user_id", userIds)
    : { data: [] };

  const orderCountMap = new Map<string, number>();
  for (const o of orderCounts || []) {
    orderCountMap.set(o.user_id, (orderCountMap.get(o.user_id) || 0) + 1);
  }

  const registrations = (profiles || []).map((p) => {
    const hasProducts = (productCountMap.get(p.id) || 0) > 0;
    const hasOrders = (orderCountMap.get(p.id) || 0) > 0;
    const hasSlug = !!p.slug && p.order_form_enabled !== false;
    const hasProfile = !!(p.city && p.business_category);
    const hasWaSent = !!p.first_wa_sent_at;

    // Determine onboarding stage
    let stage: "baru_daftar" | "setup_done" | "ada_produk" | "ada_pesanan" | "aktif" = "baru_daftar";
    if (hasWaSent || (hasOrders && (orderCountMap.get(p.id) || 0) >= 3)) {
      stage = "aktif";
    } else if (hasOrders) {
      stage = "ada_pesanan";
    } else if (hasProducts) {
      stage = "ada_produk";
    } else if (hasSlug || hasProfile) {
      stage = "setup_done";
    }

    return {
      id: p.id,
      name: p.business_name || p.full_name || "—",
      email: emailMap.get(p.id) || "—",
      provider: providerMap.get(p.id) || "email",
      city: p.city || null,
      category: p.business_category || null,
      business_type: p.business_type || null,
      slug: hasSlug ? p.slug : null,
      orders_count: orderCountMap.get(p.id) || 0,
      products_count: productCountMap.get(p.id) || 0,
      has_wa_sent: hasWaSent,
      has_referral: !!p.referred_by,
      has_community: !!p.community_id,
      stage,
      created_at: p.created_at,
    };
  });

  // Summary stats
  const total = registrations.length;
  const stageCounts = {
    baru_daftar: registrations.filter((r) => r.stage === "baru_daftar").length,
    setup_done: registrations.filter((r) => r.stage === "setup_done").length,
    ada_produk: registrations.filter((r) => r.stage === "ada_produk").length,
    ada_pesanan: registrations.filter((r) => r.stage === "ada_pesanan").length,
    aktif: registrations.filter((r) => r.stage === "aktif").length,
  };

  const providerCounts: Record<string, number> = {};
  for (const r of registrations) {
    providerCounts[r.provider] = (providerCounts[r.provider] || 0) + 1;
  }

  return NextResponse.json({
    registrations,
    summary: { total, stageCounts, providerCounts },
  });
}
