import { NextResponse } from "next/server";
import { getUser, createServiceClient } from "@/lib/supabase/server";
import { USER_ROLES } from "@/lib/utils/constants";

/**
 * API-layer admin authorization (Layer 3).
 * Verifies auth + checks role via profile table using service client.
 */
export async function requireAdmin() {
  const user = await getUser();

  if (!user) {
    return {
      authorized: false as const,
      user: null,
      profile: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const supabase = await createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;
  if (role !== USER_ROLES.ADMIN && role !== USER_ROLES.MODERATOR) {
    return {
      authorized: false as const,
      user,
      profile,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    authorized: true as const,
    user,
    profile,
    error: null,
  };
}
