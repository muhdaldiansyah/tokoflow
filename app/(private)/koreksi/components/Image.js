// app/dashboard/autograde/components/Image.js
'use client';

import React, { useState } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Image component without animations or complex states.
 * A lightweight alternative to the more complex SupabaseImage component.
 */
export default function Image({ path, alt, className = '' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  if (!path || !SUPABASE_URL) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        Error: No image path
      </div>
    );
  }
  
  const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/autograde/${encodeURIComponent(path)}`;
  
  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          Loading...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          Failed to load image
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        className={`${error ? 'hidden' : 'block'} w-full h-full object-contain`}
      />
    </div>
  );
}