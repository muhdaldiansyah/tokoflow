// lib/utils/api-response.js
import { NextResponse } from 'next/server';
import { makeETag, maybeNotModified } from '../http/jsonETag.js';

/**
 * Standard API response format
 */
export function apiResponse(data = null, error = null, status = 200) {
  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || error,
        data: null
      },
      { status }
    );
  }

  return NextResponse.json(
    {
      success: true,
      error: null,
      data
    },
    { status }
  );
}

/**
 * Error response helper
 */
export function errorResponse(message, status = 400) {
  return apiResponse(null, { message }, status);
}

/**
 * Success response helper
 */
export function successResponse(data, status = 200) {
  return apiResponse(data, null, status);
}

/**
 * Success response with ETag + optional Link header
 */
export function successResponseWithETag(request, payload, { link } = {}) {
  const body = JSON.stringify({ success: true, error: null, data: payload });
  const etag = makeETag(body);

  if (maybeNotModified(request, etag)) {
    return new Response(null, { status: 304, headers: { etag } });
  }

  const res = new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, max-age=0, must-revalidate',
      etag,
    },
  });

  if (link) res.headers.set('link', `<${link}>; rel="next"`);
  return res;
}

/**
 * Handle Supabase errors
 */
export function handleSupabaseError(error) {
  console.error('Supabase error:', error);

  if (error.code === 'PGRST116') {
    return errorResponse('Record not found', 404);
  }

  if (error.code === '23505') {
    return errorResponse('Duplicate entry', 409);
  }

  if (error.code === '23503') {
    return errorResponse('Referenced record not found', 400);
  }

  return errorResponse(error.message || 'Database error', 500);
}
