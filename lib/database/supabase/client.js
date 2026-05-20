// lib/database/supabase/client.js
import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client. Used by AuthContext, page-level fetchers,
 * and anything that needs to read the user's session cookie.
 *
 * Returns a no-op stub during SSR / prerender (when there's no `window`)
 * so static page generation doesn't crash if env vars aren't injected at
 * build time. Real usage on the client requires NEXT_PUBLIC_SUPABASE_URL
 * and NEXT_PUBLIC_SUPABASE_ANON_KEY to be set — without them the stub is
 * returned in the browser too and an error is logged.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Server-side rendering / prerender path: return a stub that satisfies
  // every method AuthContext touches at first render. The real client
  // takes over once the page hydrates in the browser.
  const isServer = typeof window === 'undefined';

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!isServer) {
      console.error('Missing Supabase environment variables');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
    }
    return ssrStub();
  }

  if (isServer) {
    // Even with env vars present we don't want SSR/prerender to issue
    // network calls — return the stub so build is hermetic.
    return ssrStub();
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Minimal Supabase client stub used during prerender. Only implements the
 * surface AuthContext + fetch helpers touch at first render. Anything
 * unimplemented will throw at call site, which is correct — we want loud
 * failures if real Supabase calls are happening on the server side.
 */
function ssrStub() {
  const noResult = async () => ({ data: null, error: null });
  const noSession = async () => ({ data: { session: null }, error: null });
  const noUser = async () => ({ data: { user: null }, error: null });

  const queryStub = {
    select: () => queryStub,
    eq: () => queryStub,
    in: () => queryStub,
    or: () => queryStub,
    not: () => queryStub,
    is: () => queryStub,
    gte: () => queryStub,
    lte: () => queryStub,
    gt: () => queryStub,
    lt: () => queryStub,
    order: () => queryStub,
    range: () => queryStub,
    limit: () => queryStub,
    single: noResult,
    maybeSingle: noResult,
    then: (resolve) => resolve({ data: [], error: null }),
  };

  return {
    auth: {
      getSession: noSession,
      getUser: noUser,
      signInWithPassword: noResult,
      signUp: noResult,
      signOut: noResult,
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: () => queryStub,
  };
}