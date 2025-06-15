// app/dashboard/autograde/[examId]/components/Workspace/Student/SubmissionRow.js
'use client';

import React from 'react';
import formatters from '../../../utils/formatters';
import { AlertCircle, CheckCircle, Loader2, User, QrCode, Check, X } from 'lucide-react';
import { getStudentStatusColor } from '../../../utils/statistics';

export default function SubmissionRow({ submission, ctx, bulkMode, isSelected, onSelect, isQRUpload = false, onApprove, onReject }) {
  const gradeInfo = formatters.formatGradeWithColor(submission.grade);
  const statusInfo = getStudentStatusColor(submission);
  
  const getStatusIcon = () => {
    if (submission.isLoadingStatus || submission.isLoadingFiles) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
    }
    
    if (submission.grade !== null) {
      const color = submission.grade >= 80 ? 'text-green-600 dark:text-green-400' :
                    submission.grade >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400';
      return <CheckCircle className={`h-4 w-4 ${color}`} />;
    }
    
    if (submission.statusError || submission.filesError) {
      return (
        <AlertCircle 
          className="h-4 w-4 text-red-500" 
          title={submission.statusError || submission.filesError} 
        />
      );
    }
    
    return null;
  };
  
  return (
    <li className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div
        className={`w-full flex items-center px-3 py-3 sm:py-2 transition-colors min-h-[52px] sm:min-h-[48px] touch-manipulation
          ${ctx.selectedSubmission?.id === submission.id && !bulkMode
            ? 'bg-blue-50 dark:bg-gray-700/50' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 active:bg-gray-100'
          }`}
        style={{ touchAction: 'manipulation' }}
      >
      {/* Checkbox for bulk mode */}
      {bulkMode && (
        <div className="mr-3 flex-shrink-0" onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </div>
      )}
      <button
        onClick={() => {
          if (!bulkMode) {
            ctx.handleSelectSubmission(submission);
          }
        }}
        className="flex-1 min-w-0 flex items-start gap-2 text-left focus:outline-none"
      >
        <div className="flex items-center gap-2 mt-0.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusInfo.bgColor}`}></div>
          {isQRUpload || submission.upload_source === 'qr' ? (
            <QrCode className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
          ) : (
            <User className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate text-left">
            {submission.student_name}
          </p>
          {submission.class_name && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {submission.class_name}
            </p>
          )}
        </div>
      </button>
      
      <div className="ml-2 flex-shrink-0 flex items-center gap-2">
        {/* Show grade if exists */}
        {submission.grade !== null && submission.grade !== undefined && (
          <span className={`text-xs font-medium ${gradeInfo.className}`}>
            {gradeInfo.text}
          </span>
        )}
        
        {/* Show approval buttons only for pending QR uploads */}
        {(isQRUpload || submission.upload_source === 'qr') && submission.approval_status === 'pending' && !bulkMode && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprove(submission.id);
              }}
              className="p-1 rounded-md bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
              title="Approve"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject(submission.id);
              }}
              className="p-1 rounded-md bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
              title="Reject"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        
        {/* Show rejected status only for rejected submissions without grade */}
        {submission.approval_status === 'rejected' && !submission.grade && (
          <span className="text-xs text-red-600 font-medium">Rejected</span>
        )}
        
        {/* Show grading status icon */}
        {getStatusIcon()}
      </div>
    </div>
    </li>
  );
}
