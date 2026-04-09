// app/api/users/route.js
//
// Owner-only listing of users (av_profiles). Used by /admin/users to show
// every account so the owner can promote / demote / inspect roles.
import { authenticateRequest } from '../../../lib/utils/auth-helpers';
import { requireOwner } from '../../../lib/auth/role.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../lib/utils/api-response';

export const runtime = 'nodejs';

/**
 * GET /api/users — list every profile + role.
 * Owner only.
 */
export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
    const gate = await requireOwner(auth);
    if (!gate.ok) return gate.response;

    const { data, error } = await auth.supabase
      .from('av_profiles')
      .select('id, email, full_name, business_name, phone_number, role, created_at')
      .order('created_at', { ascending: true })
      .limit(500);

    if (error) return handleSupabaseError(error);
    return successResponse(data || []);
  } catch (err) {
    console.error('[users] GET error', err);
    return errorResponse('Failed to list users', 500);
  }
}
