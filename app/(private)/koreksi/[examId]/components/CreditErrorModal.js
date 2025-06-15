// app/(private)/koreksi/[examId]/components/CreditErrorModal.js
'use client';

import React from 'react';
import { X, AlertTriangle, CreditCard, Clock, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreditErrorModal({ 
  isOpen, 
  onClose, 
  error, 
  profile,
  onUpgrade 
}) {
  const router = useRouter();
  
  if (!isOpen) return null;

  const isExpired = error?.includes('expired');
  const isInsufficient = error?.includes('Insufficient');
  
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/plans');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Background overlay with blur */}
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>
        
        {/* Modal panel */}
        <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200/20 dark:border-gray-700/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 px-6 py-5">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  {isExpired ? (
                    <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white" id="modal-title">
                  {isExpired ? 'Kredit Sudah Kadaluarsa' : 'Kredit Tidak Mencukupi'}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {isExpired 
                    ? 'Kredit Anda telah melewati masa berlaku.'
                    : 'Anda memerlukan kredit untuk melakukan penilaian otomatis.'}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-6 py-5">
            {/* Current Status */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Status Kredit Anda</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sisa Kredit</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {profile?.credits_balance || 0} Kredit
                  </span>
                </div>
                {profile?.next_credits_expiry_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Berlaku Hingga</span>
                    <span className={`text-sm font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                      {new Date(profile.next_credits_expiry_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Dengan menambah kredit, Anda dapat:
              </h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Sparkles className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Melakukan penilaian otomatis dengan AI
                  </span>
                </li>
                <li className="flex items-start">
                  <Sparkles className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Menghemat waktu koreksi hingga 90%
                  </span>
                </li>
                <li className="flex items-start">
                  <Sparkles className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Mendapatkan analisis detail untuk setiap jawaban
                  </span>
                </li>
              </ul>
            </div>

            {/* Pricing Preview */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Promo Spesial:</strong> Dapatkan bonus kredit hingga 50% untuk pembelian paket hari ini!
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleUpgrade}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium transition-all transform hover:scale-[1.02]"
            >
              <CreditCard className="h-5 w-5" />
              <span>Lihat Paket Kredit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium transition-colors"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
