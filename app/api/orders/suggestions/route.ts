import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get item suggestions from products + recent orders + receipts
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemMap = new Map<string, number>();

    const [productsResult, ordersResult, receiptsResult] = await Promise.all([
      supabase
        .from("products")
        .select("name, price")
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
        itemMap.set(key, product.price);
      }
    }

    if (ordersResult.data) {
      for (const order of ordersResult.data) {
        const items = order.items as { name: string; price: number; qty: number }[];
        if (!items) continue;
        for (const item of items) {
          const key = item.name.toLowerCase();
          if (!itemMap.has(key)) {
            itemMap.set(key, item.price);
          }
        }
      }
    }

    if (receiptsResult.data) {
      for (const receipt of receiptsResult.data) {
        const items = receipt.items as { name: string; price: number; qty: number }[];
        if (!items) continue;
        for (const item of items) {
          const key = item.name.toLowerCase();
          if (!itemMap.has(key)) {
            itemMap.set(key, item.price);
          }
        }
      }
    }

    const suggestions = Array.from(itemMap.entries()).map(([name, price]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      price,
    }));

    return NextResponse.json(suggestions, {
      headers: { "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Suggestions API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
