import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Fast path: if JWT has >5 min remaining, skip the auth.getUser() network call.
  // getSession() reads from the cookie (0ms network); getUser() hits the Supabase
  // Auth server (~30-80ms RTT) to validate + refresh. We only need getUser() when
  // the JWT is near expiry or when there is no session cookie at all.
  const { data: { session } } = await supabase.auth.getSession();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const isJwtFresh = session?.expires_at != null && session.expires_at - nowSeconds > 300;

  let user = session?.user ?? null;

  if (!isJwtFresh) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  return { supabaseResponse, user };
}

/**
 * Get user role from the profiles table
 * Uses service role key to bypass RLS
 */
export async function getUserRole(userId: string): Promise<string | null> {
  const schema = process.env.NEXT_PUBLIC_APP_SCHEMA || 'public';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema },
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return data?.role ?? null;
}
