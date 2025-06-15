// app/(private)/koreksi/[examId]/ExamDetailsClient.js
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useResponsive, useResponsiveLayout } from './hooks/useResponsive';
import useExamDetails from './useExamDetails';

import Workspace from './components/Workspace';
import ToastStack from './components/ToastStack';

export default function ExamDetailsClient() {
  const { examId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [activeWorkspace, setActiveWorkspace] = React.useState('student');
  
  const ctx = useExamDetails({
    examId,
    initialExam: null,
    initialProfile: null,
    userId: user?.id,
    setActiveWorkspace: setActiveWorkspace,
  });
  
  // Loading State
  if (ctx.isLoadingExam) {
    return (
      <div className="flex-1 flex flex-col h-screen h-[100dvh]">
        <div className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 animate-pulse">
          <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-gray-200 rounded-md w-20 sm:w-24 flex-shrink-0"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-4 sm:p-6 bg-gray-50 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 animate-pulse">
                  <div className="h-8 w-8 bg-gray-200 rounded-lg mb-3 sm:mb-4"></div>
                  <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error State
  if (ctx.pageError) {
    return (
      <div className="flex-1 flex flex-col h-screen h-[100dvh]">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="text-center max-w-md animate-fade-in w-full">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 px-4">
              {ctx.pageError || 'An unexpected error occurred while loading the exam details.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2 touch-manipulation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
              <button
                onClick={() => router.push('/koreksi')}
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors touch-manipulation"
              >
                Back to Exams
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Main Content
  return (
    <div className="flex flex-col h-screen h-[100dvh] bg-gray-50">
      {/* Main Workspace - Full height without header */}
      <div className="flex-1 overflow-hidden">
        <Workspace 
          ctx={ctx} 
          activeWorkspace={activeWorkspace} 
          setActiveWorkspace={setActiveWorkspace} 
        />
      </div>
      
      {/* Toast Notifications */}
      <ToastStack />
    </div>
  );
}
