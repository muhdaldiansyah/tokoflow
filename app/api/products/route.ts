import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - List products
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("products")
      .select("id, user_id, name, price, sort_order, image_url, description, category, is_available, stock, unit, min_order_qty, cost_price, created_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create product
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, price, description, category, unit, stock, min_order_qty, is_available, cost_price } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    // Get max sort_order
    const { data: existing } = await supabase
      .from("products")
      .select("sort_order")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: false })
      .limit(1);

    const maxSort = existing?.[0]?.sort_order ?? -1;

    const { data, error } = await supabase
      .from("products")
      .insert({
        user_id: user.id,
        name,
        price,
        sort_order: maxSort + 1,
        ...(description && { description }),
        ...(category && { category }),
        ...(unit && { unit }),
        ...(stock !== undefined && stock !== null && { stock }),
        ...(min_order_qty && min_order_qty > 1 && { min_order_qty }),
        ...(is_available === false && { is_available: false }),
        ...(cost_price !== undefined && cost_price !== null && { cost_price }),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Create product API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
