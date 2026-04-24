import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { invoiceToMyInvoisDocument } from "@/features/invoices/services/myinvois-adapter";
import { submitDocuments, getDocumentStatus } from "@/lib/myinvois";
import type { Invoice } from "@/features/invoices/types/invoice.types";

/**
 * POST /api/invoices/:id/myinvois-submit
 *
 * Submit a single invoice to LHDN MyInvois. The route:
 *   1. Loads the invoice + merchant profile (server-side, RLS-scoped).
 *   2. Validates prerequisites (merchant TIN, BRN, SST registration if applicable).
 *   3. Generates UBL 2.1 JSON + base64 + SHA-256 hash.
 *   4. POSTs to LHDN documentsubmissions endpoint.
 *   5. Persists the returned UUID + submissionUid + initial status on the invoice row.
 *   6. Returns the acceptance response; client polls `/myinvois-status` for final validation.
 *
 * Pro-plan gated. Requires `myinvois_client_id` + `myinvois_client_secret_enc` on the
 * profile OR env-level fallback for merchants not yet self-onboarded.
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

  // Load invoice + merchant profile in parallel.
  const [{ data: invoice }, { data: profile }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase
      .from("profiles")
      .select(
        "business_name, business_address, business_phone, tin, brn, sst_registration_id, city, bisnis_until",
      )
      .eq("id", user.id)
      .single(),
  ]);

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Pro-plan gate — MyInvois submission requires an active Bisnis/Pro tier.
  const bisnisActive =
    profile.bisnis_until && new Date(profile.bisnis_until) > new Date();
  if (!bisnisActive) {
    return NextResponse.json(
      { error: "MyInvois submission requires Pro plan (RM 49/mo)" },
      { status: 402 },
    );
  }

  if (!profile.tin || !profile.brn) {
    return NextResponse.json(
      {
        error:
          "Merchant TIN and BRN are required before submitting to MyInvois. Set them in Settings → Tax identity.",
      },
      { status: 400 },
    );
  }

  // Idempotency: if already submitted and accepted, return the existing status.
  if (invoice.myinvois_uuid && invoice.myinvois_status === "valid") {
    return NextResponse.json({
      submissionUid: invoice.myinvois_submission_uid,
      uuid: invoice.myinvois_uuid,
      longId: invoice.myinvois_long_id,
      status: invoice.myinvois_status,
      cached: true,
    });
  }

  try {
    const generated = invoiceToMyInvoisDocument(
      invoice as Invoice,
      {
        business_name: profile.business_name,
        business_address: profile.business_address,
        business_phone: profile.business_phone,
        tin: profile.tin,
        brn: profile.brn,
        sst_registration_id: profile.sst_registration_id,
      },
      {
        supplierStateName: profile.city || "Kuala Lumpur",
        buyerTin: invoice.buyer_tin,
        buyerBrn: invoice.buyer_brn,
        buyerSstId: invoice.buyer_sst_id,
      },
    );

    const submission = await submitDocuments([generated]);

    const accepted = submission.acceptedDocuments?.[0];
    const rejected = submission.rejectedDocuments?.[0];

    if (rejected) {
      await supabase
        .from("invoices")
        .update({
          myinvois_status: "rejected",
          myinvois_submitted_at: new Date().toISOString(),
          myinvois_errors: rejected,
        })
        .eq("id", id);

      return NextResponse.json(
        {
          error: "Document rejected by LHDN",
          details: rejected,
        },
        { status: 422 },
      );
    }

    if (!accepted) {
      return NextResponse.json(
        { error: "No accepted document in LHDN response", submission },
        { status: 502 },
      );
    }

    // Optimistically fetch final status once; client can poll for long-lived "Submitted".
    let finalStatus = "submitted";
    let longId: string | undefined;
    try {
      const status = await getDocumentStatus(accepted.uuid);
      finalStatus = status.status.toLowerCase();
      longId = status.longId;
    } catch {
      // Status endpoint is eventually consistent — ignore if not ready yet.
    }

    await supabase
      .from("invoices")
      .update({
        myinvois_uuid: accepted.uuid,
        myinvois_submission_uid: submission.submissionUid,
        myinvois_long_id: longId ?? null,
        myinvois_status: finalStatus,
        myinvois_submitted_at: new Date().toISOString(),
        ...(finalStatus === "valid"
          ? { myinvois_validated_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", id);

    return NextResponse.json({
      submissionUid: submission.submissionUid,
      uuid: accepted.uuid,
      longId,
      status: finalStatus,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `MyInvois submission failed: ${message}` },
      { status: 500 },
    );
  }
}
