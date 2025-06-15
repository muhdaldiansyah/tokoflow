// app/dashboard/autograde/[examId]/components/FileCard.js
'use client';

import React from 'react';
import formatters from '../utils/formatters';
import SupabaseImage from '../../SupabaseImage';

/**
 * @param {{
 *   file: { id: number; original_name: string; storage_path: string; url?: string };
 *   onDelete: () => void;
 *   onPreview?: (file: any) => void;
 *   viewMode?: 'grid' | 'list';
 * }} props
 */
export default function FileCard({ file, onDelete, onPreview, viewMode = 'grid' }) {
  const formatFileSize = (size) => {
    if (!size) return null;
    return formatters.formatFileSize(size);
  };
  
  const handlePreviewClick = () => {
    if (onPreview) {
      onPreview(file);
    }
  };
  
  if (viewMode === 'list') {
    return (
      <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-all group">
        {/* Thumbnail */}
        <div className="w-12 h-12 mr-3 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          <SupabaseImage
            path={file.storage_path}
            alt={file.original_name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.original_name}
          </p>
          {file.size && (
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviewClick}
              className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-all"
              aria-label="Preview file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-100 hover:border-rose-300 transition-all"
              aria-label="Delete file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
      {/* Image preview */}
      <div
        className="relative aspect-[4/3] w-full bg-gray-50 overflow-hidden cursor-pointer"
        onClick={handlePreviewClick}
      >
        <SupabaseImage
          path={file.storage_path}
          alt={file.original_name}
          className="w-full h-full object-contain p-4"
        />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePreviewClick();
              }}
              className="w-12 h-12 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-100 hover:border-indigo-300 transition-all shadow-md"
              title="Preview file"
              aria-label="Preview file">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* File info */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate" title={file.original_name}>
              {file.original_name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {file.uploaded_at && formatters.formatRelativeTime(file.uploaded_at)}
              {file.size && ` • ${formatFileSize(file.size)}`}
            </p>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onDelete}
              className="p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-100 hover:border-rose-300 transition-all"
              aria-label="Delete file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}