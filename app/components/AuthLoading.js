// app/components/AuthLoading.js
"use client";

import { useEffect, useState } from 'react';

export default function AuthLoading() {
  const [showRefreshHint, setShowRefreshHint] = useState(false);

  useEffect(() => {
    // Show refresh hint after 2 seconds (reduced from 3)
    const timer = setTimeout(() => {
      setShowRefreshHint(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600 mb-2">Memeriksa autentikasi...</p>

        {showRefreshHint && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 mb-2">
              Proses autentikasi memakan waktu lebih lama dari biasanya
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Refresh Halaman
            </button>
          </div>
        )}
      </div>
    </div>
  );
}