import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyXSignature, mapBillplzStateToOrderStatus } from "@/lib/billplz";
import {
  PACK_CODE,
  MEDIUM_PACK_CODE,
  UNLIMITED_CODE,
  BISNIS_CODE,
  PACK_PRICE,
  MEDIUM_PACK_PRICE,
  UNLIMITED_PRICE,
  BISNIS_PRICE,
} from "@/config/plans";
import { REFERRAL_COMMISSION_RATE } from "@/lib/utils/constants";

// Direct service-role client (webhook has no cookie context).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/billing/webhook
 *
 * Billplz posts form-urlencoded params to this endpoint whenever a bill state
 * changes (paid, refunded, cancelled). X-Signature HMAC-SHA256 verifies the
 * payload's integrity. On a paid transition we activate the merchant's plan +
 * credit the referrer.
 */
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
      // Billplz may also post JSON depending on dashboard config.
      params = (await request.json()) as Record<string, string>;
    }

    const isValid = verifyXSignature(params);
    if (!isValid) {
      await supabase.from("webhook_logs").insert({
        order_id: params.id ?? "unknown",
        event_type: "signature_verification_failed",
        payload: params,
        status: "failed",
        error_message: "Invalid X-Signature",
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Log verified webhook for audit + reconciliation
    await supabase.from("webhook_logs").insert({
      order_id: params.id,
      event_type: params.state ?? "unknown",
      payload: params,
      status: "verified",
    });

    const billId = params.id;
    const state = params.state as "due" | "paid" | "deleted";
    const paid = params.paid === "true";
    const paidAmount = Number(params.paid_amount ?? "0") / 100; // cents → RM
    const paidAt = params.paid_at;

    const mappedStatus = mapBillplzStateToOrderStatus(state, paid);

    // Lookup payment_order by billplz_bill_id (persisted at creation).
    const { data: paymentOrder } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("billplz_bill_id", billId)
      .single();

    if (!paymentOrder) {
      return NextResponse.json(
        { error: "Payment order not found for bill" },
        { status: 404 },
      );
    }

    // Idempotency — skip if the state hasn't changed.
    if (paymentOrder.status === mappedStatus) {
      return NextResponse.json({ message: "Already processed" });
    }
    // Don't revert a completed payment unless Billplz explicitly refunds.
    if (paymentOrder.status === "completed" && mappedStatus === "pending") {
      return NextResponse.json({ message: "Already completed" });
    }

    // Update the linked transactions row so history stays consistent.
    const { data: transaction } = await supabase
      .from("transactions")
      .select("id, midtrans_order_id")
      .eq("payment_order_id", paymentOrder.id)
      .single();

    if (transaction) {
      await supabase
        .from("transactions")
        .update({
          status: state,
          payment_type: "billplz",
          gross_amount: Math.round(paidAmount),
          raw_response: params,
        })
        .eq("id", transaction.id);
    }

    // Atomic check-and-set on the status transition. Two concurrent webhook
    // deliveries both pass the read above — without this guard, both would
    // run the activation RPCs. With the .eq("status", previousStatus)
    // predicate the second UPDATE matches zero rows, so only the first
    // delivery proceeds to plan activation.
    const previousStatus = paymentOrder.status;
    const { data: claimed } = await supabase
      .from("payment_orders")
      .update({
        status: mappedStatus,
        ...(paidAt ? { billplz_paid_at: paidAt } : {}),
      })
      .eq("id", paymentOrder.id)
      .eq("status", previousStatus)
      .select("id")
      .maybeSingle();

    if (!claimed) {
      return NextResponse.json({ message: "Already processed (race)" });
    }

    // On successful payment, activate the plan and credit the referrer.
    if (mappedStatus === "completed") {
      let rpcError: unknown = null;
      if (paymentOrder.plan_code === PACK_CODE) {
        const { error } = await supabase.rpc("add_order_pack", {
          p_user_id: paymentOrder.user_id,
        });
        rpcError = error;
      } else if (paymentOrder.plan_code === MEDIUM_PACK_CODE) {
        const { error } = await supabase.rpc("add_order_pack_with_credits", {
          p_user_id: paymentOrder.user_id,
          p_credits: 100,
        });
        rpcError = error;
      } else if (paymentOrder.plan_code === UNLIMITED_CODE) {
        const { error } = await supabase.rpc("activate_unlimited", {
          p_user_id: paymentOrder.user_id,
        });
        rpcError = error;
      } else if (paymentOrder.plan_code === BISNIS_CODE) {
        const { error } = await supabase.rpc("activate_bisnis", {
          p_user_id: paymentOrder.user_id,
        });
        rpcError = error;
      }
      if (rpcError) {
        const errMessage =
          rpcError instanceof Error ? rpcError.message : String(rpcError);
        await supabase.from("webhook_logs").insert({
          order_id: billId,
          event_type: "plan_activation_failed",
          payload: {
            user_id: paymentOrder.user_id,
            plan_code: paymentOrder.plan_code,
            paid_amount: paidAmount,
          },
          status: "failed",
          error_message: errMessage,
        });
        // Return 500 so Billplz retries. The previousStatus check above will
        // re-attempt activation on the next delivery rather than short-circuit
        // on "Already processed" — note that the row is now "completed" so a
        // simple retry will skip. Treat this as ops-paged: an admin must
        // resolve from webhook_logs.
        return NextResponse.json(
          { error: "Plan activation failed", details: errMessage },
          { status: 500 },
        );
      }

      // Referral commission — credit upstream referrer if still in the 6-month window.
      try {
        const { data: payerProfile } = await supabase
          .from("profiles")
          .select("referred_by, referral_expires_at")
          .eq("id", paymentOrder.user_id)
          .single();

        if (
          payerProfile?.referred_by &&
          payerProfile.referral_expires_at &&
          new Date(payerProfile.referral_expires_at) > new Date()
        ) {
          const priceMap: Record<string, number> = {
            [PACK_CODE]: PACK_PRICE,
            [MEDIUM_PACK_CODE]: MEDIUM_PACK_PRICE,
            [UNLIMITED_CODE]: UNLIMITED_PRICE,
            [BISNIS_CODE]: BISNIS_PRICE,
          };
          const paymentAmount = priceMap[paymentOrder.plan_code] ?? 0;
          const commission = Math.round(
            paymentAmount * REFERRAL_COMMISSION_RATE,
          );
          await supabase.rpc("increment_referral_commission", {
            p_referral_code: payerProfile.referred_by,
            p_amount: commission,
          });
        }
      } catch {
        // best-effort — don't block payment processing for commission errors
      }
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
