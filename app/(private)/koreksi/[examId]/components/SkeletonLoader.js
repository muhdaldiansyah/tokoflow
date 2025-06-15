// app/dashboard/autograde/[examId]/components/SkeletonLoader.js
'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Simple skeleton loader
 */
export default function SkeletonLoader({ type = 'default', text = 'Memuat...' }) {
  switch (type) {
    case 'page':
      return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="m-auto text-center">
            <Loader2 className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto animate-spin" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">{text}</p>
          </div>
        </div>
      );
    case 'list':
      return (
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      );
    case 'files':
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
            </div>
          ))}
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-500">{text}</span>
        </div>
      );
  }
}
