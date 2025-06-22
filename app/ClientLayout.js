// app/ClientLayout.js
"use client";

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from "./hooks/useAuth";
import AnalyticsProvider from "./components/analytics/AnalyticsProvider";
import { Suspense, useEffect } from 'react';
import { Toaster } from 'sonner';

// Pages that require authentication
const PROTECTED_PAGES = [
  '/dashboard', 
  '/admin', 
  '/koreksi',
  '/produk',
  '/penjualan',
  '/barang-masuk',
  '/inventori',
  '/koreksi-stok',
  '/rekap-penjualan',
  '/harga-modal',
  '/fee-marketplace',
  '/komposisi-produk'
];

// Auth redirect logic component
function AuthRedirect({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

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
  }, [user, loading, pathname, router, searchParams]);

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