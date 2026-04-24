import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get recent orders by customer name
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerName = searchParams.get("name");
    const limit = parseInt(searchParams.get("limit") || "3");

    if (!customerName) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("orders")
      .select("items, total, created_at, order_number")
      .eq("user_id", user.id)
      .eq("customer_name", customerName)
      .is("deleted_at", null)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Orders by customer API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
