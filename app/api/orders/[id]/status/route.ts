import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/server";

// "menunggu" is the DB enum for orders that hit the quota wall on creation
// (see check_order_limit RPC); merchants can still progress them once they
// upgrade, so it must be a valid input here.
const VALID_STATUSES = ["new", "menunggu", "processed", "shipped", "done", "cancelled"];

// PATCH - Update order status only
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
    const { status, tracking_number, courier_name } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (status === "cancelled") {
      return NextResponse.json({ error: "Use the order undo endpoint to cancel orders" }, { status: 400 });
    }

    // Snapshot current status + user name before applying the update
    const [{ data: currentOrder }, { data: profile }] = await Promise.all([
      supabase
        .from("orders")
        .select("status")
        .eq("id", id)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("profiles")
        .select("business_name")
        .eq("id", user.id)
        .single(),
    ]);

    const updates: Record<string, unknown> = { status };

    if (status === "shipped") {
      updates.shipped_at = new Date().toISOString();
      // Optional shipment metadata captured alongside the status flip
      // (migration 098). Both fields are nullable + free-form; we
      // accept null to allow the merchant to clear an earlier value
      // when re-marking as shipped.
      if (typeof tracking_number === "string") {
        updates.tracking_number = tracking_number.trim().slice(0, 100) || null;
      } else if (tracking_number === null) {
        updates.tracking_number = null;
      }
      if (typeof courier_name === "string") {
        updates.courier_name = courier_name.trim().slice(0, 60) || null;
      } else if (courier_name === null) {
        updates.courier_name = null;
      }
    } else if (status === "done") {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }

    // Fire-and-forget — order_status_logs (merchant-visible timeline)
    supabase
      .from("order_status_logs")
      .insert({
        order_id: id,
        from_status: currentOrder?.status ?? null,
        to_status: status,
        changed_by: user.id,
        changed_by_name: profile?.business_name ?? null,
      })
      .then(() => {});

    // Fire-and-forget — fulfillment_events (superadmin audit ledger)
    createServiceClient().then((svc) => {
      svc.from("fulfillment_events").insert({
        user_id: user.id,
        order_id: id,
        event_type: "status_changed",
        from_status: currentOrder?.status ?? null,
        to_status: status,
        tracking_number: status === "shipped" && typeof updates.tracking_number === "string"
          ? (updates.tracking_number as string) || null : null,
        courier_name: status === "shipped" && typeof updates.courier_name === "string"
          ? (updates.courier_name as string) || null : null,
        actor_type: "merchant",
        actor_id: user.id,
        source_table: "orders",
        source_id: id,
        metadata: { status },
      }).then(() => {});
    }).catch(() => {});

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update order status API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
