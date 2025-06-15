"use client";

import React from 'react';

/**
 * Placeholder component to display when an image fails to load
 * @param {Object} props
 * @param {string} props.label - Text to display in the placeholder
 * @param {string} [props.className=''] - Additional CSS classes
 */
export default function PlaceholderImage({ label, className = '' }) {
  return (
    <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md ${className}`}>
      <div className="text-center p-4">
        <div className="text-gray-500 dark:text-gray-400 text-sm">{label}</div>
      </div>
    </div>
  );
}