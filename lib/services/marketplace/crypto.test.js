// lib/services/marketplace/crypto.test.js
//
// Run with:
//   node --test lib/services/marketplace/crypto.test.js

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import {
  encryptToken,
  decryptToken,
  hmacSha256Hex,
  hmacSha256Bytes,
  timingSafeEqualString,
  __resetKeyCache,
} from './crypto.js';

// Set a deterministic key for the test process. 32 raw bytes base64-encoded.
before(() => {
  process.env.MARKETPLACE_ENCRYPTION_KEY = crypto
    .randomBytes(32)
    .toString('base64');
  __resetKeyCache();
});

// ---------------------------------------------------------------------------
// encryptToken / decryptToken round-trip
// ---------------------------------------------------------------------------

test('encrypt/decrypt: round-trips a short access token', () => {
  const plaintext = 'tiktok_access_token_abc123';
  const ct = encryptToken(plaintext);
  assert.notEqual(ct, plaintext);
  assert.equal(decryptToken(ct), plaintext);
});

test('encrypt/decrypt: round-trips a long refresh token', () => {
  const plaintext = 'x'.repeat(2048);
  const ct = encryptToken(plaintext);
  assert.equal(decryptToken(ct), plaintext);
});

test('encrypt/decrypt: round-trips Unicode', () => {
  const plaintext = 'Toko Ibu Clarice — PIK, Jakarta 🇮🇩';
  const ct = encryptToken(plaintext);
  assert.equal(decryptToken(ct), plaintext);
});

test('encrypt: two calls produce different ciphertext (IV is random)', () => {
  const plaintext = 'same_plaintext';
  const a = encryptToken(plaintext);
  const b = encryptToken(plaintext);
  assert.notEqual(a, b);
  // But both decrypt back to the same plaintext
  assert.equal(decryptToken(a), plaintext);
  assert.equal(decryptToken(b), plaintext);
});

test('decrypt: tampering with the ciphertext throws (GCM auth tag check)', () => {
  const plaintext = 'sensitive_token';
  const ct = encryptToken(plaintext);
  // Flip a byte in the middle of the ciphertext
  const buf = Buffer.from(ct, 'base64');
  buf[20] = buf[20] ^ 0xff;
  const tamperedB64 = buf.toString('base64');

  assert.throws(() => decryptToken(tamperedB64));
});

test('encrypt: throws on empty string', () => {
  assert.throws(() => encryptToken(''), /non-empty/);
});

test('encrypt: throws on non-string input', () => {
  assert.throws(() => encryptToken(null), /non-empty/);
  assert.throws(() => encryptToken(undefined), /non-empty/);
  assert.throws(() => encryptToken(123), /non-empty/);
});

test('decrypt: throws on ciphertext that is too short', () => {
  assert.throws(() => decryptToken('dGVzdA=='), /too short/); // "test" in base64 → 4 bytes
});

// ---------------------------------------------------------------------------
// HMAC helpers
// ---------------------------------------------------------------------------

test('hmacSha256Hex: matches Node crypto reference', () => {
  const key = 'secret';
  const message = 'hello world';
  const ours = hmacSha256Hex(key, message);
  const ref = crypto.createHmac('sha256', key).update(message).digest('hex');
  assert.equal(ours, ref);
});

test('hmacSha256Bytes: returns a Buffer matching the hex digest', () => {
  const key = 'k';
  const message = 'm';
  const bytes = hmacSha256Bytes(key, message);
  assert.ok(Buffer.isBuffer(bytes));
  assert.equal(bytes.length, 32);
  assert.equal(bytes.toString('hex'), hmacSha256Hex(key, message));
});

// ---------------------------------------------------------------------------
// timingSafeEqualString
// ---------------------------------------------------------------------------

test('timingSafeEqualString: equal strings return true', () => {
  assert.equal(timingSafeEqualString('abc', 'abc'), true);
});

test('timingSafeEqualString: different strings return false', () => {
  assert.equal(timingSafeEqualString('abc', 'abd'), false);
});

test('timingSafeEqualString: different lengths return false without throwing', () => {
  assert.equal(timingSafeEqualString('abc', 'abcd'), false);
  assert.equal(timingSafeEqualString('', 'x'), false);
});

test('timingSafeEqualString: non-strings return false', () => {
  assert.equal(timingSafeEqualString(null, 'abc'), false);
  assert.equal(timingSafeEqualString('abc', undefined), false);
  assert.equal(timingSafeEqualString(123, '123'), false);
});
