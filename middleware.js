// middleware.js
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  // Base response that will collect Supabase cookies
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => response.cookies.set(name, value, options),
        remove: (name, options) => response.cookies.delete({ name, ...options }),
      },
    }
  );

  // Get authenticated user (this validates the token on server)
  let user = null;
  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    if (!error) {
      user = authUser;
    }
  } catch (error) {
    // AuthSessionMissingError is expected when user is not logged in
    console.log("Middleware: No auth session found");
  }

  const withCookiesRedirect = (url) => {
    const r = NextResponse.redirect(url);
    // carry forward cookies set on `response`
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  // Payment is feature-flagged off during Early Access. The /checkout and
  // /plans pages reference /api/payment/* endpoints that don't exist yet,
  // so they currently 404 on submit. Until the Midtrans backend is built,
  // bounce both routes to /dashboard. Set NEXT_PUBLIC_PAYMENT_ENABLED=true
  // in .env to re-enable.
  const paymentEnabled = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === 'true';
  if (!paymentEnabled) {
    if (request.nextUrl.pathname.startsWith('/checkout') ||
        request.nextUrl.pathname.startsWith('/plans')) {
      const target = new URL('/dashboard', request.url);
      target.searchParams.set('notice', 'payment-disabled');
      return withCookiesRedirect(target);
    }
  }

  // If user is not authenticated and trying to access private routes
  const isPrivateRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                         request.nextUrl.pathname.startsWith('/products') ||
                         request.nextUrl.pathname.startsWith('/sales') ||
                         request.nextUrl.pathname.startsWith('/scanner') ||
                         request.nextUrl.pathname.startsWith('/customers') ||
                         request.nextUrl.pathname.startsWith('/inventory') ||
                         request.nextUrl.pathname.startsWith('/marketplace-fees') ||
                         request.nextUrl.pathname.startsWith('/marketplace') ||
                         request.nextUrl.pathname.startsWith('/incoming-goods') ||
                         request.nextUrl.pathname.startsWith('/product-costs') ||
                         request.nextUrl.pathname.startsWith('/product-compositions') ||
                         request.nextUrl.pathname.startsWith('/stock-adjustments') ||
                         request.nextUrl.pathname.startsWith('/warehouses') ||
                         request.nextUrl.pathname.startsWith('/admin') ||
                         request.nextUrl.pathname.startsWith('/plans') ||
                         request.nextUrl.pathname.startsWith('/checkout');

  if (!user && isPrivateRoute) {
    const redirectUrl = new URL('/login', request.url)
    const next = request.nextUrl.pathname + (request.nextUrl.search || '')
    redirectUrl.searchParams.set('redirect', next)
    return withCookiesRedirect(redirectUrl);
  }

  // If user is authenticated and trying to access auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    return withCookiesRedirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/dashboard/:path*',
    '/products/:path*',
    '/sales/:path*',
    '/scanner/:path*',
    '/customers/:path*',
    '/inventory/:path*',
    '/marketplace-fees/:path*',
    '/marketplace/:path*',
    '/incoming-goods/:path*',
    '/product-costs/:path*',
    '/product-compositions/:path*',
    '/stock-adjustments/:path*',
    '/warehouses/:path*',
    '/admin/:path*',
    '/plans/:path*',
    '/checkout/:path*',
  ],
};