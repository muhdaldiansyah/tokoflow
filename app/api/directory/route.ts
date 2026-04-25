import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/directory — Public directory of listed merchants.
 * No auth required. Used by /toko page.
 *
 * Query params:
 *   city     — filter by city_slug
 *   category — filter by business_category
 *   q        — search business_name (ilike)
 *   limit    — max results (default 50, max 100)
 *   offset   — pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const city = searchParams.get("city");
    const category = searchParams.get("category");
    const q = searchParams.get("q");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const offset = Number(searchParams.get("offset")) || 0;

    const supabase = await createServiceClient();

    // Build merchant query
    let query = supabase
      .from("profiles")
      .select(
        "id, slug, business_name, business_description, business_category, city, city_slug, logo_url, business_address",
        { count: "exact" }
      )
      .eq("is_listed", true)
      .eq("order_form_enabled", true)
      .not("slug", "is", null)
      .not("business_name", "is", null)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (city) query = query.eq("city_slug", city);
    if (category) query = query.eq("business_category", category);
    if (q) {
      const sanitized = q.replace(/[%_\\]/g, "");
      if (sanitized.length >= 2) {
        query = query.ilike("business_name", `%${sanitized}%`);
      }
    }

    // Run merchant query + filter options in PARALLEL
    const [merchantResult, citiesResult, categoriesResult] = await Promise.all([
      query,
      supabase
        .from("profiles")
        .select("city, city_slug")
        .eq("is_listed", true)
        .eq("order_form_enabled", true)
        .not("city", "is", null)
        .not("city_slug", "is", null)
        .limit(200),
      supabase
        .from("profiles")
        .select("business_category")
        .eq("is_listed", true)
        .eq("order_form_enabled", true)
        .not("business_category", "is", null)
        .limit(200),
    ]);

    if (merchantResult.error) {
      console.error("Directory API error:", merchantResult.error);
      return NextResponse.json({ error: "Failed to load directory" }, { status: 500 });
    }

    const data = merchantResult.data || [];

    // Fetch product counts for returned merchants only (if any)
    const productCounts: Record<string, number> = {};
    if (data.length > 0) {
      const ids = data.map((m) => m.id);
      const { data: products } = await supabase
        .from("products")
        .select("user_id")
        .in("user_id", ids)
        .eq("is_available", true)
        .is("deleted_at", null);

      if (products) {
        const idToSlug = Object.fromEntries(data.map((p) => [p.id, p.slug]));
        for (const p of products) {
          const s = idToSlug[p.user_id];
          if (s) productCounts[s] = (productCounts[s] || 0) + 1;
        }
      }
    }

    // Deduplicate filter options
    const uniqueCities = citiesResult.data
      ? [...new Map(citiesResult.data.map((c) => [c.city_slug, c])).values()]
      : [];
    const uniqueCategories = categoriesResult.data
      ? [...new Set(categoriesResult.data.map((c) => c.business_category))].filter(Boolean)
      : [];

    const merchants = data.map((m) => ({
      slug: m.slug,
      business_name: m.business_name,
      business_description: m.business_description,
      business_category: m.business_category,
      city: m.city,
      city_slug: m.city_slug,
      logo_url: m.logo_url,
      business_address: m.business_address,
      productCount: productCounts[m.slug!] || 0,
    }));

    return NextResponse.json({
      merchants,
      total: merchantResult.count || 0,
      filters: {
        cities: uniqueCities,
        categories: uniqueCategories,
      },
    }, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Directory API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
