import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Simple in-memory rate limiter per order ID
const claimLimit = new Map<string, number>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string" || id.length < 10) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Rate limit: 1 claim per order (prevent spam)
    if (claimLimit.has(id)) {
      // Already claimed — return success silently (idempotent)
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
      claimLimit.set(id, Date.now());
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
      return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
    }

    claimLimit.set(id, Date.now());

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
