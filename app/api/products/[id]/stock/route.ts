import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// PATCH - Decrement product stock
export async function PATCH(
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
    const { qty } = body;

    if (!qty || qty <= 0) {
      return NextResponse.json({ error: "Quantity must be positive" }, { status: 400 });
    }

    // Fetch current stock
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("stock")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Unlimited stock — nothing to decrement
    if (product.stock === null) {
      return NextResponse.json({ success: true });
    }

    const newStock = Math.max(0, product.stock - qty);
    const updates: Record<string, unknown> = { stock: newStock };
    if (newStock === 0) updates.is_available = false;

    const { error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to decrement stock" }, { status: 500 });
    }

    return NextResponse.json({ success: true, stock: newStock });
  } catch (error) {
    console.error("Decrement stock API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
