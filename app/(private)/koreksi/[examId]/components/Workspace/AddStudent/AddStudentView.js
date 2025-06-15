// app/dashboard/autograde/[examId]/components/Workspace/AddStudent/AddStudentView.js
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, Loader2, UserPlus } from 'lucide-react';
import StudentCreationItem from './StudentCreationItem';
import { useResponsive, useResponsiveLayout } from '../../../hooks/useResponsive';
import { useAuth } from '@/app/context/AuthContext';

export default function AddStudentView({ ctx, onStudentCreated, setActiveWorkspace }) {
  const { isMobile } = useResponsive();
  const { getContainerPadding } = useResponsiveLayout();
  const { user } = useAuth(); // Get user from auth context
  
  const [studentsToCreate, setStudentsToCreate] = useState([
    { id: 'temp-1', name: '', files: [] }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  
  useEffect(() => {
    // Reset when exam changes
    if (ctx.exam) {
      setResults(null);
      setError(null);
    }
  }, [ctx.exam]);
  
  const addStudent = () => {
    const newStudent = {
      id: `temp-${Date.now()}`,
      name: '',
      files: []
    };
    
    setStudentsToCreate([...studentsToCreate, newStudent]);
  };
  
  const removeStudent = (index) => {
    if (studentsToCreate.length > 1) {
      const newStudents = studentsToCreate.filter((_, i) => i !== index);
      setStudentsToCreate(newStudents);
    }
  };
  
  const updateStudent = (index, updatedStudent) => {
    const newStudents = [...studentsToCreate];
    newStudents[index] = updatedStudent;
    setStudentsToCreate(newStudents);
  };
  
  const validateForm = () => {
    const student = studentsToCreate[0];
    if (!student.name.trim()) {
      setError('Nama siswa harus diisi');
      return false;
    }
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    setResults(null);
    
    try {
      const formData = new FormData();
      formData.append('examId', ctx.exam.id);
      
      // Add userId to formData - get it from auth context
      console.log('User from auth context:', user); // Debug log
      if (user?.id) {
        console.log('Adding userId to form data:', user.id); // Debug log
        formData.append('userId', user.id);
      } else {
        console.error('No user ID found in auth context'); // Debug log
      }
      
      // Prepare students data (without files)
      const studentsData = studentsToCreate.map(({ files, ...student }) => student);
      formData.append('students', JSON.stringify(studentsData));
      
      // Debug log to see all form data
      for (let [key, value] of formData.entries()) {
        console.log(`Form data - ${key}:`, value);
      }
      
      // Append files with reference to student
      studentsToCreate.forEach((student, studentIndex) => {
        if (student.files && student.files.length > 0) {
          student.files.forEach((file, fileIndex) => {
            formData.append(`student-${studentIndex}-file-${fileIndex}`, file);
          });
        }
      });
      
      console.log('Submitting form data:', {
        examId: ctx.exam.id,
        studentsData,
        hasFiles: studentsToCreate.some(s => s.files?.length > 0)
      }); // Debug log
      
      const response = await fetch('/api/koreksi/bulk-submissions', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      console.log('Server response:', result); // Debug log
      
      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat data siswa');
      }
      
      setResults(result.results);
      
      // Navigate to first successful student regardless of overall success flag
      const firstSuccessful = result.results?.find(r => r.success);
      if (firstSuccessful && firstSuccessful.submissionId) {
        console.log('Successfully created student, navigating to:', firstSuccessful.submissionId);
        
        // Reset form for next student
        setStudentsToCreate([
          { id: `temp-${Date.now()}`, name: '', files: [] }
        ]);
        setError(null);
        
        // Show success message
        setTimeout(() => {
          setResults(null);
        }, 3000);
        
        // Fetch the updated student submissions to ensure we have the latest data
        await ctx.fetchStudentSubmissionsAndGrades();
        
        // Do not switch views - stay on add student page for adding more students
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div 
      className="h-full flex flex-col overflow-hidden"
      role="article"
      aria-label="Tambah siswa"
    >
      <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-4' : 'p-6'}`}>
      <div className="max-w-2xl mx-auto w-full">
        {/* Header with Close Button */}
        <div className={`flex items-start justify-between ${isMobile ? 'mb-4' : 'mb-6'}`}>
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 dark:text-white flex items-center gap-2`}>
              <UserPlus size={isMobile ? 20 : 24} className="text-gray-900 dark:text-gray-400" />
              Tambah Siswa
            </h2>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 mt-1`}>
              Tambahkan siswa baru untuk ujian ini
            </p>
          </div>
          
        </div>
        
        {/* Error Message */}
        {error && (
          <div className={`${isMobile ? 'mb-3' : 'mb-4'} p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/20 text-red-600 dark:text-red-400 rounded-md ${isMobile ? 'text-xs' : 'text-sm'} flex items-center gap-2`}>
            <XCircle size={isMobile ? 14 : 16} className="flex-shrink-0" />
            {error}
          </div>
        )}
        
        {/* Students List */}
        <div className={`${isMobile ? 'space-y-3 mb-4' : 'space-y-4 mb-6'}`}>
          <StudentCreationItem
            key={studentsToCreate[0].id}
            student={studentsToCreate[0]}
            index={0}
            onUpdate={updateStudent}
            onRemove={removeStudent}
            isOnly={true}
            isMobile={isMobile}
          />
        </div>
        
        {/* Results */}
        {results && (
          <div className="mb-6 space-y-2">
            {results.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded-md border transition-all ${
                  result.success 
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/20 text-green-600 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/20 text-red-600 dark:text-red-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle size={16} />
                  ) : (
                    <XCircle size={16} />
                  )}
                  <span className="font-medium">{result.studentName}</span>
                </div>
                {result.success && result.fileUploadResults && result.fileUploadResults.length > 0 && (
                  <div className="mt-1 ml-6 text-sm">
                    {result.fileUploadResults.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <CheckCircle size={12} />
                        {file.originalName}
                      </div>
                    ))}
                  </div>
                )}
                {result.error && (
                  <div className="mt-1 ml-6 text-sm">{result.error}</div>
                )}
              </div>
            ))}
          </div>
        )}
        

        
        {/* Submit */}
        <div className={`flex items-center ${isMobile ? 'justify-center' : 'justify-end'} ${isMobile ? 'pt-3' : 'pt-4'} border-t border-gray-200 dark:border-gray-700`}>          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`${isMobile ? 'w-full' : ''} px-4 ${isMobile ? 'py-3' : 'py-2'} ${isMobile ? 'text-sm' : 'text-sm'} font-medium inline-flex items-center justify-center gap-2 text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Membuat Data Siswa...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Tambah Siswa
              </>
            )}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
