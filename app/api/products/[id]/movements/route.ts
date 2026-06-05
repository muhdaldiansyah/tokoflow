import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limit = Math.min(50, parseInt(request.nextUrl.searchParams.get("limit") || "15", 10));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("inventory_movements")
      .select("id, movement_type, qty_delta, qty_before, qty_after, actor_type, occurred_at, order_id, reason, orders(order_number)")
      .eq("product_id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching inventory movements:", error);
      return NextResponse.json({ error: "Failed to fetch movements" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Movements API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
