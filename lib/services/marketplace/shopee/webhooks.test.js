// lib/services/marketplace/shopee/webhooks.test.js
//
// Run with:
//   node --test lib/services/marketplace/shopee/webhooks.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import {
  verifyWebhookSignature,
  parseEvent,
  extractOrderIdFromData,
  EVENT_CODES,
} from './webhooks.js';

const PARTNER_KEY = 'pkey_secret';
const WEBHOOK_URL = 'https://tokoflow.vercel.app/api/webhooks/shopee';

function signVariantA(url, body) {
  return crypto.createHmac('sha256', PARTNER_KEY).update(`${url}|${body}`).digest('hex');
}
function signVariantB(body) {
  return crypto.createHmac('sha256', PARTNER_KEY).update(body).digest('hex');
}

// ---------------------------------------------------------------------------
// verifyWebhookSignature — Variant A (Authorization header, url+body)
// ---------------------------------------------------------------------------

test('verifyWebhookSignature: accepts Variant A (Authorization, url+body)', () => {
  const rawBody = '{"code":3,"shop_id":123}';
  const authHeader = signVariantA(WEBHOOK_URL, rawBody);

  const result = verifyWebhookSignature({
    rawBody,
    partnerKey: PARTNER_KEY,
    url: WEBHOOK_URL,
    authHeader,
  });

  assert.equal(result.verified, true);
  assert.equal(result.variant, 'authorization');
});

test('verifyWebhookSignature: Variant A is URL-sensitive (wrong URL → reject)', () => {
  const rawBody = '{"code":3}';
  const authHeader = signVariantA(WEBHOOK_URL, rawBody);

  const result = verifyWebhookSignature({
    rawBody,
    partnerKey: PARTNER_KEY,
    url: 'https://different.url/path',
    authHeader,
  });

  assert.equal(result.verified, false);
});

// ---------------------------------------------------------------------------
// verifyWebhookSignature — Variant B (X-Shopee-Signature, body only)
// ---------------------------------------------------------------------------

test('verifyWebhookSignature: accepts Variant B (X-Shopee-Signature, body)', () => {
  const rawBody = '{"code":3,"shop_id":123}';
  const signatureHeader = signVariantB(rawBody);

  const result = verifyWebhookSignature({
    rawBody,
    partnerKey: PARTNER_KEY,
    url: WEBHOOK_URL,
    signatureHeader,
  });

  assert.equal(result.verified, true);
  assert.equal(result.variant, 'x-shopee-signature');
});

test('verifyWebhookSignature: Variant B ignores URL', () => {
  const rawBody = '{"code":3}';
  const signatureHeader = signVariantB(rawBody);

  const result = verifyWebhookSignature({
    rawBody,
    partnerKey: PARTNER_KEY,
    url: 'https://completely.wrong/url',
    signatureHeader,
  });

  assert.equal(result.verified, true);
  assert.equal(result.variant, 'x-shopee-signature');
});

// ---------------------------------------------------------------------------
// verifyWebhookSignature — failure modes
// ---------------------------------------------------------------------------

test('verifyWebhookSignature: wrong partner_key → reject', () => {
  const rawBody = '{"code":3}';
  const authHeader = signVariantA(WEBHOOK_URL, rawBody);

  const result = verifyWebhookSignature({
    rawBody,
    partnerKey: 'WRONG_KEY',
    url: WEBHOOK_URL,
    authHeader,
  });

  assert.equal(result.verified, false);
});

test('verifyWebhookSignature: tampered body → reject', () => {
  const rawBody = '{"code":3}';
  const authHeader = signVariantA(WEBHOOK_URL, rawBody);

  const result = verifyWebhookSignature({
    rawBody: '{"code":10}', // tampered
    partnerKey: PARTNER_KEY,
    url: WEBHOOK_URL,
    authHeader,
  });

  assert.equal(result.verified, false);
});

test('verifyWebhookSignature: no headers provided → reject (not throw)', () => {
  const result = verifyWebhookSignature({
    rawBody: '{"code":3}',
    partnerKey: PARTNER_KEY,
    url: WEBHOOK_URL,
  });

  assert.equal(result.verified, false);
  assert.equal(result.variant, null);
});

test('verifyWebhookSignature: both headers present, variant A wins if it matches', () => {
  const rawBody = '{"code":3}';
  const authHeader = signVariantA(WEBHOOK_URL, rawBody);
  const signatureHeader = signVariantB(rawBody);

  const result = verifyWebhookSignature({
    rawBody,
    partnerKey: PARTNER_KEY,
    url: WEBHOOK_URL,
    authHeader,
    signatureHeader,
  });

  assert.equal(result.verified, true);
  assert.equal(result.variant, 'authorization');
});

test('verifyWebhookSignature: both headers present, A wrong but B right → B wins', () => {
  const rawBody = '{"code":3}';
  const authHeader = 'deadbeef'; // wrong
  const signatureHeader = signVariantB(rawBody); // right

  const result = verifyWebhookSignature({
    rawBody,
    partnerKey: PARTNER_KEY,
    url: WEBHOOK_URL,
    authHeader,
    signatureHeader,
  });

  assert.equal(result.verified, true);
  assert.equal(result.variant, 'x-shopee-signature');
});

// ---------------------------------------------------------------------------
// parseEvent
// ---------------------------------------------------------------------------

test('parseEvent: parses ORDER_STATUS_UPDATE (code 3)', () => {
  const raw = JSON.stringify({
    code: 3,
    shop_id: 555666,
    timestamp: 1700000000,
    data: { ordersn: '2504091234ABCDE', status: 'SHIPPED', update_time: 1700000001 },
  });
  const evt = parseEvent(raw);

  assert.equal(evt.code, 3);
  assert.equal(evt.codeName, 'ORDER_STATUS_UPDATE');
  assert.equal(evt.known, true);
  assert.equal(evt.shopId, '555666');
  assert.equal(evt.externalOrderId, '2504091234ABCDE');
});

test('parseEvent: parses SHOP_DEAUTHORIZATION (code 10)', () => {
  const raw = JSON.stringify({
    code: 10,
    shop_id: 555666,
    timestamp: 1700000000,
    data: {},
  });
  const evt = parseEvent(raw);

  assert.equal(evt.code, 10);
  assert.equal(evt.codeName, 'SHOP_DEAUTHORIZATION');
  assert.equal(evt.externalOrderId, null);
});

test('parseEvent: unknown code → known=false without throwing', () => {
  const raw = JSON.stringify({ code: 999, shop_id: 1, timestamp: 0, data: {} });
  const evt = parseEvent(raw);
  assert.equal(evt.code, 999);
  assert.equal(evt.known, false);
});

test('parseEvent: invalid JSON throws', () => {
  assert.throws(() => parseEvent('not json'), /not valid JSON/);
});

// ---------------------------------------------------------------------------
// extractOrderIdFromData
// ---------------------------------------------------------------------------

test('extractOrderIdFromData: ORDER_STATUS_UPDATE returns ordersn', () => {
  assert.equal(
    extractOrderIdFromData(EVENT_CODES.ORDER_STATUS_UPDATE, { ordersn: 'ORD1' }),
    'ORD1'
  );
});

test('extractOrderIdFromData: SHOP_DEAUTHORIZATION returns null', () => {
  assert.equal(
    extractOrderIdFromData(EVENT_CODES.SHOP_DEAUTHORIZATION, {}),
    null
  );
});
