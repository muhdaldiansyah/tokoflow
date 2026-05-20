// app/api/customers/[id]/route.js
import { authenticateRequest } from '../../../../lib/utils/auth-helpers';
import { requireOwner } from '../../../../lib/auth/role';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../lib/utils/api-response';

export const runtime = 'nodejs';

/**
 * GET /api/customers/[id] — single customer with their full sales history.
 * Returns: { customer, sales: [...], stats: { orders, total_spent, total_profit, last_order_at } }
 */
export async function GET(request, { params }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);

    const { supabase } = auth;
    const { id } = await params;
    const customerId = Number(id);
    if (!Number.isFinite(customerId)) return errorResponse('Invalid customer id', 400);

    const [{ data: customer, error: cErr }, { data: sales, error: sErr }] = await Promise.all([
      supabase
        .from('tf_customers')
        .select('id, name, phone, notes, created_at, updated_at')
        .eq('id', customerId)
        .maybeSingle(),
      supabase
        .from('tf_sales_transactions')
        .select('id, transaction_date, sku, product_name, channel, quantity, selling_price, revenue, net_profit')
        .eq('customer_id', customerId)
        .order('transaction_date', { ascending: false })
        .limit(200),
    ]);

    if (cErr) return handleSupabaseError(cErr);
    if (!customer) return errorResponse('Customer not found', 404);
    if (sErr) return handleSupabaseError(sErr);

    const salesList = sales || [];
    const stats = salesList.reduce(
      (acc, row) => {
        acc.orders        += 1;
        acc.total_spent   += Number(row.revenue    || 0);
        acc.total_profit  += Number(row.net_profit || 0);
        if (!acc.last_order_at || row.transaction_date > acc.last_order_at) {
          acc.last_order_at = row.transaction_date;
        }
        return acc;
      },
      { orders: 0, total_spent: 0, total_profit: 0, last_order_at: null }
    );

    return successResponse({ customer, sales: salesList, stats });
  } catch (err) {
    console.error('[customers/:id] GET error', err);
    return errorResponse('Failed to fetch customer', 500);
  }
}

/**
 * PATCH /api/customers/[id] — update customer fields.
 * Body: { name?, phone?, notes? }
 */
export async function PATCH(request, { params }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);

    const { supabase } = auth;
    const { id } = await params;
    const customerId = Number(id);
    if (!Number.isFinite(customerId)) return errorResponse('Invalid customer id', 400);

    const body = await request.json();
    const update = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        return errorResponse('Customer name cannot be empty');
      }
      update.name = body.name.trim();
    }
    if (body.phone !== undefined) update.phone = body.phone?.trim() || null;
    if (body.notes !== undefined) update.notes = body.notes?.trim() || null;

    const { data, error } = await supabase
      .from('tf_customers')
      .update(update)
      .eq('id', customerId)
      .select()
      .single();

    if (error) return handleSupabaseError(error);
    return successResponse(data);
  } catch (err) {
    console.error('[customers/:id] PATCH error', err);
    return errorResponse('Failed to update customer', 500);
  }
}

/**
 * DELETE /api/customers/[id] — delete a customer. Owner only.
 * The FK on tf_sales_transactions.customer_id is ON DELETE SET NULL,
 * so historical sales remain intact but become "uncategorized".
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
    const gate = await requireOwner(auth);
    if (!gate.ok) return gate.response;

    const { supabase } = auth;
    const { id } = await params;
    const customerId = Number(id);
    if (!Number.isFinite(customerId)) return errorResponse('Invalid customer id', 400);

    const { error } = await supabase
      .from('tf_customers')
      .delete()
      .eq('id', customerId);

    if (error) return handleSupabaseError(error);
    return successResponse({ message: 'Customer deleted', id: customerId });
  } catch (err) {
    console.error('[customers/:id] DELETE error', err);
    return errorResponse('Failed to delete customer', 500);
  }
}
