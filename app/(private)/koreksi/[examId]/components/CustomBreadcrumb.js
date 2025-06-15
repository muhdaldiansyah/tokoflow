// app/dashboard/autograde/[examId]/components/CustomBreadcrumb.js
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Breadcrumb component for exam detail page
 */
export default function CustomBreadcrumb({ examTitle, activeWorkspace }) {
  // Get readable name for current workspace
  const getWorkspaceName = (workspace) => {
    switch(workspace) {
      case 'dashboard': return 'Overview';
      case 'student': return 'Students';
      case 'answer': return 'Answer Keys';
      case 'help': return 'Help';
      case 'editExam': return 'Edit Exam';
      case 'addStudent': return 'Add Student';
      default: return workspace;
    }
  };
  
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-4">
    
      <Link
        href="/dashboard/autograde"
        className="hover:text-gray-900 dark:hover:text-white hover:underline transition-colors"
      >
        Autograde
      </Link>
      
      <ChevronRight size={14} className="mx-1" />
      
      <span className="font-medium text-gray-700 dark:text-gray-300 truncate" style={{ maxWidth: '150px' }}>
        {examTitle || 'Exam'}
      </span>
      
      {activeWorkspace !== 'dashboard' && (
        <>
          <ChevronRight size={14} className="mx-1" />
          <span className="text-indigo-600 dark:text-indigo-400">
            {getWorkspaceName(activeWorkspace)}
          </span>
        </>
      )}
    </nav>
  );
}
