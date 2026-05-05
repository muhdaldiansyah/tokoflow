import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { aiRateLimitResponseInit, checkAiRateLimit } from "@/lib/rate-limit/ai";
import { REPLY_DRAFT_PROMPT, callTwinAI } from "@/lib/ai/twin-prompts";

/**
 * Foreground Assist — customer reply draft.
 *
 * Tier 2 SUGGEST (never auto-send). Takes incoming customer message + history
 * + customer profile, returns ONE draft reply the merchant can edit and send.
 *
 * Per bible v1.2 + 10-item refusal list:
 * - Tokoflow NEVER DMs customer atas namamu (relationship is yours)
 * - Tokoflow NEVER auto-replies to review/komplain (voice is yours)
 *
 * This endpoint produces a DRAFT only. UI must require explicit merchant
 * approval before sending. Send is via the merchant's WhatsApp on their phone.
 *
 * Synthesis note: shipping despite "Year 2" deferral. Founder override
 * 2026-05-06.
 */

const HistorySchema = z.object({
  from: z.enum(["customer", "merchant"]),
  text: z.string().max(2000),
});

const ReplyDraftSchema = z.object({
  customer_message: z.string().min(1).max(2000),
  history: z.array(HistorySchema).max(20).optional().default([]),
  customer_id: z.string().uuid().optional(),
  merchant_voice_notes: z.string().max(500).optional(),
});

interface CustomerContext {
  name: string;
  phone: string | null;
  total_orders: number;
  total_spent: number;
  notes: string | null;
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = checkAiRateLimit(user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit reached" },
      aiRateLimitResponseInit(limit),
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ReplyDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { customer_message, history, customer_id, merchant_voice_notes } =
    parsed.data;

  // Fetch customer context if id provided
  let customerCtx: CustomerContext | null = null;
  if (customer_id) {
    const { data } = await supabase
      .from("customers")
      .select("name, phone, total_orders, total_spent, notes")
      .eq("id", customer_id)
      .single();
    if (data) {
      customerCtx = data as CustomerContext;
    }
  }

  const historyText =
    history && history.length > 0
      ? history
          .map((h) => `${h.from === "customer" ? "Customer" : "You"}: ${h.text}`)
          .join("\n")
      : "(no prior history)";

  const customerCtxText = customerCtx
    ? `Customer: ${customerCtx.name}${customerCtx.phone ? ` (${customerCtx.phone})` : ""}
- Total orders: ${customerCtx.total_orders}
- Lifetime spend: RM ${customerCtx.total_spent}
${customerCtx.notes ? `- Notes: ${customerCtx.notes}` : ""}`
    : "(walk-in customer, no profile)";

  const merchantVoiceText = merchant_voice_notes
    ? `Merchant voice: ${merchant_voice_notes}`
    : "(default warm/informal Malaysian SMB voice)";

  const userPrompt = `Customer's most recent message:
${customer_message}

Conversation history:
${historyText}

Customer profile:
${customerCtxText}

${merchantVoiceText}

Draft ONE reply for the merchant to review.`;

  const result = await callTwinAI({
    system: REPLY_DRAFT_PROMPT,
    user: userPrompt,
    temperature: 0.4, // slight creativity for natural variation
    maxTokens: 400,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, draft: null },
      { status: 503 },
    );
  }

  const json = result.json as {
    draft?: string;
    tone?: string;
    confidence?: number;
    alternative?: string;
  };

  if (!json.draft || typeof json.draft !== "string") {
    return NextResponse.json(
      { error: "AI returned no draft", draft: null },
      { status: 502 },
    );
  }

  return NextResponse.json({
    draft: json.draft,
    tone: json.tone ?? "warm",
    confidence: typeof json.confidence === "number" ? json.confidence : 0.5,
    alternative: typeof json.alternative === "string" ? json.alternative : null,
    reminder:
      "Tokoflow drafts. You send. Customer relationship stays with you.",
    usage: result.usage ?? null,
  });
}
