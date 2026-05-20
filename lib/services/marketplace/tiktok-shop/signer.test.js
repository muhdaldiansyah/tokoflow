// lib/services/marketplace/tiktok-shop/signer.test.js
//
// Unit tests for the TikTok Shop Partner Center request signer.
//
// Run with:
//   node --test lib/services/marketplace/tiktok-shop/signer.test.js
//
// These are white-box tests — they verify the signer implementation matches
// its documented algorithm (prepend path, sorted k-v concat, wrap with
// app_secret, HMAC-SHA256 hex). They do NOT prove correctness against a
// live TikTok Shop endpoint; that's the job of the Phase G integration
// test against a real test shop. But regressions in the algorithm are
// caught here before they hit production.
//
// Ground truth: the algorithm is documented in the signer source comment
// and derived from the EcomPHP/tiktokshop-php SDK (Client.php). Every
// assertion below has a comment linking it back to a specific rule in the
// spec.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import {
  signTikTokShopRequest,
  isShoplessPath,
  buildSignableString,
  stableJsonStringify,
} from './signer.js';

// Helper: hand-compute the expected sign for a given wrapped string.
function expectedSign(appSecret, wrapped) {
  return crypto.createHmac('sha256', appSecret).update(wrapped).digest('hex');
}

// ---------------------------------------------------------------------------
// isShoplessPath
// ---------------------------------------------------------------------------

test('isShoplessPath: /authorization/* is shopless', () => {
  assert.equal(isShoplessPath('/authorization/202309/shops'), true);
  assert.equal(isShoplessPath('/authorization/202309/token/get'), true);
});

test('isShoplessPath: /seller/* is shopless', () => {
  assert.equal(isShoplessPath('/seller/202309/info'), true);
});

test('isShoplessPath: /order/* is NOT shopless', () => {
  assert.equal(isShoplessPath('/order/202309/orders/search'), false);
});

test('isShoplessPath: /product/202309/categories is shopless (exact match)', () => {
  assert.equal(isShoplessPath('/product/202309/categories'), true);
});

test('isShoplessPath: /product/202309/products/search is NOT shopless', () => {
  assert.equal(isShoplessPath('/product/202309/products/search'), false);
});

// ---------------------------------------------------------------------------
// buildSignableString — core algorithm
// ---------------------------------------------------------------------------

test('buildSignableString: sorts keys alphabetically and concatenates k+v', () => {
  const signable = buildSignableString({
    path: '/order/202309/orders/search',
    query: { app_key: 'APPKEY', timestamp: 1700000000, shop_cipher: 'SHOPCIPHER' },
    method: 'GET',
    body: null,
    contentType: 'application/json',
  });

  // keys sorted: app_key, shop_cipher, timestamp
  // concat: 'app_keyAPPKEY' + 'shop_cipherSHOPCIPHER' + 'timestamp1700000000'
  // prepended with path
  assert.equal(
    signable,
    '/order/202309/orders/searchapp_keyAPPKEYshop_cipherSHOPCIPHERtimestamp1700000000'
  );
});

test('buildSignableString: excludes sign and access_token from signature', () => {
  const signable = buildSignableString({
    path: '/order/202309/orders/search',
    query: {
      app_key: 'APPKEY',
      timestamp: 1700000000,
      shop_cipher: 'SHOPCIPHER',
      sign: 'SHOULD_NOT_APPEAR',
      access_token: 'SHOULD_NOT_APPEAR',
      'x-tts-access-token': 'SHOULD_NOT_APPEAR',
    },
    method: 'GET',
    body: null,
    contentType: 'application/json',
  });

  // sign/access_token/x-tts-access-token excluded → same output as above
  assert.equal(
    signable,
    '/order/202309/orders/searchapp_keyAPPKEYshop_cipherSHOPCIPHERtimestamp1700000000'
  );
});

