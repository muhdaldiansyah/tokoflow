// app/dashboard/autograde/[examId]/components/Workspace/index.js
'use client';

import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import MobileWorkspace from '../Mobile/MobileWorkspace';
import ExamHeader from '../ExamHeader';
import SubmissionList from './Student/SubmissionList';
import DetailView from './Student/DetailView';
import AnswerView from './Answer/AnswerView';
import EditView from './Edit/EditView';
import { HelpView } from '../Help';
import PreviewModal from '../modals/PreviewModal';
import EditSubmissionModal from '../modals/EditSubmissionModal';
import ModalRoot from '../common/ModalRoot';

export default function Workspace({ ctx, activeWorkspace, setActiveWorkspace }) {
  const { isMobile, isTablet } = useResponsive();
  
  let mainView;
  
  // Mobile Layout with bottom navigation
  if (isMobile) {
    mainView = (
      <>
        <div className="flex-1 overflow-hidden">
          <MobileWorkspace 
            ctx={ctx} 
            activeWorkspace={activeWorkspace} 
            setActiveWorkspace={setActiveWorkspace} 
          />
        </div>
        {/* Mobile Bottom Navigation */}
        <nav className="bg-white border-t border-gray-200 px-4 py-2 safe-area-bottom">
          <div className="flex justify-around items-center">
            <button
              onClick={() => setActiveWorkspace('student')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                activeWorkspace === 'student' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-xs">Siswa</span>
            </button>
            
            <button
              onClick={() => setActiveWorkspace('answer')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                activeWorkspace === 'answer' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs">Kunci</span>
            </button>
            
            <button
              onClick={() => setActiveWorkspace('editExam')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                activeWorkspace === 'editExam' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-xs">Edit</span>
            </button>
            
            <button
              onClick={() => setActiveWorkspace('help')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                activeWorkspace === 'help' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs">Bantuan</span>
            </button>
          </div>
        </nav>
      </>
    );
  } else {
    // Desktop Layout with Header
    const shouldShowSidebar = activeWorkspace === 'student';
    
    mainView = (
      <div className="h-full flex flex-col">
        {/* Exam Header with Navigation */}
        <ExamHeader 
          ctx={ctx} 
          activeWorkspace={activeWorkspace} 
          setActiveWorkspace={setActiveWorkspace} 
        />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {shouldShowSidebar ? (
            // Two-column layout for student views
            <div className="h-full bg-gray-50">
              <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="h-full flex gap-6">
                  {/* Sidebar - Student List */}
                  <div 
                    className="flex-shrink-0 h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col"
                    style={{
                      width: isTablet ? '320px' : '380px',
                    }}
                  >
                    <SubmissionList ctx={ctx} setActiveWorkspace={setActiveWorkspace} />
                  </div>
                  
                  {/* Main Content - Detail View */}
                  <div className="flex-1 flex flex-col min-w-0 h-full">
                    <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <DetailView ctx={ctx} activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Single column layout for other views
            <div className="h-full bg-gray-50">
              <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {activeWorkspace === 'answer' ? (
                    <AnswerView ctx={ctx} setActiveWorkspace={setActiveWorkspace} />
                  ) : activeWorkspace === 'editExam' ? (
                    <EditView ctx={ctx} />
                  ) : activeWorkspace === 'help' ? (
                    <HelpView ctx={ctx} />
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Main layout with modals
  return (
    <>  
      {mainView}
      
      {/* Global Modals */}
      <ModalRoot>
        {/* File Preview Modal */}
        {ctx.isPreviewOpen && (
          <PreviewModal
            key={ctx.previewFile?.id || 'preview-modal'}
            file={ctx.previewFile}
            onClose={() => ctx.setIsPreviewOpen(false)}
          />
        )}
        
        {/* Edit Student Modal */}
        <EditSubmissionModal
          isOpen={ctx.isEditSubmissionModalOpen}
          onClose={() => ctx.setIsEditSubmissionModalOpen(false)}
          studentName={ctx.editStudentName}
          onUpdate={ctx.handleUpdateSubmission}
          setStudentName={ctx.setEditStudentName}
          isUpdating={ctx.isUpdatingSubmission}
          error={ctx.modalError}
        />
      </ModalRoot>
    </>
  );
}
