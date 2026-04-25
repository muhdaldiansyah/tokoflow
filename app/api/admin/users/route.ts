import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { USER_ROLES } from "@/lib/utils/constants";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, business_name, role, plan, plan_expiry, orders_used, orders_limit, ai_credits_used, ai_credits_limit, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get auth emails via admin API
  const {
    data: { users: authUsers },
  } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  const emailMap = new Map<string, string>();
  authUsers?.forEach((u) => {
    if (u.email) emailMap.set(u.id, u.email);
  });

  const users = (data || []).map((p) => ({
    id: p.id,
    full_name: p.full_name || p.business_name || "—",
    email: emailMap.get(p.id) || "—",
    role: p.role || "user",
    plan: p.plan || "free",
    plan_expiry: p.plan_expiry || null,
    orders_used: p.orders_used || 0,
    orders_limit: p.orders_limit ?? -1,
    ai_credits_used: p.ai_credits_used || 0,
    ai_credits_limit: p.ai_credits_limit ?? 20,
    created_at: p.created_at,
  }));

  return NextResponse.json({ users, currentUserRole: auth.profile?.role || "user" });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  // Only admin can change roles — moderator is read-only
  if (auth.profile?.role !== USER_ROLES.ADMIN) {
    return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, role } = body;

  if (!userId || !role) {
    return NextResponse.json(
      { error: "userId and role required" },
      { status: 400 }
    );
  }

  const validRoles = Object.values(USER_ROLES);
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
