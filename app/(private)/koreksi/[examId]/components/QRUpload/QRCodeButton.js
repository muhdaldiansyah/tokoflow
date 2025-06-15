// app/(private)/koreksi/[examId]/components/QRUpload/QRCodeButton.js
'use client';

import { QrCode } from 'lucide-react';

export default function QRCodeButton({ isActive, uploadCount, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative p-2 rounded-lg transition-all duration-200 group
        ${isActive 
          ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
          : 'text-gray-600 hover:bg-gray-100'
        }
      `}
      title="QR Upload"
    >
      <QrCode size={20} />
      {isActive && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
      )}
      {uploadCount > 0 && (
        <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
          {uploadCount}
        </span>
      )}
      
      {/* Tooltip */}
      <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {isActive ? 'QR Upload Active' : 'Enable QR Upload'}
      </span>
    </button>
  );
}
