import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { aiRateLimitResponseInit, checkAiRateLimit } from "@/lib/rate-limit/ai";
import { resolveCountry, isCountry } from "@/lib/country";
import { formatMoney } from "@/lib/currency/format";
import { AI_TEXT_MODELS } from "@/lib/ai/model";

// AI receipt triage for QR orders.
//
// Reads the customer-uploaded payment receipt with a vision LLM, extracts the
// raw fields, then compares them to the order *in code* (deterministic — we do
// not trust the model to judge). Returns an advisory verdict for the merchant's
// verify banner. NOT an anti-fraud guarantee: a screenshot can be forged, so the
// merchant always makes the final Confirm/Reject decision.

interface Extracted {
  amount_paid: number | null;
  currency: string | null;
  status: string | null;
  datetime: string | null;
  recipient: string | null;
  bank_or_wallet: string | null;
  reference: string | null;
  is_payment_receipt: boolean;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getAuthenticatedClient(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = checkAiRateLimit(user.id);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error:
            limit.reason === "day"
              ? "Daily AI usage limit reached. Try again tomorrow."
              : "Too many AI requests. Slow down for a moment.",
        },
        aiRateLimitResponseInit(limit),
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI is not configured" }, { status: 503 });
    }

    // Order scoped to the merchant (RLS + explicit user_id).
    const { data: order } = await supabase
      .from("orders")
      .select("id, total, created_at, image_urls")
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const proofs: string[] = Array.isArray(order.image_urls)
      ? order.image_urls.filter((u: string) => typeof u === "string" && u.includes("payment-proofs"))
      : [];
    const proofUrl = proofs[proofs.length - 1]; // newest receipt
    if (!proofUrl) {
      return NextResponse.json({ error: "No payment receipt uploaded yet" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("country")
      .eq("id", user.id)
      .single();
    const ctx = resolveCountry(isCountry(profile?.country) ? profile.country : "ID");

    // Inline the (private, signed-URL) receipt as a data URL — robust regardless
    // of whether the model provider can fetch the signed URL itself.
    let dataUrl: string;
    try {
      const imgRes = await fetch(proofUrl);
      if (!imgRes.ok) throw new Error("fetch_failed");
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      dataUrl = `data:${contentType};base64,${buf.toString("base64")}`;
    } catch {
      return NextResponse.json({ error: "Could not load the receipt image" }, { status: 502 });
    }

    const expectedAmount = Number(order.total) || 0;
    const prompt = `You are verifying a payment receipt screenshot for a Malaysian merchant. The customer should have transferred ${formatMoney(expectedAmount, ctx)} via DuitNow QR or a bank / e-wallet app. Read the screenshot and extract the payment details. Do NOT guess — if a field is not clearly visible, use null.

Respond ONLY as JSON with exactly these keys:
{
  "amount_paid": number | null,
  "currency": string | null,
  "status": string | null,
  "datetime": string | null,
  "recipient": string | null,
  "bank_or_wallet": string | null,
  "reference": string | null,
  "is_payment_receipt": boolean
}

- amount_paid: numeric amount transferred (e.g. 28 or 28.00), NO currency symbol.
- status: the exact status text shown (e.g. "Successful", "Transfer Successful", "Pending", "Failed", "Berjaya").
- datetime: the transaction date/time, CONVERTED to ISO 8601 (YYYY-MM-DDTHH:mm, e.g. 2026-06-03T21:45). Convert from whatever format the receipt shows. Use null only if no date is visible.
- recipient: the payee name or account shown.
- bank_or_wallet: e.g. "Maybank", "CIMB", "Touch 'n Go", "DuitNow".
- reference: transaction reference / receipt number.
- is_payment_receipt: true ONLY if this looks like a genuine bank / e-wallet transfer receipt — false for a product photo, the QR code image itself, or any unrelated image.`;

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        models: AI_TEXT_MODELS,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              { type: "text", text: prompt },
            ],
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });
    if (!aiRes.ok) {
      return NextResponse.json({ error: "AI check failed — try again" }, { status: 503 });
    }

    const aiData = await aiRes.json();
    let ex: Extracted;
    try {
      ex = JSON.parse(aiData.choices?.[0]?.message?.content || "{}");
    } catch {
      return NextResponse.json({ error: "AI returned an unreadable response" }, { status: 502 });
    }

    // ── Deterministic comparison (the model only extracts; code judges) ──────
    const amountPaid = typeof ex.amount_paid === "number" ? ex.amount_paid : null;
    let amount: "match" | "underpaid" | "overpaid" | "unreadable";
    if (amountPaid === null) amount = "unreadable";
    else if (Math.abs(amountPaid - expectedAmount) < 0.01) amount = "match";
    else if (amountPaid < expectedAmount) amount = "underpaid";
    else amount = "overpaid";

    const statusText = (ex.status || "").toLowerCase();
    let status: "success" | "failed" | "pending" | "unclear";
    if (/success|berjaya|complete|completed|paid|sukses/.test(statusText)) status = "success";
    else if (/fail|gagal|reject|decline|unsuccess/.test(statusText)) status = "failed";
    else if (/pending|process|memproses/.test(statusText)) status = "pending";
    else status = "unclear";

    let recency: "ok" | "before_order" | "unreadable";
    const receiptDate = ex.datetime ? new Date(ex.datetime) : null;
    if (!receiptDate || isNaN(receiptDate.getTime())) {
      recency = "unreadable";
    } else {
      // The receipt should be on/after the order day; allow 1 day of timezone slack.
      const slackMs = 24 * 60 * 60 * 1000;
      recency =
        receiptDate.getTime() >= new Date(order.created_at).getTime() - slackMs
          ? "ok"
          : "before_order";
    }

    let verdict: "likely_valid" | "review" | "likely_invalid";
    if (ex.is_payment_receipt === false) verdict = "review";
    else if (amount === "underpaid" || status === "failed") verdict = "likely_invalid";
    // An unreadable date shouldn't downgrade an otherwise-clear match — only a
    // date that predates the order (reused old screenshot) blocks "valid".
    else if (amount === "match" && status === "success" && recency !== "before_order") verdict = "likely_valid";
    else verdict = "review";

    return NextResponse.json({
      verdict,
      checks: { amount, status, recency },
      expectedAmount,
      extracted: {
        amount_paid: amountPaid,
        currency: ex.currency ?? null,
        status: ex.status ?? null,
        datetime: ex.datetime ?? null,
        recipient: ex.recipient ?? null,
        bank_or_wallet: ex.bank_or_wallet ?? null,
        reference: ex.reference ?? null,
        is_payment_receipt: ex.is_payment_receipt !== false,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
