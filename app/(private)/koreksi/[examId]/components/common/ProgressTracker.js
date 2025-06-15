// app/dashboard/autograde/[examId]/components/common/ProgressTracker.js
'use client';

import React from 'react';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Sparkles, X } from 'lucide-react';

export default function ProgressTracker({ 
  items = [], 
  title = 'Processing Items',
  onClose,
  isComplete = false
}) {
  // Calculate estimated time remaining
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = React.useState(null);
  const [startTime] = React.useState(Date.now());
  
  React.useEffect(() => {
    // Update estimated time remaining every second
    const timer = setInterval(() => {
      if (isComplete || items.length === 0) {
        setEstimatedTimeRemaining(null);
        return;
      }
      
      const completedItems = items.filter(item => item.status !== 'pending').length;
      const pendingItems = items.length - completedItems;
      
      if (completedItems === 0 || pendingItems === 0) {
        setEstimatedTimeRemaining('Calculating...');
        return;
      }
      
      const elapsedMs = Date.now() - startTime;
      const msPerItem = elapsedMs / completedItems;
      const remainingMs = msPerItem * pendingItems;
      
      // Format the remaining time
      if (remainingMs < 60000) {
        setEstimatedTimeRemaining(`~${Math.ceil(remainingMs / 1000)} seconds`);
      } else {
        setEstimatedTimeRemaining(`~${Math.ceil(remainingMs / 60000)} minutes`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [items, isComplete, startTime]);
  const totalItems = items.length;
  const completedItems = items.filter(item => item.status !== 'pending').length;
  const successItems = items.filter(item => item.status === 'success').length;
  const failedItems = items.filter(item => item.status === 'error').length;
  const pendingItems = items.filter(item => item.status === 'pending').length;
  
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  // Animation CSS
  const animationStyles = `
    @keyframes progressFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    @keyframes progressSlideUp {
      from {
        transform: translateY(20px) scale(0.95);
        opacity: 0;
      }
      to {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }
    
    @keyframes progressPulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    
    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(200%);
      }
    }
    
    .progress-backdrop {
      animation: progressFadeIn 0.3s ease-out;
    }
    
    .progress-modal {
      animation: progressSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    .progress-pulse {
      animation: progressPulse 2s ease-in-out infinite;
    }
    
    .progress-shimmer {
      animation: shimmer 2s linear infinite;
    }
  `;
  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] progress-backdrop"
      >
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col border border-gray-200/20 dark:border-gray-700/20 progress-modal relative overflow-hidden"
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Header with magic icon when processing */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {!isComplete && pendingItems > 0 && (
                  <div className="relative">
                    <Sparkles className="h-5 w-5 text-blue-500 progress-pulse" />
                    <div className="absolute inset-0 bg-blue-400 blur-xl opacity-50 progress-pulse"></div>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              </div>
              {isComplete && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            
            {/* Enhanced Progress bar */}
            <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${
                  isComplete ? (
                    failedItems > 0 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                      : 'bg-gradient-to-r from-green-400 to-green-500'
                  ) : 'bg-gradient-to-r from-blue-400 to-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              >
                {/* Animated shine effect */}
                <div 
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent progress-shimmer"
                  style={{ filter: 'blur(8px)' }}
                ></div>
              </div>
            </div>
            
            {/* Progress stats */}
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {completedItems} of {totalItems} completed
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {progress}%
              </span>
            </div>
            
            {/* Estimated time remaining */}
            {!isComplete && estimatedTimeRemaining && (
              <div className="flex justify-end mb-4 text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {pendingItems > 0 ? `Estimated time remaining: ${estimatedTimeRemaining}` : 'Finishing up...'}
                </span>
              </div>
            )}
            
            {/* Summary stats cards */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl text-center backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50">
                <div className="flex justify-center mb-1">
                  <Loader2 className={`h-5 w-5 ${pendingItems > 0 ? 'text-blue-500 animate-spin' : 'text-gray-400'}`} />
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pendingItems}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-center backdrop-blur-sm border border-green-200/50 dark:border-green-800/50">
                <div className="flex justify-center mb-1">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{successItems}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Success</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-center backdrop-blur-sm border border-red-200/50 dark:border-red-800/50">
                <div className="flex justify-center mb-1">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{failedItems}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Failed</div>
              </div>
            </div>
            
            {/* Items list with better styling */}
            <div className="overflow-y-auto flex-1 bg-gray-50/50 dark:bg-gray-700/20 rounded-xl p-3 backdrop-blur-sm max-h-[300px] border border-gray-200/50 dark:border-gray-600/50">
              {items.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-300" />
                  <p>Preparing to process items...</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.map((item, index) => (
                    <li 
                      key={index}
                      className={`flex items-center p-3 rounded-lg bg-white/80 dark:bg-gray-700/40 border backdrop-blur-sm transition-all duration-300 ${
                        item.status === 'pending' 
                          ? 'border-gray-200 dark:border-gray-600' 
                          : item.status === 'success'
                          ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                          : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                      }`}
                      style={{
                        animationName: item.status !== 'pending' ? 'progressSlideUp' : undefined,
                        animationDuration: item.status !== 'pending' ? '0.3s' : undefined,
                        animationTimingFunction: item.status !== 'pending' ? 'ease-out' : undefined,
                        animationDelay: item.status !== 'pending' ? `${index * 50}ms` : undefined,
                        animationFillMode: item.status !== 'pending' ? 'both' : undefined
                      }}
                    >
                      {item.status === 'pending' && (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin mr-3 flex-shrink-0" />
                      )}
                      {item.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      )}
                      {item.status === 'error' && (
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-3 flex-shrink-0" />
                      )}
                      
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.name}
                        </p>
                        {item.message && (
                          <p className={`text-xs mt-0.5 truncate ${
                            item.status === 'error' 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {item.message}
                          </p>
                        )}
                      </div>
                      
                      {item.score !== undefined && (
                        <span className={`text-sm font-semibold ml-3 px-2 py-0.5 rounded-md ${
                          item.score >= 80 ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30' :
                          item.score >= 60 ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30' :
                          'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {item.score}%
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}