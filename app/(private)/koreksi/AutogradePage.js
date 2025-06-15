// app/(private)/koreksi/AutogradePage.js
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/database/supabase/client';

/**
 * Autograde main page with Apple HIG & Geist design system
 */
export default function AutogradePage({ user }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch exams
  useEffect(() => {
    async function fetchExams() {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch basic exam data
        const { data, error } = await supabase
          .from('kn_exams')
          .select('id, title, created_at')
          .eq('owner_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Fetch basic stats
        const examIds = data.map(e => e.id);
        let submissionCounts = {};
        let gradingCounts = {};
        
        if (examIds.length > 0) {
          // Get submission counts
          const { data: submissions } = await supabase
            .from('kn_student_submissions')
            .select('id, exam_id')
            .in('exam_id', examIds);
          
          if (submissions) {
            submissions.forEach(sub => {
              submissionCounts[sub.exam_id] = (submissionCounts[sub.exam_id] || 0) + 1;
            });
          }
          
          // Get grading counts
          const submissionIds = submissions?.map(s => s.id) || [];
          if (submissionIds.length > 0) {
            const { data: gradings } = await supabase
              .from('kn_grading_sessions')
              .select('id, student_submission_id')
              .in('student_submission_id', submissionIds);
            
            if (gradings) {
              const submissionToExam = {};
              submissions.forEach(s => {
                submissionToExam[s.id] = s.exam_id;
              });
              
              gradings.forEach(g => {
                const examId = submissionToExam[g.student_submission_id];
                if (examId) {
                  gradingCounts[examId] = (gradingCounts[examId] || 0) + 1;
                }
              });
            }
          }
        }
        
        // Combine data
        const examsWithStats = data.map(exam => ({
          ...exam,
          submissionCount: submissionCounts[exam.id] || 0,
          gradedCount: gradingCounts[exam.id] || 0
        }));
        
        setExams(examsWithStats);
      } catch (err) {
        console.error('Error fetching exams:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchExams();
  }, [user, supabase]);
  
  // Create new exam
  const handleCreateExam = async (e) => {
    e.preventDefault();
    
    if (!newExamTitle.trim() || !user?.id) {
      return;
    }
    
    setIsCreating(true);
    
    try {
      const { data, error } = await supabase
        .from('kn_exams')
        .insert([
          { title: newExamTitle.trim(), owner_id: user.id }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      // Navigate to the new exam
      router.push(`/koreksi/${data.id}`);
    } catch (err) {
      console.error('Error creating exam:', err);
      alert(`Failed to create exam: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };
  
  // Format date with relative time
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Hari ini';
      if (diffDays === 1) return 'Kemarin';
      if (diffDays < 7) return `${diffDays} hari lalu`;
      
      return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };
  
  // Filter exams based on search
  const filteredExams = exams.filter(exam => 
    exam.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get progress percentage
  const getProgress = (exam) => {
    if (exam.submissionCount === 0) return 0;
    return Math.round((exam.gradedCount / exam.submissionCount) * 100);
  };
  
  // Get status color
  const getStatusColor = (progress) => {
    if (progress === 100) return 'text-success';
    if (progress > 0) return 'text-warning';
    return 'text-gray-400';
  };
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Autentikasi Diperlukan</h2>
          <p className="text-gray-600 mb-6">Silakan masuk untuk mengakses platform koreksi otomatis</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Masuk
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Koreksi Otomatis</h1>
              <p className="text-gray-600 mt-1">Penilaian bertenaga AI untuk koreksi yang lebih cepat dan konsisten</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari ujian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white animate-fade-in">
            <h2 className="text-2xl font-semibold mb-4">Mulai Sesi Koreksi Baru</h2>
            <p className="text-blue-100 mb-6 max-w-2xl">
              Buat ujian baru dan mulai menilai lembar jawaban siswa dengan bantuan AI. 
              Unggah kunci jawaban, tambah siswa, dan dapatkan hasil instan.
            </p>
            <form onSubmit={handleCreateExam} className="flex gap-3 max-w-xl">
              <input
                type="text"
                value={newExamTitle}
                onChange={(e) => setNewExamTitle(e.target.value)}
                placeholder="Masukkan judul ujian (cth: Kuis Matematika Minggu 5)"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 bg-white/90 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                disabled={isCreating}
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[120px] flex items-center justify-center gap-2"
                disabled={isCreating || !newExamTitle.trim()}
              >
                {isCreating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Membuat
                  </>
                ) : (
                  'Buat Ujian'
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Exams Grid */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Ujian Anda
            {filteredExams.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredExams.length} ujian)
              </span>
            )}
          </h2>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl p-12 text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Kesalahan Memuat Ujian</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center animate-fade-in">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Ujian tidak ditemukan' : 'Belum ada ujian'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchQuery 
                ? `Tidak ada ujian yang cocok dengan "${searchQuery}". Coba kata pencarian lain.`
                : 'Mulai dengan membuat ujian pertama Anda. Unggah kunci jawaban dan nilai lembar jawaban siswa secara otomatis dengan AI.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => document.querySelector('input[type="text"]').focus()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Buat Ujian Pertama Anda
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam, index) => {
              const progress = getProgress(exam);
              const isComplete = progress === 100;
              
              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => router.push(`/koreksi/${exam.id}`)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {exam.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(exam.created_at)}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isComplete ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <svg className={`w-5 h-5 ${isComplete ? 'text-success' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isComplete ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        )}
                      </svg>
                    </div>
                  </div>
                  
                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progres Koreksi</span>
                      <span className={`text-sm font-semibold ${getStatusColor(progress)}`}>
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress === 100 ? 'bg-success' : progress > 0 ? 'bg-warning' : 'bg-gray-300'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{exam.submissionCount}</p>
                      <p className="text-sm text-gray-500">Lembar Jawaban</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{exam.gradedCount}</p>
                      <p className="text-sm text-gray-500">Terkoreksi</p>
                    </div>
                  </div>
                  
                  {/* Action */}
                  <button className="w-full py-2 px-4 bg-gray-50 text-gray-700 rounded-lg font-medium group-hover:bg-blue-50 group-hover:text-blue-600 transition-all flex items-center justify-center gap-2">
                    <span>Lihat Detail</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
