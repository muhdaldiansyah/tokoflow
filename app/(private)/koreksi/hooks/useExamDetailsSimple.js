// app/dashboard/autograde/hooks/useExamDetails.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../lib/database/supabase/client';

/**
 * A streamlined exam details hook without animations, complex state, and extra features
 */
export default function useExamDetails({ examId, userId }) {
  const supabase = createClient();
  
  // Basic state
  const [exam, setExam] = useState(null);
  const [correctAnswerFiles, setCorrectAnswerFiles] = useState([]);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState(null);
  
  // Username extraction 
  const username = userId?.split('-')[0] || 'anonymous_user';

  // Fetch exam details
  const fetchExamDetails = useCallback(async () => {
    if (!examId || !userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Fetch exam basics
      const { data: examData, error: examError } = await supabase
        .from("kn_exams")
        .select("id, title, created_at")
        .eq("id", examId)
        .single();
      
      if (examError) throw examError;
      setExam(examData);
      
      // 2. Fetch answer files
      const { data: correctFiles, error: filesError } = await supabase
        .from("kn_correct_answer_files")
        .select("id, filename, storage_path, original_name")
        .eq("exam_id", examId);
      
      if (filesError) throw filesError;
      
      // Add URLs to files
      const filesWithUrls = await Promise.all((correctFiles || []).map(async (file) => {
        const { data: urlData } = await supabase.storage.from('autograde').getPublicUrl(file.storage_path);
        return { ...file, url: urlData?.publicUrl };
      }));
      
      setCorrectAnswerFiles(filesWithUrls);
      
      // 3. Fetch student submissions
      const { data: submissions, error: submissionError } = await supabase
        .from("kn_student_submissions")
        .select("id, student_name, class_name, exam_date, created_at")
        .eq("exam_id", examId);
      
      if (submissionError) throw submissionError;
      
      // 4. Fetch grading results for all submissions
      const submissionIds = (submissions || []).map(s => s.id);
      let gradesMap = new Map();
      
      if (submissionIds.length > 0) {
        const { data: gradesData } = await supabase
          .from('kn_grading_sessions')
          .select('student_submission_id, final_score')
          .in('student_submission_id', submissionIds)
          .order('created_at', { ascending: false });
        
        if (gradesData) {
          gradesData.forEach(g => {
            if (g.student_submission_id && !gradesMap.has(g.student_submission_id)) {
              gradesMap.set(g.student_submission_id, g.final_score);
            }
          });
        }
      }
      
      // Combine submission data with grades
      const enhancedSubmissions = (submissions || []).map(sub => ({
        ...sub,
        grade: gradesMap.get(sub.id) || null,
        files: []
      }));
      
      setStudentSubmissions(enhancedSubmissions);
    } catch (err) {
      console.error("Error fetching exam data:", err);
      setError(err.message || "Failed to load exam data");
    } finally {
      setIsLoading(false);
    }
  }, [examId, userId, supabase]);
  
  // Fetch student files when a submission is selected
  const fetchStudentFiles = useCallback(async (submissionId) => {
    if (!submissionId) return;
    
    try {
      const { data, error } = await supabase
        .from("kn_student_answer_files")
        .select("id, filename, storage_path, original_name")
        .eq("submission_id", submissionId);
      
      if (error) throw error;
      
      const filesWithUrls = await Promise.all((data || []).map(async (file) => {
        const { data: urlData } = await supabase.storage.from('autograde').getPublicUrl(file.storage_path);
        return { ...file, url: urlData?.publicUrl };
      }));
      
      // Update the selected submission with files
      setSelectedSubmission(prev => prev ? { ...prev, files: filesWithUrls } : null);
      
      // Also update the files in the submissions list
      setStudentSubmissions(prev => 
        prev.map(sub => sub.id === submissionId ? { ...sub, files: filesWithUrls } : sub)
      );
      
    } catch (err) {
      console.error("Error fetching student files:", err);
    }
  }, [supabase]);
  
  // Get grading result for a submission
  const fetchGradingResult = useCallback(async (submissionId) => {
    if (!submissionId) return;
    
    try {
      const { data, error } = await supabase
        .from("kn_grading_sessions")
        .select("id, final_score, results_json, created_at")
        .eq("student_submission_id", submissionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        const result = {
          assessment: data.results_json || "No details available.",
          score: data.final_score || 0,
          id: data.id
        };
        
        // Update selected submission with result
        setSelectedSubmission(prev => 
          prev ? { ...prev, grading_result: result, grade: result.score } : null
        );
        
        // Update grade in submissions list
        setStudentSubmissions(prev => 
          prev.map(sub => sub.id === submissionId ? { ...sub, grade: result.score } : sub)
        );
      }
    } catch (err) {
      console.error("Error fetching grading result:", err);
    }
  }, [supabase]);
  
  // Handle selecting a submission
  const selectSubmission = useCallback((submission) => {
    setSelectedSubmission(submission);
    fetchStudentFiles(submission.id);
    fetchGradingResult(submission.id);
  }, [fetchStudentFiles, fetchGradingResult]);
  
  // Start grading process
  const startGrading = useCallback(async (submissionId) => {
    if (!submissionId || isGrading || !userId) return;
    
    // Basic validation
    const submission = studentSubmissions.find(s => s.id === submissionId);
    if (!submission) return;
    
    if (correctAnswerFiles.length === 0) {
      alert("Error: You need to upload answer key files first.");
      return;
    }
    
    if (!submission.files || submission.files.length === 0) {
      alert("Error: The student hasn't uploaded any answers yet.");
      return;
    }
    
    setIsGrading(true);
    
    try {
      const response = await fetch("/api/koreksi/start-grading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          submissionId,
          username,
          userId
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Grading failed (${response.status})`);
      }
      
      // Update with grading result
      const gradingResult = {
        assessment: result.fullAssessment || "No details available.",
        score: result.finalScore || 0,
        id: result.sessionId
      };
      
      // Update selected submission
      setSelectedSubmission(prev => 
        prev ? { ...prev, grading_result: gradingResult, grade: gradingResult.score } : null
      );
      
      // Update grade in submissions list
      setStudentSubmissions(prev => 
        prev.map(sub => sub.id === submissionId ? { ...sub, grade: gradingResult.score } : sub)
      );
      
    } catch (err) {
      console.error("Error grading submission:", err);
      alert(`Grading failed: ${err.message}`);
    } finally {
      setIsGrading(false);
    }
  }, [correctAnswerFiles, examId, isGrading, studentSubmissions, userId, username]);
  
  // Initial data load
  useEffect(() => {
    if (examId && userId) {
      fetchExamDetails();
    }
  }, [examId, userId, fetchExamDetails]);
  
  return {
    // Data
    exam,
    correctAnswerFiles,
    studentSubmissions,
    selectedSubmission,
    username,
    
    // Status
    isLoading,
    isGrading,
    error,
    
    // Actions
    selectSubmission,
    startGrading,
    fetchExamDetails,
    fetchStudentFiles,
    fetchGradingResult
  };
}