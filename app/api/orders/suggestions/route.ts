import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get item suggestions from products + recent orders + receipts
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemMap = new Map<string, { name: string; price: number; product_id?: string | null }>();

    const [productsResult, ordersResult, receiptsResult] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, price")
        .eq("user_id", user.id)
        .eq("is_available", true)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
      supabase
        .from("orders")
        .select("items")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("receipts")
        .select("items")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    // Products have canonical prices — add first so they take priority
    if (productsResult.data) {
      for (const product of productsResult.data) {
        const key = product.name.toLowerCase();
        itemMap.set(key, { name: product.name, price: product.price, product_id: product.id });
      }
    }

    if (ordersResult.data) {
      for (const order of ordersResult.data) {
        const items = order.items as { product_id?: string | null; name: string; price: number; qty: number }[];
        if (!items) continue;
        for (const item of items) {
          const key = item.name.toLowerCase();
          if (!itemMap.has(key)) {
            itemMap.set(key, { name: item.name, price: item.price, product_id: item.product_id ?? null });
          }
        }
      }
    }

    if (receiptsResult.data) {
      for (const receipt of receiptsResult.data) {
        const items = receipt.items as { product_id?: string | null; name: string; price: number; qty: number }[];
        if (!items) continue;
        for (const item of items) {
          const key = item.name.toLowerCase();
          if (!itemMap.has(key)) {
            itemMap.set(key, { name: item.name, price: item.price, product_id: item.product_id ?? null });
          }
        }
      }
    }

    const suggestions = Array.from(itemMap.values());

    return NextResponse.json(suggestions, {
      headers: { "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Suggestions API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
