// app/api/sales/transactions/export/route.js
import { createClient } from '@/lib/database/supabase-server';
import { successResponse, errorResponse, handleSupabaseError } from '@/lib/utils/api-response';

/**
 * GET /api/sales/transactions/export - Export sales transactions as CSV
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const channel = searchParams.get('channel');
    const sku = searchParams.get('sku');
    const format = searchParams.get('format') || 'csv';

    if (format !== 'csv') {
      return errorResponse('Only CSV format is supported');
    }

    let query = supabase
      .from('tokoflow_sales_transactions')
      .select(`
        transaction_date,
        sku,
        product_name,
        quantity,
        selling_price,
        revenue,
        modal_cost,
        packing_cost,
        affiliate_cost,
        marketplace_fee,
        net_profit,
        channel
      `)
      .order('transaction_date', { ascending: false });

    // Apply filters
    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }
    if (channel) {
      query = query.eq('channel', channel);
    }
    if (sku) {
      query = query.eq('sku', sku);
    }

    const { data, error } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    // Convert to CSV
    const headers = [
      'Date',
      'SKU',
      'Product',
      'Quantity',
      'Price',
      'Revenue',
      'Modal Cost',
      'Packing Cost',
      'Affiliate Cost',
      'Marketplace Fee',
      'Net Profit',
      'Channel'
    ];

    const rows = data.map(row => [
      row.transaction_date,
      row.sku,
      row.product_name,
      row.quantity,
      row.selling_price,
      row.revenue,
      row.modal_cost,
      row.packing_cost,
      row.affiliate_cost,
      row.marketplace_fee,
      row.net_profit,
      row.channel
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        const value = String(cell || '');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','))
    ].join('\n');

    // Return CSV response
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sales_transactions_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting transactions:', error);
    return errorResponse('Failed to export transactions', 500);
  }
}
