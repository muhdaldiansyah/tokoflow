import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveCountry, isCountry } from "@/lib/country";
import { getPaymentGateway, generateReference } from "@/lib/payment";
import { normalizePhone } from "@/lib/utils/phone";
import {
  PACK_CODE,
  PACK_PRICE,
  PACK_ORDERS,
  MEDIUM_PACK_CODE,
  MEDIUM_PACK_PRICE,
  MEDIUM_PACK_ORDERS,
  UNLIMITED_CODE,
  UNLIMITED_PRICE,
  BISNIS_CODE,
  BISNIS_CODE_ANNUAL,
  BISNIS_PRICE_MONTHLY, 
  BISNIS_PRICE_ANNUAL_TOTAL,
  BUSINESS_CODE,
  getPricingTier,
} from "@/config/plans";

/**
 * POST /api/billing/payments
 *
 * Create a payment bill for a subscription plan in the merchant's country
 * currency. Routes through the country-aware gateway dispatcher:
 *   - MY merchants → Billplz (FPX / DuitNow QR / credit card)
 *   - ID merchants → Midtrans Snap (BCA/Mandiri VA / GoPay / OVO / DANA / QRIS)
 *
 * Returns { url, billId, reference } — client redirects the merchant to the
 * gateway-hosted payment page. The gateway POSTs to the matching webhook
 * (`/api/billing/billplz-webhook` or `/api/billing/midtrans-webhook`) on
 * completion.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planCode } = body;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, business_name, business_phone, country")
      .eq("id", user.id)
      .single();

    const ctx = resolveCountry(
      isCountry(profile?.country) ? profile.country : "ID",
    );

    // Resolve plan → amount + display name. New tiers (Pro/Business) come from
    // the country-aware pricing table; the legacy MY-only top-up packs are
    // resolved from the deprecated constants for back-compat.
    let code: string;
    let name: string;
    let amount: number;

    if (planCode === BISNIS_CODE_ANNUAL) {
      code = BISNIS_CODE_ANNUAL;
      name = "Pro · 1 year";
      amount = BISNIS_PRICE_ANNUAL_TOTAL;
    } else if (planCode === BISNIS_CODE || planCode === BUSINESS_CODE) {
      const tier = getPricingTier(planCode, ctx);
      if (!tier) {
        return NextResponse.json({ error: "Plan not available in this country" }, { status: 400 });
      }
      code = tier.planCode;
      name = planCode === BISNIS_CODE ? "Pro · 1 month" : `${tier.displayName} — 1 month`;
      amount = planCode === BISNIS_CODE ? BISNIS_PRICE_MONTHLY : tier.amount;
    } else if (ctx.code === "MY" && planCode === PACK_CODE) {
      code = PACK_CODE;
      name = `${PACK_ORDERS} orders top-up`;
      amount = PACK_PRICE;
    } else if (ctx.code === "MY" && planCode === MEDIUM_PACK_CODE) {
      code = MEDIUM_PACK_CODE;
      name = `${MEDIUM_PACK_ORDERS} orders top-up`;
      amount = MEDIUM_PACK_PRICE;
    } else if (ctx.code === "MY" && planCode === UNLIMITED_CODE) {
      code = UNLIMITED_CODE;
      name = "Unlimited — 1 month";
      amount = UNLIMITED_PRICE;
    } else {
      return NextResponse.json({ error: "Invalid plan code" }, { status: 400 });
    }

    const reference = generateReference();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${ctx.domain}`;
    const gateway = getPaymentGateway(ctx);

    const bill = await gateway.createBill({
      email: user.email!,
      name: profile?.business_name || profile?.full_name || "Tokoflow merchant",
      mobile: normalizePhone(profile?.business_phone, ctx),
      amount,
      currency: ctx.currency,
      callbackUrl: `${appUrl}/api/billing/${gateway.name}-webhook`,
      redirectUrl: `${appUrl}/pembayaran/pending?ref=${reference}`,
      description: name,
      reference,
      planCode: code,
    });

    const serviceClient = await createServiceClient();

    const { data: paymentOrder, error: orderError } = await serviceClient
      .from("payment_orders")
      .insert({
        user_id: user.id,
        plan_code: code,
        billing_cycle: planCode === BISNIS_CODE_ANNUAL ? "annual" : "monthly",
        status: "pending",
        amount,
        country: ctx.code,
        gateway_provider: gateway.name,
        gateway_bill_id: bill.id,
        gateway_url: bill.url,
        // Mirror to legacy Billplz columns when applicable so the existing
        // webhook + reconciliation paths keep working unchanged.
        ...(gateway.name === "billplz"
          ? {
              billplz_bill_id: bill.id,
              billplz_collection_id: process.env.BILLPLZ_COLLECTION_ID,
              billplz_url: bill.url,
            }
          : {}),
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Error creating payment order:", orderError);
      return NextResponse.json(
        { error: "Failed to create payment order" },
        { status: 500 },
      );
    }

    const { error: txError } = await serviceClient.from("transactions").insert({
      payment_order_id: paymentOrder.id,
      // Legacy column kept gateway-agnostic — stores Billplz reference for MY
      // and Midtrans order_id for ID. The column name is a historical scar.
      midtrans_order_id: reference,
      status: "pending",
      gross_amount: amount,
    });
    if (txError) {
      console.error("Error creating transaction:", txError);
    }

    return NextResponse.json({
      billId: bill.id,
      url: bill.url,
      reference,
    });
  } catch (error) {
    console.error("Payment error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Could not create payment: ${message}` },
      { status: 500 },
    );
  }
}
