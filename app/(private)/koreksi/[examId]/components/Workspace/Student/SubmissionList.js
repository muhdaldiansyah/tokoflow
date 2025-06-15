// app/dashboard/autograde/[examId]/components/Workspace/Student/SubmissionList.js
'use client';

import React from 'react';
import { useResponsive, useResponsiveLayout } from '../../../hooks/useResponsive';
import SubmissionRow from './SubmissionRow';
import { Search, Loader2, Users, CheckCircle, Trash2, X, Check, CheckSquare, UserPlus, QrCode, ChevronRight } from 'lucide-react';
import { showToast } from '../../ToastStack';
import ProgressTracker from '../../common/ProgressTracker';
import AddStudentModal from '../../modals/AddStudentModal';

export default function SubmissionList({ ctx, setActiveWorkspace }) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const submissions = ctx.studentSubmissions || [];
  const { isMobile } = useResponsive();
  const { getContainerPadding } = useResponsiveLayout();
  const [showQRUploads, setShowQRUploads] = React.useState(true);
  const [showAddStudentModal, setShowAddStudentModal] = React.useState(false);
  
  // Bulk action states
  const [bulkGradeMode, setBulkGradeMode] = React.useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = React.useState(false);
  const [selectedStudents, setSelectedStudents] = React.useState(new Set());
  const [showGradeConfirm, setShowGradeConfirm] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  // Progress tracking states
  const [showProgress, setShowProgress] = React.useState(false);
  const [progressItems, setProgressItems] = React.useState([]);
  const [isProgressComplete, setIsProgressComplete] = React.useState(false);

  // Filter and sort submissions
  const filteredSubmissions = submissions
    .filter(submission => {
      const query = searchQuery.toLowerCase();
      const name = submission.student_name.toLowerCase();
      const className = submission.class_name?.toLowerCase() || '';
      return name.includes(query) || className.includes(query);
    })
    .sort((a, b) => {
      // Sort alphabetically by student name
      return a.student_name.localeCompare(b.student_name);
    });
    
  // Separate regular and QR uploads
  const regularSubmissions = filteredSubmissions.filter(s => s.upload_source !== 'qr' || s.approval_status === 'approved');
  const qrSubmissions = filteredSubmissions.filter(s => s.upload_source === 'qr' && s.approval_status !== 'approved');
  const pendingQrSubmissions = qrSubmissions.filter(s => s.approval_status === 'pending');
    
  // Bulk action handlers
  const handleBulkGradeClick = () => {
    if (ctx.correctAnswerFiles.length === 0) {
      showToast('Unggah Kunci Jawaban terlebih dahulu', 'error');
      return;
    }
    setBulkGradeMode(true);
    setSelectedStudents(new Set());
  };
  
  const handleBulkDeleteClick = () => {
    setBulkDeleteMode(true);
    setSelectedStudents(new Set());
  };
  
  const handleCancelBulkAction = () => {
    setBulkGradeMode(false);
    setBulkDeleteMode(false);
    setSelectedStudents(new Set());
    setShowGradeConfirm(false);
    setShowDeleteConfirm(false);
  };
  
  const handleSelectAll = () => {
    if (selectedStudents.size === regularSubmissions.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(regularSubmissions.map(s => s.id)));
    }
  };
  
  const handleStudentSelect = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };
  
  const handleConfirmBulkGrade = async () => {
    if (selectedStudents.size === 0) {
      showToast('Pilih minimal 1 siswa untuk dinilai', 'warning');
      return;
    }
    
    // Create progress items for all selected students
    const items = Array.from(selectedStudents).map(id => {
      const submission = filteredSubmissions.find(s => s.id === id);
      return {
        id,
        name: submission ? submission.student_name : `Student ${id}`,
        status: 'pending',
        message: (submission?.grade !== null && submission?.grade !== undefined) ? 'Already graded' : 'Waiting to process'
      };
    });
    
    // Initialize progress state
    setProgressItems(items);
    setShowProgress(true);
    setIsProgressComplete(false);
    setIsProcessing(true);
    setShowGradeConfirm(false);
    
    try {
      // Filter out submissions that have already been graded
      const submissionsToGrade = Array.from(selectedStudents)
        .filter(id => {
          const submission = filteredSubmissions.find(s => s.id === id);
          return submission && (submission.grade === null || submission.grade === undefined);
        });
      
      // Update progress for already graded submissions
      setProgressItems(prev => 
        prev.map(item => {
          if (!submissionsToGrade.includes(item.id)) {
            return {
              ...item,
              status: 'success',
              message: 'Already graded',
            };
          }
          return item;
        })
      );
      
      if (submissionsToGrade.length === 0) {
        showToast('Semua siswa yang dipilih sudah dinilai', 'info');
        setIsProgressComplete(true);
        return;
      }
      
      // Call the bulk grading function
      const result = await ctx.handleBulkGrading(submissionsToGrade);
      
      if (result.success) {
        // Update progress items with results
        setProgressItems(prev => 
          prev.map(item => {
            // Find this item in the results
            const resultItem = result.results.find(r => r.submissionId === item.id);
            
            if (!resultItem) {
              return item; // No change if not found
            }
            
            if (resultItem.success) {
              if (resultItem.alreadyGraded) {
                return {
                  ...item,
                  status: 'success',
                  message: 'Already graded'
                };
              } else {
                return {
                  ...item,
                  status: 'success',
                  message: `Graded in ${resultItem.timeTaken || '–'} seconds`,
                  score: resultItem.finalScore
                };
              }
            } else {
              return {
                ...item,
                status: 'error',
                message: resultItem.message || resultItem.error || 'Failed to grade'
              };
            }
          })
        );
        
        // Update credits info if available
        if (result.creditsUsed) {
          showToast(`Kredit terpakai: ${result.creditsUsed}`, 'info');
        }
      } else {
        // Mark all pending items as error
        setProgressItems(prev => 
          prev.map(item => {
            if (item.status === 'pending') {
              return {
                ...item,
                status: 'error',
                message: result.message || result.error || 'Failed to grade'
              };
            }
            return item;
          })
        );
        
        showToast(`Error: ${result.message || result.error}`, 'error');
      }
    } catch (error) {
      // Mark all pending items as error
      setProgressItems(prev => 
        prev.map(item => {
          if (item.status === 'pending') {
            return {
              ...item,
              status: 'error',
              message: error.message || 'Unknown error'
            };
          }
          return item;
        })
      );
      
      showToast(`Error: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsProcessing(false);
      setIsProgressComplete(true);
    }
  };
  
  // QR Approval handlers
  const handleApproveQR = async (submissionId) => {
    try {
      const response = await fetch('/api/koreksi/qr/approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          status: 'approved'
        })
      });
      
      if (response.ok) {
        showToast('Submission approved', 'success');
        // Refresh the submissions list
        ctx.fetchStudentSubmissionsAndGrades();
      } else {
        const error = await response.json();
        showToast(`Error: ${error.message}`, 'error');
      }
    } catch (error) {
      showToast('Failed to approve submission', 'error');
    }
  };
  
  const handleRejectQR = async (submissionId) => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    
    try {
      const response = await fetch('/api/koreksi/qr/approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          status: 'rejected',
          reason
        })
      });
      
      if (response.ok) {
        showToast('Submission rejected', 'success');
        // Refresh the submissions list
        ctx.fetchStudentSubmissionsAndGrades();
      } else {
        const error = await response.json();
        showToast(`Error: ${error.message}`, 'error');
      }
    } catch (error) {
      showToast('Failed to reject submission', 'error');
    }
  };
  
  const handleConfirmBulkDelete = async () => {
    if (selectedStudents.size === 0) {
      showToast('Pilih minimal 1 siswa untuk dihapus', 'warning');
      return;
    }
    
    setIsProcessing(true);
    const results = [];
    const errors = [];
    
    try {
      for (const studentId of selectedStudents) {
        const submission = filteredSubmissions.find(s => s.id === studentId);
        if (submission) {
          try {
            await ctx.handleDeleteSubmission(studentId, submission.student_name);
            results.push(submission.student_name);
          } catch (error) {
            errors.push(submission.student_name);
          }
        }
      }
      
      if (results.length > 0) {
        showToast(`${results.length} siswa berhasil dihapus`, 'success');
      }
      if (errors.length > 0) {
        showToast(`${errors.length} siswa gagal dihapus`, 'error');
      }
      handleCancelBulkAction();
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="h-full w-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          {/* Title Section - First Priority */}
          <div className={`${isMobile ? 'px-4 py-4' : 'px-6 py-5'} border-b border-gray-100`}>
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 tracking-tight`}>
              {isMobile ? 'Siswa' : 'Daftar Siswa'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredSubmissions.length === 0 
                ? 'Belum ada siswa terdaftar'
                : `${filteredSubmissions.length} siswa${qrSubmissions.length > 0 ? ` (${qrSubmissions.length} via QR)` : ''}${searchQuery ? ` - difilter` : ''}`
              }
            </p>
          </div>
          
          {/* Action Buttons Section - Second Priority */}
          <div className={`${isMobile ? 'px-4 py-4' : 'px-6 py-5'} border-b border-gray-100`}>
            <div className="flex items-center gap-3 overflow-x-auto">
              {!bulkGradeMode && !bulkDeleteMode && (
                <>
                  {/* Add Student Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setShowAddStudentModal(true)}
                      className={`flex items-center ${isMobile ? 'gap-2 px-4 py-2.5 rounded-lg' : 'justify-center w-11 h-11 rounded-xl'} bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-sm transition-all duration-200 ease-out`}
                      title="Tambah Siswa"
                    >
                      <UserPlus size={isMobile ? 16 : 20} />
                      {isMobile && <span className="text-sm font-semibold">Tambah Siswa</span>}
                    </button>
                    {!isMobile && <span className="text-xs text-indigo-600 mt-1.5 font-medium">Tambah</span>}
                  </div>
                  
                  {/* Bulk Grade Button - Only when students exist */}
                  {filteredSubmissions.length > 0 && (
                    <div className="flex flex-col items-center">
                      <button
                        onClick={handleBulkGradeClick}
                        className={`flex items-center ${isMobile ? 'gap-2 px-4 py-2.5 rounded-lg' : 'justify-center w-11 h-11 rounded-xl'} bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-sm transition-all duration-200 ease-out`}
                        title="Mulai Nilai Semua"
                      >
                        <CheckCircle size={isMobile ? 16 : 20} />
                        {isMobile && <span className="text-sm font-semibold">Nilai Semua</span>}
                      </button>
                      {!isMobile && <span className="text-xs text-emerald-600 mt-1.5 font-medium">Nilai</span>}
                    </div>
                  )}
                  
                  {/* Delete Button - Only when students exist and not on mobile */}
                  {!isMobile && filteredSubmissions.length > 0 && (
                    <div className="flex flex-col items-center">
                      <button
                        onClick={handleBulkDeleteClick}
                        className="flex items-center justify-center w-11 h-11 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-100 hover:border-rose-300 hover:shadow-sm transition-all duration-200 ease-out"
                        title="Hapus Siswa"
                      >
                        <Trash2 size={20} />
                      </button>
                      <span className="text-xs text-rose-600 mt-1.5 font-medium">Hapus</span>
                    </div>
                  )}
                </>
              )}
              
              {/* Bulk mode controls */}
              {filteredSubmissions.length > 0 && (bulkGradeMode || bulkDeleteMode) && (
                <>
                  <div className="flex flex-col items-center">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center justify-center w-11 h-11 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 rounded-xl transition-all duration-200 ease-out"
                      title={selectedStudents.size === regularSubmissions.length ? "Batalkan Pilih Semua" : "Pilih Semua"}
                    >
                      <CheckSquare size={20} className={selectedStudents.size === regularSubmissions.length ? 'text-indigo-600' : 'text-gray-500'} />
                    </button>
                    <span className="text-xs text-gray-600 mt-1.5 font-medium">Pilih</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => bulkGradeMode ? setShowGradeConfirm(true) : setShowDeleteConfirm(true)}
                      disabled={selectedStudents.size === 0 || isProcessing}
                      className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ease-out border ${bulkGradeMode ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200 hover:border-emerald-400' : 'bg-rose-100 border-rose-300 text-rose-700 hover:bg-rose-200 hover:border-rose-400'} disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={bulkGradeMode ? "Konfirmasi Nilai" : "Konfirmasi Hapus"}
                    >
                      {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                    </button>
                    <span className="text-xs text-gray-600 mt-1.5 font-medium">Proses</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <button
                      onClick={handleCancelBulkAction}
                      disabled={isProcessing}
                      className="flex items-center justify-center w-11 h-11 bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 rounded-xl transition-all duration-200 ease-out disabled:opacity-50"
                      title="Batal"
                    >
                      <X size={20} />
                    </button>
                    <span className="text-xs text-gray-600 mt-1.5 font-medium">Batal</span>
                  </div>
                  
                  {/* Status indicator */}
                  {filteredSubmissions.length > 0 && (
                    <div className="text-sm text-gray-600 ml-4">
                      <span className="font-medium">{selectedStudents.size}</span> dari {regularSubmissions.length} dipilih
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Search Section - Third Priority */}
          <div className={`${isMobile ? 'px-4 py-4' : 'px-6 py-4'}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={isMobile ? 16 : 18} />
              <input
                type="text"
                placeholder="Cari siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 ${isMobile ? 'py-3' : 'py-2.5'} text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 ease-out`}
                style={{ fontSize: isMobile ? '16px' : '14px' }}
              />
            </div>
          </div>
        </div>

        {/* List Container - Fourth Priority */}
        <div className="flex-1 overflow-hidden bg-white">
          {ctx.isLoadingSubmissions ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                <span className="text-sm text-gray-500">Memuat daftar siswa...</span>
              </div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center max-w-sm">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                </div>
                <p className="text-sm sm:text-base font-medium text-gray-700">
                  {searchQuery ? 'Tidak ditemukan siswa' : 'Belum ada siswa terdaftar'}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  {searchQuery ? 'Coba kata kunci lain' : 'Klik tombol + untuk menambahkan siswa baru'}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto bg-white">
              {/* QR Uploads Section - Only show pending/rejected */}
              {qrSubmissions.length > 0 && (
                <div className="border-b border-gray-200">
                  <div className="px-4 py-3 bg-amber-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">
                        QR Uploads ({qrSubmissions.length})
                      </span>
                      {pendingQrSubmissions.length > 0 && (
                        <span className="text-xs text-amber-700">
                          {pendingQrSubmissions.length} need review
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowQRUploads(!showQRUploads)}
                      className="text-amber-600 hover:text-amber-700"
                    >
                      <ChevronRight className={`w-4 h-4 transform transition-transform ${showQRUploads ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                  {showQRUploads && (
                    <ul className="divide-y divide-gray-200">
                      {qrSubmissions.map((submission) => (
                        <SubmissionRow 
                          key={submission.id} 
                          submission={submission} 
                          ctx={ctx}
                          bulkMode={false}
                          isSelected={false}
                          onSelect={() => {}}
                          isQRUpload={true}
                          onApprove={handleApproveQR}
                          onReject={handleRejectQR}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              {/* Regular Submissions (including approved QR) */}
              <ul className="divide-y divide-gray-200">
                {regularSubmissions.map((submission) => (
                  <SubmissionRow 
                    key={submission.id} 
                    submission={submission} 
                    ctx={ctx}
                    bulkMode={bulkGradeMode || bulkDeleteMode}
                    isSelected={selectedStudents.has(submission.id)}
                    onSelect={() => handleStudentSelect(submission.id)}
                    isQRUpload={false}
                    onApprove={handleApproveQR}
                    onReject={handleRejectQR}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    
    {/* Confirmation Modals */}
    {showGradeConfirm && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl border border-gray-200/20">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            Konfirmasi Penilaian
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Apakah Anda yakin ingin memulai penilaian untuk {selectedStudents.size} siswa?
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowGradeConfirm(false)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmBulkGrade}
              className="px-4 py-2 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 hover:border-emerald-400 transition-all"
            >
              Ya, Mulai Nilai
            </button>
          </div>
        </div>
      </div>
    )}
    
    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200/20">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Konfirmasi Penghapusan
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Apakah Anda yakin ingin menghapus {selectedStudents.size} siswa? Data yang terhapus tidak dapat dikembalikan.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmBulkDelete}
              className="px-4 py-2 bg-rose-100 border border-rose-300 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200 hover:border-rose-400 transition-all"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </div>
    )}
    
    {/* Progress Tracker Modal */}
    {showProgress && (
      <ProgressTracker
        items={progressItems}
        title="Bulk Grading Progress"
        onClose={() => {
          setShowProgress(false);
          handleCancelBulkAction();
        }}
        isComplete={isProgressComplete}
      />
    )}
    
    {/* Add Student Modal */}
    <AddStudentModal
      isOpen={showAddStudentModal}
      onClose={() => setShowAddStudentModal(false)}
      ctx={ctx}
    />
    </>
  );
}