test('buildSignableString: skips null, undefined, and array values', () => {
  const signable = buildSignableString({
    path: '/order/202309/orders/search',
    query: {
      app_key: 'APPKEY',
      timestamp: 1700000000,
      maybe_null: null,
      maybe_undef: undefined,
      maybe_array: ['a', 'b'],
    },
    method: 'GET',
    body: null,
    contentType: 'application/json',
  });

  assert.equal(signable, '/order/202309/orders/searchapp_keyAPPKEYtimestamp1700000000');
});

test('buildSignableString: appends JSON body for POST with application/json', () => {
  const signable = buildSignableString({
    path: '/order/202309/orders/search',
    query: { app_key: 'APPKEY', timestamp: 1700000000, shop_cipher: 'SHOPCIPHER' },
    method: 'POST',
    body: { page_size: 50, order_status: 'UNPAID' },
    contentType: 'application/json',
  });

  // body stableJsonStringify sorts keys → {"order_status":"UNPAID","page_size":50}
  const expectedBody = '{"order_status":"UNPAID","page_size":50}';
  assert.equal(
    signable,
    '/order/202309/orders/searchapp_keyAPPKEYshop_cipherSHOPCIPHERtimestamp1700000000' +
      expectedBody
  );
});

test('buildSignableString: does NOT append body for multipart/form-data', () => {
  const signable = buildSignableString({
    path: '/product/202309/images/upload',
    query: { app_key: 'APPKEY', timestamp: 1700000000 },
    method: 'POST',
    body: { something: 'binary' },
    contentType: 'multipart/form-data',
  });

  assert.equal(signable, '/product/202309/images/uploadapp_keyAPPKEYtimestamp1700000000');
});

test('buildSignableString: does NOT append body for GET even if body is passed', () => {
  const signable = buildSignableString({
    path: '/order/202309/orders',
    query: { app_key: 'APPKEY', timestamp: 1700000000, shop_cipher: 'SHOPCIPHER' },
    method: 'GET',
    body: { should_be_ignored: true },
    contentType: 'application/json',
  });

  assert.equal(
    signable,
    '/order/202309/ordersapp_keyAPPKEYshop_cipherSHOPCIPHERtimestamp1700000000'
  );
});

// ---------------------------------------------------------------------------
// stableJsonStringify — body byte-identity for signing
// ---------------------------------------------------------------------------

test('stableJsonStringify: sorts keys at every nesting level', () => {
  const out = stableJsonStringify({
    zeta: 1,
    alpha: { charlie: 3, bravo: 2 },
    beta: [{ y: 2, x: 1 }, { b: 2, a: 1 }],
  });
  assert.equal(
    out,
    '{"alpha":{"bravo":2,"charlie":3},"beta":[{"x":1,"y":2},{"a":1,"b":2}],"zeta":1}'
  );
});

test('stableJsonStringify: preserves array order', () => {
  const out = stableJsonStringify({ list: [3, 1, 2] });
  assert.equal(out, '{"list":[3,1,2]}');
});

// ---------------------------------------------------------------------------
// signTikTokShopRequest — end-to-end
// ---------------------------------------------------------------------------

test('signTikTokShopRequest: GET with shop_cipher produces a valid signed URL', () => {
  const result = signTikTokShopRequest({
    method: 'GET',
    path: '/order/202309/orders',
    query: { ids: 'order123' },
    appKey: 'APPKEY',
    appSecret: 'APPSECRET',
    accessToken: 'ACCESSTOKEN',
    shopCipher: 'SHOPCIPHER',
    timestamp: 1700000000,
  });

  // Manually compute the expected sign.
  // signable: path + sorted(app_key,ids,shop_cipher,timestamp) k+v concat
  const manualSignable =
    '/order/202309/ordersapp_keyAPPKEYidsorder123shop_cipherSHOPCIPHERtimestamp1700000000';
  const manualWrapped = 'APPSECRET' + manualSignable + 'APPSECRET';
  const manualSign = expectedSign('APPSECRET', manualWrapped);

  assert.equal(result.debug.signable, manualSignable);
  assert.equal(result.debug.sign, manualSign);
  assert.ok(result.url.includes(`sign=${manualSign}`));
  assert.ok(result.url.includes('shop_cipher=SHOPCIPHER'));
  assert.ok(result.url.includes('app_key=APPKEY'));
  assert.equal(result.headers['x-tts-access-token'], 'ACCESSTOKEN');
  assert.equal(result.body, null);
});

