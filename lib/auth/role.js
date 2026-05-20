// lib/auth/role.js
//
// Server-side role gate. Used by sensitive API routes to enforce
// "owner only" boundaries (cost data, marketplace fees, deletes, admin).
//
// Usage:
//   const auth = await authenticateRequest(request);
//   if (!auth.ok) return errorResponse(auth.error, auth.status || 401);
//   const gate = await requireOwner(auth);
//   if (!gate.ok) return gate.response;
//   // ... continue with the privileged action

import { errorResponse } from '../utils/api-response';

/**
 * Look up the current user's role from av_profiles.
 * Returns 'owner' | 'staff' | null (null = profile row missing).
 */
export async function getCurrentRole(auth) {
  if (!auth?.user?.id || !auth?.supabase) return null;

  const { data, error } = await auth.supabase
    .from('av_profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data.role || null;
}

/**
 * Gate that returns { ok: true } if the current user is owner, otherwise
 * { ok: false, response: <403 Response> } ready to be returned from a route.
 */
export async function requireOwner(auth) {
  const role = await getCurrentRole(auth);
  if (role === 'owner') return { ok: true, role };
  return {
    ok: false,
    role,
    response: errorResponse(
      'Aksi ini hanya untuk owner. Hubungi pemilik akun untuk melakukannya.',
      403
    ),
  };
}
