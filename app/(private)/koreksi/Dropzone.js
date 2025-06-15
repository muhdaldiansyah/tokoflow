// app/dashboard/autograde/Dropzone.js

"use client";

import React, { useState, useRef } from "react";

const DEFAULT_ACCEPTED_FILES = ['image/*', 'application/pdf'];

/**
 * @typedef {Object} DropzoneProps
 * @property {string} title
 * @property {'correct' | 'student'} answerType
 * @property {string} username
 * @property {string} examId
 * @property {string} [submissionId]
 * @property {string} [userId]
 * @property {() => void} [onUploadComplete]
 * @property {string} [className]
 */

/**
 * Dropzone component with Apple HIG design principles
 * @param {DropzoneProps} props
 */
export default function Dropzone({
  title,
  answerType,
  username,
  examId,
  submissionId,
  userId,
  onUploadComplete,
  className = ""
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    await uploadFiles(files);
  };

  const uploadFiles = async (files) => {
    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("username", username);
        formData.append("answerType", answerType);
        formData.append("examId", examId);

        if (answerType === "student" && submissionId) {
          formData.append("submissionId", submissionId);
        }
        
        if (userId) {
          formData.append("userId", userId);
        }

        const response = await fetch("/api/koreksi/upload-file", {
          method: "POST",
          body: formData,
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || `Failed to upload ${file.name}`);
        }

        return { name: file.name, size: file.size };
      });

      const successfulUploads = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...successfulUploads]);
      setSuccess(`Successfully uploaded ${successfulUploads.length} file${successfulUploads.length > 1 ? 's' : ''}`);
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err) {
      setError(err.message || "An error occurred while uploading files");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
            : isUploading 
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 cursor-pointer'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <label className={`block p-8 ${isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={DEFAULT_ACCEPTED_FILES.join(',')}
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            {/* Icon */}
            <div className={`p-4 rounded-full transition-all ${
              isDragging 
                ? 'bg-blue-100' 
                : 'bg-gray-100'
            }`}>
              {isUploading ? (
                <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : (
                <svg className={`w-8 h-8 transition-colors ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
            </div>
            
            {/* Text */}
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 mb-1">
                {isUploading ? 'Uploading...' : title}
              </p>
              <p className="text-sm text-gray-600">
                {isDragging 
                  ? 'Drop files here' 
                  : isUploading 
                    ? `Processing ${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''}...`
                    : 'Drag & drop files here, or click to browse'
                }
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Supports: JPG, PNG, PDF up to 10MB each
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-slide-down">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Upload failed</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && !error && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 animate-slide-down">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">{success}</p>
            <p className="text-xs text-green-600 mt-0.5">Files are ready for grading</p>
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && !error && (
        <div className="mt-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Uploaded files ({uploadedFiles.length})
            </p>
            <button
              onClick={() => setUploadedFiles([])}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear list
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-gray-700 truncate" title={file.name}>
                    {file.name}
                  </span>
                </div>
                {file.size && (
                  <span className="text-xs text-gray-500 ml-2">
                    {formatFileSize(file.size)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
