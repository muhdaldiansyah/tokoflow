import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/products/bulk-stock
// Accepts absolute stock values, handles both tracked (via adjust_product_stock RPC)
// and untracked (enables tracking) products in one call.
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body as { updates: Array<{ id: string; stock: number }> };

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }
    if (updates.length > 200) {
      return NextResponse.json({ error: "Too many updates" }, { status: 400 });
    }

    const ids = updates.map((u) => u.id);
    const svc = await createServiceClient();

    const { data: products, error: fetchErr } = await svc
      .from("products")
      .select("id, stock, name, price, cost_price")
      .eq("user_id", user.id)
      .in("id", ids)
      .is("deleted_at", null);

    if (fetchErr || !products) {
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let updated = 0;
    const errors: string[] = [];

    for (const update of updates) {
      const product = productMap.get(update.id);
      if (!product) {
        errors.push(`Product ${update.id} not found`);
        continue;
      }

      const newStock = Math.max(0, Math.round(Number(update.stock) || 0));

      if (product.stock === null || product.stock === undefined) {
        // Enable stock tracking for the first time
        const { error } = await svc
          .from("products")
          .update({ stock: newStock, ...(newStock > 0 ? { is_available: true } : {}) })
          .eq("id", product.id)
          .eq("user_id", user.id);

        if (error) { errors.push(`Failed to update ${product.name}`); continue; }

        // Record as a catalog change — new stock tracking enabled
        svc.from("catalog_change_events").insert({
          user_id: user.id,
          product_id: product.id,
          change_type: "stock_tracking_enabled",
          changed_fields: ["stock"],
          old_values: { stock: null },
          new_values: { stock: newStock },
          stock_before: null,
          stock_after: newStock,
          actor_type: "merchant",
          actor_id: user.id,
          source_table: "products",
          source_id: product.id,
        }).then(() => {});

        updated++;
      } else {
        // Tracked product — apply signed delta via atomic RPC
        const delta = newStock - product.stock;
        if (delta === 0) continue;

        const { error } = await svc.rpc("adjust_product_stock", {
          p_user_id: user.id,
          p_product_id: product.id,
          p_delta: delta,
        });

        if (error) {
          if (error.message?.includes("invalid_stock_delta")) continue;
          errors.push(`Failed to update ${product.name}`);
          continue;
        }

        updated++;
      }
    }

    return NextResponse.json({ updated, errors });
  } catch (error) {
    console.error("Bulk stock update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
