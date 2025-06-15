// Simple toast notification system
'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

// Global toast store
let toastCounter = 0;
if (typeof window !== 'undefined' && !window.__toastStore) {
  window.__toastStore = [];
  window.__addToast = ({ message, type = 'info', duration = 3000 }) => {
    const id = `${Date.now()}-${toastCounter++}-${Math.random().toString(36).substr(2, 9)}`;
    const toast = { id, message, type };
    window.__toastStore.push(toast);
    window.dispatchEvent(new CustomEvent('toast-add'));
    
    // Remove after duration
    setTimeout(() => {
      window.__toastStore = window.__toastStore.filter(t => t.id !== id);
      window.dispatchEvent(new CustomEvent('toast-remove'));
    }, duration);
  };
}

export function showToast(message, type = 'info') {
  if (typeof window !== 'undefined' && window.__addToast) {
    window.__addToast({ message, type });
  }
}

export default function ToastStack() {
  const [toasts, setToasts] = useState([]);
  
  useEffect(() => {
    const handleToastUpdate = () => {
      setToasts([...window.__toastStore]);
    };
    
    window.addEventListener('toast-add', handleToastUpdate);
    window.addEventListener('toast-remove', handleToastUpdate);
    
    return () => {
      window.removeEventListener('toast-add', handleToastUpdate);
      window.removeEventListener('toast-remove', handleToastUpdate);
    };
  }, []);
  
  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5" />;
      case 'error': return <XCircle className="h-5 w-5" />;
      case 'warning': return <AlertCircle className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };
  
  const getColors = (type) => {
    switch (type) {
      case 'success': return 'bg-green-600 text-white';
      case 'error': return 'bg-red-600 text-white';
      case 'warning': return 'bg-yellow-600 text-white';
      default: return 'bg-gray-800 text-white';
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(({ id, message, type }) => (
        <div
          key={id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${getColors(type)} min-w-[300px] max-w-[400px]`}
        >
          {getIcon(type)}
          <p className="text-sm">{message}</p>
        </div>
      ))}
    </div>
  );
}
