import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";

const VALID_STATUSES = ["new", "menunggu", "processed", "shipped", "done", "cancelled"];

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
    if (status === "cancelled") {
      return NextResponse.json({ error: "Use individual order cancellation so stock can be restored safely" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { status };
    if (status === "shipped") updates.shipped_at = new Date().toISOString();
    if (status === "done") updates.completed_at = new Date().toISOString();

    // Snapshot current statuses and user name before applying bulk update
    const [{ data: currentOrders }, { data: profile }] = await Promise.all([
      supabase
        .from("orders")
        .select("id, status")
        .in("id", ids)
        .eq("user_id", user.id),
      supabase
        .from("profiles")
        .select("business_name")
        .eq("id", user.id)
        .single(),
    ]);

    const fromStatusMap = new Map(
      (currentOrders ?? []).map((o: { id: string; status: string }) => [o.id, o.status])
    );
    const changedByName = profile?.business_name ?? null;

    let successCount = 0;
    const logs: {
      order_id: string;
      from_status: string | null;
      to_status: string;
      changed_by: string;
      changed_by_name: string | null;
    }[] = [];

    for (const id of ids) {
      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .neq("status", "cancelled");

      if (!error) {
        successCount++;
        logs.push({
          order_id: id,
          from_status: fromStatusMap.get(id) ?? null,
          to_status: status,
          changed_by: user.id,
          changed_by_name: changedByName,
        });
      }
    }

    if (logs.length > 0) {
      supabase.from("order_status_logs").insert(logs).then(() => {});
    }

    return NextResponse.json({ successCount });
  } catch (error) {
    console.error("Bulk update status API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
