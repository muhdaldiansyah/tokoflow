// app/dashboard/autograde/[examId]/components/WorkspaceHeader.js
'use client';

import React from 'react';
import { User, UserPlus } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';
import TooltipProvider from './Tooltip/TooltipProvider';

export default function WorkspaceHeader({ ctx }) {
  const { isMobile } = useResponsive();
  
  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-green-600 dark:text-green-400`} />
          <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white`}>
            {isMobile ? 'Siswa' : 'Detail Siswa'}
          </h2>
        </div>
        
        <div className="flex items-center gap-1">
          <TooltipProvider text="Tambah siswa baru" position="bottom">
            <button
              onClick={() => ctx?.setActiveWorkspace('addStudent')}
              className={`inline-flex items-center gap-2 ${isMobile ? 'px-3 py-2' : 'px-3 py-1.5'} rounded-md ${isMobile ? 'text-sm' : 'text-sm'} font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 touch-manipulation`}
              aria-label="Add student"
            >
              <UserPlus size={isMobile ? 14 : 16} />
              <span>{isMobile ? 'Tambah' : 'Tambah Siswa'}</span>
            </button>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
