// app/dashboard/autograde/components/FileUploader.js
'use client';

import React, { useState } from 'react';

/**
 * A basic file uploader component that replaces the more complex Dropzone.
 * Simplified to focus on core functionality without animations or complex UI.
 */
export default function FileUploader({ examId, username, answerType, submissionId }) {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [fileName, setFileName] = useState('');
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fileInput = form.querySelector('input[type="file"]');
    
    if (!fileInput.files.length) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }
    
    setIsUploading(true);
    setMessage(null);
    
    try {
      const formData = new FormData(form);
      
      const response = await fetch('/api/koreksi/upload-file', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      setMessage({ type: 'success', text: 'File uploaded successfully' });
      setFileName('');
      fileInput.value = '';
      
      // Reload the page to show new file
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="mt-4 border rounded p-4 bg-gray-50">
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="examId" value={examId} />
        <input type="hidden" name="username" value={username} />
        <input type="hidden" name="answerType" value={answerType} />
        {submissionId && (
          <input type="hidden" name="submissionId" value={submissionId} />
        )}
        
        <label className="block text-sm font-medium mb-2">Upload File</label>
        <input 
          type="file" 
          name="file" 
          onChange={handleFileChange}
          accept="image/*,application/pdf" 
          className="block w-full text-sm border rounded p-2 mb-2" 
          disabled={isUploading}
        />
        
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400"
          disabled={isUploading || !fileName}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      
      {message && (
        <div className={`mt-3 p-2 rounded ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}