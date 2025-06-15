// app/dashboard/autograde/[examId]/useExamDetails.js
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { resilientFetchJson } from "@/utils/resilientFetch";
import {
  ChevronLeft, Loader2, FileText, Users, Trash2, Play, CheckCircle, XCircle,
  Clock, Plus, Info, ImageIcon, File as FileIcon, Maximize, Edit, Eye, UserPlus,
  AlertCircle, X, CalendarDays, Settings, RefreshCcw, Download, ShieldCheck, Share2,
  Image, Sparkles, Sliders, ArrowUpDown, BarChart3, AlertTriangle
} from "lucide-react";
import { filterStudentsByStatus } from "./utils/statistics";
import { getUserPlanLimits } from "@/lib/subscription/planLimits";

/**
 * Custom hook for managing exam details state and actions
 * @param {Object} props
 * @param {string} props.examId - The ID of the exam
 * @param {Object|null} props.initialExam - Initial exam data (if available from SSR)
 * @param {Object|null} props.initialProfile - Initial user profile (if available from SSR)
 * @param {string} props.userId - The current user ID
 * @param {function} props.setActiveWorkspace - Function to set the active workspace state
 * @returns {Object} The exam details context with state and handlers
 */
export default function useExamDetails({ examId, initialExam, initialProfile, userId, setActiveWorkspace }) {
  const router = useRouter();

  // Constants
  const username = initialProfile?.full_name?.split(" ")[0] || userId?.split("-")[0] || "anonymous_user";

  // State
  const [activeTab, setActiveTab] = useState("answer-key");
  const [studentDetailTab, setStudentDetailTab] = useState("answers");
  const [isClientReady, setIsClientReady] = useState(false);

  const [exam, setExam] = useState(initialExam || null);
  const [correctAnswerFiles, setCorrectAnswerFiles] = useState([]);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [profile, setProfile] = useState(initialProfile || null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const [isLoadingExam, setIsLoadingExam] = useState(!initialExam);
  const [isLoadingCorrectFiles, setIsLoadingCorrectFiles] = useState(false);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [isGrading, setIsGrading] = useState({});
  const [isDeleting, setIsDeleting] = useState({});
  const [isCreatingStudents, setIsCreatingStudents] = useState(false);
  const [isUpdatingExam, setIsUpdatingExam] = useState(false);
  const [isUpdatingSubmission, setIsUpdatingSubmission] = useState(false);

  const [isEditExamModalOpen, setIsEditExamModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isEditSubmissionModalOpen, setIsEditSubmissionModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAnswerPaneCollapsed, setIsAnswerPaneCollapsed] = useState(false);

  const [editExamTitle, setEditExamTitle] = useState("");
  const [editStudentName, setEditStudentName] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editExamDate, setEditExamDate] = useState("");
  const [studentNames, setStudentNames] = useState([""]);
  const [newClassName, setNewClassName] = useState("");
  const [newExamDate, setNewExamDate] = useState("");

  const [pageError, setPageError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [creditError, setCreditError] = useState(null);
  const [showCreditErrorModal, setShowCreditErrorModal] = useState(false);
  const [gradingError, setGradingError] = useState({});
  const [userPlanLimits, setUserPlanLimits] = useState(null);

  const resultsRef = useRef(null);

  // Effects
  useEffect(() => { setIsClientReady(true); }, []);

  // API Helper function
  const api = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API Error');
    }
    
    return data;
  };

  // Data Fetching Callbacks
  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api(`/api/koreksi/user-profile?userId=${userId}`);
      setProfile(data.profile);
      setHasUnreadNotifications(data.hasUnreadNotifications);
      
      // Fetch user plan limits
      const planLimits = await getUserPlanLimits(userId);
      setUserPlanLimits(planLimits);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  }, [userId]);

  const fetchExamDetails = useCallback(async () => {
    if (!examId || !userId) return;
    setIsLoadingExam(true);
    setPageError(null);
    try {
      const data = await api(`/api/koreksi/exams?examId=${examId}`);
      setExam(data.exam);
      setEditExamTitle(data.exam.title);
    } catch (err) {
      console.error("Fetch Exam Error:", err);
      setPageError(err.message || "Gagal memuat detail tugas.");
      setExam(null);
    } finally {
      setIsLoadingExam(false);
    }
  }, [examId, userId]);

  const fetchCorrectAnswerFiles = useCallback(async () => {
    if (!examId || !userId) return;
    setIsLoadingCorrectFiles(true);
    try {
      const data = await api(`/api/koreksi/answer-files?examId=${examId}`);
      setCorrectAnswerFiles(data.files);
    } catch (err) {
      console.warn("Gagal memuat kunci jawaban:", err.message);
    } finally {
      setIsLoadingCorrectFiles(false);
    }
  }, [examId, userId]);

  const fetchStudentSubmissionsAndGrades = useCallback(async () => {
    if (!examId || !userId) return;
    setIsLoadingSubmissions(true);
    try {
      const data = await api(`/api/koreksi/submissions?examId=${examId}`);
      setStudentSubmissions(data.submissions);
    } catch (err) {
      console.warn("Gagal memuat pengumpulan siswa:", err.message);
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, [examId, userId]);

  const fetchStudentFilesForSelected = useCallback(async (submissionId) => {
    const updateLoading = (isLoading, error = null) => {
      setSelectedSubmission(prev => prev?.id === submissionId ? { ...prev, isLoadingFiles: isLoading, filesError: error } : prev);
      setStudentSubmissions(prevList => prevList.map(s => s.id === submissionId ? { ...s, isLoadingFiles: isLoading, filesError: error } : s));
    };
    updateLoading(true);

    try {
      // No need to pass userId anymore since we query from database
      const data = await api(`/api/koreksi/student-files?submissionId=${submissionId}`);
      const filesWithUrls = data.files;

      setSelectedSubmission(prev => prev?.id === submissionId ? { ...prev, files: filesWithUrls } : prev);
      setStudentSubmissions(prevList => prevList.map(s => s.id === submissionId ? { ...s, files: filesWithUrls } : s));
      updateLoading(false);
    } catch (err) {
      console.error(`Fetch Student Files (${submissionId}) Error:`, err);
      updateLoading(false, err.message || "Gagal memuat file.");
    }
  }, []);

  const fetchGradingResultForSelected = useCallback(async (submissionId) => {
    const updateLoading = (isLoading, error = null) => {
      setSelectedSubmission(prev => prev?.id === submissionId ? { ...prev, isLoadingStatus: isLoading, statusError: error } : prev);
      setStudentSubmissions(prevList => prevList.map(s => s.id === submissionId ? { ...s, isLoadingStatus: isLoading, statusError: error } : s));
    };
    updateLoading(true);

    try {
      const data = await api(`/api/koreksi/grading-results?submissionId=${submissionId}`);
      const result = data.result;

      setSelectedSubmission(prev => prev?.id === submissionId ? { ...prev, grading_result: result, grade: result?.finalScore ?? prev.grade } : prev);
      if (result) {
        setStudentSubmissions(prevList => prevList.map(s => s.id === submissionId ? { ...s, grade: result.finalScore } : s));
      }
      updateLoading(false);
    } catch (err) {
      console.error(`Fetch Grading Status (${submissionId}) Error:`, err);
      updateLoading(false, err.message || "Gagal memuat hasil.");
    }
  }, []);

  // Initial Data Load Effect
  useEffect(() => {
    if (examId && userId && isClientReady) {
      if (!initialProfile) fetchProfile();
      if (!initialExam) fetchExamDetails();
      fetchCorrectAnswerFiles();
      fetchStudentSubmissionsAndGrades();
    }
  }, [examId, userId, isClientReady, initialProfile, initialExam, fetchProfile, fetchExamDetails, fetchCorrectAnswerFiles, fetchStudentSubmissionsAndGrades]);

  // Sync selectedSubmission with studentSubmissions when the list updates
  useEffect(() => {
    if (selectedSubmission && studentSubmissions.length > 0) {
      // Find the matching submission in the updated list
      const updatedSubmission = studentSubmissions.find(s => s.id === selectedSubmission.id);
      
      if (updatedSubmission) {
        // Check if the data has changed (compare key fields)
        const hasChanged = 
          updatedSubmission.grade !== selectedSubmission.grade ||
          updatedSubmission.grading_result !== selectedSubmission.grading_result ||
          updatedSubmission.approval_status !== selectedSubmission.approval_status ||
          updatedSubmission.student_name !== selectedSubmission.student_name;
        
        if (hasChanged) {
          console.log('Syncing selectedSubmission with updated data:', {
            oldGrade: selectedSubmission.grade,
            newGrade: updatedSubmission.grade,
            studentName: updatedSubmission.student_name
          });
          
          // Update selectedSubmission with the latest data
          setSelectedSubmission(prev => ({
            ...prev,
            ...updatedSubmission,
            // Preserve loading states and other local state
            isLoadingFiles: prev.isLoadingFiles,
            isLoadingStatus: prev.isLoadingStatus,
            filesError: prev.filesError,
            statusError: prev.statusError,
            files: prev.files, // Keep existing files
            grading_result: prev.grading_result // Keep existing grading_result
          }));
          
          // If grade was updated but grading_result is missing, fetch it
          if (updatedSubmission.grade !== null && updatedSubmission.grade !== undefined && !selectedSubmission.grading_result) {
            console.log('Grade updated, fetching grading result...');
            fetchGradingResultForSelected(updatedSubmission.id);
          }
        }
      }
    }
  }, [studentSubmissions, selectedSubmission?.id, fetchGradingResultForSelected]); // Only depend on studentSubmissions, the ID, and the fetch function

  // Action Handlers
  const handleUpdateExam = useCallback(async () => {
    if (!editExamTitle.trim() || !exam) { setModalError("Judul tugas tidak boleh kosong."); return; }
    setIsUpdatingExam(true); setModalError(null);
    try {
      await api(`/api/koreksi/exams/${examId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editExamTitle.trim() })
      });
      setExam(prev => prev ? { ...prev, title: editExamTitle.trim() } : null);
      // Switch back to student view after successful update
      if (setActiveWorkspace) setActiveWorkspace('student');
    } catch (err) { setModalError(err.message || "Gagal memperbarui judul."); }
    finally { setIsUpdatingExam(false); }
  }, [editExamTitle, exam, examId, setActiveWorkspace]);

  const handleDeleteFile = useCallback(async (fileId, storagePath, type, submissionId, deleteGrading = false) => {
    console.log('handleDeleteFile called with:', { fileId, storagePath, type, submissionId, deleteGrading });
    if (isDeleting[fileId]) {
      console.log('Already deleting file:', fileId);
      return;
    }
    setIsDeleting(prev => ({ ...prev, [fileId]: true }));
    try {
      if (type === 'correct') {
        console.log('Deleting correct answer file:', fileId);
        await api(`/api/koreksi/answer-files/${fileId}`, { method: 'DELETE' });
        setCorrectAnswerFiles(prev => prev.filter(f => f.id !== fileId));
      } else if (submissionId) {
        console.log('Deleting student file:', fileId);
        // Add delete_grading parameter to the request
        const url = `/api/koreksi/student-files/${fileId}?deleteGrading=${deleteGrading}`;
        const response = await api(url, { method: 'DELETE' });
        console.log('Delete response:', response);
        
        // Update the file list first
        const updateState = (prevState) => {
          if (prevState?.id !== submissionId) return prevState;
          
          // Return updated submission with filtered files
          const updatedState = { 
            ...prevState, 
            files: prevState.files?.filter(f => f.id !== fileId) 
          };
          
          // If we're also deleting grading and it was successful
          if (deleteGrading && response.gradingDeleted) {
            // Clear the grading result
            updatedState.grading_result = null;
            updatedState.grade = null;
          }
          
          return updatedState;
        };
        
        // Update both selected submission and submissions list
        setSelectedSubmission(updateState);
        setStudentSubmissions(prevList => 
          prevList.map(s => s.id === submissionId ? updateState(s) ?? s : s)
        );
        
        console.log('Delete request completed');
      }
    } catch (err) { 
      console.error('Delete error:', err);
      throw err; // Re-throw the error for the component to handle
    }
    finally { setIsDeleting(prev => ({ ...prev, [fileId]: false })); }
  }, [isDeleting]);

  const handlePreviewFile = useCallback((file) => {
    console.log('%cPREVIEW FILE CLICKED', 'color: blue; font-weight: bold; font-size: 14px;');
    console.log('File:', file);
    console.log('Date/Time:', new Date().toLocaleTimeString());
    
    setPreviewFile(file); 
    setIsPreviewOpen(true);
    
    console.log('State after preview:', { isPreviewOpen: true, previewFile: file, timestamp: new Date().toLocaleTimeString() });
    
    // Log the call stack
    console.trace('handlePreviewFile stack trace');
  }, []);

  const handleSelectSubmission = useCallback((submission) => {
    if (selectedSubmission?.id === submission.id) return;
    
    // Automatically switch to student view when selecting a student
    if (setActiveWorkspace) setActiveWorkspace('student');
    
    setSelectedSubmission({ ...submission, isLoadingFiles: true, isLoadingStatus: true, filesError: null, statusError: null, files: [], grading_result: null });
    fetchStudentFilesForSelected(submission.id);
    fetchGradingResultForSelected(submission.id);
    setStudentDetailTab("answers");
  }, [selectedSubmission?.id, fetchStudentFilesForSelected, fetchGradingResultForSelected, setActiveWorkspace]);

  const handleEditSubmissionClick = useCallback((submission) => {
    setSelectedSubmission(submission);
    setEditStudentName(submission.student_name);
    setModalError(null);
    setIsEditSubmissionModalOpen(true);
  }, []);

  const handleUpdateSubmission = useCallback(async () => {
    if (!selectedSubmission || !editStudentName.trim()) { setModalError("Nama siswa wajib diisi."); return; }
    setIsUpdatingSubmission(true); setModalError(null);
    try {
      const data = await api(`/api/koreksi/submissions/${selectedSubmission.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          student_name: editStudentName.trim()
        })
      });
      if (data.submission) {
        const updatedSubmission = { ...selectedSubmission, ...data.submission };
        setStudentSubmissions(prev => prev.map(s => s.id === data.submission.id ? updatedSubmission : s));
        setSelectedSubmission(updatedSubmission);
      }
      setIsEditSubmissionModalOpen(false);
    } catch (err) { setModalError(err.message || "Gagal memperbarui info."); }
    finally { setIsUpdatingSubmission(false); }
  }, [selectedSubmission, editStudentName]);

  const handleDeleteSubmission = useCallback(async (submissionId, studentName) => {
    if (isDeleting[submissionId]) return;
    // Removed window.confirm as we now use modal confirmation
    setIsDeleting(prev => ({ ...prev, [submissionId]: true })); setPageError(null);
    try {
      await api(`/api/koreksi/submissions/${submissionId}`, { method: 'DELETE' });
      setStudentSubmissions(prev => prev.filter(s => s.id !== submissionId));
      if (selectedSubmission?.id === submissionId) setSelectedSubmission(null);
    } catch (err) { setPageError(`Gagal menghapus "${studentName}": ${err.message}`); }
    finally { setIsDeleting(prev => ({ ...prev, [submissionId]: false })); }
  }, [isDeleting, selectedSubmission?.id]);

  const handleBulkGrading = useCallback(async (submissionIds) => {
    if (!examId || !userId || !submissionIds || submissionIds.length === 0) {
      console.error('Missing required parameters for bulk grading');
      return { success: false, error: 'Missing required parameters' };
    }
    
    // Validate correct answer files exist
    if (correctAnswerFiles.length === 0) {
      return { 
        success: false, 
        error: 'Unggah Kunci Jawaban terlebih dahulu' 
      };
    }
    
    // Set grading state for all submissions
    const updatedGradingState = { ...isGrading };
    submissionIds.forEach(id => {
      updatedGradingState[id] = true;
    });
    setIsGrading(updatedGradingState);
    
    try {
      // Call the bulk grading API endpoint using resilient fetch
      console.log('Starting bulk grading with resilient fetch...');
      const data = await resilientFetchJson('/api/koreksi/bulk-grading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          submissionIds,
          username,
          userId
        })
      }, 3); // 3 retries max
      
      // Update the local state with the grading results
      const updatedSubmissions = [...studentSubmissions];
      
      data.results.forEach(result => {
        if (result.success && !result.alreadyGraded) {
          const index = updatedSubmissions.findIndex(s => s.id === result.submissionId);
          
          if (index !== -1) {
            updatedSubmissions[index] = {
              ...updatedSubmissions[index],
              grade: result.finalScore,
              isLoadingStatus: false,
              statusError: null
            };
          }
          
          // If this is the selected submission, update that too
          if (selectedSubmission?.id === result.submissionId) {
            setSelectedSubmission(prev => ({
              ...prev,
              grade: result.finalScore,
              isLoadingStatus: false,
              statusError: null
            }));
          }
        }
      });
      
      setStudentSubmissions(updatedSubmissions);
      
      // Clear grading state
      const clearedGradingState = { ...isGrading };
      submissionIds.forEach(id => {
        clearedGradingState[id] = false;
      });
      setIsGrading(clearedGradingState);
      
      // The watcher in useExamDetails will handle syncing and fetching grading results
      // Just ensure we have the latest submission data
      if (selectedSubmission) {
        const updatedSelectedSubmission = updatedSubmissions.find(s => s.id === selectedSubmission.id);
        if (updatedSelectedSubmission) {
          console.log('Bulk grading complete, selected submission will be synced by watcher');
        }
      }
      
      return {
        success: true,
        results: data.results,
        message: data.message,
        creditsUsed: data.creditsUsed
      };
      
    } catch (error) {
      console.error('Bulk grading error:', error);
      
      // Clear grading state
      const clearedGradingState = { ...isGrading };
      submissionIds.forEach(id => {
        clearedGradingState[id] = false;
      });
      setIsGrading(clearedGradingState);
      
      // Check if it's a credit-related error
      const errorMsg = error.message || 'Failed to perform bulk grading';
      if (errorMsg.includes('expired') || errorMsg.includes('Insufficient') || errorMsg.includes('credits')) {
        setCreditError(errorMsg);
        setShowCreditErrorModal(true);
      }
      
      return {
        success: false,
        error: errorMsg
      };
    }
  }, [examId, userId, username, correctAnswerFiles, isGrading, studentSubmissions, selectedSubmission]);

  // Single grading has been deprecated - use bulk grading instead
  // const handleStartGrading = deprecated

  // Add Student Modal Helpers
  const addStudentNameField = useCallback(() => setStudentNames(prev => [...prev, ""]), []);
  const removeStudentNameField = useCallback((index) => {
    if (studentNames.length > 1) setStudentNames(prev => prev.filter((_, i) => i !== index));
  }, [studentNames.length]);
  const updateStudentName = useCallback((index, value) => {
    setStudentNames(prev => prev.map((name, i) => (i === index ? value : name)));
  }, []);
  const handleOpenAddStudentModal = useCallback(() => {
    setStudentNames([""]); setNewClassName(""); setNewExamDate(""); setModalError(null);
    setIsAddStudentModalOpen(true);
  }, []);

  const createStudentSubmissions = useCallback(async () => {
    setIsCreatingStudents(true); setModalError(null);
    try {
      const trimmedNames = studentNames.map(n => n.trim()).filter(Boolean);
      if (trimmedNames.length === 0) throw new Error("Masukkan setidaknya satu nama siswa.");

      await api("/api/koreksi/submissions", {
        method: "POST",
        body: JSON.stringify({
          examId,
          studentNames: trimmedNames,
          className: newClassName.trim() || null,
          examDate: newExamDate || null
        })
      });

      await fetchStudentSubmissionsAndGrades(); // Refetch list
      setIsAddStudentModalOpen(false);
    } catch (err) { setModalError(err.message || "Gagal membuat data."); }
    finally { setIsCreatingStudents(false); }
  }, [studentNames, newClassName, newExamDate, examId, fetchStudentSubmissionsAndGrades]);

  // Function to switch back to student view
  const handleSwitchToStudent = useCallback(() => {
    if (setActiveWorkspace) setActiveWorkspace('student');
  }, [setActiveWorkspace]);

  // Function to check grading progress (stub for now, could be implemented fully)
  const checkGradingProgress = useCallback(async (submissionId) => {
    // This would be implemented to check progress from an API endpoint
    // For now, we'll return a simulated progress value
    return Math.floor(Math.random() * 100);
  }, []);

  return {
    // State
    isClientReady,
    exam,
    correctAnswerFiles,
    studentSubmissions,
    selectedSubmission,
    profile,
    hasUnreadNotifications,
    isLoadingExam,
    isLoadingCorrectFiles,
    isLoadingSubmissions,
    isGrading,
    isDeleting,
    isCreatingStudents,
    isUpdatingExam,
    isUpdatingSubmission,
    activeTab,
    studentDetailTab,
    isEditExamModalOpen,
    isPreviewOpen,
    previewFile,
    isComparisonOpen,
    isEditSubmissionModalOpen,
    isAddStudentModalOpen,
    editExamTitle,
    editStudentName,
    studentNames,
    newClassName,
    newExamDate,
    pageError,
    modalError,
    gradingError,
    creditError,
    showCreditErrorModal,
    resultsRef,
    isAnswerPaneCollapsed,
    setIsAnswerPaneCollapsed,
    setCorrectAnswerFiles,
    setStudentSubmissions,
    setSelectedSubmission,
    setActiveTab,
    setStudentDetailTab,
    setIsEditExamModalOpen,
    setIsPreviewOpen,
    setPreviewFile,
    setIsComparisonOpen,
    setIsEditSubmissionModalOpen,
    setIsAddStudentModalOpen,
    setEditExamTitle,
    setEditStudentName,
    setStudentNames,
    setNewClassName,
    setNewExamDate,
    setPageError,
    setModalError,
    setCreditError,
    setShowCreditErrorModal,
    setActiveWorkspace, // Add setActiveWorkspace to the returned context
    userPlanLimits, // Add user plan limits

    // Action handlers
    handleUpdateExam,
    handleDeleteFile,
    handlePreviewFile,
    handleSelectSubmission,
    handleEditSubmissionClick,
    handleUpdateSubmission,
    handleDeleteSubmission,
    // handleStartGrading, // Deprecated - use bulk grading
    handleBulkGrading, // Use bulk grading instead of single grading
    handleSwitchToStudent, // Add new method
    addStudentNameField,
    removeStudentNameField,
    updateStudentName,
    handleOpenAddStudentModal,
    createStudentSubmissions,
    fetchStudentFilesForSelected,
    fetchGradingResultForSelected,
    fetchCorrectAnswerFiles,
    fetchStudentSubmissionsAndGrades, // Add missing function
    checkGradingProgress,

    username,
    userId, // Add userId to context
    userPlanLimits, // Add user plan limits to context

    // External libraries/components
    icons: {
      ChevronLeft, Loader2, FileText, Users, Trash2, Play, CheckCircle, XCircle,
      Clock, Plus, Info, ImageIcon, FileIcon, Maximize, Edit, Eye, UserPlus,
      AlertCircle, X, CalendarDays, Settings, RefreshCcw, Download, ShieldCheck, Share2,
      Image, Sparkles, Sliders, ArrowUpDown, BarChart3, AlertTriangle
    }
  };
}