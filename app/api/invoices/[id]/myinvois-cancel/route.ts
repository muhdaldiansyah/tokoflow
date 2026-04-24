import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { cancelDocument } from "@/lib/myinvois";

/**
 * POST /api/invoices/:id/myinvois-cancel
 *
 * Cancel a previously-submitted MyInvois document within LHDN's 72-hour window.
 * Body: { reason: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedClient(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason || reason.length < 5) {
    return NextResponse.json(
      { error: "Cancellation reason is required (min 5 characters)" },
      { status: 400 },
    );
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, myinvois_uuid, myinvois_status, myinvois_submitted_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!invoice?.myinvois_uuid) {
    return NextResponse.json(
      { error: "Invoice was never submitted to MyInvois" },
      { status: 404 },
    );
  }
  if (invoice.myinvois_status === "cancelled") {
    return NextResponse.json(
      { error: "Invoice is already cancelled" },
      { status: 409 },
    );
  }

  // 72-hour cancellation window check.
  if (invoice.myinvois_submitted_at) {
    const submittedAt = new Date(invoice.myinvois_submitted_at).getTime();
    const hoursSince = (Date.now() - submittedAt) / (1000 * 60 * 60);
    if (hoursSince > 72) {
      return NextResponse.json(
        {
          error:
            "MyInvois cancellation window has passed (72 hours). Issue a credit note instead.",
        },
        { status: 422 },
      );
    }
  }

  try {
    await cancelDocument(invoice.myinvois_uuid, reason);
    await supabase
      .from("invoices")
      .update({
        myinvois_status: "cancelled",
        myinvois_errors: { cancel_reason: reason, cancelled_at: new Date().toISOString() },
      })
      .eq("id", id);

    return NextResponse.json({ status: "cancelled" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Cancellation failed: ${message}` },
      { status: 500 },
    );
  }
}
