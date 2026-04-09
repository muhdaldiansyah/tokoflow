// lib/database/supabase-server/index.js
// Server-side Supabase client - only import in Server Components, Route Handlers, or Server Actions
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { installKeepAlive } from '../../http/keepalive.js';

installKeepAlive();

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
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

// ---------------------------------------------------------------------------
// Service-role client (bypasses RLS)
// ---------------------------------------------------------------------------
//
// ⚠️ DANGER: This client bypasses Row Level Security. It must ONLY be used
// in server-only code paths where:
//
//   (a) There is no authenticated user (webhook endpoints called by external
//       platforms, Vercel Cron invocations), AND
//   (b) The caller has already verified its own authorization (e.g. webhook
//       HMAC signature match, cron shared-secret match).
//
// Never expose a service-role client to a route that receives request bodies
// from arbitrary users. Never ship it to the browser. Never put it behind a
// shared helper that is also used by user-facing routes.
//
// Failure mode: if SUPABASE_SERVICE_ROLE_KEY is missing, this function throws
// loudly instead of silently falling back to anon — a silent downgrade would
// make webhook inserts fail with a confusing RLS error later.
//
// @returns {ReturnType<typeof createSupabaseClient>}
let _serviceRoleCache = null;
export function createServiceRoleClient() {
  if (_serviceRoleCache) return _serviceRoleCache;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('createServiceRoleClient: NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  if (!key) {
    throw new Error(
      'createServiceRoleClient: SUPABASE_SERVICE_ROLE_KEY is not set. ' +
        'Get it from Supabase dashboard → Settings → API → service_role. ' +
        'Never commit it.'
    );
  }

  _serviceRoleCache = createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-tokoflow-role': 'service' } },
  });
  return _serviceRoleCache;
}