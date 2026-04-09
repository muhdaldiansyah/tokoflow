// app/api/marketplace/route.js
//
// List marketplace connections (read for any auth user, write owner-only).
import { authenticateRequest } from '../../../lib/utils/auth-helpers';
import { requireOwner } from '../../../lib/auth/role.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../lib/utils/api-response';

export const runtime = 'nodejs';

const VALID_CHANNELS = new Set(['shopee', 'tokopedia', 'tiktok-shop']);

export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);

    const { data, error } = await auth.supabase
      .from('tf_marketplace_connections')
      .select('id, channel, shop_id, shop_name, last_sync_at, last_sync_status, last_sync_error, is_active, created_at, updated_at')
      .order('channel', { ascending: true });

    if (error) return handleSupabaseError(error);

    // Never expose tokens to the client. The columns above already exclude
    // access_token / refresh_token / scope, but be explicit about it.
    return successResponse({
      connections: data || [],
      supported_channels: Array.from(VALID_CHANNELS),
    });
  } catch (err) {
    console.error('[marketplace] GET error', err);
    return errorResponse('Failed to list marketplace connections', 500);
  }
}

/**
 * DELETE /api/marketplace?id=<n>  — disconnect (owner only)
 */
export async function DELETE(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
    const gate = await requireOwner(auth);
    if (!gate.ok) return gate.response;

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    if (!Number.isFinite(id)) return errorResponse('id required', 400);

    const { error } = await auth.supabase
      .from('tf_marketplace_connections')
      .delete()
      .eq('id', id);
    if (error) return handleSupabaseError(error);

    return successResponse({ disconnected: id });
  } catch (err) {
    console.error('[marketplace] DELETE error', err);
    return errorResponse('Failed to disconnect', 500);
  }
}
