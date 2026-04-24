import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/server";
import {
  createBill,
  generateReference,
  ringgitToCents,
} from "@/lib/billplz";
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
  BISNIS_PRICE,
} from "@/config/plans";

/**
 * POST /api/billing/payments
 *
 * Create a Billplz bill for a subscription plan. Returns { url, billId } —
 * client redirects the merchant to the Billplz payment page (FPX / DuitNow QR /
 * credit card). Billplz then POSTs to /api/billing/webhook on completion.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planCode } = body;

    // Resolve plan → amount + display name
    let code: string;
    let name: string;
    let amount: number;

    if (planCode === PACK_CODE) {
      code = PACK_CODE;
      name = `${PACK_ORDERS} orders top-up`;
      amount = PACK_PRICE;
    } else if (planCode === MEDIUM_PACK_CODE) {
      code = MEDIUM_PACK_CODE;
      name = `${MEDIUM_PACK_ORDERS} orders top-up`;
      amount = MEDIUM_PACK_PRICE;
    } else if (planCode === UNLIMITED_CODE) {
      code = UNLIMITED_CODE;
      name = "Unlimited — 1 month";
      amount = UNLIMITED_PRICE;
    } else if (planCode === BISNIS_CODE) {
      code = BISNIS_CODE;
      name = "Pro (LHDN-ready) — 1 month";
      amount = BISNIS_PRICE;
    } else {
      return NextResponse.json({ error: "Invalid plan code" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, business_name, business_phone")
      .eq("id", user.id)
      .single();

    const collectionId = process.env.BILLPLZ_COLLECTION_ID;
    if (!collectionId) {
      return NextResponse.json(
        { error: "Billplz collection not configured" },
        { status: 500 },
      );
    }

    const reference = generateReference();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tokoflow.com";

    const bill = await createBill({
      collectionId,
      email: user.email!,
      name: profile?.business_name || profile?.full_name || "Tokoflow merchant",
      mobile: profile?.business_phone?.replace(/\D/g, "") || undefined,
      amountCents: ringgitToCents(amount),
      callbackUrl: `${appUrl}/api/billing/webhook`,
      redirectUrl: `${appUrl}/pembayaran/pending?ref=${reference}`,
      description: name,
      reference1Label: "plan",
      reference1: code,
      reference2Label: "ref",
      reference2: reference,
      // Deliver to merchant's email after creation (they get a Billplz receipt).
      deliver: false,
    });

    const serviceClient = await createServiceClient();

    const { data: paymentOrder, error: orderError } = await serviceClient
      .from("payment_orders")
      .insert({
        user_id: user.id,
        plan_code: code,
        billing_cycle: "monthly",
        status: "pending",
        amount,
        billplz_bill_id: bill.id,
        billplz_collection_id: collectionId,
        billplz_url: bill.url,
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
      // Reuse existing midtrans_order_id column for the Billplz reference until we migrate the schema.
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
