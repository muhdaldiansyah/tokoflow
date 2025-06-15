// app/(private)/koreksi/[examId]/components/Workspace/Answer/AnswerView.js
'use client';

import React, { useState } from 'react';
import { useResponsive, useResponsiveLayout } from '../../../hooks/useResponsive';
import SupabaseImage from '../../../../SupabaseImage';
import SkeletonLoader from '../../SkeletonLoader';
import { showToast } from '../../ToastStack';

export default function AnswerView({ ctx, setActiveWorkspace }) {
  const { isMobile } = useResponsive();
  const [isUploading, setIsUploading] = useState(false);
  const [deleteFileId, setDeleteFileId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  // Delete confirmation handlers
  const handleDeleteClick = (file) => {
    setDeleteFileId(file.id);
    setFileName(file.original_name);
    setDeleteError('');
    setShowDeleteConfirm(true);
  };
  
  const handleCancelDelete = () => {
    setDeleteFileId(null);
    setFileName('');
    setDeleteError('');
    setShowDeleteConfirm(false);
  };
  
  const handleConfirmDelete = async () => {
    if (deleteFileId) {
      setIsDeleting(true);
      setDeleteError('');
      
      try {
        await ctx.handleDeleteFile(deleteFileId, '', 'correct');
        handleCancelDelete();
      } catch (error) {
        setDeleteError(error.message || 'Gagal menghapus file');
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0 && !isUploading) {
      // Check file upload limit
      if (ctx.userId) {
        const maxFiles = ctx.userPlanLimits?.maxDocumentUpload || 1;
        const currentCount = ctx.correctAnswerFiles?.length || 0;
        const totalFiles = currentCount + files.length;
        
        if (totalFiles > maxFiles) {
          showToast(`Maksimal ${maxFiles} file kunci jawaban. Anda sudah memiliki ${currentCount} file.`, 'error');
          e.target.value = '';
          return;
        }
      }
      
      setIsUploading(true);
      const formData = new FormData();
      
      // Add metadata
      formData.append('examId', ctx.exam?.id);
      formData.append('username', ctx.username || 'user');
      formData.append('answerType', 'correct');
      formData.append('userId', ctx.userId);
      
      // Add all files
      files.forEach(file => {
        formData.append('files', file);
      });
      
      try {
        const response = await fetch('/api/koreksi/answer-files', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          await ctx.fetchCorrectAnswerFiles();
          showToast(`${data.files.filter(f => f.success).length} file berhasil diunggah`, 'success');
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
  };

  const files = ctx.correctAnswerFiles || [];
  const totalFiles = files.length;
  const maxFileSize = files.reduce((max, file) => Math.max(max, file.size || 0), 0);
  
  return (
    <>
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              Kunci Jawaban
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Unggah file kunci jawaban untuk penilaian otomatis - Maks {ctx.userPlanLimits?.maxDocumentUpload || 1} file
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Upload Button */}
            <input
              type="file"
              id="answer-key-upload"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleUpload}
            />
            <label
              htmlFor="answer-key-upload"
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all ${
                isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
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
                  <span className="text-sm">Upload {ctx.correctAnswerFiles?.length > 0 ? `(${ctx.correctAnswerFiles.length}/${ctx.userPlanLimits?.maxDocumentUpload || 1})` : ''}</span>
                </>
              )}
            </label>
          </div>
        </div>
      </div>
      
      {/* Stats Summary */}
      {files.length > 0 && (
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{totalFiles}</p>
                <p className="text-xs text-gray-600">Total File</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">PDF & Images</p>
                <p className="text-xs text-gray-600">Format Didukung</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6 pb-20">
        {ctx.isLoadingCorrectFiles ? (
          <SkeletonLoader type="files" text="Memuat kunci jawaban..." />
        ) : files.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Kunci Jawaban</h3>
              <p className="text-gray-600 mb-6">
                Unggah file kunci jawaban untuk memulai proses penilaian otomatis. Sistem mendukung format PDF dan gambar.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 text-left">
                <h4 className="font-medium text-blue-900 mb-2">Tips:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Pastikan kunci jawaban jelas dan mudah dibaca</li>
                  <li>• Gunakan format PDF untuk dokumen multi-halaman</li>
                  <li>• Gambar sebaiknya beresolusi tinggi</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="relative aspect-[4/3] bg-gray-50 cursor-pointer"
                    onClick={() => ctx.handlePreviewFile(file)}
                  >
                    {file.storage_path.toLowerCase().endsWith('.pdf') ? (
                      <div className="w-full h-full flex items-center justify-center p-8">
                        <div className="text-center">
                          <svg className="w-16 h-16 text-red-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,19L8,14H10L11.5,17.5L13,14H15L13,19H10Z" />
                          </svg>
                          <p className="text-sm font-medium text-gray-700">PDF Document</p>
                        </div>
                      </div>
                    ) : (
                      <SupabaseImage 
                        path={file.storage_path} 
                        alt={file.original_name} 
                        className="w-full h-full object-contain p-4" 
                      />
                    )}
                    
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
                      {new Date(file.created_at || file.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Drag & Drop Hint */}
            {!isMobile && (
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  💡 Tips: Anda juga bisa drag & drop file langsung ke area ini
                </p>
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
              Hapus Kunci Jawaban
            </h3>
          </div>
          
          <p className="text-gray-600 mb-6">
            Apakah Anda yakin ingin menghapus <span className="font-medium text-gray-900">"{fileName}"</span>?
          </p>
          
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
    </>
  );
}
