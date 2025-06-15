"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import ImprovedGoogleButton from "../../components/auth/ImprovedGoogleButton";
import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";

export default function LoginPage() {
  const { user, loading, signIn, signInWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

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
          
          const redirect = searchParams.get('redirect') || '/koreksi';
          router.replace(`/login?redirect=${redirect}`);
        } catch (e) {
          console.error('Error clearing localStorage:', e);
        }
      }
    }
  }, [searchParams, isClient, router]);

  // Auto-redirect authenticated users
  useEffect(() => {
    if (isClient && user && !loading && !isLoading) {
      const redirectTo = searchParams.get('redirect') || '/koreksi';
      if (searchParams.get('clearSession') !== 'true') {
        setTimeout(() => router.push(redirectTo), 300);
      }
    }
  }, [user, loading, isLoading, searchParams, router, isClient]);
  
  // Handle URL parameters
  useEffect(() => {
    if (isClient) {
      if (searchParams.get('registered') === 'true') {
        setSuccess('Registration successful! Please check your email for confirmation.');
      }
      if (searchParams.has('error')) {
        setError(searchParams.get('error') || 'An error occurred');
      }
    }
  }, [searchParams, isClient]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error, data } = await signIn(email, password);

      if (error) throw error;

      if (data.user) {
        setLoginSuccess(true);
        const redirectTo = searchParams.get('redirect') || '/koreksi';
        setTimeout(() => router.push(redirectTo), 1000);
      }
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || "An error occurred during login";
      setError(errorMessage);
      setLoginSuccess(false);
    } finally {
      if (!loginSuccess) {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <PublicNav />
      <div className="min-h-screen bg-white flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-gray-900">KoreksiNilai</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Sign in to continue grading</p>
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
            <p className="text-sm text-blue-600">Login successful! Redirecting...</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Google Sign In - Primary */}
          <ImprovedGoogleButton />
          
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          {isClient ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
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
                    Forgot?
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
                <span>{isLoading ? "Signing in..." : loginSuccess ? "Success!" : "Sign in"}</span>
              </button>
            </form>
          ) : (
            <div className="h-[308px] bg-gray-50 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link 
              href="/register" 
              className="font-medium text-gray-900 hover:text-gray-700"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}