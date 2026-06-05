import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// In-memory fast-path dedupe per order ID. The DB `payment_claimed_at` field
// is the real source of truth — this just lets us short-circuit repeat clicks
// without a DB round-trip. Expires after 1 hour and is bounded.
const CLAIM_TTL_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 10_000;
const claimLimit = new Map<string, number>();

function rememberClaim(id: string): void {
  const now = Date.now();
  if (claimLimit.size > MAX_ENTRIES) {
    for (const [k, ts] of claimLimit) {
      if (now - ts > CLAIM_TTL_MS) claimLimit.delete(k);
    }
  }
  claimLimit.set(id, now);
}

function isFreshClaim(id: string): boolean {
  const ts = claimLimit.get(id);
  if (ts === undefined) return false;
  if (Date.now() - ts > CLAIM_TTL_MS) {
    claimLimit.delete(id);
    return false;
  }
  return true;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string" || id.length < 10) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Fast-path dedupe — DB check below is the authoritative source.
    if (isFreshClaim(id)) {
      return NextResponse.json({ success: true, alreadyClaimed: true });
    }

    const supabase = await createServiceClient();

    // Verify order exists, not deleted, and hasn't been claimed yet
    const { data: order } = await supabase
      .from("orders")
      .select("id, payment_claimed_at, paid_amount, total, status")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Already paid — no need to claim
    if (order.paid_amount >= order.total && order.total > 0) {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    // Already claimed — idempotent
    if (order.payment_claimed_at) {
      rememberClaim(id);
      return NextResponse.json({ success: true, alreadyClaimed: true });
    }

    // Don't allow claims on cancelled/done orders
    if (order.status === "cancelled" || order.status === "done") {
      return NextResponse.json({ error: "Order is already completed or cancelled" }, { status: 400 });
    }

    // Set payment_claimed_at
    const { error } = await supabase
      .from("orders")
      .update({ payment_claimed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    rememberClaim(id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
