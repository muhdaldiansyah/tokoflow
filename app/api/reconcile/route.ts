import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/server";
import {
  meetsAutoLinkThreshold,
  scoreReconciliation,
} from "@/lib/services/reconcile.service";

/**
 * POST /api/reconcile  — run auto-reconciliation for the authenticated user.
 *
 * Body: { payment_notification_id?: string }
 *
 * Without id  → scans every pending_match payment_notification < 60min old
 *                and tries to match each to an unpaid order.
 * With id     → fast path: scopes to that single payment notification.
 *                Used inline by ingestion endpoints after a paste/SMS lands.
 *
 * Auto-links when composite score ≥ 0.92 (money-bearing threshold).
 * Below 0.92, the row stays in pending_match for the merchant to confirm
 * via the UI claim card (deferred — see P5-reconciliation-plan.md).
 *
 * This endpoint is idempotent — re-running it on the same payment is safe.
 */

interface ReconcileReport {
  payment_notification_id: string;
  best_score: number;
  best_order_id: string | null;
  auto_linked: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { payment_notification_id?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      // empty body OK
    }
    const targetId =
      typeof body.payment_notification_id === "string"
        ? body.payment_notification_id
        : null;

    const supabase = await createServiceClient();
    const cutoff60min = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    let pendingQuery = supabase
      .from("payment_notifications")
      .select("id, amount_myr, sender_name, occurred_at, created_at")
      .eq("user_id", user.id)
      .eq("status", "pending_match")
      .gte("created_at", cutoff60min);
    if (targetId) pendingQuery = pendingQuery.eq("id", targetId);

    const { data: pending, error: pendingErr } = await pendingQuery;
    if (pendingErr) {
      console.error("Reconcile: pending fetch error", pendingErr);
      return NextResponse.json(
        { error: "Could not fetch pending payments" },
        { status: 500 },
      );
    }

    if (!pending || pending.length === 0) {
      return NextResponse.json({ matched: 0, candidates: [] });
    }

    const cutoff48h = new Date(
      Date.now() - 48 * 60 * 60 * 1000,
    ).toISOString();
    const reports: ReconcileReport[] = [];
    let matchedCount = 0;

    for (const pmt of pending) {
      const amount = Number(pmt.amount_myr) || 0;
      if (amount <= 0) {
        reports.push({
          payment_notification_id: pmt.id,
          best_score: 0,
          best_order_id: null,
          auto_linked: false,
        });
        continue;
      }

      // Candidate orders: same merchant, unpaid, created within 48h, total
      // within ±5% of payment amount.
      const { data: candidates } = await supabase
        .from("orders")
        .select(
          "id, customer_name, total, created_at, delivery_date, payment_status, undone_at",
        )
        .eq("user_id", user.id)
        .eq("payment_status", "unpaid")
        .is("undone_at", null)
        .gte("created_at", cutoff48h)
        .gte("total", Math.floor(amount * 0.95))
        .lte("total", Math.ceil(amount * 1.05));

      if (!candidates || candidates.length === 0) {
        reports.push({
          payment_notification_id: pmt.id,
          best_score: 0,
          best_order_id: null,
          auto_linked: false,
        });
        continue;
      }

      const occurredAt = pmt.occurred_at
        ? new Date(pmt.occurred_at)
        : new Date(pmt.created_at);

      let bestScore = 0;
      let bestId: string | null = null;
      for (const c of candidates) {
        const scores = scoreReconciliation({
          paymentAmountMyr: amount,
          paymentSenderName: pmt.sender_name ?? null,
          paymentOccurredAt: occurredAt,
          orderTotalMyr: Number(c.total) || 0,
          orderCustomerName: c.customer_name ?? null,
          orderCreatedAt: new Date(c.created_at),
          orderDeliveryDate: c.delivery_date
            ? new Date(c.delivery_date)
            : null,
        });
        if (scores.total > bestScore) {
          bestScore = scores.total;
          bestId = c.id;
        }
      }

      const autoLink = bestId !== null && meetsAutoLinkThreshold(bestScore);

      if (autoLink && bestId) {
        // Mark notification matched.
        await supabase
          .from("payment_notifications")
          .update({
            matched_order_id: bestId,
            match_confidence: Number(bestScore.toFixed(2)),
            status: "matched",
            matched_at: new Date().toISOString(),
            match_method: "auto",
          })
          .eq("id", pmt.id);

        // Mark order paid. Uses paid_amount + payment_status to keep parity
        // with the existing payment-record path (/api/orders/[id]/payment).
        await supabase
          .from("orders")
          .update({
            paid_amount: amount,
            payment_status: "paid",
            payment_claimed_at: new Date().toISOString(),
          })
          .eq("id", bestId);

        matchedCount += 1;
      }

      reports.push({
        payment_notification_id: pmt.id,
        best_score: Number(bestScore.toFixed(2)),
        best_order_id: bestId,
        auto_linked: autoLink,
      });
    }

    return NextResponse.json({
      matched: matchedCount,
      total_pending: pending.length,
      candidates: reports,
    });
  } catch (error) {
    console.error("Reconcile error:", error);
    return NextResponse.json(
      { error: "Something went wrong on our end. We're on it." },
      { status: 500 },
    );
  }
}
