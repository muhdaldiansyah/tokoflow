// app/dashboard/autograde/components/Breadcrumb.js
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Breadcrumb component for autograde dashboard
 */
export default function Breadcrumb({ currentPage = 'Koreksi', examTitle = null }) {
  const router = useRouter();
  
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-500 dark:text-gray-400">
   
      {examTitle ? (
        <>
          <Link
            href="/koreksi"
            className="hover:text-gray-900 dark:hover:text-white hover:underline transition-colors truncate max-w-[150px]"
          >
            Koreksi
          </Link>
          
          <ChevronRight size={14} className="mx-1" />
          
          <span className="font-medium text-indigo-600 dark:text-indigo-400 truncate max-w-[200px]">
            {examTitle}
          </span>
        </>
      ) : (
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {currentPage}
        </span>
      )}
    </nav>
  );
}
