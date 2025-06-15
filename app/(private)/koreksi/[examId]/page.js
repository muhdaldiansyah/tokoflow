// app/autograde-client/[examId]/page.js
"use client";

import { Suspense } from 'react';
import ExamDetailsClient from './ExamDetailsClient';
import ProtectedPage from '../../../components/auth/ProtectedPage';

/**
 * Client Component for Exam Details page
 */
export default function ExamPage() {
  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={<div className="p-8 flex items-center justify-center">Loading exam details...</div>}>
          <ExamDetailsClient />
        </Suspense>
      </div>
    </ProtectedPage>
  );
}
