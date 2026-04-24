import { NextResponse, type NextRequest } from "next/server";
import { updateSession, getUserRole } from "@/lib/supabase/middleware";
import { PROTECTED_ROUTES, AUTH_ROUTES, ROUTES, USER_ROLES } from "@/lib/utils/constants";

const MAINTENANCE_BLOCKED_ROUTES = [
  "/login",
  "/register",
  "/features",
  "/pricing",
  "/about",
  "/contact",
];

// Public routes that don't need auth — skip Supabase getUser() call
const PUBLIC_ROUTES = ["/order/", "/r/", "/api/public/", "/api/wa/"];

// Legacy (ID) → new (MY) path rewrites. Preserves SEO equity + existing
// WhatsApp / bookmark links after the Phase 2 route rename.
const LEGACY_ROUTE_MAP: Record<string, string> = {
  "/pesanan": "/orders",
  "/produk": "/products",
  "/pelanggan": "/customers",
  "/persiapan": "/prep",
  "/rekap": "/recap",
  "/faktur": "/invoices",
  "/komunitas": "/community",
  "/pajak": "/tax",
  "/pengaturan": "/settings",
  "/pesan": "/order",
};

// Leaf subpaths that were still Indonesian even after the top-level rename
// ("/orders/baru" → "/orders/new" etc.). Matched after the prefix pass so the
// top-level legacy path and the leaf both resolve cleanly.
const LEGACY_LEAF_MAP: Record<string, string> = {
  "/baru": "/new",
};

function rewriteLegacyPath(pathname: string): string | null {
  let rewritten: string | null = null;

  for (const [legacy, current] of Object.entries(LEGACY_ROUTE_MAP)) {
    if (pathname === legacy) {
      rewritten = current;
      break;
    }
    if (pathname.startsWith(legacy + "/")) {
      rewritten = current + pathname.slice(legacy.length);
      break;
    }
  }

  const subject = rewritten ?? pathname;
  for (const [leaf, replacement] of Object.entries(LEGACY_LEAF_MAP)) {
    if (subject.endsWith(leaf)) {
      return subject.slice(0, -leaf.length) + replacement;
    }
  }

  return rewritten;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permanent redirect for legacy Indonesian route prefixes to their new MY
  // equivalents — /pesanan/123/edit → /orders/123/edit (+ search string).
  const rewritten = rewriteLegacyPath(pathname);
  if (rewritten) {
    const url = request.nextUrl.clone();
    url.pathname = rewritten;
    return NextResponse.redirect(url, 301);
  }

  // CORS for API routes — allow mobile app (Expo Web) in development
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const allowedOrigins = [
      "http://localhost:8081",
      "http://localhost:19006",
      "http://localhost:8082",
    ];

    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : "",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const response = NextResponse.next();
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }
    return response;
  }

  // Skip auth for public routes — avoid unnecessary Supabase RPC
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);

  // Maintenance mode — redirect blocked marketing/auth routes to coming soon page
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true") {
    const isBlockedRoute = MAINTENANCE_BLOCKED_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );
    if (isBlockedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Determine if user is authenticated
  const isAuthenticated = !!user;

  // Check if the current path is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is an auth route
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // If user is not logged in and trying to access protected route
  if (!isAuthenticated && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.LOGIN;
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access auth routes (login, register, etc.)
  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    const redirectTo = url.searchParams.get("redirectTo") || ROUTES.DASHBOARD;
    url.pathname = redirectTo;
    url.searchParams.delete("redirectTo");
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access landing page, redirect to dashboard
  if (isAuthenticated && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.DASHBOARD;
    return NextResponse.redirect(url);
  }

  // Check admin routes - require admin or moderator role
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = ROUTES.LOGIN;
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    // Check user role
    const role = await getUserRole(user.id);
    if (role !== USER_ROLES.ADMIN && role !== USER_ROLES.MODERATOR) {
      const url = request.nextUrl.clone();
      url.pathname = ROUTES.DASHBOARD;
      url.searchParams.set("error", "admin_required");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
