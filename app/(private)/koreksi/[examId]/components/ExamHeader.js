// app/(private)/koreksi/[examId]/components/ExamHeader.js
'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Home, Users, Key, Settings, FileEdit, QrCode } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';
import QRCodeButton from './QRUpload/QRCodeButton';
import QRCodeModal from './QRUpload/QRCodeModal';

export default function ExamHeader({ ctx, activeWorkspace, setActiveWorkspace }) {
  const { isMobile } = useResponsive();
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrStatus, setQrStatus] = useState({
    isActive: false,
    uploadCount: 0
  });
  
  const activeStudents = ctx.studentSubmissions?.filter(s => 
    s.upload_source !== 'qr' || s.approval_status === 'approved'
  ) || [];
  
  const tabs = [
    {
      id: 'student',
      label: isMobile ? 'Siswa' : 'Students',
      icon: Users,
      count: activeStudents.length
    },
    {
      id: 'answer', 
      label: isMobile ? 'Kunci' : 'Answer Key',
      icon: Key,
      count: ctx.correctAnswerFiles?.length || 0
    },
    {
      id: 'editExam',
      label: isMobile ? 'Edit' : 'Settings', 
      icon: isMobile ? FileEdit : Settings,
      count: null
    }
  ];

  // Check QR upload status
  useEffect(() => {
    if (ctx.exam?.id) {
      checkQRStatus();
      // Set up polling for real-time updates
      const interval = setInterval(checkQRStatus, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [ctx.exam?.id]);

  const checkQRStatus = async () => {
    try {
      const response = await fetch(`/api/koreksi/qr/status?examId=${ctx.exam.id}`);
      if (response.ok) {
        const data = await response.json();
        setQrStatus({
          isActive: data.isActive,
          uploadCount: data.pendingUploads || 0
        });
        
        // Update student submissions if there are new QR uploads
        if (data.pendingUploads > 0) {
          ctx.fetchStudentSubmissionsAndGrades();
        }
      }
    } catch (error) {
      console.error('Error checking QR status:', error);
    }
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200">
        {/* Breadcrumb Navigation - Desktop Only */}
        {!isMobile && (
          <div className="py-3 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                  <button
                    onClick={() => window.location.href = '/koreksi'}
                    className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Home size={16} className="mr-1.5" />
                    Beranda
                  </button>
                  <ChevronRight size={16} className="text-gray-400" />
                  <span className="text-gray-900 font-medium truncate">
                    {ctx.exam?.title || 'Ujian Tanpa Judul'}
                  </span>
                </div>
                
                {/* QR Code Button - Desktop */}
                <QRCodeButton
                  isActive={qrStatus.isActive}
                  uploadCount={qrStatus.uploadCount}
                  onClick={() => setShowQRModal(true)}
                />
              </nav>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className={`${isMobile ? 'px-4 pt-3' : 'pt-3'}`}>
          <div className={`${!isMobile ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' : ''}`}>
            <nav className="flex items-center justify-between" role="tablist">
              <div className="flex space-x-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeWorkspace === tab.id || 
                    (tab.id === 'student' && activeWorkspace === 'addStudent');
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveWorkspace(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                        isActive
                          ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                          : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                      }`}
                      role="tab"
                      aria-selected={isActive}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                      {tab.count !== null && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          isActive 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* QR Code Button - Mobile */}
              {isMobile && (
                <QRCodeButton
                  isActive={qrStatus.isActive}
                  uploadCount={qrStatus.uploadCount}
                  onClick={() => setShowQRModal(true)}
                />
              )}
            </nav>
          </div>
        </div>
      </div>
      
      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          // Refresh status when modal closes
          checkQRStatus();
        }}
        exam={ctx.exam}
      />
    </>
  );
}
