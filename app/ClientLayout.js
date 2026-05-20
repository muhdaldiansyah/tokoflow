// app/ClientLayout.js
"use client";

import React, { Suspense } from 'react';
import { AuthProvider } from "./hooks/useAuthSimple";
import AnalyticsProvider from "./components/analytics/AnalyticsProvider";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import { Toaster } from 'sonner';

// Main client layout component
export default function ClientLayout({ children }) {
  // Always wrap with AuthProvider and Analytics
  return (
    <AuthProvider>
      <AnalyticsProvider />
      <ServiceWorkerRegister />
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
      <Suspense fallback={null}>{children}</Suspense>
    </AuthProvider>
  );
}