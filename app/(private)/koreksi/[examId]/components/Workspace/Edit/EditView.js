// app/dashboard/autograde/[examId]/components/Workspace/Edit/EditView.js
'use client';

import React, { useState } from 'react';
import { useResponsive } from '../../../hooks/useResponsive';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { showToast } from '../../ToastStack';

export default function EditView({ ctx }) {
  const { isMobile } = useResponsive();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const handleSaveChanges = async () => {
    await ctx.handleUpdateExam();
    if (!ctx.modalError) {
      setIsEditMode(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!ctx.exam?.id || isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/koreksi/exams/${ctx.exam.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Gagal menghapus ujian');
      }
      
      showToast('Ujian berhasil dihapus', 'success');
      router.push('/koreksi');
    } catch (error) {
      console.error('Error deleting exam:', error);
      showToast(error.message || 'Gagal menghapus ujian', 'error');
      setIsDeleting(false);
    }
  };

  const getExamStats = () => {
    const students = ctx.studentSubmissions || [];
    const graded = students.filter(s => s.grading_result).length;
    const totalFiles = students.reduce((sum, s) => sum + (s.files?.length || 0), 0);
    const answerKeys = ctx.correctAnswerFiles?.length || 0;
    
    return {
      totalStudents: students.length,
      gradedStudents: graded,
      totalFiles,
      answerKeys,
      createdAt: ctx.exam?.created_at
    };
  };

  const stats = getExamStats();
  
  return (
    <>
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Pengaturan Ujian
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Kelola detail dan pengaturan ujian
            </p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6 pb-20 space-y-6">
          {/* Edit Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Detail Ujian</h3>
            
            <div className="space-y-4">
              {!isEditMode ? (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Judul Ujian
                    </label>
                    <p className="text-gray-900 font-medium">{ctx.exam?.title || 'Ujian Tanpa Judul'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditMode(true);
                      ctx.setEditExamTitle(ctx.exam?.title || '');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="examTitle" className="block text-sm font-medium text-gray-700 mb-2">
                      Judul Ujian
                    </label>
                    <input
                      type="text"
                      id="examTitle"
                      value={ctx.editExamTitle}
                      onChange={(e) => ctx.setEditExamTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Masukkan judul ujian"
                      disabled={ctx.isUpdatingExam}
                      autoFocus
                    />
                  </div>
                  
                  {ctx.modalError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{ctx.modalError}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setIsEditMode(false);
                        ctx.setEditExamTitle(ctx.exam?.title || '');
                        ctx.setModalError && ctx.setModalError('');
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                      disabled={ctx.isUpdatingExam}
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={ctx.isUpdatingExam || !ctx.editExamTitle.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {ctx.isUpdatingExam ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Simpan Perubahan</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl border border-red-200 p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Zona Berbahaya</h3>
            <p className="text-sm text-gray-600 mb-4">
              Tindakan ini tidak dapat dibatalkan. Harap berhati-hati.
            </p>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={ctx.isUpdatingExam || isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Hapus Ujian</span>
            </button>
          </div>

          {/* Additional Settings */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pengaturan Lanjutan</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Notifikasi Email</p>
                  <p className="text-sm text-gray-600">Kirim email ketika siswa dinilai</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
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
              Hapus Ujian
            </h3>
          </div>
          
          <p className="text-gray-600 mb-2">
            Apakah Anda yakin ingin menghapus ujian <span className="font-medium text-gray-900">"{ctx.exam?.title}"</span>?
          </p>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Peringatan:</strong> Semua data terkait ujian ini akan dihapus permanen, termasuk:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-amber-700 list-disc list-inside">
              <li>{stats.totalStudents} data siswa</li>
              <li>{stats.totalFiles} file jawaban</li>
              <li>{stats.answerKeys} kunci jawaban</li>
              <li>{stats.gradedStudents} hasil penilaian</li>
            </ul>
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteExam}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Hapus Permanen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
