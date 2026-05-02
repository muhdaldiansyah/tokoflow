import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/orders/:id/undo  — 7-day soft undo with hard-force escape hatch.
 *
 * Body: { force?: boolean, reason?: string }
 *
 * Within window  → soft undo: marks status='cancelled', sets undone_at +
 *                  optional reason, restores tracked product stock,
 *                  decrements orders_used. Customer stats roll back via
 *                  trigger (migration 055).
 * Past window    → 410 Gone unless force=true. With force=true, same as
 *                  soft path but the 410 check is skipped.
 *
 * Idempotent: re-running on an already-undone order returns 200 with
 * { alreadyUndone: true }.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { force?: unknown; reason?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      // empty body OK — defaults to force=false, no reason
    }
    const force = body.force === true;
    const reason =
      typeof body.reason === "string" && body.reason.trim()
        ? body.reason.trim().slice(0, 240)
        : null;

    const serviceClient = await createServiceClient();
    const { data: order, error: fetchErr } = await serviceClient
      .from("orders")
      .select(
        "id, user_id, status, undone_at, undo_window_ends_at, items, deleted_at",
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.undone_at) {
      return NextResponse.json({
        success: true,
        alreadyUndone: true,
        undoneAt: order.undone_at,
      });
    }

    const now = new Date();
    const windowEndsAt = order.undo_window_ends_at
      ? new Date(order.undo_window_ends_at)
      : null;
    const inWindow = !!windowEndsAt && windowEndsAt.getTime() > now.getTime();

    if (!inWindow && !force) {
      return NextResponse.json(
        {
          error: "window_expired",
          message:
            "Past the 7-day undo window. Send force=true to cancel anyway.",
          windowEndedAt: order.undo_window_ends_at,
        },
        { status: 410 },
      );
    }

    const { error: updateErr } = await serviceClient
      .from("orders")
      .update({
        status: "cancelled",
        undone_at: now.toISOString(),
        undo_reason: reason,
      })
      .eq("id", order.id)
      .eq("user_id", user.id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Could not undo this order. Try again." },
        { status: 500 },
      );
    }

    // Restore tracked stock for each line item. Untracked products are no-op.
    const items = Array.isArray(order.items) ? order.items : [];
    let stockRestored = 0;
    for (const item of items) {
      if (!item || typeof item.name !== "string" || !item.qty) continue;
      const { data: ok } = await serviceClient.rpc("restore_product_stock", {
        p_user_id: user.id,
        p_product_name: item.name,
        p_qty: Math.max(1, Math.round(Number(item.qty) || 1)),
      });
      if (ok) stockRestored += 1;
    }

    // Free up a quota slot. Customer stats roll back via the trigger from
    // migration 055 since status is now 'cancelled'.
    await serviceClient.rpc("decrement_orders_used", { p_user_id: user.id });

    return NextResponse.json({
      success: true,
      undoneAt: now.toISOString(),
      forced: !inWindow,
      stockRestoredFor: stockRestored,
    });
  } catch (error) {
    console.error("Undo order error:", error);
    return NextResponse.json(
      { error: "Something went wrong on our end. We're on it." },
      { status: 500 },
    );
  }
}
