import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedClient } from "@/lib/supabase/api";
import { aiRateLimitResponseInit, checkAiRateLimit } from "@/lib/rate-limit/ai";
import { PAYMENT_MATCH_PROMPT, callTwinAI } from "@/lib/ai/twin-prompts";

/**
 * Background Twin — payment matcher.
 *
 * Tier 3 autonomous task. Takes a bank notification text + open orders for
 * the authenticated merchant, returns the best-match order or "ESCALATE".
 *
 * Per bible v1.2 D-014: Background Twin is autonomous. This endpoint is
 * called by:
 *   (a) The Phase 0 smoke test as Aldi processes WA admin manually
 *   (b) Future: webhook from bank notification scraper or Billplz settlement
 *
 * Synthesis note: shipping despite explicit "Year 2" deferral. Founder
 * override 2026-05-06. Phase 0 smoke test still gates production rollout —
 * if customer detects AI tone OR merchant trust degrades, scope reduces or
 * kills per kill trigger #3.
 */

const PaymentMatchSchema = z.object({
  notification: z.string().min(5).max(2000),
  // Caller may pass open orders explicitly; if omitted we fetch from DB.
  candidate_orders: z
    .array(
      z.object({
        order_number: z.string(),
        customer_name: z.string(),
        total_amount: z.number(),
        customer_phone: z.string().optional(),
      }),
    )
    .max(50)
    .optional(),
});

interface OrderRow {
  order_number: string;
  total: number;
  customer_name: string | null;
  customer_phone: string | null;
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

  const parsed = PaymentMatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Fetch open orders if caller didn't pass any (RLS scopes to user)
  let candidates = parsed.data.candidate_orders;
  if (!candidates) {
    const { data: orders } = await supabase
      .from("orders")
      .select("order_number, total, customer_name, customer_phone")
      .neq("status", "cancelled")
      .neq("status", "done")
      .order("created_at", { ascending: false })
      .limit(50);

    candidates = ((orders ?? []) as OrderRow[]).map((o) => ({
      order_number: o.order_number,
      customer_name: o.customer_name ?? "Unknown",
      total_amount: o.total,
      customer_phone: o.customer_phone ?? undefined,
    }));
  }

  if (candidates.length === 0) {
    return NextResponse.json({
      match: "ESCALATE",
      confidence: 0,
      reasoning: "No open orders to match against",
      candidates_considered: 0,
    });
  }

  const userPrompt = `Bank notification:
${parsed.data.notification}

Open orders (${candidates.length}):
${candidates
  .map(
    (o) =>
      `- ${o.order_number} | ${o.customer_name} | RM ${o.total_amount}${o.customer_phone ? ` | ${o.customer_phone}` : ""}`,
  )
  .join("\n")}`;

  const result = await callTwinAI({
    system: PAYMENT_MATCH_PROMPT,
    user: userPrompt,
    temperature: 0.1,
    maxTokens: 200,
  });

  if (!result.ok) {
    return NextResponse.json(
      { match: "ESCALATE", confidence: 0, reasoning: result.error },
      { status: 503 },
    );
  }

  const json = result.json as {
    match?: string;
    confidence?: number;
    reasoning?: string;
  };

  return NextResponse.json({
    match: json.match ?? "ESCALATE",
    confidence: typeof json.confidence === "number" ? json.confidence : 0,
    reasoning: json.reasoning ?? "",
    candidates_considered: candidates.length,
    usage: result.usage ?? null,
  });
}
