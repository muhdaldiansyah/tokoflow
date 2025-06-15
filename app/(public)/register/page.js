// app/(public)/register/page.js
"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp } from "../../actions/auth";
import { Loader2, AlertTriangle, Package } from "lucide-react";
import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "",
    businessName: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Form Validation
    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter.");
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok.");
      setLoading(false);
      return;
    }

    try {
      // Sign Up User using server action
      const { data: signUpData, error: signUpError } = await signUp(
        formData.email, 
        formData.password,
        {
          full_name: formData.name,
          business_name: formData.businessName
        }
      );

      if (signUpError) {
        if (signUpError.message?.includes("User already registered")) { 
          throw new Error("Email ini sudah terdaftar."); 
        }
        if (signUpError.message?.includes("Password should be at least 6 characters")) { 
          throw new Error("Password minimal 6 karakter."); 
        }
        throw new Error(signUpError.message || "Gagal mendaftar.");
      }

      // Redirect after success
      router.push('/login?registered=true');

    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan pendaftaran.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PublicNav />
      <div className="min-h-screen bg-gray-50 text-gray-700 overflow-x-hidden">
        <main className="pt-28 pb-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-lg">
            <div className="text-center mb-6">
              <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-semibold text-gray-900">TokoFlow</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Buat Akun Baru</h1>
              <p className="text-gray-600 text-sm mt-1">Mulai kelola toko Anda dengan sistem yang modern</p>
            </div>
            
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-700 text-sm transition-colors duration-300" 
                  placeholder="Masukkan nama lengkap Anda" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  disabled={loading} 
                />
              </div>

              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Toko/Bisnis
                </label>
                <input 
                  type="text" 
                  id="businessName" 
                  name="businessName" 
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-700 text-sm transition-colors duration-300" 
                  placeholder="Contoh: Toko Elektronik Jaya" 
                  value={formData.businessName} 
                  onChange={handleChange} 
                  required 
                  disabled={loading} 
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat Email
                </label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-700 text-sm transition-colors duration-300" 
                  placeholder="nama@email.com" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  disabled={loading} 
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-700 text-sm transition-colors duration-300" 
                  placeholder="•••••••• (min. 6 karakter)" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  minLength={6} 
                  disabled={loading} 
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Konfirmasi Password
                </label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-700 text-sm transition-colors duration-300" 
                  placeholder="••••••••" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  required 
                  minLength={6} 
                  disabled={loading} 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading} 
                className="btn-primary w-full bg-gray-900 hover:bg-black text-white font-medium py-2.5 rounded-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" /> Memproses...
                  </>
                ) : (
                  "Buat Akun"
                )}
              </button>
            </form>
            
            <p className="mt-6 text-center text-sm text-gray-600">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-medium text-gray-700 hover:text-black transition-colors duration-300">
                Masuk di sini
              </Link>
            </p>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-6 px-4">
            Dengan membuat akun, Anda menyetujui{" "}
            <Link href="/syarat-ketentuan" className="text-gray-700 hover:text-black transition-colors duration-300">
              Ketentuan Layanan
            </Link>{" "}
            &{" "}
            <Link href="/kebijakan-privasi" className="text-gray-700 hover:text-black transition-colors duration-300">
              Kebijakan Privasi
            </Link>{" "}
            kami.
          </p>
        </div>
      </main>
      </div>
      
      {/* Add CSS animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        /* Button animations */
        .btn-primary {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
      <Footer />
    </>
  );
}