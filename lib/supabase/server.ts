import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { APP_SCHEMA } from "./config";
import type { CookieOptions } from "@supabase/ssr";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: { schema: APP_SCHEMA as any },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase client with service role key (bypasses RLS).
 * Use only for admin operations where RLS should be bypassed.
 */
export async function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: { schema: APP_SCHEMA as any },
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}

// Reads user from the session cookie — no round-trip to Supabase Auth server.
// Safe because middleware.ts already calls auth.getUser() on every request
// which validates the JWT and refreshes the session cookie. Server components
// can trust the cookie-backed session without re-validating server-side.
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
});

// Cached per-request profile fetch — columns cover all dashboard surfaces
// (layout + today + orders + products pages). Both layout.tsx and page.tsx
// call this; React cache() deduplicates to a single Supabase query per request.
export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "full_name, business_name, business_type, business_category, role, orders_used, order_credits, unlimited_until, packs_bought_this_month, bisnis_until, daily_order_capacity, preorder_enabled, slug, referral_code"
    )
    .eq("id", userId)
    .single();
  return data;
});

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}
