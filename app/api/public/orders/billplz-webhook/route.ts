import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyXSignature } from "@/lib/billplz";
import { decryptSecret } from "@/lib/crypto/secret-box";

// ADR 0001 — per-merchant Billplz callback. Distinct from the Tokoflow-side
// /api/billing/webhook because:
//   • the X-Signature key is the merchant's, not Tokoflow's env key
//   • we update order_payments + orders.paid_amount, not payment_orders + plans
//
// Billplz forwards reference_1 = orderId and reference_2 = businessId so we
// can look up the merchant's signature key before verifying. The verification
// is done with the merchant's key — Tokoflow's env key would mis-fail here.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let params: Record<string, string>;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      params = Object.fromEntries(
        Array.from(formData.entries()).map(([k, v]) => [k, String(v)]),
      );
    } else {
      params = (await request.json()) as Record<string, string>;
    }

    const billId = params.id;
    const businessId = params.reference_2;
    const orderId = params.reference_1;

    if (!billId || !businessId) {
      return NextResponse.json(
        { error: "Missing bill id or merchant reference" },
        { status: 400 },
      );
    }

    // Resolve the merchant's X-Signature key. Without this we cannot prove
    // the callback is from Billplz (anyone can POST to a public URL).
    const { data: profile } = await supabase
      .from("profiles")
      .select("billplz_x_signature_key_enc")
      .eq("id", businessId)
      .maybeSingle();

    if (!profile?.billplz_x_signature_key_enc) {
      // Either the merchant disconnected after the bill was created, or the
      // reference is a forgery. Log and 400 — Billplz will stop retrying.
      await supabase.from("webhook_logs").insert({
        order_id: billId,
        event_type: "merchant_signature_key_missing",
        payload: params,
        status: "failed",
        error_message: `No signature key for merchant ${businessId}`,
      });
      return NextResponse.json(
        { error: "Merchant signature key not found" },
        { status: 400 },
      );
    }

    let signatureKey: string;
    try {
      signatureKey = decryptSecret(profile.billplz_x_signature_key_enc);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "decrypt failed";
      await supabase.from("webhook_logs").insert({
        order_id: billId,
        event_type: "merchant_signature_decrypt_failed",
        payload: params,
        status: "failed",
        error_message: msg,
      });
      return NextResponse.json({ error: "Signature key unreadable" }, { status: 500 });
    }

    if (!verifyXSignature(params, signatureKey)) {
      await supabase.from("webhook_logs").insert({
        order_id: billId,
        event_type: "signature_verification_failed",
        payload: params,
        status: "failed",
        error_message: "Invalid X-Signature on merchant webhook",
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    await supabase.from("webhook_logs").insert({
      order_id: billId,
      event_type: `merchant_${params.state ?? "unknown"}`,
      payload: params,
      status: "verified",
    });

    const state = params.state as "due" | "paid" | "deleted" | undefined;
    const paid = params.paid === "true";
    const paidAmount = Number(params.paid_amount ?? "0") / 100; // cents → RM
    const paidAt = params.paid_at;

    // Cross-check: the order_payments row's order_id must match reference_1.
    // Defends against a forgery using one merchant's key but another's bill id.
    const { data: payment } = await supabase
      .from("order_payments")
      .select("id, order_id, user_id, status")
      .eq("billplz_bill_id", billId)
      .maybeSingle();

    if (!payment) {
      return NextResponse.json({ error: "order_payment not found" }, { status: 404 });
    }
    if (payment.order_id !== orderId || payment.user_id !== businessId) {
      await supabase.from("webhook_logs").insert({
        order_id: billId,
        event_type: "merchant_reference_mismatch",
        payload: params,
        status: "failed",
        error_message: `expected order=${payment.order_id} merchant=${payment.user_id}, got order=${orderId} merchant=${businessId}`,
      });
      return NextResponse.json({ error: "Reference mismatch" }, { status: 400 });
    }

    if (state === "paid" && paid) {
      const { error } = await supabase.rpc("mark_order_payment_paid", {
        p_billplz_bill_id: billId,
        p_paid_amount: paidAmount,
        p_payment_method: params.payment_channel ?? null,
        p_paid_at: paidAt ?? new Date().toISOString(),
        p_metadata: params,
      });
      if (error) {
        await supabase.from("webhook_logs").insert({
          order_id: billId,
          event_type: "mark_paid_rpc_failed",
          payload: params,
          status: "failed",
          error_message: error.message,
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ message: "OK" });
    }

    if (state === "deleted" || (state === "due" && !paid)) {
      // Billplz emits "deleted" for cancellations and a `due` callback when
      // a bill expires unpaid. We surface both as failed/expired so the
      // merchant can see the attempt without it polluting paid_amount.
      const nextStatus = state === "deleted" ? "failed" : "expired";
      const { error } = await supabase.rpc("mark_order_payment_failed", {
        p_billplz_bill_id: billId,
        p_status: nextStatus,
        p_metadata: params,
      });
      if (error) {
        await supabase.from("webhook_logs").insert({
          order_id: billId,
          event_type: "mark_failed_rpc_failed",
          payload: params,
          status: "failed",
          error_message: error.message,
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ message: "OK" });
    }

    return NextResponse.json({ message: "Ignored" });
  } catch (err) {
    console.error("Merchant Billplz webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
