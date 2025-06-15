// app/(private)/koreksi/[examId]/components/modals/AddStudentModal.js
'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { showToast } from '../ToastStack';
import { getUserPlanLimits, validateFileUploadLimit } from '@/lib/subscription/planLimits';

export default function AddStudentModal({ isOpen, onClose, ctx }) {
  const { user } = useAuth();
  const [studentName, setStudentName] = useState('');
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStudentName('');
      setFiles([]);
      setError(null);
    }
  }, [isOpen]);
  
  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Check file upload limit
    const validation = await validateFileUploadLimit(user?.id, 0, selectedFiles.length);
    if (!validation.allowed) {
      setError(validation.message);
      e.target.value = ''; // Clear the input
      return;
    }
    
    setFiles(selectedFiles);
    setError(null);
  };
  
  const handleSubmit = async () => {
    if (!studentName.trim()) {
      setError('Nama siswa harus diisi');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('examId', ctx.exam.id);
      
      if (user?.id) {
        formData.append('userId', user.id);
      }
      
      // Prepare student data
      const studentsData = [{
        id: `temp-${Date.now()}`,
        name: studentName.trim()
      }];
      formData.append('students', JSON.stringify(studentsData));
      
      // Append files
      files.forEach((file, index) => {
        formData.append(`student-0-file-${index}`, file);
      });
      
      const response = await fetch('/api/koreksi/bulk-submissions', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat data siswa');
      }
      
      const firstSuccessful = result.results?.find(r => r.success);
      if (firstSuccessful && firstSuccessful.submissionId) {
        showToast(`Siswa "${studentName}" berhasil ditambahkan`, 'success');
        
        // Fetch updated submissions
        await ctx.fetchStudentSubmissionsAndGrades();
        
        // Close modal
        onClose();
        
        // Select the newly created student
        setTimeout(() => {
          const newStudent = ctx.studentSubmissions.find(s => s.id === firstSuccessful.submissionId);
          if (newStudent) {
            ctx.handleSelectSubmission(newStudent);
          }
        }, 100);
      } else {
        throw new Error('Gagal membuat data siswa');
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <UserPlus size={20} className="text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Tambah Siswa</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <XCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}
            
            {/* Student Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Siswa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Masukkan nama siswa"
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                Masukkan nama lengkap siswa
              </p>
            </div>
            
            {/* File Upload (Optional) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Jawaban (Opsional) - Maks {ctx?.userPlanLimits?.maxDocumentUpload || 1} file
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors"
                >
                  <div className="text-center">
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-1 text-sm text-gray-600">
                      Klik untuk mengunggah file
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF hingga 10MB
                    </p>
                  </div>
                </label>
              </div>
              
              {/* Selected Files */}
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="truncate">{file.name}</span>
                      <span className="text-xs text-gray-400">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !studentName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menambahkan...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Tambah Siswa
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
