// app/(private)/koreksi/page.js

"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { createClient } from "../../../lib/database/supabase/client"; 
import Link from "next/link";
import { useRouter } from "next/navigation"; // Fixed: Added Next.js router
import {
  Plus, Search, CalendarDays, Loader2, ClipboardList, Users,
  CheckCircle, Info, AlertTriangle, X, RefreshCw
} from "lucide-react";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Terjadi Kesalahan</h2>
            <p className="text-gray-600 mb-4">Maaf, terjadi kesalahan yang tidak terduga.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main Component
function AutoGradeExamsPageContent() {
  // --- State variables ---
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [createModalError, setCreateModalError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // --- Hooks ---
  const { user, loading: authLoading } = useAuth();
  const router = useRouter(); // Fixed: Use Next.js router
  
  const supabase = useMemo(() => createClient(), []);
  const isMountedRef = useRef(true);

  // --- Effects ---
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch function
  const fetchExamsData = useCallback(async (userId, abortSignal) => {
    console.log("[KoreksiPage] fetchExamsData triggered for user:", userId);

    // 1. Ambil data ujian utama
    const { data: rawExams, error: examsError } = await supabase
      .from("kn_exams")
      .select("id, title, created_at")
      .eq("owner_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .abortSignal(abortSignal);
    
    if (examsError) throw examsError;
    if (!rawExams || rawExams.length === 0) return [];

    // 2. Ambil statistik menggunakan RPC function yang sudah dibuat
    const examIds = rawExams.map((e) => e.id);
    const { data: stats, error: statsError } = await supabase
        .rpc('get_exam_stats', { p_exam_ids: examIds })
        .abortSignal(abortSignal);

    if (statsError) {
      console.warn("Could not fetch exam stats, counts will be 0.", statsError);
    }
    const statsMap = new Map(stats?.map(s => [s.exam_id, s]) || []);

    // 3. Gabungkan data
    const processedExams = rawExams.map((exam) => {
      const examStats = statsMap.get(exam.id);
      return { 
        id: exam.id, 
        title: exam.title, 
        created_at: exam.created_at, 
        student_count: Number(examStats?.submission_count || 0),
        graded_count: Number(examStats?.graded_count || 0),
      };
    });

    return processedExams;
  }, [supabase]);

  // Fixed: Proper cleanup implementation
  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) {
        setStatus('success'); 
      }
      return;
    }
    
    const abortController = new AbortController();

    const runFetch = async () => {
      setStatus('loading');
      setError(null);
      console.log("[KoreksiPage] Main effect: Starting fetch process.");

      try {
        const processedExams = await fetchExamsData(user.id, abortController.signal);
        if (!isMountedRef.current) return;
        setExams(processedExams);
        setStatus('success');
        console.log("[KoreksiPage] Main effect: Fetch success.");
      } catch (err) {
        if (err.name === 'AbortError' || err.message?.includes('AbortError') || err.code === '20') {
          console.log("[KoreksiPage] Main effect: Fetch aborted.");
          return;
        }
        if (!isMountedRef.current) return;
        console.error("[KoreksiPage] Main effect: Fetch failed.", err);
        setError(`Gagal memuat tugas: ${err.message || err}`);
        setStatus('error');
      }
    };

    runFetch();
    
    return () => {
      abortController.abort();
    };
  }, [authLoading, user, fetchExamsData]);

  // Fixed: Memoized filtered exams to reduce re-renders
  const memoizedFilteredExams = useMemo(() => {
    let results = [...exams];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(exam => exam.title.toLowerCase().includes(query));
    }
    return results;
  }, [exams, searchQuery]);

  useEffect(() => {
    setFilteredExams(memoizedFilteredExams);
  }, [memoizedFilteredExams]);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    if (!user || status === 'loading') return;
    
    const abortController = new AbortController();
    setStatus('loading');
    setError(null);

    try {
      const processedExams = await fetchExamsData(user.id, abortController.signal);
      if (!isMountedRef.current) return;
      setExams(processedExams);
      setStatus('success');
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('AbortError') || err.code === '20') return;
      if (!isMountedRef.current) return;
      console.error("[KoreksiPage] Refresh failed.", err);
      setError(`Gagal memuat tugas: ${err.message || err}`);
      setStatus('error');
    }
  }, [user, status, fetchExamsData]);

  // Fixed: Use Next.js router instead of window.location
  const handleCreateExam = useCallback(async () => {
    const trimmedTitle = newExamTitle.trim();
    if (!trimmedTitle) { 
      setCreateModalError("Judul tugas tidak boleh kosong."); 
      return; 
    }
    if (!user?.id) { 
      setCreateModalError("Sesi pengguna tidak valid. Silakan login ulang."); 
      return; 
    }

    setIsCreating(true); 
    setCreateModalError(null);
    
    try {
      // Generate QR token
      const qrToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const { data, error: insertError } = await supabase
        .from("kn_exams")
        .insert([{ 
          title: trimmedTitle, 
          owner_id: user.id,
          qr_token: qrToken,
          qr_upload_enabled: true
        }])
        .select()
        .single();

      if (insertError) {
        if (insertError.message.includes('duplicate key value')) {
          throw new Error("Judul tugas sudah ada. Gunakan judul lain.");
        }
        throw insertError;
      }
      if (!data) throw new Error("Gagal membuat tugas di database.");
      
      // Fixed: Use Next.js router
      router.push(`/koreksi/${data.id}`);

    } catch (err) {
      console.error("Error creating exam:", err);
      setCreateModalError(`Gagal: ${err.message || 'Silakan coba lagi.'}`);
      if (isMountedRef.current) setIsCreating(false);
    }
  }, [newExamTitle, user?.id, supabase, router]);
  
  // --- UI Helpers ---
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Fixed: Improved status info with better class handling
  const getStatusInfo = (exam) => {
    if (exam.student_count === 0) {
      return { 
        text: 'Kosong', 
        colorClass: 'text-amber-700 dark:text-amber-300',
        bgClass: 'bg-amber-50 dark:bg-amber-900/20',
        iconBgClass: 'bg-amber-100 dark:bg-amber-900/30',
        icon: Info 
      };
    }
    if (exam.graded_count >= exam.student_count) {
      return { 
        text: 'Selesai', 
        colorClass: 'text-emerald-700 dark:text-emerald-300',
        bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
        iconBgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
        icon: CheckCircle 
      };
    }
    return { 
      text: 'Berjalan', 
      colorClass: 'text-gray-700 dark:text-gray-300',
      bgClass: 'bg-gray-100 dark:bg-gray-800/30',
      iconBgClass: 'bg-gray-200 dark:bg-gray-800/50',
      icon: Loader2 
    };
  };

  // --- Render Decision ---
  const isLoading = status === 'loading' || authLoading;
  const showContent = status === 'success' && !authLoading;
  const showError = status === 'error' && !authLoading;

  let loadingMessage = authLoading ? "Memeriksa autentikasi..." : "Memuat daftar tugas...";

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-start p-6 sm:p-8 max-w-3xl mx-auto w-full">
            
          {/* Header */}
          <div className="w-full max-w-lg mx-auto pt-8 pb-12 flex flex-col items-center">
            <div className="flex flex-col items-center justify-center mb-6">
              <img src="/images/logo.png" alt="KoreksiNilai" className="h-16 w-auto mb-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">KoreksiNilai</h1>
            </div>

            {/* Search and Create */}
            <div className="w-full flex flex-col sm:flex-row items-stretch gap-4 max-w-lg mx-auto">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tugas atau buat yang baru..."
                  className="w-full pl-10 pr-8 py-3 border border-gray-200 dark:border-gray-600 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 text-sm shadow-sm transition-colors duration-200 ease-in-out"
                  disabled={isLoading}
                />
                {searchQuery && (
                  <button
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <button
                onClick={() => { setIsCreateModalOpen(true); setCreateModalError(null); }}
                className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-1.5 px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-sm font-medium shadow-sm disabled:opacity-50 mt-4 sm:mt-0"
                disabled={isCreating || isLoading}
              >
                <span>Buat Tugas Baru</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="animate-spin h-12 w-12 text-gray-700" />
              <p className="mt-4 text-sm text-gray-600">{loadingMessage}</p>
            </div>
          )}

          {/* Error State */}
          {showError && (
            <div className="w-full max-w-md mx-auto mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-3" role="alert">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Terjadi Kesalahan:</span> {error}
                <button onClick={handleRefresh} className="ml-2 font-semibold underline">Coba lagi</button>
              </div>
            </div>
          )}

          {/* Content */}
          {showContent && (
            <>
              {filteredExams.length > 0 ? (
                <motion.div
                  className="w-full max-w-md mx-auto space-y-2 mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Tugas Anda</h2>
                    <button 
                      onClick={handleRefresh} 
                      disabled={isLoading} 
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" 
                      title="Refresh"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {filteredExams.map((exam) => {
                    const statusInfo = getStatusInfo(exam);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div key={exam.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                        <Link href={`/koreksi/${exam.id}`} className="py-2.5 px-3 flex items-center gap-3">
                          <div className={`p-1.5 rounded-md ${statusInfo.iconBgClass}`}>
                            <StatusIcon className={`h-4 w-4 ${statusInfo.colorClass} ${statusInfo.text === 'Berjalan' ? 'animate-spin' : ''}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate" title={exam.title}>
                              {exam.title}
                            </h3>
                            <div className="flex items-center gap-x-2 text-xs text-gray-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" /> 
                                {formatDate(exam.created_at)}
                              </span>
                              {exam.student_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" /> 
                                  {exam.graded_count || 0}/{exam.student_count} dinilai
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                // Empty State
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="text-center py-12 px-4"
                >
                  <div className="max-w-lg w-full mx-auto bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                      <ClipboardList className="w-7 h-7 text-gray-700" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {searchQuery ? 'Tidak Ditemukan' : 'Selamat Datang'}
                    </h2>
                    <p className="text-base text-gray-600 mb-6 max-w-sm">
                      {searchQuery 
                        ? `Tidak ada tugas dengan kata kunci "${searchQuery}"` 
                        : 'Buat tugas pertama Anda untuk mulai menilai.'}
                    </p>
                    {searchQuery ? (
                      <button 
                        onClick={() => setSearchQuery("")} 
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-200 transition-colors"
                      >
                        Hapus Pencarian
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsCreateModalOpen(true)} 
                        className="px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-sm font-medium shadow-sm inline-flex items-center gap-2 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Buat Tugas Pertama
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Create Modal */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <motion.div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="bg-white rounded-lg shadow-xl max-w-md w-full border"
              >
                <div className="p-5 border-b">
                  <h3 className="text-lg font-semibold">Tugas Penilaian Baru</h3>
                </div>
                <div className="p-5">
                  <div className="mb-4">
                    <label 
                      htmlFor="examTitleModal" 
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Judul Tugas <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="examTitleModal" 
                      value={newExamTitle} 
                      onChange={(e) => setNewExamTitle(e.target.value)} 
                      placeholder="Contoh: Ujian Harian Matematika" 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-500" 
                      maxLength={150} 
                      disabled={isCreating} 
                    />
                    {createModalError && (
                      <p className="text-red-600 text-xs mt-2 flex items-center gap-1.5">
                        <Info size={14} /> 
                        {createModalError}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-5 bg-gray-50 border-t">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsCreateModalOpen(false); 
                      setNewExamTitle(''); 
                      setCreateModalError(null);
                    }} 
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors" 
                    disabled={isCreating}
                  >
                    Batal
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCreateExam} 
                    className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded font-medium text-sm flex items-center gap-1.5 disabled:opacity-60 transition-colors" 
                    disabled={!newExamTitle.trim() || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4"/> 
                        Membuat...
                      </>
                    ) : (
                      "Buat Tugas"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Export with Error Boundary
export default function AutoGradeExamsPage() {
  return (
    <ErrorBoundary>
      <AutoGradeExamsPageContent />
    </ErrorBoundary>
  );
}