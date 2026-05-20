// lib/services/marketplace/shopee/signer.test.js
//
// Run with:
//   node --test lib/services/marketplace/shopee/signer.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import {
  signShopeePublic,
  signShopeeShop,
  buildShopeePublicRequest,
  buildShopeeShopRequest,
  getShopeeHost,
  SHOPEE_LIVE_HOST,
  SHOPEE_TEST_HOST,
} from './signer.js';

function refHmac(key, message) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

// ---------------------------------------------------------------------------
// Host selection
// ---------------------------------------------------------------------------

test('getShopeeHost: explicit live returns production host', () => {
  assert.equal(getShopeeHost('live'), SHOPEE_LIVE_HOST);
});

test('getShopeeHost: explicit test returns UAT host', () => {
  assert.equal(getShopeeHost('test'), SHOPEE_TEST_HOST);
});

test('getShopeeHost: reads SHOPEE_ENVIRONMENT env var', () => {
  const original = process.env.SHOPEE_ENVIRONMENT;
  try {
    process.env.SHOPEE_ENVIRONMENT = 'live';
    assert.equal(getShopeeHost(), SHOPEE_LIVE_HOST);
    process.env.SHOPEE_ENVIRONMENT = 'test';
    assert.equal(getShopeeHost(), SHOPEE_TEST_HOST);
  } finally {
    process.env.SHOPEE_ENVIRONMENT = original;
  }
});

// ---------------------------------------------------------------------------
// signShopeePublic — for auth endpoints
// ---------------------------------------------------------------------------

test('signShopeePublic: base = partner_id + path + timestamp', () => {
  const sign = signShopeePublic({
    partnerId: 2001234,
    partnerKey: 'pkey_abcdef',
    path: '/api/v2/shop/auth_partner',
    timestamp: 1700000000,
  });

  const expected = refHmac('pkey_abcdef', '2001234/api/v2/shop/auth_partner1700000000');
  assert.equal(sign, expected);
});

test('signShopeePublic: output is lowercase hex', () => {
  const sign = signShopeePublic({
    partnerId: 2001234,
    partnerKey: 'pkey_abcdef',
    path: '/api/v2/auth/token/get',
    timestamp: 1700000000,
  });
  assert.equal(sign, sign.toLowerCase());
  assert.match(sign, /^[0-9a-f]{64}$/);
});

test('signShopeePublic: throws on missing partner_key', () => {
  assert.throws(() =>
    signShopeePublic({
      partnerId: 2001234,
      partnerKey: '',
      path: '/api/v2/shop/auth_partner',
      timestamp: 1700000000,
    })
  );
});

test('signShopeePublic: throws on non-numeric timestamp', () => {
  assert.throws(() =>
    signShopeePublic({
      partnerId: 2001234,
      partnerKey: 'pkey',
      path: '/api/v2/shop/auth_partner',
      timestamp: 'not-a-number',
    })
  );
});

test('signShopeePublic: throws on path without leading slash', () => {
  assert.throws(() =>
    signShopeePublic({
      partnerId: 2001234,
      partnerKey: 'pkey',
      path: 'api/v2/shop/auth_partner',
      timestamp: 1700000000,
    })
  );
});

// ---------------------------------------------------------------------------
// signShopeeShop — for authenticated shop endpoints
// ---------------------------------------------------------------------------

test('signShopeeShop: base = partner_id + path + timestamp + access_token + shop_id', () => {
  const sign = signShopeeShop({
    partnerId: 2001234,
    partnerKey: 'pkey_abcdef',
    path: '/api/v2/order/get_order_list',
    timestamp: 1700000000,
    accessToken: 'atok_xyz',
    shopId: 555666,
  });

  const expected = refHmac(
    'pkey_abcdef',
    '2001234/api/v2/order/get_order_list1700000000atok_xyz555666'
  );
  assert.equal(sign, expected);
});

test('signShopeeShop: throws on missing access_token', () => {
  assert.throws(() =>
    signShopeeShop({
      partnerId: 2001234,
      partnerKey: 'pkey',
      path: '/api/v2/order/get_order_list',
      timestamp: 1700000000,
      accessToken: '',
      shopId: 555666,
    })
  );
});

