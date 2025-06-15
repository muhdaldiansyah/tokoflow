// app/(private)/koreksi/[examId]/components/Breadcrumb.js
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, FileText, Users, Key, LayoutDashboard } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';

/**
 * Enhanced Breadcrumb component with workspace navigation
 * 
 * @param {Object} props Component props
 * @param {string} props.examTitle The title of the current exam
 * @param {string} props.activeWorkspace Current active workspace
 * @param {Function} props.onSectionChange Function to change workspace
 */
export default function EnhancedBreadcrumb({ examTitle, activeWorkspace, onSectionChange }) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  
  // Workspace tabs
  const workspaceTabs = [
    { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'student', label: 'Siswa', icon: Users },
    { id: 'answer', label: 'Kunci Jawaban', icon: Key },
  ];
  
  return (
    <div className="space-y-3">
      {/* Breadcrumb Navigation */}
      <nav 
        aria-label="Breadcrumb" 
        className="flex items-center text-sm text-gray-500"
      >
        <button 
          onClick={() => router.push('/koreksi')}
          className="text-gray-500 hover:text-gray-700 transition-colors font-medium"
        >
          Tugas
        </button>
        
        <ChevronRight size={16} className="mx-2 text-gray-400" />
        
        <span className="font-semibold text-gray-900 truncate max-w-xs">
          {examTitle || 'Memuat...'}
        </span>
      </nav>
      
      {/* Workspace Tabs - Desktop only */}
      {!isMobile && (
        <div className="flex items-center gap-1">
          {workspaceTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeWorkspace === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onSectionChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
