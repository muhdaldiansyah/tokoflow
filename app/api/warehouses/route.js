// app/api/warehouses/route.js
//
// Warehouse CRUD. List is open to any authenticated user (sales input form
// needs to populate the picker), but create/update/delete are owner-only via
// the [id] route. POST also goes through requireOwner here.
import { authenticateRequest } from '../../../lib/utils/auth-helpers';
import { requireOwner } from '../../../lib/auth/role.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../lib/utils/api-response';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);

    const { data, error } = await auth.supabase
      .from('tf_warehouses')
      .select('id, name, address, is_default, created_at, updated_at')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) return handleSupabaseError(error);
    return successResponse(data || []);
  } catch (err) {
    console.error('[warehouses] GET error', err);
    return errorResponse('Failed to list warehouses', 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
    const gate = await requireOwner(auth);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return errorResponse('Warehouse name is required');
    }

    // If marking this as default, the partial unique index will reject the
    // insert if another default already exists. Flip the existing default
    // to false first.
    if (body.is_default === true) {
      const { error: clearErr } = await auth.supabase
        .from('tf_warehouses')
        .update({ is_default: false })
        .eq('is_default', true);
      if (clearErr) return handleSupabaseError(clearErr);
    }

    const { data, error } = await auth.supabase
      .from('tf_warehouses')
      .insert({
        name: body.name.trim(),
        address: body.address?.trim() || null,
        is_default: body.is_default === true,
      })
      .select()
      .single();

    if (error) return handleSupabaseError(error);
    return successResponse(data, 201);
  } catch (err) {
    console.error('[warehouses] POST error', err);
    return errorResponse('Failed to create warehouse', 500);
  }
}
