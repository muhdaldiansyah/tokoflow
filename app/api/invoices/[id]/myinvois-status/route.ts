import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { getDocumentStatus } from "@/lib/myinvois";

/**
 * GET /api/invoices/:id/myinvois-status
 *
 * Poll LHDN for the latest validation status of an already-submitted invoice.
 * Returns the cached DB state if MyInvois UUID isn't set yet (submission hasn't happened).
 * Updates DB when status transitions (Submitted → Valid / Invalid).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedClient(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, myinvois_uuid, myinvois_submission_uid, myinvois_long_id, myinvois_status, myinvois_errors, myinvois_submitted_at, myinvois_validated_at",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (!invoice.myinvois_uuid) {
    return NextResponse.json({
      status: "not_submitted",
      message: "This invoice has not been submitted to MyInvois yet.",
    });
  }

  try {
    const live = await getDocumentStatus(invoice.myinvois_uuid);
    const newStatus = live.status.toLowerCase();
    const hasTransition = newStatus !== invoice.myinvois_status;

    if (hasTransition) {
      await supabase
        .from("invoices")
        .update({
          myinvois_status: newStatus,
          myinvois_long_id: live.longId,
          ...(newStatus === "valid"
            ? { myinvois_validated_at: live.dateTimeValidated ?? new Date().toISOString() }
            : {}),
          ...(newStatus === "invalid" && live.validationResults
            ? { myinvois_errors: live.validationResults }
            : {}),
        })
        .eq("id", id);
    }

    return NextResponse.json({
      uuid: live.uuid,
      submissionUid: live.submissionUid,
      longId: live.longId,
      status: newStatus,
      validatedAt: live.dateTimeValidated,
      validationResults: live.validationResults,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        uuid: invoice.myinvois_uuid,
        status: invoice.myinvois_status,
        cached: true,
        error: message,
      },
      { status: 200 },
    );
  }
}
