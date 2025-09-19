"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuthSimple";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import { Package } from "lucide-react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signIn: signInWithAuth, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user) {
      setLoginSuccess(true);
    }
  }, [user]);

  // Session cleanup logic
  useEffect(() => {
    if (isClient && searchParams.get('clearSession') === 'true') {
      if (typeof window !== 'undefined') {
        try {
          Object.keys(localStorage)
            .filter(key => key.startsWith('sb-') || key.includes('supabase'))
            .forEach(key => localStorage.removeItem(key));
          
          document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          });
          
          const redirect = searchParams.get('redirect') || '/dashboard';
          router.replace(`/login?redirect=${redirect}`);
        } catch (e) {
          console.error('Error clearing localStorage:', e);
        }
      }
    }
  }, [searchParams, isClient, router]);

  // Auto-redirect authenticated users is handled by middleware
  
  // Handle URL parameters
  useEffect(() => {
    if (isClient) {
      if (searchParams.get('registered') === 'true') {
        setSuccess('Registrasi berhasil! Silakan login dengan akun Anda.');
      }
      if (searchParams.has('error')) {
        setError(searchParams.get('error') || 'Terjadi kesalahan');
      }
    }
  }, [searchParams, isClient]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setLoginSuccess(false);

    try {
      const { error: signInError } = await signInWithAuth(email, password);

      if (signInError) {
        throw signInError;
      }

      setLoginSuccess(true);
    } catch (err) {
      const errorMessage = err?.message || "Terjadi kesalahan saat login";
      setError(errorMessage);
      setLoginSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <PublicNav />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">TokoFlow</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Selamat Datang</h1>
          <p className="text-gray-600">Masuk untuk mengelola toko Anda</p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg animate-slide-down">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg animate-slide-down">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}
        
        {loginSuccess && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg animate-slide-down">
            <p className="text-sm text-blue-600">Login berhasil! Mengalihkan...</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Email/Password Form */}
          {isClient ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || loginSuccess}
                  className="w-full h-12 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Lupa Password?
                  </Link>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || loginSuccess}
                  className="w-full h-12 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || loginSuccess}
                className="w-full h-12 bg-gray-900 text-white font-medium rounded-lg transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span>{isLoading ? "Memproses..." : loginSuccess ? "Berhasil!" : "Masuk"}</span>
              </button>
            </form>
          ) : (
            <div className="h-[184px] bg-gray-50 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun?{" "}
            <Link 
              href="/register" 
              className="font-medium text-gray-900 hover:text-gray-700"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
    <Footer />
    
    {/* Add CSS animations */}
    <style jsx global>{`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .animate-fade-in {
        animation: fadeIn 0.5s ease-out forwards;
      }
      
      .animate-slide-down {
        animation: slideDown 0.3s ease-out forwards;
      }
    `}</style>
    </>
  );
}

