import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get delivery date counts by day for a given month
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

    const from = `${year}-${String(month).padStart(2, "0")}-01T00:00:00`;
    const toDate = new Date(year, month, 0);
    const to = `${year}-${String(month).padStart(2, "0")}-${String(toDate.getDate()).padStart(2, "0")}T23:59:59`;

    const { data, error } = await supabase
      .from("orders")
      .select("delivery_date")
      .eq("user_id", user.id)
      .not("delivery_date", "is", null)
      .neq("status", "cancelled")
      .gte("delivery_date", from)
      .lte("delivery_date", to);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch delivery counts" }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      const d = new Date(row.delivery_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      counts[key] = (counts[key] || 0) + 1;
    }

    return NextResponse.json(counts, {
      headers: { "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Delivery counts API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
