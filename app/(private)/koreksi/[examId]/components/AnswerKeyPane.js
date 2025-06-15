// app/(private)/koreksi/[examId]/components/AnswerKeyPane.js
'use client';

import React, { useRef, useState } from 'react';
import { useResponsive, useResponsiveLayout } from '../hooks/useResponsive';
import FileCard from './FileCard';
import { Upload } from 'lucide-react';
import { showToast } from './ToastStack';
import { getUserPlanLimits } from '@/lib/subscription/planLimits';

/**
 * Defines the expected shape of a file object.
 * @typedef {object} FileData
 * @property {number | string} id - Unique identifier for the file.
 * @property {string} original_name - The original filename displayed to the user.
 * @property {string} storage_path - Path used for deletion or potentially fetching.
 * @property {string} [url] - Optional direct URL to the file if available.
 * @property {number} [size] - Optional file size in bytes.
 * @property {string} [uploaded_at] - Optional upload timestamp.
 */

/**
 * Props definition for the AnswerKeyPane component.
 * @param {object} props
 * @param {FileData[]} props.files - Array of file objects representing the answer keys. Defaults to an empty array.
 * @param {() => void} props.onUploadComplete - Callback function executed after a file upload finishes successfully.
 * @param {(id: number | string) => void} props.onDelete - Callback function to handle the deletion of a specific file by its ID.
 * @param {string} props.username - The username of the current user, often used for upload metadata.
 * @param {string} props.examId - The ID of the current exam, used for context in uploads/deletions.
 */
export default function AnswerKeyPane({
  files = [],
  onUploadComplete,
  onDelete,
  onPreview, // Add onPreview prop
  username,
  examId,
  userId, // Add userId prop
}) {
  const { isMobile, isTablet } = useResponsive();
  const { getContainerPadding } = useResponsiveLayout();
  const listRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFiles = async (filesToUpload) => {
    if (filesToUpload.length > 0 && !isUploading) {
      // Check file upload limit
      if (userId) {
        const { maxDocumentUpload } = await getUserPlanLimits(userId);
        const currentCount = files?.length || 0;
        const totalFiles = currentCount + filesToUpload.length;
        
        if (totalFiles > maxDocumentUpload) {
          showToast(`Maksimal ${maxDocumentUpload} file kunci jawaban. Anda sudah memiliki ${currentCount} file.`, 'error');
          return;
        }
      }
      
      setIsUploading(true);
      const formData = new FormData();
      
      // Add metadata
      formData.append('examId', examId);
      formData.append('username', username);
      formData.append('answerType', 'correct');
      formData.append('userId', userId);
      
      // Add all files
      Array.from(filesToUpload).forEach(file => {
        formData.append('files', file);
      });
      
      try {
        const response = await fetch('/api/koreksi/answer-files', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          if (onUploadComplete) {
            await onUploadComplete();
          }
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
  };

  const handleDragOver = (e) => {
    if (!isMobile) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    if (!isMobile) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    if (!isMobile) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      const files = e.dataTransfer.files;
      handleFiles(files);
    }
  };
  
  return (
    <div
      className="h-full w-full flex flex-col bg-white dark:bg-gray-800"
      role="region"
      aria-label="Answer Key Panel"
    >
      {/* Content Area */}
      <div className={`flex-1 min-h-0 overflow-y-auto ${isMobile ? 'p-4' : 'p-6'}`}>
        {files.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-lg">
              {/* Icon Container */}
              <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
                <div className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'} bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mx-auto shadow-md`}>
                  <Upload className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} text-gray-400`} />
                </div>
              </div>
              
              {/* Text Content */}
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-2`}>
                Belum Ada Kunci Jawaban
              </h3>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 px-4`}>
                {isMobile ? 'Tap tombol Unggah di atas' : 'Unggah file kunci jawaban untuk memulai proses penilaian otomatis'}
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={listRef}
            className={`grid grid-cols-${isMobile ? '2' : '1 sm:grid-cols-2 lg:grid-cols-3'} gap-${isMobile ? '3' : '4'}`}
            role="list"
            aria-label="Answer key files"
          >
            {files.map((file, index) => (
              <div
                key={file.id}
                role="listitem"
                tabIndex={0}
                aria-posinset={index + 1}
                aria-setsize={files.length}
              >
                <FileCard
                  file={file}
                  onDelete={() => onDelete(file.id)}
                  onPreview={() => onPreview(file)}
                  viewMode="grid"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
