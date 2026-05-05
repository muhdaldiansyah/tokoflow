import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedClient } from "@/lib/supabase/api";

const DistSchema = z.object({
  snapshot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  week_number: z.number().int().min(1).max(8),
  followers_total: z.number().int().min(0),
  posts_published: z.number().int().min(0).optional().default(0),
  substantive_comments: z.number().int().min(0).optional().default(0),
  inbound_dm_total: z.number().int().min(0).optional().default(0),
  inbound_dm_qualified: z.number().int().min(0).optional().default(0),
  per_platform: z.record(z.string(), z.unknown()).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
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
    .from("phase_0_distribution_metrics")
    .select("*")
    .order("snapshot_date", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ snapshots: data ?? [] });
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

  const parsed = DistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("phase_0_distribution_metrics")
    .upsert(
      { ...parsed.data, user_id: auth.user.id },
      { onConflict: "snapshot_date,user_id" },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, snapshot: data });
}
