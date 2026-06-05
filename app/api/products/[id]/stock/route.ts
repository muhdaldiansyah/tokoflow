import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/server";

// PATCH - Decrement product stock
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { qty } = body;

    if (!qty || qty <= 0) {
      return NextResponse.json({ error: "Quantity must be positive" }, { status: 400 });
    }

    const serviceClient = await createServiceClient();
    const { data: newStock, error } = await serviceClient.rpc("adjust_product_stock", {
      p_user_id: user.id,
      p_product_id: id,
      p_delta: -Math.max(1, Math.round(Number(qty) || 1)),
    });

    if (error) {
      if (error.message?.includes("product_not_found")) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to decrement stock" }, { status: 500 });
    }

    if (newStock === null) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, stock: newStock });
  } catch (error) {
    console.error("Decrement stock API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
