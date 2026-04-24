import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

const VALID_STATUSES = ["new", "processed", "shipped", "done", "cancelled"];

// POST - Bulk update order status
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Order IDs are required" }, { status: 400 });
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { status };
    if (status === "shipped") updates.shipped_at = new Date().toISOString();
    if (status === "done") updates.completed_at = new Date().toISOString();

    let successCount = 0;

    for (const id of ids) {
      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .neq("status", "cancelled");

      if (!error) successCount++;
    }

    return NextResponse.json({ successCount });
  } catch (error) {
    console.error("Bulk update status API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
