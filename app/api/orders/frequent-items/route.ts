import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get frequent items (top 12 available products for quick-add chips)
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: products, error } = await supabase
      .from("products")
      .select("name, price, unit, stock, min_order_qty")
      .eq("user_id", user.id)
      .eq("is_available", true)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch frequent items" }, { status: 500 });
    }

    const items = (products || []).map(
      (p: { name: string; price: number; unit?: string | null; stock?: number | null; min_order_qty?: number }) => ({
        name: p.name,
        price: p.price,
        count: 0,
        unit: p.unit,
        stock: p.stock ?? null,
        min_order_qty: p.min_order_qty ?? 1,
      })
    );

    return NextResponse.json(items, {
      headers: { "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Frequent items API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
