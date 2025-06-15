// app/dashboard/autograde/[examId]/components/modals/AnswerKeyModal.js
'use client';

import React from 'react';
import { X } from 'lucide-react';
import AnswerKeyPane from '../AnswerKeyPane';
import { useResponsive } from '../../hooks/useResponsive';

export default function AnswerKeyModal({
  isOpen,
  onClose,
  files = [],
  onUploadComplete,
  onDelete,
  username,
  examId,
}) {
  const { isMobile, isTablet } = useResponsive();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>
        
        {/* Modal panel */}
        <div 
          className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
          style={{ maxWidth: isMobile ? '95%' : isTablet ? '80%' : '800px' }}
        >
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white" id="modal-title">
                Kunci Jawaban
              </h3>
              <button
                type="button"
                className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="bg-white dark:bg-gray-800" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <div className="p-4">
              <AnswerKeyPane
                files={files}
                onUploadComplete={onUploadComplete}
                onDelete={onDelete}
                username={username}
                examId={examId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
