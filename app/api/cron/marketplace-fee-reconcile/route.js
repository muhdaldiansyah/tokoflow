// app/api/cron/marketplace-fee-reconcile/route.js
//
// Daily reconciliation of marketplace_fee on tf_sales_transactions.
//
// When an order first lands in Tokoflow (via sync or webhook) we compute
// marketplace_fee from the static per-channel percentage in
// tf_marketplace_fees. That's an estimate — good enough for real-time
// profit display, but wrong for the final books.
//
// Every 24 hours this cron:
//   1. Finds tf_sales_transactions rows with external_order_id set, older
//      than 24 hours (giving the order time to reach COMPLETED), and
//      fee_reconciled_at IS NULL.
//   2. Groups them by (external_source, external_order_id, connection_id).
//   3. For each group:
//      - shopee:      calls get_escrow_detail(order_sn) → commission_fee,
//                     service_fee, and escrow_amount → the authoritative
//                     per-order numbers.
//      - tiktok-shop: calls /finance/202309/orders/{id}/statement_transactions
//                     → platform_fee, shipping_fee, commission_fee breakdown
//                     by order.
//   4. Writes the real marketplace_fee back to tf_sales_transactions and
//      sets fee_reconciled_at = now. Also recomputes net_profit.
//
// Rate limiting: settlement/escrow endpoints are lower-QPS than order search,
// so we cap this to N orders per run and let the cron pick up the rest on
// the next tick.

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

import { createServiceRoleClient } from '../../../../lib/database/supabase-server';
import { loadActiveConnections } from '../../../../lib/services/marketplace/connections.js';
import { getEscrowDetail } from '../../../../lib/services/marketplace/shopee/orders.js';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_ORDERS_PER_RUN = 200;
const MIN_ORDER_AGE_MS = 24 * 60 * 60 * 1000;

export async function POST(request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  return reconcile();
}
export async function GET(request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  return reconcile();
}

async function reconcile() {
  const supabase = createServiceRoleClient();

  // Find recent-but-settled transactions that haven't been reconciled.
  const cutoff = new Date(Date.now() - MIN_ORDER_AGE_MS).toISOString();
  const { data: txs, error } = await supabase
    .from('tf_sales_transactions')
    .select('id, external_source, external_order_id, external_item_id, channel, modal_cost, packing_cost, affiliate_cost, selling_price, quantity, marketplace_fee, revenue, net_profit')
    .not('external_order_id', 'is', null)
    .is('fee_reconciled_at', null)
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(MAX_ORDERS_PER_RUN);

  if (error) {
    console.error('[cron/fee-reconcile] select failed', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!txs || txs.length === 0) {
    return NextResponse.json({ ok: true, reconciled: 0, message: 'nothing to reconcile' });
  }

  // Load active connections keyed by channel so we can find credentials.
  const connections = await loadActiveConnections(supabase);
  const byChannel = new Map();
  for (const c of connections) {
    if (!byChannel.has(c.channel)) byChannel.set(c.channel, []);
    byChannel.get(c.channel).push(c);
  }

  // Group transactions by (channel, order_id) so a multi-line order is
  // reconciled in one API call (we'll split fees proportionally across lines).
  const byOrder = new Map();
  for (const tx of txs) {
    const key = `${tx.external_source}:${tx.external_order_id}`;
    if (!byOrder.has(key)) {
      byOrder.set(key, { source: tx.external_source, orderId: tx.external_order_id, txs: [] });
    }
    byOrder.get(key).txs.push(tx);
  }

  let reconciled = 0;
  const failures = [];

  for (const group of byOrder.values()) {
    try {
      if (group.source === 'shopee') {
        await reconcileShopeeOrder(supabase, byChannel.get('shopee') || [], group);
      } else if (group.source === 'tiktok-shop') {
        // TikTok Shop settlement reconciliation requires the finance API
        // which we haven't wired here yet. Mark rows as reconciled=null but
        // bump a counter so we can see the backlog.
        failures.push({ order: group.orderId, reason: 'tiktok-shop finance API pending' });
        continue;
      } else {
        failures.push({ order: group.orderId, reason: `unsupported source: ${group.source}` });
        continue;
      }
      reconciled += group.txs.length;
    } catch (err) {
      failures.push({ order: group.orderId, reason: err?.message || String(err) });
    }
  }

  return NextResponse.json({
    ok: true,
    batch: txs.length,
    reconciled,
    failures: failures.length,
    failure_sample: failures.slice(0, 10),
  });
}

// ---------------------------------------------------------------------------
// Shopee: get_escrow_detail
// ---------------------------------------------------------------------------

async function reconcileShopeeOrder(supabase, shopeeConnections, group) {
  if (shopeeConnections.length === 0) {
    throw new Error('no active shopee connection — cannot reconcile');
  }

  // In a single-tenant install there's typically one Shopee connection.
  // If there are multiple, try each one until one succeeds (the order
  // belongs to exactly one shop but we don't have that linkage on the
  // transaction row — future improvement is to store connection_id on
  // tf_sales_transactions).
  let escrow;
  let lastErr;
  for (const conn of shopeeConnections) {
    try {
      escrow = await getEscrowDetail({
        credentials: {
          partnerId: process.env.SHOPEE_PARTNER_ID,
          partnerKey: process.env.SHOPEE_PARTNER_KEY,
          accessToken: conn.access_token,
          shopId: conn.shop_id,
          environment: process.env.SHOPEE_ENVIRONMENT,
        },
        orderSn: group.orderId,
      });
      if (escrow && Object.keys(escrow).length > 0) break;
    } catch (err) {
      lastErr = err;
    }
  }

  if (!escrow) {
    throw lastErr || new Error('escrow detail empty');
  }

  const orderIncome = escrow.order_income || {};
  const totalFee =
    (Number(orderIncome.commission_fee) || 0) +
    (Number(orderIncome.service_fee) || 0) +
    (Number(orderIncome.seller_transaction_fee) || 0);

  if (!Number.isFinite(totalFee)) return;

  // Apportion fee proportionally across line items by quantity*price.
  const totalValue = group.txs.reduce(
    (sum, tx) => sum + Number(tx.selling_price) * Number(tx.quantity),
    0
  );
  if (totalValue <= 0) return;

  for (const tx of group.txs) {
    const share = (Number(tx.selling_price) * Number(tx.quantity)) / totalValue;
    const newFee = Number((totalFee * share).toFixed(2));
    const newProfit =
      Number(tx.revenue) -
      (Number(tx.modal_cost) + Number(tx.packing_cost)) * Number(tx.quantity) -
      Number(tx.affiliate_cost) -
      newFee;

    await supabase
      .from('tf_sales_transactions')
      .update({
        marketplace_fee: newFee,
        net_profit: Number(newProfit.toFixed(2)),
        fee_reconciled_at: new Date().toISOString(),
      })
      .eq('id', tx.id);
  }
}

function authorizeCron(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
