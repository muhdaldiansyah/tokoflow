// app/api/marketplace/route.js
//
// List marketplace connections (read for any auth user, write owner-only).
import { authenticateRequest } from '../../../lib/utils/auth-helpers';
import { requireOwner } from '../../../lib/auth/role.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../lib/utils/api-response';

export const runtime = 'nodejs';

// Tokopedia is NOT in the supported list: its OpenAPI was absorbed into
// TikTok Shop Partner Center in 2025 and new integrations must use the
// TikTok Shop app. See docs/marketplace-integration.md.
const VALID_CHANNELS = new Set(['tiktok-shop', 'shopee']);

export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);

    // Explicit column list — NEVER include access_token_enc / refresh_token_enc
    // / shop_cipher / scope in the response. Those are server-only.
    const { data, error } = await auth.supabase
      .from('tf_marketplace_connections')
      .select([
        'id',
        'channel',
        'shop_id',
        'shop_name',
        'seller_type',
        'last_sync_at',
        'last_sync_cursor',
        'last_sync_status',
        'last_sync_error',
        'last_webhook_at',
        'is_active',
        'deactivated_at',
        'deactivated_reason',
        'created_at',
        'updated_at',
      ].join(', '))
      .order('channel', { ascending: true });

    if (error) return handleSupabaseError(error);

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
