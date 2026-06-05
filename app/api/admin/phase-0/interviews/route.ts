import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedClient } from "@/lib/supabase/api";

const InterviewSchema = z.object({
  interview_number: z.number().int().min(1).max(10),
  initial: z.string().min(1).max(20),
  type: z.enum(["friendly", "hostile"]),
  interview_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  vertical: z.string().max(100).nullable().optional(),
  revenue_band: z
    .enum(["<5k", "5-15k", "15-50k", ">50k"])
    .nullable()
    .optional(),
  three_tier_resonance: z.number().int().min(1).max(10).nullable().optional(),
  tier_1_love_mentioned: z.boolean().optional(),
  tier_2_love_mentioned: z.boolean().optional(),
  tier_3_top_pain_cited: z.boolean().optional(),
  top_pains: z.string().max(500).nullable().optional(),
  sean_ellis_answer: z
    .enum([
      "a_very_disappointed",
      "b_somewhat_disappointed",
      "c_not_disappointed",
    ])
    .nullable()
    .optional(),
  wtp_rm_per_month: z.number().int().min(0).max(1000).nullable().optional(),
  brand_friction: z.number().int().min(1).max(10).nullable().optional(),
  brand_friction_notes: z.string().max(500).nullable().optional(),
  wave_2_spillover_names: z.string().max(500).nullable().optional(),
  trust_concerns: z.string().max(1000).nullable().optional(),
  beta_willing: z.boolean().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

async function requireAdmin(req: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient(req);
  if (!user) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
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
    .from("phase_0_interviews")
    .select("*")
    .order("interview_number");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ interviews: data ?? [] });
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

  const parsed = InterviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("phase_0_interviews")
    .upsert({ ...parsed.data, user_id: auth.user.id }, { onConflict: "interview_number" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, interview: data });
}