test('signTikTokShopRequest: POST body is byte-identical between sign and transmit', () => {
  const bodyObj = { page_size: 50, order_status: 'UNPAID' };
  const result = signTikTokShopRequest({
    method: 'POST',
    path: '/order/202309/orders/search',
    body: bodyObj,
    appKey: 'APPKEY',
    appSecret: 'APPSECRET',
    accessToken: 'ACCESSTOKEN',
    shopCipher: 'SHOPCIPHER',
    timestamp: 1700000000,
  });

  // The body string we send on the wire must be exactly what we signed.
  // Reconstruct the signable using the same serialized body and verify.
  const wireBody = result.body;
  assert.equal(wireBody, '{"order_status":"UNPAID","page_size":50}');

  const manualSignable =
    '/order/202309/orders/searchapp_keyAPPKEYshop_cipherSHOPCIPHERtimestamp1700000000' +
    wireBody;
  const manualWrapped = 'APPSECRET' + manualSignable + 'APPSECRET';
  const manualSign = expectedSign('APPSECRET', manualWrapped);

  assert.equal(result.debug.sign, manualSign);
});

test('signTikTokShopRequest: shopless path (/authorization/...) does NOT require shop_cipher', () => {
  const result = signTikTokShopRequest({
    method: 'GET',
    path: '/authorization/202309/shops',
    appKey: 'APPKEY',
    appSecret: 'APPSECRET',
    accessToken: 'ACCESSTOKEN',
    timestamp: 1700000000,
    // no shopCipher provided — should not throw
  });

  assert.ok(!result.url.includes('shop_cipher'));
  assert.ok(result.url.includes('sign='));

  const manualSignable =
    '/authorization/202309/shopsapp_keyAPPKEYtimestamp1700000000';
  assert.equal(result.debug.signable, manualSignable);
});

test('signTikTokShopRequest: non-shopless path without shop_cipher throws', () => {
  assert.throws(
    () =>
      signTikTokShopRequest({
        method: 'GET',
        path: '/order/202309/orders',
        appKey: 'APPKEY',
        appSecret: 'APPSECRET',
        accessToken: 'ACCESSTOKEN',
        timestamp: 1700000000,
        // shopCipher missing
      }),
    /shop_cipher is required/
  );
});

test('signTikTokShopRequest: missing appKey throws', () => {
  assert.throws(
    () =>
      signTikTokShopRequest({
        method: 'GET',
        path: '/authorization/202309/shops',
        appSecret: 'APPSECRET',
        timestamp: 1700000000,
      }),
    /appKey is required/
  );
});

test('signTikTokShopRequest: missing appSecret throws', () => {
  assert.throws(
    () =>
      signTikTokShopRequest({
        method: 'GET',
        path: '/authorization/202309/shops',
        appKey: 'APPKEY',
        timestamp: 1700000000,
      }),
    /appSecret is required/
  );
});

test('signTikTokShopRequest: path without leading slash throws', () => {
  assert.throws(
    () =>
      signTikTokShopRequest({
        method: 'GET',
        path: 'order/202309/orders', // missing slash
        appKey: 'APPKEY',
        appSecret: 'APPSECRET',
        shopCipher: 'SHOPCIPHER',
        timestamp: 1700000000,
      }),
    /path must start with/
  );
});

test('signTikTokShopRequest: two calls with same inputs produce identical signatures', () => {
  const args = {
    method: 'POST',
    path: '/order/202309/orders/search',
    body: { page_size: 20, order_status: 'COMPLETED' },
    appKey: 'APPKEY',
    appSecret: 'APPSECRET',
    accessToken: 'ACCESSTOKEN',
    shopCipher: 'SHOPCIPHER',
    timestamp: 1700000000,
  };
  const a = signTikTokShopRequest(args);
  const b = signTikTokShopRequest(args);
  assert.equal(a.debug.sign, b.debug.sign);
  assert.equal(a.url, b.url);
  assert.equal(a.body, b.body);
});
