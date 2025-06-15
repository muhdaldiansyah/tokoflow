// app/dashboard/autograde/[examId]/components/Tooltip/TooltipProvider.js
'use client';

import React from 'react';

const TooltipProvider = ({ children, text, position = 'bottom' }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  const positionClasses = {
    top: '-top-2 -translate-y-full left-1/2 -translate-x-1/2',
    bottom: '-bottom-2 translate-y-full left-1/2 -translate-x-1/2',
    left: 'top-1/2 -translate-y-1/2 -left-2 -translate-x-full',
    right: 'top-1/2 -translate-y-1/2 -right-2 translate-x-full'
  };
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md shadow-sm dark:bg-gray-700 whitespace-nowrap ${positionClasses[position]}`}>
          {text}
        </div>
      )}
    </div>
  );
};

export default TooltipProvider;
