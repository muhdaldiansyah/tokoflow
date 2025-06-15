// app/dashboard/autograde/[examId]/components/modals/EditSubmissionModal.js
'use client';

import React from 'react';
import { X, Save, UserSquare } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

export default function EditSubmissionModal({ 
  isOpen, 
  onClose, 
  studentName, 
  onUpdate,
  setStudentName,
  isUpdating,
  error
}) {
  const { isMobile } = useResponsive();
  
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    // Only close if clicked directly on the overlay, not on child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" 
      onClick={handleOverlayClick}
    >
      <div className={`relative bg-white ${isMobile ? 'rounded-lg' : 'rounded-xl'} max-w-md w-full shadow-2xl border border-gray-200 animate-scale-in`}>
        <div className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-6'} border-b border-gray-100`}>
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 flex items-center gap-2`}>
            <UserSquare className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
            {isMobile ? 'Edit Siswa' : 'Edit Student Name'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
            title="Close"
          >
            <X className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={`${isMobile ? 'p-4' : 'p-6'}`}>
          {error && (
            <div className={`${isMobile ? 'mb-3 p-3' : 'mb-4 p-4'} bg-red-50 border border-red-200 text-red-700 rounded-lg ${isMobile ? 'text-xs' : 'text-sm'} flex items-center gap-2`}>
              <svg className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label htmlFor="student-name" className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              {isMobile ? 'Nama Siswa' : 'Student Name'}
            </label>
            <input
              id="student-name"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-base`}
              placeholder={isMobile ? 'Masukkan nama siswa' : 'Enter student name'}
              autoFocus
              required
              style={{ fontSize: isMobile ? '16px' : '14px' }}
            />
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mt-1`}>
              {isMobile ? 'Masukkan nama lengkap siswa' : 'Enter the full name of the student'}
            </p>
          </div>
          
          <div className={`${isMobile ? 'mt-6' : 'mt-8'} flex ${isMobile ? 'flex-col-reverse' : 'justify-end'} gap-3`}>
            <button
              type="button"
              onClick={onClose}
              className={`${isMobile ? 'w-full' : ''} px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors touch-manipulation`}
            >
              {isMobile ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isUpdating || !studentName.trim()}
              className={`${isMobile ? 'w-full' : ''} px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors touch-manipulation`}
            >
              {isUpdating ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>{isMobile ? 'Menyimpan...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isMobile ? 'Simpan' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
