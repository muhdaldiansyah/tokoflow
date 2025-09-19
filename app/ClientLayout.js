// app/ClientLayout.js
"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from "./hooks/useAuthSimple";
import AnalyticsProvider from "./components/analytics/AnalyticsProvider";
import AuthLoading from "./components/AuthLoading";
import { Toaster } from 'sonner';

// Pages that require authentication
const PROTECTED_PAGES = [
  '/dashboard', 
  '/admin', 
  '/koreksi',
  '/products',
  '/sales',
  '/incoming-goods',
  '/inventory',
  '/stock-adjustments',
  '/sales-history',
  '/product-costs',
  '/marketplace-fees',
  '/product-compositions'
];

// Auth redirect logic component
function AuthRedirect({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = React.useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (loading || !isClient) return;

    // Check if current page requires auth
    const isProtectedPage = PROTECTED_PAGES.some(page =>
      pathname === page || pathname.startsWith(page + '/')
    );

    // Redirect to login if accessing protected page without auth
    if (isProtectedPage && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Redirect from login if already authenticated
    if (pathname === '/login' && user) {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.replace(redirectTo);
    }
  }, [user, loading, pathname, router, searchParams, isClient]);

  // Show loading screen while auth is being checked or client is initializing
  if (loading || !isClient) {
    return <AuthLoading />;
  }

  return children;
}

// Main client layout component
export default function ClientLayout({ children }) {
  // Always wrap with AuthProvider and Analytics
  return (
    <AuthProvider>
      <AnalyticsProvider />
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
      <Suspense fallback={null}>
        <AuthRedirect>
          {children}
        </AuthRedirect>
      </Suspense>
    </AuthProvider>
  );
}