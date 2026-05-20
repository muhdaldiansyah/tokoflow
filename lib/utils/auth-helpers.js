// lib/utils/auth-helpers.js
import { createClient } from '../database/supabase-server/index.js';
import { errorResponse } from './api-response';

/**
 * Validates authentication and returns the authenticated user
 * @param {Request} request - The incoming request
 * @returns {Promise<{user: Object, supabase: Object} | Response>} User and supabase client or error response
 */
export async function authenticateRequest(request) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { ok: false, status: 401, error: 'Unauthorized' };
    }

    return { ok: true, user, supabase };
  } catch (error) {
    console.error('Authentication error:', error);
    return { ok: false, status: 401, error: 'Authentication failed' };
  }
}

/**
 * Middleware-like function to wrap API handlers with authentication
 * @param {Function} handler - The API handler function
 * @returns {Function} Wrapped handler with authentication
 */
export function withAuth(handler) {
  return async (request, context) => {
    const authResult = await authenticateRequest(request);

    // If authResult is a Response (error), return it
    if (authResult instanceof Response) {
      return authResult;
    }

    // Add user and supabase to the context
    const enhancedContext = {
      ...context,
      user: authResult.user,
      supabase: authResult.supabase,
    };

    return handler(request, enhancedContext);
  };
}