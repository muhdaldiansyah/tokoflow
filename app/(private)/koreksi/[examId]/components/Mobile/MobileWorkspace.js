// app/dashboard/autograde/[examId]/components/Mobile/MobileWorkspace.js
'use client';

import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { HelpView } from '../Help';
import WorkspaceHeader from '../WorkspaceHeader';
import DetailView from '../Workspace/Student/DetailView';
import AnswerView from '../Workspace/Answer/AnswerView';
import EditView from '../Workspace/Edit/EditView';
import AddStudentView from '../Workspace/AddStudent/AddStudentView';
import SubmissionList from '../Workspace/Student/SubmissionList';

export default function MobileWorkspace({ ctx, activeWorkspace, setActiveWorkspace }) {
  const { isMobile } = useResponsive();
  const renderContent = () => {
    switch (activeWorkspace) {
      case 'student':
        // For student view, show list on mobile and detail if student is selected
        if (ctx.selectedSubmission) {
          return <DetailView ctx={ctx} />;
        } else {
          return <SubmissionList ctx={ctx} setActiveWorkspace={setActiveWorkspace} />;
        }
      case 'answer':
        return <AnswerView ctx={ctx} />;
      case 'editExam':
        return <EditView ctx={ctx} />;
      case 'addStudent':
        return (
          <AddStudentView 
            ctx={ctx} 
            onStudentCreated={(submissionId) => {
              ctx.fetchStudentSubmissionsAndGrades().then(() => {
                const student = ctx.studentSubmissions.find(s => s.id === submissionId);
                if (student) {
                  ctx.handleSelectSubmission(student);
                  setActiveWorkspace('student');
                }
              });
            }}
          />
        );
      case 'help':
        return <HelpView ctx={ctx} />;
      default:
        // Default to student view with overview in empty state
        return <SubmissionList ctx={ctx} setActiveWorkspace={setActiveWorkspace} />;
    }
  };
  
  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
      {renderContent()}
    </div>
  );
}
