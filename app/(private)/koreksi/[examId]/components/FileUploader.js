// app/dashboard/autograde/[examId]/components/FileUploader.js
'use client';

import React, { useState } from 'react';
import { UploadCloud, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function FileUploader({ 
  submissionId, 
  examId, 
  userId, 
  onSuccess,
  className = ""
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [files, setFiles] = useState([]);

  const handleFileChange = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setError(null);
    setSuccess(null);
    setIsUploading(true);
    setFiles(Array.from(selectedFiles));

    try {
      // Create FormData
      const formData = new FormData();
      
      // Add metadata
      formData.append('examId', examId);
      formData.append('submissionId', submissionId);
      formData.append('userId', userId);
      
      // Add all files
      Array.from(selectedFiles).forEach(file => {
        formData.append('files', file);
      });
      
      // Send to student files API - this will save to kn_student_submission_files table
      const response = await fetch(`/api/koreksi/student-files?submissionId=${submissionId}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload files');
      }
      
      setSuccess(`Successfully uploaded ${selectedFiles.length} files`);
      
      if (onSuccess) {
        onSuccess(data.files);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Error uploading files');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`p-4 border-2 border-dashed rounded-lg text-center transition-colors ${
        isUploading ? "opacity-60 cursor-not-allowed" : "hover:border-red-400 dark:hover:border-red-500"
      }`}>
        <label className="cursor-pointer block">
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-2 py-4">
            {isUploading ? (
              <Loader2 className="animate-spin text-red-600 dark:text-red-500 h-8 w-8" />
            ) : (
              <UploadCloud className="text-gray-400 dark:text-gray-500 h-8 w-8" />
            )}
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload Answer Files
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isUploading ? "Uploading..." : "Click to choose files"}
            </p>
          </div>
        </label>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-md flex items-start text-xs gap-1.5">
          <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200 rounded-md flex items-center text-xs gap-1.5">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {files.length} files:
          </p>
          <ul className="list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto">
            {files.map((file, index) => (
              <li key={index} className="text-xs text-gray-500 dark:text-gray-400 truncate" title={file.name}>
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}