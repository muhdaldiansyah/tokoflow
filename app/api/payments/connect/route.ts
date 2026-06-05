import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { listCollections } from "@/lib/billplz";
import { encryptSecret } from "@/lib/crypto/secret-box";

// POST /api/payments/connect — onboarding wizard validates merchant's pasted
// Billplz credentials, encrypts them, and persists to profile. Does NOT
// auto-enable payment — merchant flips the toggle separately so they get
// one final confirmation before customers see "Pay" buttons.
//
// Body: { apiKey, xSignatureKey, collectionId }
// All three must be provided. apiKey is validated against Billplz by listing
// collections; if the call succeeds AND the collection_id exists in the list,
// we accept and encrypt.
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const apiKey = String(body.apiKey ?? "").trim();
    const xSignatureKey = String(body.xSignatureKey ?? "").trim();
    const collectionId = String(body.collectionId ?? "").trim();

    if (!apiKey || !xSignatureKey || !collectionId) {
      return NextResponse.json(
        { error: "Missing field. apiKey, xSignatureKey, collectionId all required." },
        { status: 400 },
      );
    }

    // Validate against Billplz: list collections with the pasted key.
    let collections: Array<{ id: string; title: string }>;
    try {
      const res = await listCollections(apiKey);
      collections = res.collections ?? [];
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json(
        { error: `Billplz rejected the API key: ${msg}` },
        { status: 400 },
      );
    }

    const matched = collections.find((c) => c.id === collectionId);
    if (!matched) {
      return NextResponse.json(
        {
          error: `Collection "${collectionId}" not found in your Billplz account. Visit Billplz → Billing → Collections to confirm the ID.`,
          availableCollections: collections.map((c) => ({ id: c.id, title: c.title })),
        },
        { status: 400 },
      );
    }

    // All good — encrypt and persist. Default payment_enabled stays FALSE;
    // merchant flips it on separately.
    const apiKeyEnc = encryptSecret(apiKey);
    const xSigEnc = encryptSecret(xSignatureKey);

    const { error } = await supabase
      .from("profiles")
      .update({
        billplz_api_key_enc: apiKeyEnc,
        billplz_x_signature_key_enc: xSigEnc,
        billplz_collection_id: collectionId,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Failed to persist Billplz credentials:", error);
      return NextResponse.json({ error: "Could not save credentials" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      collectionTitle: matched.title,
    });
  } catch (err) {
    console.error("Billplz connect error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/payments/connect — disconnect Billplz. Clears keys and forces
// payment_enabled OFF so any in-flight orders fall back to manual QR.
export async function DELETE(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        billplz_api_key_enc: null,
        billplz_x_signature_key_enc: null,
        billplz_collection_id: null,
        billplz_payment_enabled: false,
      })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: "Could not disconnect" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Billplz disconnect error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
