// app/dashboard/autograde/[examId]/components/Workspace/Student/DetailView.js
'use client';

import React from 'react';
import formatters from '../../../utils/formatters';
import { useResponsive, useResponsiveLayout } from '../../../hooks/useResponsive';
import SupabaseImage from '../../../../SupabaseImage';
import SkeletonLoader from '../../SkeletonLoader';
import { showToast } from '../../ToastStack';
import CreditErrorModal from '../../CreditErrorModal';

export default function DetailView({ ctx, activeWorkspace, setActiveWorkspace }) {
  const { isMobile } = useResponsive();
  const { getContainerPadding } = useResponsiveLayout();
  const sub = ctx.selectedSubmission;
  
  // Track previous grade value
  const prevGradeRef = React.useRef(sub?.grade);
  
  // Fetch grading result when grade exists but result doesn't
  React.useEffect(() => {
    if (sub && sub.grade !== null && sub.grade !== undefined && !sub.grading_result && !sub.isLoadingStatus) {
      // Small delay to ensure the grading result is saved in the database
      const timer = setTimeout(() => {
        ctx.fetchGradingResultForSelected(sub.id);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sub?.id, sub?.grade, sub?.grading_result, sub?.isLoadingStatus, ctx.fetchGradingResultForSelected]);
  
  // Auto-switch to results tab when grading is completed
  React.useEffect(() => {
    if (sub) {
      const prevGrade = prevGradeRef.current;
      const currentGrade = sub.grade;
      
      // Check if grade changed from null/undefined to a value
      if ((prevGrade === null || prevGrade === undefined) && 
          (currentGrade !== null && currentGrade !== undefined)) {
        // Auto-switch to results tab when grading completes
        ctx.setStudentDetailTab('results');
        // Show success notification
        showToast(`Penilaian ${sub.student_name} selesai - Nilai: ${currentGrade}`, 'success');
      }
      
      // Update the ref for next comparison
      prevGradeRef.current = currentGrade;
    }
  }, [sub?.grade, sub?.student_name, ctx.setStudentDetailTab]);
  
  // Fetch grading result when results tab is active with retry logic
  React.useEffect(() => {
    if (ctx.studentDetailTab === 'results' && sub && sub.grade !== null && sub.grade !== undefined && !sub.grading_result && !sub.isLoadingStatus) {
      // Initial fetch attempt
      ctx.fetchGradingResultForSelected(sub.id);
      
      // Set up retry polling for up to 10 seconds
      let retries = 0;
      const maxRetries = 5;
      const retryInterval = setInterval(() => {
        if (sub && sub.grade !== null && sub.grade !== undefined && !sub.grading_result && !sub.isLoadingStatus) {
          retries++;
          console.log(`Retrying to fetch grading result for ${sub.student_name} (attempt ${retries})`);
          ctx.fetchGradingResultForSelected(sub.id);
          
          if (retries >= maxRetries) {
            clearInterval(retryInterval);
          }
        } else {
          // Success or no longer needed
          clearInterval(retryInterval);
        }
      }, 2000); // Retry every 2 seconds
      
      return () => clearInterval(retryInterval);
    }
  }, [ctx.studentDetailTab, sub?.id, sub?.grade, sub?.grading_result, sub?.isLoadingStatus, ctx.fetchGradingResultForSelected]);
  
  // State for delete confirmation
  const [deleteFileId, setDeleteFileId] = React.useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [fileName, setFileName] = React.useState('');
  const [deleteGrading, setDeleteGrading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  
  // Delete confirmation handlers
  const handleDeleteClick = (file) => {
    setDeleteFileId(file.id);
    setFileName(file.original_name);
    setDeleteGrading(false);
    setDeleteError('');
    setShowDeleteConfirm(true);
  };
  
  const handleCancelDelete = () => {
    setDeleteFileId(null);
    setFileName('');
    setDeleteGrading(false);
    setDeleteError('');
    setShowDeleteConfirm(false);
  };
  
  const handleConfirmDelete = async () => {
    if (deleteFileId && sub) {
      setIsDeleting(true);
      setDeleteError('');
      
      try {
        const fileToDelete = sub.files.find(f => f.id === deleteFileId);
        const storagePath = fileToDelete?.storage_path || '';
        await ctx.handleDeleteFile(deleteFileId, storagePath, 'student', sub.id, deleteGrading);
        
        if (deleteGrading && sub.grading_result) {
          await ctx.fetchGradingResultForSelected(sub.id);
        }
      } catch (error) {
        setDeleteError(error.message || 'Gagal menghapus file');
      } finally {
        setIsDeleting(false);
        if (!deleteError) {
          handleCancelDelete();
        }
      }
    }
  };
  
  // Empty state - Grading Dashboard
  if (!sub) {
    const students = ctx.studentSubmissions || [];
    // Only count approved and non-QR students for statistics
    const activeStudents = students.filter(s => 
      s.upload_source !== 'qr' || s.approval_status === 'approved'
    );
    const gradedCount = activeStudents.filter(s => s.grade !== null && s.grade !== undefined).length;
    const pendingCount = activeStudents.length - gradedCount;
    const totalFiles = activeStudents.reduce((sum, s) => sum + (s.files?.length || 0), 0);
    const averageScore = gradedCount > 0 
      ? Math.round(activeStudents.filter(s => s.grade !== null && s.grade !== undefined)
          .reduce((sum, s) => sum + (s.grade || 0), 0) / gradedCount)
      : 0;

    const getTimeOfDay = () => {
      const hour = new Date().getHours();
      if (hour < 12) return { greeting: 'Selamat Pagi', icon: '🌅' };
      if (hour < 17) return { greeting: 'Selamat Siang', icon: '☀️' };
      return { greeting: 'Selamat Malam', icon: '🌙' };
    };

    const { greeting, icon } = getTimeOfDay();

    return (
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
        <div className="h-full p-6">
          <div className="max-w-5xl mx-auto">
            {/* Welcome Header */}
            <div className="mb-8 animate-fade-in">
              <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mb-2`}>
                {icon} {greeting}!
              </h2>
              <p className={`${isMobile ? 'text-base' : 'text-lg'} text-gray-600`}>
                {ctx.exam?.title || 'Ujian Harian Matematika Kelas 10'}
              </p>
            </div>

            {activeStudents.length === 0 ? (
              /* No Students State */
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center animate-fade-in">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Mulai dengan Menambah Siswa</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  Belum ada siswa yang terdaftar untuk ujian ini. Tambahkan siswa pertama Anda untuk memulai.
                </p>
                <button 
                  onClick={() => setActiveWorkspace('addStudent')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Siswa
                </button>
              </div>
            ) : (
              /* Dashboard Content */
              <>
                {/* Stats Grid */}
                <div className={`grid gap-4 mb-8 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                  <div className="bg-white rounded-xl p-4 border border-gray-200 animate-fade-in" style={{ animationDelay: '50ms' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Total Siswa</span>
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{activeStudents.length}</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200 animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Sudah Dinilai</span>
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{gradedCount}</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200 animate-fade-in" style={{ animationDelay: '150ms' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Belum Dinilai</span>
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Rata-rata Nilai</span>
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {averageScore || '-'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8 animate-fade-in" style={{ animationDelay: '250ms' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Progress Penilaian</h3>
                    <span className="text-sm text-gray-600">
                      {gradedCount} dari {activeStudents.length} siswa ({Math.round((gradedCount / activeStudents.length) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${activeStudents.length > 0 ? (gradedCount / activeStudents.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 animate-fade-in" style={{ animationDelay: '300ms' }}>
                  <h3 className="font-semibold text-gray-900 mb-4">Langkah Selanjutnya</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-blue-600">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">Pilih siswa dari daftar</p>
                        <p className="text-sm text-gray-600">Klik nama siswa di sidebar kiri untuk melihat detail</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-blue-600">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">Periksa file jawaban</p>
                        <p className="text-sm text-gray-600">Pastikan semua file jawaban sudah terupload dengan benar</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-blue-600">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">Mulai penilaian</p>
                        <p className="text-sm text-gray-600">Klik tombol "Mulai Nilai" untuk memulai penilaian otomatis</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="mt-8 text-center text-sm text-gray-600 animate-fade-in" style={{ animationDelay: '350ms' }}>
                  <p>💡 <span className="font-medium">Tips:</span> Anda dapat mengunggah kunci jawaban di tab "Answer Key" untuk penilaian yang lebih akurat</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
    <div className="flex-1 flex flex-col overflow-hidden bg-white h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900 truncate">
                {sub.student_name}
              </h2>
              <button
                onClick={() => ctx.handleEditSubmissionClick(sub)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                title="Edit siswa"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Upload Button */}
            <input
              type="file"
              id="file-upload-detail"
              multiple
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0 && !isUploading) {
                  setIsUploading(true);
                  const formData = new FormData();
                  
                  // Add metadata
                  formData.append('examId', ctx.exam.id);
                  formData.append('submissionId', sub.id);
                  formData.append('userId', ctx.userId);
                  
                  // Add all files
                  files.forEach(file => {
                    formData.append('files', file);
                  });
                  
                  try {
                    const response = await fetch(`/api/koreksi/student-files?submissionId=${sub.id}`, {
                      method: 'POST',
                      body: formData,
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                      await ctx.fetchStudentFilesForSelected(sub.id);
                      showToast(`${data.files.length} file berhasil diunggah`, 'success');
                    } else {
                      showToast(data.error || 'Gagal mengunggah file', 'error');
                    }
                  } catch (error) {
                    console.error('Upload error:', error);
                    showToast('Error saat mengunggah file', 'error');
                  } finally {
                    setIsUploading(false);
                  }
                }
                e.target.value = '';
              }}
            />
            <label
              htmlFor="file-upload-detail"
              className={`flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all ${
                isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
              title="Upload File"
            >
              {isUploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span className="text-sm">Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm">Upload</span>
                </>
              )}
            </label>
            
            {/* Grading Status Indicator */}
            {sub.grade !== null && sub.grade !== undefined && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Sudah Dinilai</span>
              </div>
            )}
            
            {/* Close Button */}
            <button
              onClick={() => {
                // Clear selected submission
                ctx.setSelectedSubmission(null);
                // Go back to student list view
                setActiveWorkspace('student');
              }}
              className="flex items-center justify-center w-9 h-9 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all"
              title="Tutup"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="px-6 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex gap-8">
          {[
            { id: 'answers', label: 'File Jawaban' },
            { id: 'results', label: 'Hasil Penilaian' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => ctx.setStudentDetailTab(tab.id)}
              className={`py-4 px-1 text-sm font-medium transition-colors relative ${
                ctx.studentDetailTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {ctx.studentDetailTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-6">
        {ctx.studentDetailTab === 'answers' ? (
          <div className="animate-fade-in">
            {sub.isLoadingFiles ? (
              <SkeletonLoader type="files" text="Memuat file jawaban..." />
            ) : sub.files?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sub.files.map((file, index) => (
                  <div
                    key={file.id}
                    className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      className="relative aspect-[4/3] bg-gray-50 cursor-pointer"
                      onClick={() => ctx.handlePreviewFile(file)}
                    >
                      <SupabaseImage 
                        path={file.storage_path} 
                        alt={file.original_name} 
                        className="w-full h-full object-contain p-4" 
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-3">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              ctx.handlePreviewFile(file);
                            }}
                            className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-all shadow-md"
                            title="Pratinjau"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(file);
                            }}
                            className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-100 hover:border-rose-300 transition-all shadow-md"
                            title="Hapus"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-gray-900 truncate" title={file.original_name}>
                        {file.original_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 font-medium">Belum ada file jawaban yang diunggah</p>
                <p className="text-sm text-gray-500 mt-1">Klik tombol upload di atas untuk mengunggah file</p>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            {sub.isLoadingStatus ? (
              <SkeletonLoader type="student-detail" text="Memuat hasil penilaian..." />
            ) : sub.grading_result ? (
              <div className="space-y-6">
                {/* Score Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Nilai Akhir</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Dinilai pada {formatters.formatDateTime(sub.grading_result.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-5xl font-bold ${
                        (sub.grade) >= 80 ? 'text-green-600' :
                        (sub.grade) >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {sub.grade || 0}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">dari 100</p>
                    </div>
                  </div>
                </div>
                
                {/* Detailed Assessment */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Penilaian Detail</h3>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {sub.grading_result.fullAssessment || sub.grading_result.results_json || sub.grading_result.analysis || JSON.stringify(sub.grading_result) || 'Tidak ada detail penilaian'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-xl">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Dinilai</h3>
                <p className="text-gray-600 max-w-sm mx-auto mb-4">
                  {(!sub.files || sub.files.length === 0) ? 
                    "Unggah file jawaban terlebih dahulu untuk mengaktifkan penilaian" : 
                    "Gunakan fitur 'Nilai Semua' di daftar siswa untuk memulai penilaian"}
                </p>
                {sub.files && sub.files.length > 0 && (
                  <button
                    onClick={() => {
                      // Close detail view and show student list
                      ctx.setSelectedSubmission(null);
                      setActiveWorkspace('student');
                    }}
                    className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    Kembali ke Daftar Siswa
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
    
    {/* Delete Confirmation Modal */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal p-4 animate-fade-in">
        <div className="bg-white rounded-xl p-6 max-w-md w-full animate-scale-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Hapus File
            </h3>
          </div>
          
          <p className="text-gray-600 mb-6">
            Apakah Anda yakin ingin menghapus <span className="font-medium text-gray-900">"{fileName}"</span> dari {sub.student_name}?
          </p>
          
          {sub.grading_result && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6">
              <p className="text-sm text-amber-800 font-medium mb-2">
                File ini sudah dinilai (Nilai: {sub.grading_result.finalScore}%)
              </p>
              <label className="flex items-center text-sm cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={deleteGrading}
                  onChange={(e) => setDeleteGrading(e.target.checked)}
                  className="mr-2 rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-amber-700">
                  Hapus juga hasil penilaian
                </span>
              </label>
            </div>
          )}
          
          {deleteError && (
            <div className="bg-red-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-red-600">{deleteError}</p>
            </div>
          )}
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isDeleting && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              )}
              {isDeleting ? 'Menghapus...' : 'Hapus File'}
            </button>
          </div>
        </div>
      </div>
    )}
    
    {/* Credit Error Modal */}
    <CreditErrorModal
      isOpen={ctx.showCreditErrorModal}
      onClose={() => ctx.setShowCreditErrorModal(false)}
      error={ctx.creditError}
      profile={ctx.profile}
    />
    </>
  );
}
