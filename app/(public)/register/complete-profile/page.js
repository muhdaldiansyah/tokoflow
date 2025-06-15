'use client';

// Disable prerendering for this page since it requires authentication
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function CompleteProfilePage() {
  const { user, profile, loading, createProfile } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    institutionName: '',
    jobTitle: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // If user is not logged in, redirect to login
    if (mounted && !loading && !user) {
      router.push('/login');
      return;
    }
    
    // If user already has a profile, redirect to dashboard
    if (mounted && !loading && user && profile) {
      router.push('/koreksi');
      return;
    }
    
    // Pre-fill name from Google if available
    if (mounted && !loading && user && user.user_metadata?.full_name) {
      setFormData(prev => ({
        ...prev,
        fullName: user.user_metadata.full_name
      }));
    }
  }, [user, profile, loading, router, mounted]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!formData.fullName.trim()) {
        throw new Error('Nama lengkap wajib diisi');
      }

      // Prepare profile data
      const profileData = {
        full_name: formData.fullName.trim(),
        phone_number: formData.phoneNumber.trim() || null,
        institution_name: formData.institutionName.trim() || null,
        job_title: formData.jobTitle.trim() || null,
        credits_balance: 100, // Default starting credits
        is_verified: true
      };

      // Add credits expiry date (30 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      profileData.next_credits_expiry_date = expiryDate.toISOString();
      profileData.created_at = new Date().toISOString();
      profileData.updated_at = new Date().toISOString();

      // Create profile
      const { success, error } = await createProfile(profileData);
      
      if (!success) {
        throw new Error(error || 'Gagal menyimpan profil');
      }
      
      // Successful profile creation, redirect to dashboard
      router.push('/koreksi');
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  // Show loading state while auth state is being checked
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-700 overflow-x-hidden">
      <main className="pt-16 pb-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-elevate">
            <div className="text-center mb-6">
              <Link href="/" className="inline-block mb-3">
                <span className="text-2xl font-medium text-black">KoreksiNilai</span>
              </Link>
              <h1 className="text-xl font-medium text-black">Lengkapi Profil Anda</h1>
              <p className="text-gray-600 text-sm mt-1">Informasi ini membantu kami memberikan pengalaman penilaian yang lebih baik</p>
            </div>
            
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  id="fullName" 
                  name="fullName" 
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-700 text-sm transition-colors duration-300" 
                  placeholder="Masukkan nama lengkap Anda" 
                  value={formData.fullName} 
                  onChange={handleChange} 
                  required 
                  disabled={isSubmitting} 
                />
              </div>
              
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Telepon
                </label>
                <input 
                  type="text" 
                  id="phoneNumber" 
                  name="phoneNumber" 
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-700 text-sm transition-colors duration-300" 
                  placeholder="cth: 08123456789" 
                  value={formData.phoneNumber} 
                  onChange={handleChange} 
                  disabled={isSubmitting} 
                />
              </div>
              
              <div>
                <label htmlFor="institutionName" className="block text-sm font-medium text-gray-700 mb-1">
                  Asal Institusi
                </label>
                <input 
                  type="text" 
                  id="institutionName" 
                  name="institutionName" 
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-700 text-sm transition-colors duration-300" 
                  placeholder="cth: Universitas Indonesia" 
                  value={formData.institutionName} 
                  onChange={handleChange}
                  disabled={isSubmitting} 
                />
              </div>
              
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Pekerjaan/Jabatan
                </label>
                <input 
                  type="text" 
                  id="jobTitle" 
                  name="jobTitle" 
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-700 text-sm transition-colors duration-300" 
                  placeholder="cth: Guru / Dosen / Pelajar" 
                  value={formData.jobTitle} 
                  onChange={handleChange}
                  disabled={isSubmitting} 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="btn-primary w-full bg-gray-900 hover:bg-black text-white font-medium py-2.5 rounded-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" /> Memproses...
                  </>
                ) : (
                  "Simpan dan Lanjutkan"
                )}
              </button>
            </form>
            
            <p className="text-xs text-gray-500 text-center mt-6 px-4">
              Dengan melengkapi profil, Anda setuju dengan{" "}
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
        </div>
      </main>
      
      {/* Add CSS animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }
        
        /* Enhanced shadow classes */
        .shadow-elevate {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }
        
        /* Button animations */
        .btn-primary {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .btn-primary:after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: -100%;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%);
          transition: all 0.5s ease;
          z-index: 1;
        }
        
        .btn-primary:hover:after {
          left: 100%;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}