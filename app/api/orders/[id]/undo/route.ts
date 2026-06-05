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

    const { data: cancelledOrder, error: cancelErr } = await serviceClient.rpc("cancel_order_and_release_stock", {
      p_user_id: user.id,
      p_order_id: order.id,
      p_undone_at: now.toISOString(),
      p_reason: reason,
    });

    if (cancelErr || !cancelledOrder) {
      console.error("Cancel order stock release failed:", cancelErr);
      return NextResponse.json(
        { error: "Could not undo this order. Try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      undoneAt: (cancelledOrder as { undone_at?: string | null }).undone_at ?? now.toISOString(),
      forced: !inWindow,
    });
  } catch (error) {
    console.error("Undo order error:", error);
    return NextResponse.json(
      { error: "Something went wrong on our end. We're on it." },
      { status: 500 },
    );
  }
}
