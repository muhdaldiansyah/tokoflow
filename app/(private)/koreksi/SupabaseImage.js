// app/dashboard/autograde/SupabaseImage.js
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import PlaceholderImage from './PlaceholderImage';
import { Loader2 } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Displays an image from Supabase Storage using a direct public URL.
 * Handles loading and error states.
 * Requires NEXT_PUBLIC_SUPABASE_URL environment variable to be set.
 * 
 * @param {Object} props
 * @param {string} props.path - The path to the image in Supabase storage
 * @param {string} [props.bucket='autograde'] - The bucket name
 * @param {string} [props.alt=''] - Alt text for the image
 * @param {string} [props.className=''] - CSS classes for the container div
 * @param {string} [props.imgClassName=''] - CSS classes for the image element
 * @param {'contain'|'cover'|'fill'|'none'|'scale-down'} [props.objectFit='contain'] - CSS object-fit value
 * @param {number} [props.width=500] - Width of the image
 * @param {number} [props.height=500] - Height of the image
 * @param {boolean} [props.fill=false] - Whether the image should fill its container
 * @param {boolean} [props.priority=false] - Whether to prioritize loading
 * @param {boolean} [props.unoptimized=true] - Whether to disable optimization
 * @param {string} [props.errorMessage='Gagal memuat gambar'] - Error message to display
 * @param {Function} [props.onClick] - Click handler for the image
 */
export default function SupabaseImage({
  path,
  bucket = 'autograde',
  alt = '',
  className = '',
  imgClassName = '',
  objectFit = 'contain',
  width = 500,
  height = 500,
  fill = false,
  priority = false,
  unoptimized = true,
  errorMessage = 'Gagal memuat gambar',
  onClick,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (!path) {
      setHasError(true); setIsLoading(false);
      console.error("SupabaseImage: No path provided."); return;
    }
    if (!SUPABASE_URL) {
      setHasError(true); setIsLoading(false);
      console.error("SupabaseImage: NEXT_PUBLIC_SUPABASE_URL environment variable is not set."); return;
    }
    const constructedUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURIComponent(path)}`;
    setImageUrl(constructedUrl);
    setIsLoading(true); setHasError(false);
  }, [path, bucket]);

  const handleLoad = () => setIsLoading(false);
  const handleError = (e) => {
    console.error(`Error loading image from Supabase: ${imageUrl}`, e);
    setHasError(true); setIsLoading(false);
  };

  if (hasError || !imageUrl) {
    return <PlaceholderImage label={errorMessage} className={className} />;
  }

  const imageProps = fill
    ? { fill: true, sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" }
    : { width: width, height: height };

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-gray-800/50 z-10">
          <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
        </div>
      )}
      <Image
        src={imageUrl}
        alt={alt}
        {...imageProps}
        priority={priority}
        unoptimized={unoptimized}
        className={`
          transition-opacity duration-300
          ${objectFit === 'contain' ? 'object-contain' : ''}
          ${objectFit === 'cover' ? 'object-cover' : ''}
          ${objectFit === 'fill' ? 'object-fill' : ''}
          ${objectFit === 'none' ? 'object-none' : ''}
          ${objectFit === 'scale-down' ? 'object-scale-down' : ''}
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          ${imgClassName}
          ${fill ? '' : 'w-auto h-auto'}
        `}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}