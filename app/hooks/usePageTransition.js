// app/hooks/usePageTransition.js
"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Custom hook for handling page transitions in Next.js App Router
 * Addresses common issues with router.push and stale data
 */
export function usePageTransition() {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = useCallback((url, options = {}) => {
    const { forceReload = false, replace = false } = options;

    // For critical navigations or when data freshness is important, use window.location
    if (forceReload || url === '/koreksi') {
      window.location.href = url;
      return;
    }

    // For other navigations, use Next.js router
    if (replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  }, [router]);

  const refresh = useCallback(() => {
    // First push the current path, then refresh
    router.push(pathname);
    setTimeout(() => {
      router.refresh();
    }, 10);
  }, [router, pathname]);

  const back = useCallback(() => {
    // Use window.history for more reliable back navigation
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/koreksi';
    }
  }, []);

  return {
    navigate,
    refresh,
    back,
    pathname
  };
}
