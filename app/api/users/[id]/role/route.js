// app/api/users/[id]/role/route.js
//
// Owner-only role change. Critical safeguards:
//   1. Caller must be owner.
//   2. Cannot demote the last remaining owner — that would leave the install
//      with no one able to manage cost data, fees, or other owners.
//   3. Role must be a valid value ('owner' | 'staff').
import { authenticateRequest } from '../../../../../lib/utils/auth-helpers';
import { requireOwner } from '../../../../../lib/auth/role.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../../lib/utils/api-response';

export const runtime = 'nodejs';

const VALID_ROLES = new Set(['owner', 'staff']);

export async function PATCH(request, { params }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
    const gate = await requireOwner(auth);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    if (!id) return errorResponse('Invalid user id', 400);

    const body = await request.json().catch(() => ({}));
    const { role } = body || {};
    if (!VALID_ROLES.has(role)) {
      return errorResponse('Role must be "owner" or "staff"', 400);
    }

    // Fetch the target row to know its current state
    const { data: target, error: tErr } = await auth.supabase
      .from('av_profiles')
      .select('id, role')
      .eq('id', id)
      .maybeSingle();

    if (tErr) return handleSupabaseError(tErr);
    if (!target) return errorResponse('User not found', 404);

    // Safeguard: if we're demoting an owner to staff, make sure at least one
    // OTHER owner exists. Otherwise the install would lose all owners.
    if (target.role === 'owner' && role === 'staff') {
      const { count, error: cErr } = await auth.supabase
        .from('av_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'owner');

      if (cErr) return handleSupabaseError(cErr);
      if ((count || 0) <= 1) {
        return errorResponse(
          'Tidak bisa menurunkan owner terakhir. Promote user lain ke owner dulu sebelum demote yang ini.',
          409
        );
      }
    }

    const { data, error } = await auth.supabase
      .from('av_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, email, full_name, role')
      .single();

    if (error) return handleSupabaseError(error);
    return successResponse(data);
  } catch (err) {
    console.error('[users/:id/role] PATCH error', err);
    return errorResponse('Failed to update role', 500);
  }
}
