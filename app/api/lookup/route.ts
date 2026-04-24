import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/lookup?type=categories|units|cities|provinces
 * Public endpoint — no auth required. Returns lookup table data.
 * Cities support optional province_id filter: ?type=cities&province_id=32
 * Results cached by CDN via Cache-Control header.
 */
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");

  if (!type || !["categories", "units", "cities", "provinces"].includes(type)) {
    return NextResponse.json({ error: "Invalid type. Use: categories, units, cities, provinces" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // Provinces
  if (type === "provinces") {
    const { data, error } = await supabase
      .from("provinces")
      .select("id, name, slug, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Lookup API error (provinces):", error);
      return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  }

  // Cities — with optional province_id filter
  if (type === "cities") {
    const provinceId = request.nextUrl.searchParams.get("province_id");
    let query = supabase
      .from("cities")
      .select("id, name, slug, province_id, sort_order")
      .eq("is_active", true);

    if (provinceId) {
      query = query.eq("province_id", parseInt(provinceId, 10));
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error) {
      console.error("Lookup API error (cities):", error);
      return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  }

  // Categories & Units
  const tableMap: Record<string, string> = {
    categories: "business_categories",
    units: "product_units",
  };

  const { data, error } = await supabase
    .from(tableMap[type])
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(`Lookup API error (${type}):`, error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
