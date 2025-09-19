// app/(private)/layout.js - Private pages layout with sidebar
"use client";

import PrivateNav from "../components/PrivateNav";
import { useAuth } from "../hooks/useAuthSimple";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Auth guard component
function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        setIsChecking(false);
      }
    }
  }, [user, loading, router]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Router will handle redirect
  }

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

export default function PrivateLayout({ children }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
