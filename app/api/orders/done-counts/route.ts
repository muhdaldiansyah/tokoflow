import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

// GET - Get counts of completed orders by date for a given month
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
      .select("created_at")
      .eq("user_id", user.id)
      .eq("status", "done")
      .gte("created_at", from)
      .lte("created_at", to);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch done counts" }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      const d = new Date(row.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      counts[key] = (counts[key] || 0) + 1;
    }

    return NextResponse.json(counts);
  } catch (error) {
    console.error("Done counts API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
