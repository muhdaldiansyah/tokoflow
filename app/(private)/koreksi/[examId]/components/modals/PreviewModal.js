// app/dashboard/autograde/[examId]/components/modals/PreviewModal.js
'use client';

import React, { useEffect, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, Maximize2, Loader2, ChevronLeft } from 'lucide-react';
import SupabaseImage from '../../../SupabaseImage';
import { useResponsive } from '../../hooks/useResponsive';
import { showToast } from '../ToastStack';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function PreviewModal({ file, onClose }) {
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [textContent, setTextContent] = useState(null);
  const { isMobile } = useResponsive();
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [initialPinchDistance, setInitialPinchDistance] = useState(null);
  const [currentPinchDistance, setCurrentPinchDistance] = useState(null);
  const [lastTap, setLastTap] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Determine file type
  const isImage = file?.original_name?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
  const isText = file?.original_name?.match(/\.(txt|md|json|xml|html|css|js)$/i);
  const isPDF = file?.original_name?.match(/\.pdf$/i);
  
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);
  
  // Handle mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3));
      }
    };
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);
  
  // Handle swipe down to close on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const minSwipeDistance = 50;
    
    const onTouchStart = (e) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientY);
    };
    
    const onTouchMove = (e) => {
      setTouchEnd(e.targetTouches[0].clientY);
    };
    
    const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      
      const distance = touchStart - touchEnd;
      const isSwipeDown = distance < -minSwipeDistance;
      
      if (isSwipeDown) {
        onClose();
      }
    };
    
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
    
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isMobile, touchStart, touchEnd, onClose]);
  
  // Handle pinch-to-zoom on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        setInitialPinchDistance(distance);
        setCurrentPinchDistance(distance);
      }
    };
    
    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && initialPinchDistance) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        const scaleDelta = distance / initialPinchDistance;
        setScale(prev => Math.min(Math.max(prev * scaleDelta, 0.5), 3));
        setInitialPinchDistance(distance);
      }
    };
    
    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        setInitialPinchDistance(null);
        setCurrentPinchDistance(null);
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, initialPinchDistance]);
  
  // Handle double-tap to zoom on mobile
  useEffect(() => {
    if (!isMobile || isText) return;
    
    const handleDoubleTap = (e) => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      
      if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
        e.preventDefault();
        // Toggle between normal and 2x zoom
        setScale(prev => prev === 1 ? 2 : 1);
      } else {
        setLastTap(now);
      }
    };
    
    const imageContainer = document.querySelector('.image-preview-container');
    if (imageContainer) {
      imageContainer.addEventListener('click', handleDoubleTap);
      return () => imageContainer.removeEventListener('click', handleDoubleTap);
    }
  }, [isMobile, isText, lastTap]);

  const handleOverlayClick = (e) => {
    // Only close if clicked directly on the overlay, not on child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };
  
  const handleResetZoom = () => {
    setScale(1);
  };
  
  const handleDownload = async () => {
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      
      // Construct the proper URL
      let downloadUrl = file.url;
      if (!downloadUrl && file.storage_path) {
        if (!SUPABASE_URL) {
          throw new Error('Supabase URL not configured');
        }
        // Assume autograde bucket if not specified
        const bucket = file.bucket || 'autograde';
        downloadUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURIComponent(file.storage_path)}`;
      }
      
      if (!downloadUrl) {
        throw new Error('No download URL available');
      }
      
      // Fetch the file as a blob
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to download file');
      
      const blob = await response.blob();
      
      // Create a temporary blob URL
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.original_name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      showToast('Download started', 'success');
    } catch (error) {
      console.error('Download failed:', error);
      showToast('Failed to download file. Please try again.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md animate-fade-in">
      {/* Header Bar */}
      <div className={`absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md shadow-lg safe-area-top ${isMobile ? 'px-4 py-3' : 'px-4 py-4'}`}>
        <div className="flex items-center justify-between">
          {/* Mobile Back Button */}
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 -ml-2 mr-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation"
              title="Back"
            >
              <ChevronLeft className="w-5 h-5 text-gray-800" />
            </button>
          )}
          
          {/* File Info */}
          <div className="flex-1 min-w-0 mr-3">
            <h2 className={`text-gray-900 font-medium truncate ${isMobile ? 'text-sm' : 'text-lg'}`}>
              {file.original_name}
            </h2>
            {!isMobile && (
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span>{formatFileSize(file.size)}</span>
                <span className="text-gray-400">•</span>
                <span>{formatDate(file.uploaded_at || file.created_at)}</span>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls - Only show for images and desktop */}
            {!isText && !isMobile && (
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Zoom out"
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="px-3 py-1 hover:bg-gray-200 rounded transition-colors text-sm text-gray-700 font-medium min-w-[60px]"
                  title="Reset zoom"
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Zoom in"
                  disabled={scale >= 3}
                >
                  <ZoomIn className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            )}
            
            {/* Download Button - Show on mobile */}
            {isMobile && (
              <button
                onClick={handleDownload}
                className={`p-2.5 bg-gray-100 rounded-lg transition-colors touch-manipulation ${isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 active:bg-gray-300'}`}
                title="Download"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 text-gray-700 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-gray-700" />
                )}
              </button>
            )}
            
            {/* Download Button - Desktop */}
            {!isMobile && (
              <button
                onClick={handleDownload}
                className={`p-2.5 bg-gray-100 rounded-lg transition-colors ${isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                title="Download"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 text-gray-700 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-gray-700" />
                )}
              </button>
            )}
            
            {/* Close Button - Desktop only */}
            {!isMobile && (
              <button
                onClick={onClose}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ml-2"
                title="Close (Esc)"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className={`absolute inset-0 ${isMobile ? 'pt-16 pb-8' : 'pt-20'} flex items-center justify-center overflow-hidden`}
        onClick={handleOverlayClick}
        style={{ paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 2rem)' : '0' }}
      >
        {/* Loading State */}
        {isLoading && !textContent && (
          <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
            <div className={`text-center bg-black/20 backdrop-blur-sm rounded-2xl ${isMobile ? 'p-6' : 'p-8'}`}>
              <Loader2 className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} text-white animate-spin mx-auto mb-3`} />
              <p className={`text-white font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>Loading preview...</p>
              <p className={`text-white/60 ${isMobile ? 'text-xs' : 'text-sm'} mt-1 px-4`}>{file.original_name}</p>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
            <div className="text-center bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-10 shadow-2xl">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-white text-lg font-medium mb-2">Failed to load preview</p>
              <p className="text-white/60 text-sm max-w-xs mx-auto">{file.original_name}</p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
        
        {/* Content Container */}
        {isText ? (
          // Text Content Display
          <div className={`relative ${isMobile ? 'max-w-[95vw] w-full max-h-[calc(100vh-150px)]' : 'max-w-4xl w-full max-h-[calc(100vh-120px)]'} animate-scale-in mx-4`}>
            <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200`}>
              <div className={`bg-gray-50 border-b border-gray-200 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Text Preview</p>
              </div>
              <div className={`${isMobile ? 'p-4' : 'p-8'} overflow-auto max-h-[calc(100vh-200px)] bg-white`}>
                <pre className={`whitespace-pre-wrap font-mono ${isMobile ? 'text-xs' : 'text-sm'} text-gray-800 leading-relaxed`}>
                  {textContent || 'Loading text content...'}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          // Image Container
          <div 
            className={`image-preview-container relative ${isMobile ? 'max-w-[95vw] max-h-[calc(100vh-150px)]' : 'max-w-[90vw] max-h-[calc(100vh-120px)]'} overflow-hidden`}
            style={{ 
              transform: `scale(${scale})`,
              transformOrigin: 'center',
              transition: initialPinchDistance ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            <SupabaseImage
              path={file.storage_path}
              alt={file.original_name}
              className="max-w-full max-h-full object-contain select-none rounded-xl shadow-2xl ring-1 ring-white/10"
              style={{
                display: isLoading ? 'none' : 'block',
                filter: imageError ? 'grayscale(1) opacity(0.3)' : 'none'
              }}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setImageError(true);
              }}
            />
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
        <p className="text-white/50 text-sm">
          {isMobile ? (
            "Swipe down or tap bottom to close • Pinch or double-tap to zoom"
          ) : isText ? (
            "Click outside to close • Press Esc to exit"
          ) : (
            "Ctrl + Scroll to zoom • Click outside to close • Press Esc to exit"
          )}
        </p>
      </div>
      
      {/* Mobile Close Area - Swipe down indicator */}
      {isMobile && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-auto"
          onClick={onClose}
        >
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-12 h-1 bg-white/60 rounded-full" />
            <p className="text-white/60 text-xs">Tap to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
