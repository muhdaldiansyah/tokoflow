// app/api/warehouses/[id]/route.js
import { authenticateRequest } from '../../../../lib/utils/auth-helpers';
import { requireOwner } from '../../../../lib/auth/role.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../lib/utils/api-response';

export const runtime = 'nodejs';

export async function PATCH(request, { params }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
    const gate = await requireOwner(auth);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const warehouseId = Number(id);
    if (!Number.isFinite(warehouseId)) return errorResponse('Invalid warehouse id', 400);

    const body = await request.json();
    const update = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) {
      if (!body.name.trim()) return errorResponse('Warehouse name cannot be empty');
      update.name = body.name.trim();
    }
    if (body.address !== undefined) update.address = body.address?.trim() || null;

    // Promoting to default: clear the existing default first
    if (body.is_default === true) {
      const { error: clearErr } = await auth.supabase
        .from('tf_warehouses')
        .update({ is_default: false })
        .eq('is_default', true)
        .neq('id', warehouseId);
      if (clearErr) return handleSupabaseError(clearErr);
      update.is_default = true;
    }

    const { data, error } = await auth.supabase
      .from('tf_warehouses')
      .update(update)
      .eq('id', warehouseId)
      .select()
      .single();

    if (error) return handleSupabaseError(error);
    return successResponse(data);
  } catch (err) {
    console.error('[warehouses/:id] PATCH error', err);
    return errorResponse('Failed to update warehouse', 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
    const gate = await requireOwner(auth);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const warehouseId = Number(id);
    if (!Number.isFinite(warehouseId)) return errorResponse('Invalid warehouse id', 400);

    // Refuse to delete the only warehouse — products would be orphaned
    const { count: total, error: countErr } = await auth.supabase
      .from('tf_warehouses')
      .select('id', { count: 'exact', head: true });
    if (countErr) return handleSupabaseError(countErr);
    if ((total || 0) <= 1) {
      return errorResponse('Tidak bisa menghapus warehouse terakhir.', 409);
    }

    // Refuse to delete the default — promote another first
    const { data: target, error: tErr } = await auth.supabase
      .from('tf_warehouses')
      .select('id, is_default')
      .eq('id', warehouseId)
      .maybeSingle();
    if (tErr) return handleSupabaseError(tErr);
    if (!target) return errorResponse('Warehouse not found', 404);
    if (target.is_default) {
      return errorResponse('Tidak bisa menghapus default warehouse. Set default ke warehouse lain dulu.', 409);
    }

    const { error } = await auth.supabase
      .from('tf_warehouses')
      .delete()
      .eq('id', warehouseId);

    if (error) return handleSupabaseError(error);
    return successResponse({ message: 'Warehouse deleted', id: warehouseId });
  } catch (err) {
    console.error('[warehouses/:id] DELETE error', err);
    return errorResponse('Failed to delete warehouse', 500);
  }
}
