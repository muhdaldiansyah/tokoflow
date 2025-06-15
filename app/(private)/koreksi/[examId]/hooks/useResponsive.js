// app/dashboard/autograde/[examId]/hooks/useResponsive.js

import { useState, useEffect } from 'react';

/**
 * Simple responsive hook
 */
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;
  
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
  };
}

export function useResponsiveLayout() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const getLayoutMode = () => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  };
  
  const getNavMode = () => {
    return isMobile ? 'bottom' : 'horizontal';
  };
  
  const getContainerPadding = () => {
    if (isMobile) return '16px';
    if (isTablet) return '24px';
    return '32px';
  };
  
  const shouldCollapseComponents = () => {
    return isMobile;
  };
  
  const getTouchTargetSize = () => {
    return isMobile ? '48px' : '40px';
  };
  
  const getGridColumns = (defaultCols) => {
    if (isMobile) return 1;
    if (isTablet) return Math.min(2, defaultCols);
    return defaultCols;
  };
  
  const shouldStackVertically = () => {
    return isMobile;
  };
  
  const getSidebarBehavior = () => {
    if (isMobile) return 'hidden';
    if (isTablet) return 'drawer';
    return 'fixed';
  };
  
  return {
    layoutMode: getLayoutMode(),
    navMode: getNavMode(),
    getContainerPadding,
    shouldCollapseComponents,
    getTouchTargetSize,
    getGridColumns,
    shouldStackVertically,
    getSidebarBehavior,
    isMobile,
    isTablet,
    isDesktop,
  };
}
