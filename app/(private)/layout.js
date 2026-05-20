"use client";

import { useAuth } from '../hooks/useAuthSimple';
import AuthLoading from '../components/AuthLoading';
import PrivateNav from '../components/PrivateNav';

export default function PrivateLayout({ children }) {
  const { loading } = useAuth();

  if (loading) return <AuthLoading />;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <PrivateNav />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile top padding */}
        <div className="h-16 lg:hidden" />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}