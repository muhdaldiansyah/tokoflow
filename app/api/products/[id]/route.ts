import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/server";

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get product API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Pre-update snapshot for catalog change ledger + social-proof price event
    const trackedFields = ["price", "cost_price", "stock", "name", "is_available"];
    let oldSnapshot: { price: number | null; cost_price: number | null; stock: number | null; name: string | null } | null = null;
    let oldPrice: number | null = null;
    if (trackedFields.some((f) => body[f] !== undefined)) {
      const { data: existing } = await supabase
        .from("products")
        .select("price, cost_price, stock, name")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      oldSnapshot = existing ?? null;
      oldPrice = existing?.price ?? null;
    }

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.price !== undefined) updates.price = body.price;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
    if (body.image_url !== undefined) updates.image_url = body.image_url;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category;
    if (body.is_available !== undefined) updates.is_available = body.is_available;
    if (body.stock !== undefined) updates.stock = body.stock;
    if (body.unit !== undefined) updates.unit = body.unit;
    if (body.min_order_qty !== undefined) updates.min_order_qty = body.min_order_qty;
    if (body.cost_price !== undefined) updates.cost_price = body.cost_price;

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }

    // Track price increase event for social proof (Feature 5)
    if (oldPrice !== null && body.price > oldPrice) {
      await supabase.from("events").insert({
        user_id: user.id,
        event: "product_price_increased",
        properties: {
          product_id: id,
          old_price: oldPrice,
          new_price: body.price,
          diff: body.price - oldPrice,
          product_name: data.name,
        },
      });
    }

    // Catalog change ledger — record any tracked field that actually changed
    if (oldSnapshot) {
      const changedFields: string[] = [];
      const oldValues: Record<string, unknown> = {};
      const newValues: Record<string, unknown> = {};
      if (body.price !== undefined && body.price !== oldSnapshot.price) {
        changedFields.push("price"); oldValues.price = oldSnapshot.price; newValues.price = body.price;
      }
      if (body.cost_price !== undefined && body.cost_price !== oldSnapshot.cost_price) {
        changedFields.push("cost_price"); oldValues.cost_price = oldSnapshot.cost_price; newValues.cost_price = body.cost_price;
      }
      if (body.stock !== undefined && body.stock !== oldSnapshot.stock) {
        changedFields.push("stock"); oldValues.stock = oldSnapshot.stock; newValues.stock = body.stock;
      }
      if (body.name !== undefined && body.name !== oldSnapshot.name) {
        changedFields.push("name"); oldValues.name = oldSnapshot.name; newValues.name = body.name;
      }
      if (changedFields.length > 0) {
        const svc = await createServiceClient();
        svc.from("catalog_change_events").insert({
          user_id: user.id,
          product_id: id,
          change_type: changedFields.join(","),
          changed_fields: changedFields,
          old_values: oldValues,
          new_values: newValues,
          price_before: oldSnapshot.price,
          price_after: body.price !== undefined ? body.price : oldSnapshot.price,
          cost_before: oldSnapshot.cost_price,
          cost_after: body.cost_price !== undefined ? body.cost_price : oldSnapshot.cost_price,
          stock_before: oldSnapshot.stock,
          stock_after: body.stock !== undefined ? body.stock : oldSnapshot.stock,
          actor_type: "merchant",
          actor_id: user.id,
          source_table: "products",
          source_id: id,
          idempotency_key: `catalog_change:${id}:${Date.now()}`,
        }).then(() => {});
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update product API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Soft delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