test('signShopeeShop: throws on missing shop_id', () => {
  assert.throws(() =>
    signShopeeShop({
      partnerId: 2001234,
      partnerKey: 'pkey',
      path: '/api/v2/order/get_order_list',
      timestamp: 1700000000,
      accessToken: 'atok',
      shopId: '',
    })
  );
});

// ---------------------------------------------------------------------------
// buildShopeePublicRequest
// ---------------------------------------------------------------------------

test('buildShopeePublicRequest: GET auth_partner URL includes partner_id, timestamp, sign', () => {
  const result = buildShopeePublicRequest({
    method: 'GET',
    path: '/api/v2/shop/auth_partner',
    extraQuery: { redirect: 'https://tokoflow.vercel.app/cb' },
    partnerId: 2001234,
    partnerKey: 'pkey_abcdef',
    timestamp: 1700000000,
    environment: 'test',
  });

  assert.ok(result.url.startsWith(SHOPEE_TEST_HOST));
  assert.ok(result.url.includes('partner_id=2001234'));
  assert.ok(result.url.includes('timestamp=1700000000'));
  assert.ok(result.url.includes(`sign=${result.debug.sign}`));
  assert.ok(result.url.includes('redirect=https'));
  assert.equal(result.method, 'GET');
  assert.equal(result.body, null);
});

test('buildShopeePublicRequest: POST token/get serializes JSON body (but does NOT sign it)', () => {
  const result = buildShopeePublicRequest({
    method: 'POST',
    path: '/api/v2/auth/token/get',
    body: { partner_id: 2001234, code: 'AUTHCODE', shop_id: 555666 },
    partnerId: 2001234,
    partnerKey: 'pkey_abcdef',
    timestamp: 1700000000,
  });

  assert.equal(result.method, 'POST');
  // The signed base uses ONLY partner_id + path + timestamp
  const expected = refHmac('pkey_abcdef', '2001234/api/v2/auth/token/get1700000000');
  assert.equal(result.debug.sign, expected);
  // Body serialized separately
  assert.ok(typeof result.body === 'string');
  assert.ok(result.body.includes('"code":"AUTHCODE"'));
});

// ---------------------------------------------------------------------------
// buildShopeeShopRequest
// ---------------------------------------------------------------------------

test('buildShopeeShopRequest: GET get_order_list includes access_token and shop_id in URL', () => {
  const result = buildShopeeShopRequest({
    method: 'GET',
    path: '/api/v2/order/get_order_list',
    extraQuery: {
      time_range_field: 'update_time',
      time_from: 1700000000,
      time_to: 1701000000,
      page_size: 100,
    },
    partnerId: 2001234,
    partnerKey: 'pkey_abcdef',
    accessToken: 'atok_xyz',
    shopId: 555666,
    timestamp: 1700500000,
    environment: 'test',
  });

  assert.ok(result.url.startsWith(SHOPEE_TEST_HOST));
  assert.ok(result.url.includes('access_token=atok_xyz'));
  assert.ok(result.url.includes('shop_id=555666'));
  assert.ok(result.url.includes('time_range_field=update_time'));

  // Sign must match manual computation
  const expected = refHmac(
    'pkey_abcdef',
    '2001234/api/v2/order/get_order_list1700500000atok_xyz555666'
  );
  assert.equal(result.debug.sign, expected);
});

test('buildShopeeShopRequest: same inputs → deterministic sign', () => {
  const args = {
    method: 'GET',
    path: '/api/v2/order/get_order_detail',
    partnerId: 2001234,
    partnerKey: 'pkey_abcdef',
    accessToken: 'atok_xyz',
    shopId: 555666,
    timestamp: 1700500000,
  };
  const a = buildShopeeShopRequest(args);
  const b = buildShopeeShopRequest(args);
  assert.equal(a.debug.sign, b.debug.sign);
  assert.equal(a.url, b.url);
});

test('buildShopeePublicRequest: environment=live uses production host', () => {
  const result = buildShopeePublicRequest({
    method: 'GET',
    path: '/api/v2/shop/auth_partner',
    partnerId: 2001234,
    partnerKey: 'pkey',
    timestamp: 1700000000,
    environment: 'live',
  });
  assert.ok(result.url.startsWith(SHOPEE_LIVE_HOST));
});
