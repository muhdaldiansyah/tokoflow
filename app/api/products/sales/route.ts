import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get product sales data (qty sold per product name, all time)
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("get_product_sales", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Error fetching product sales:", error);
      return NextResponse.json({ error: "Failed to fetch product sales" }, { status: 500 });
    }

    const sales: Record<string, number> = {};
    for (const row of data || []) {
      if (!row.name) continue;
      sales[row.name] = Number(row.qty) || 0;
    }

    return NextResponse.json(sales, {
      headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Product sales API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
