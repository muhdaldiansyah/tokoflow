// lib/services/marketplace/tiktok-shop/webhooks.test.js
//
// Run with:
//   node --test lib/services/marketplace/tiktok-shop/webhooks.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import {
  verifyWebhookSignature,
  parseEvent,
  extractOrderIdFromData,
  EVENT_TYPES,
} from './webhooks.js';

const APP_KEY = 'APPKEY';
const APP_SECRET = 'APPSECRET';

function sign(rawBody) {
  return crypto
    .createHmac('sha256', APP_SECRET)
    .update(APP_KEY + rawBody)
    .digest('hex');
}

// ---------------------------------------------------------------------------
// verifyWebhookSignature
// ---------------------------------------------------------------------------

test('verifyWebhookSignature: accepts a correct lowercase hex signature', () => {
  const rawBody = '{"type":1,"shop_id":"123","data":{"order_id":"XYZ"}}';
  const authHeader = sign(rawBody);

  assert.equal(
    verifyWebhookSignature({ rawBody, appKey: APP_KEY, appSecret: APP_SECRET, authHeader }),
    true
  );
});

test('verifyWebhookSignature: accepts uppercase hex (case-insensitive)', () => {
  const rawBody = '{"type":1}';
  const authHeader = sign(rawBody).toUpperCase();

  assert.equal(
    verifyWebhookSignature({ rawBody, appKey: APP_KEY, appSecret: APP_SECRET, authHeader }),
    true
  );
});

test('verifyWebhookSignature: rejects tampered body (any byte flip)', () => {
  const rawBody = '{"type":1,"shop_id":"123"}';
  const authHeader = sign(rawBody);
  const tampered = '{"type":2,"shop_id":"123"}'; // different type

  assert.equal(
    verifyWebhookSignature({
      rawBody: tampered,
      appKey: APP_KEY,
      appSecret: APP_SECRET,
      authHeader,
    }),
    false
  );
});

test('verifyWebhookSignature: rejects wrong app_secret', () => {
  const rawBody = '{"type":1}';
  const authHeader = sign(rawBody);

  assert.equal(
    verifyWebhookSignature({
      rawBody,
      appKey: APP_KEY,
      appSecret: 'WRONG_SECRET',
      authHeader,
    }),
    false
  );
});

test('verifyWebhookSignature: rejects wrong app_key', () => {
  const rawBody = '{"type":1}';
  const authHeader = sign(rawBody); // signed with correct APP_KEY

  assert.equal(
    verifyWebhookSignature({
      rawBody,
      appKey: 'WRONG_APP_KEY',
      appSecret: APP_SECRET,
      authHeader,
    }),
    false
  );
});

test('verifyWebhookSignature: rejects missing/empty authHeader', () => {
  const rawBody = '{"type":1}';

  assert.equal(
    verifyWebhookSignature({ rawBody, appKey: APP_KEY, appSecret: APP_SECRET, authHeader: '' }),
    false
  );
  assert.equal(
    verifyWebhookSignature({ rawBody, appKey: APP_KEY, appSecret: APP_SECRET, authHeader: null }),
    false
  );
});

test('verifyWebhookSignature: rejects non-string rawBody', () => {
  assert.equal(
    verifyWebhookSignature({
      rawBody: null,
      appKey: APP_KEY,
      appSecret: APP_SECRET,
      authHeader: 'x',
    }),
    false
  );
});

// ---------------------------------------------------------------------------
// parseEvent
// ---------------------------------------------------------------------------

test('parseEvent: parses a valid ORDER_STATUS_UPDATE payload', () => {
  const raw = JSON.stringify({
    type: 1,
    tts_notification_id: 'notif_abc',
    shop_id: '7294',
    timestamp: 1700000000,
    data: { order_id: 'ORD12345', order_status: 'AWAITING_SHIPMENT', update_time: 1700000001 },
  });
  const evt = parseEvent(raw);

  assert.equal(evt.type, 1);
  assert.equal(evt.typeName, 'ORDER_STATUS_UPDATE');
  assert.equal(evt.known, true);
  assert.equal(evt.shopId, '7294');
  assert.equal(evt.timestamp, 1700000000);
  assert.equal(evt.notificationId, 'notif_abc');
  assert.equal(evt.externalOrderId, 'ORD12345');
});

test('parseEvent: parses a SELLER_DEAUTHORIZATION payload', () => {
  const raw = JSON.stringify({
    type: 6,
    shop_id: '7294',
    timestamp: 1700000000,
    data: {},
  });
  const evt = parseEvent(raw);

  assert.equal(evt.type, 6);
  assert.equal(evt.typeName, 'SELLER_DEAUTHORIZATION');
  assert.equal(evt.known, true);
  assert.equal(evt.externalOrderId, null);
});

test('parseEvent: marks unknown event types as known=false without throwing', () => {
  const raw = JSON.stringify({ type: 999, shop_id: '1', timestamp: 0, data: {} });
  const evt = parseEvent(raw);

  assert.equal(evt.type, 999);
  assert.equal(evt.known, false);
  assert.equal(evt.typeName, undefined);
});

test('parseEvent: throws on invalid JSON', () => {
  assert.throws(() => parseEvent('not json'), /not valid JSON/);
});

test('parseEvent: throws on non-object payload', () => {
  assert.throws(() => parseEvent('123'), /did not decode to an object/);
});

// ---------------------------------------------------------------------------
// extractOrderIdFromData
// ---------------------------------------------------------------------------

test('extractOrderIdFromData: pulls order_id from ORDER_STATUS_UPDATE data', () => {
  assert.equal(
    extractOrderIdFromData(EVENT_TYPES.ORDER_STATUS_UPDATE, { order_id: 'ORD1' }),
    'ORD1'
  );
});

test('extractOrderIdFromData: returns null for types without order_id', () => {
  assert.equal(
    extractOrderIdFromData(EVENT_TYPES.SELLER_DEAUTHORIZATION, {}),
    null
  );
});

test('extractOrderIdFromData: returns null when data is null', () => {
  assert.equal(extractOrderIdFromData(EVENT_TYPES.ORDER_STATUS_UPDATE, null), null);
});
