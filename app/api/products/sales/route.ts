import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get product sales data (qty sold per product name, all time)
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("orders")
      .select("items")
      .eq("user_id", user.id)
      .neq("status", "cancelled")
      .is("deleted_at", null);

    if (error) {
      console.error("Error fetching product sales:", error);
      return NextResponse.json({ error: "Failed to fetch product sales" }, { status: 500 });
    }

    const sales: Record<string, number> = {};
    for (const order of data || []) {
      for (const item of order.items as { name: string; qty: number }[]) {
        const key = item.name.toLowerCase();
        sales[key] = (sales[key] || 0) + item.qty;
      }
    }

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Product sales API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
