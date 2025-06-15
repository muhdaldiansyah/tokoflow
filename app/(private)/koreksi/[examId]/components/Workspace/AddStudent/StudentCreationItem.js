// app/dashboard/autograde/[examId]/components/Workspace/AddStudent/StudentCreationItem.js
'use client';

import React from 'react';
import { X, Upload, Trash2 } from 'lucide-react';

export default function StudentCreationItem({ 
  student, 
  index, 
  onUpdate, 
  onRemove, 
  isOnly,
  isMobile 
}) {
  return (
    <div className={`border border-gray-100 dark:border-gray-700 rounded-lg ${isMobile ? 'p-3' : 'p-4'} bg-white dark:bg-gray-800/30 transition-all`}>
      
      <div className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
        {/* Row 1: Name only */}
        <div>
          <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-600 dark:text-gray-300 mb-1`}>
            Nama Siswa
          </label>
          <input
            type="text"
            value={student.name}
            onChange={(e) => onUpdate(index, { ...student, name: e.target.value })}
            className={`w-full px-3 ${isMobile ? 'py-2.5' : 'py-2'} border border-gray-200 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all ${isMobile ? 'text-base' : 'text-sm'}`}
            placeholder="Masukkan nama siswa"
            style={{ fontSize: isMobile ? '16px' : '14px' }}
          />
        </div>
        
        {/* Row 2: File Upload Section */}
        <div>
          <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-600 dark:text-gray-300 mb-2`}>
            File Jawaban {isMobile && <span className="text-xs font-normal">(Opsional)</span>}
          </label>
          
          {student.files?.length > 0 && (
            <div className={`${isMobile ? 'mb-3' : 'mb-4'} space-y-2`}>
              {student.files.map((file, fileIndex) => (
                <div key={fileIndex} className={`flex items-center justify-between ${isMobile ? 'p-2' : 'p-2'} bg-white dark:bg-gray-700/20 rounded-md border border-gray-100 dark:border-gray-600/30 transition-colors`}>
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-700 dark:text-gray-300 truncate flex-1 mr-2`}>
                    {file.name}
                  </span>
                  <button
                    onClick={() => {
                      const newFiles = student.files.filter((_, idx) => idx !== fileIndex);
                      onUpdate(index, { ...student, files: newFiles });
                    }}
                    className={`${isMobile ? 'ml-2' : 'ml-4'} p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors`}
                  >
                    <Trash2 size={isMobile ? 14 : 16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className={`border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg ${isMobile ? 'p-4' : 'p-6'} bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300 dark:hover:border-gray-500 transition-all`}>
            <input
              type="file"
              id={`file-upload-${index}`}
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const newFiles = Array.from(e.target.files);
                const currentFiles = student.files || [];
                onUpdate(index, { ...student, files: [...currentFiles, ...newFiles] });
              }}
            />
            <label
              htmlFor={`file-upload-${index}`}
              className="flex flex-col items-center justify-center cursor-pointer text-gray-500 dark:text-gray-400 group"
            >
              <Upload size={isMobile ? 18 : 20} className="mb-2 text-gray-400 group-hover:text-gray-500 transition-colors" />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 group-hover:text-gray-600 transition-colors`}>
                {isMobile ? 'Tap untuk unggah' : 'Klik untuk mengunggah file'}
              </span>
              <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 dark:text-gray-500 mt-1`}>
                {isMobile ? 'Bisa beberapa file' : 'Dapat mengunggah beberapa file'}
              </span>
            </label>
          </div>
        </div>
        

      </div>
    </div>
  );
}
