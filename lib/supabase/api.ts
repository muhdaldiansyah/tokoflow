import { createClient as createJsClient } from "@supabase/supabase-js";
import { createClient } from "./server";
import { APP_SCHEMA } from "./config";
import type { NextRequest } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Dual auth helper for API routes.
 * Checks Authorization Bearer header first (mobile), falls back to cookies (web).
 */
export async function getAuthenticatedClient(
  req: NextRequest
): Promise<{ supabase: SupabaseClient; user: User | null }> {
  const authHeader = req.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const supabase = createJsClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db: { schema: APP_SCHEMA as any },
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) return { supabase, user: null };
    return { supabase, user };
  }

  // Web: use cookie-based auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { supabase: supabase as any, user: user ?? null };
}
