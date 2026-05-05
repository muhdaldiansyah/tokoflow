import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedClient } from "@/lib/supabase/api";

const SmokeSchema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  smoke_test_day: z.number().int().min(1).max(14),
  wa_messages_handled: z.number().int().min(0).optional().default(0),
  orders_processed: z.number().int().min(0).optional().default(0),
  payments_matched: z.number().int().min(0).optional().default(0),
  invoices_generated: z.number().int().min(0).optional().default(0),
  hours_invested: z.number().min(0).max(24).optional().default(0),
  customer_complaints: z.number().int().min(0).optional().default(0),
  ai_tone_detection_incidents: z.number().int().min(0).optional().default(0),
  trust_degradation_incidents: z.number().int().min(0).optional().default(0),
  what_worked: z.string().max(2000).nullable().optional(),
  what_broke: z.string().max(2000).nullable().optional(),
  merchant_feedback: z.string().max(2000).nullable().optional(),
});

async function requireAdmin(req: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient(req);
  if (!user) return { ok: false as const, status: 401, error: "Unauthorized" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  return { ok: true as const, supabase, user };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { data, error } = await auth.supabase
    .from("phase_0_smoke_test_log")
    .select("*")
    .order("smoke_test_day");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ logs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SmokeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("phase_0_smoke_test_log")
    .upsert(
      { ...parsed.data, user_id: auth.user.id },
      { onConflict: "log_date,user_id" },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, log: data });
}
