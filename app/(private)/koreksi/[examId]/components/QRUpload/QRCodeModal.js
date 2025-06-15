// app/(private)/koreksi/[examId]/components/QRUpload/QRCodeModal.js
'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Printer, Check, Loader2 } from 'lucide-react';

export default function QRCodeModal({ isOpen, onClose, exam }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const uploadUrl = exam?.qr_token 
    ? `${window.location.origin}/upload/qr/${exam.id}/${exam.qr_token}`
    : '';

  useEffect(() => {
    if (isOpen && uploadUrl) {
      generateQRCode();
    }
  }, [isOpen, uploadUrl]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      // Use QR Server API to generate QR code
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(uploadUrl)}`;
      setQrDataUrl(qrUrl);
      setLoading(false);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(uploadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.download = `QR-${exam?.title || 'exam'}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${exam?.title}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column;
              align-items: center; 
              justify-content: center; 
              min-height: 100vh;
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            h1 { margin-bottom: 10px; }
            p { margin-bottom: 30px; color: #666; }
            img { max-width: 400px; }
            .url { 
              margin-top: 20px; 
              padding: 10px; 
              background: #f0f0f0; 
              border-radius: 5px;
              word-break: break-all;
              max-width: 400px;
            }
          </style>
        </head>
        <body>
          <h1>${exam?.title || 'Upload Jawaban'}</h1>
          <p>Scan kode QR ini untuk upload file jawaban</p>
          <img src="${qrDataUrl}" alt="QR Code" />
          <div class="url">
            <strong>URL:</strong><br/>
            ${uploadUrl}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const toggleQRUpload = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/koreksi/qr/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          examId: exam.id,
          enabled: !exam.qr_upload_enabled 
        })
      });
      
      if (response.ok) {
        // Refresh exam data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error toggling QR upload:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              QR Code Upload
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
              </div>
            ) : !exam?.qr_token ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  QR token belum tersedia untuk ujian ini.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <>
                {/* QR Code */}
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <img 
                      src={qrDataUrl} 
                      alt="QR Code" 
                      className="w-64 h-64"
                    />
                  </div>
                </div>
                
                {/* Info */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">
                    Scan untuk Upload Jawaban
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Siswa dapat scan kode QR ini untuk upload file jawaban tanpa perlu login
                  </p>
                </div>
                
                {/* Status */}
                <div className="flex justify-center mb-6">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    exam?.qr_upload_enabled 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      exam?.qr_upload_enabled ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    {exam?.qr_upload_enabled ? 'QR Upload Aktif' : 'QR Upload Nonaktif'}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Tersalin!' : 'Salin Link'}
                  </button>
                  
                  <button
                    onClick={downloadQR}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Download size={16} />
                    Download QR
                  </button>
                  
                  <button
                    onClick={printQR}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Printer size={16} />
                    Print
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Footer */}
          {exam?.qr_token && (
            <div className="flex justify-between p-6 border-t bg-gray-50">
              <button
                onClick={toggleQRUpload}
                disabled={isUpdating}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  exam?.qr_upload_enabled
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                } disabled:opacity-50`}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  exam?.qr_upload_enabled ? 'Nonaktifkan QR Upload' : 'Aktifkan QR Upload'
                )}
              </button>
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
