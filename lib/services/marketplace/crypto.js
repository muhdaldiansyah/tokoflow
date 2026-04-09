// lib/services/marketplace/crypto.js
//
// Cryptographic primitives shared by every marketplace integration.
//
// Two responsibilities:
//
//   1. Token encryption at rest — access_token and refresh_token stored in
//      tf_marketplace_connections are AES-256-GCM encrypted with a key from
//      MARKETPLACE_ENCRYPTION_KEY (base64, 32 raw bytes). The ciphertext is
//      stored as a single base64 string with the format:
//
//          base64( iv[12] || ciphertext || tag[16] )
//
//      This format is self-contained — decryption only needs the key — and
//      lets us rotate keys later by re-encrypting each row individually.
//
//   2. HMAC-SHA256 helpers used by the per-provider signers. Shopee's v2 sign
//      is HMAC-SHA256 hex; TikTok Shop Partner Center uses the same algo
//      but with a different string-to-sign composition. Both are built on
//      the `hmacSha256Hex` primitive below.
//
// All functions are pure wrappers around Node.js built-in `crypto` — no npm
// dependencies. These must run in the Node runtime (not Edge) because the
// `crypto` module used here is the Node-specific API, which is why every
// route that imports this file also sets `export const runtime = 'nodejs'`.

import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// Encryption key management
// ---------------------------------------------------------------------------

let cachedKey = null;

/**
 * Load the AES-256-GCM encryption key from MARKETPLACE_ENCRYPTION_KEY.
 * The env var is base64-encoded 32 raw bytes. Cached after first load.
 *
 * @returns {Buffer} 32-byte key
 * @throws if the env var is missing or malformed
 */
function loadKey() {
  if (cachedKey) return cachedKey;

  const b64 = process.env.MARKETPLACE_ENCRYPTION_KEY;
  if (!b64) {
    throw new Error(
      'MARKETPLACE_ENCRYPTION_KEY is not set. Generate one with: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
  }

  let buf;
  try {
    buf = Buffer.from(b64, 'base64');
  } catch {
    throw new Error('MARKETPLACE_ENCRYPTION_KEY is not valid base64');
  }

  if (buf.length !== 32) {
    throw new Error(
      `MARKETPLACE_ENCRYPTION_KEY must decode to exactly 32 bytes (got ${buf.length}). ` +
        'Regenerate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
  }

  cachedKey = buf;
  return cachedKey;
}

/**
 * For tests only — reset the cached key so a test can swap the env var.
 * Production code should never call this.
 */
export function __resetKeyCache() {
  cachedKey = null;
}

// ---------------------------------------------------------------------------
// Token encryption (AES-256-GCM)
// ---------------------------------------------------------------------------

/**
 * Encrypt a token (access_token or refresh_token) for at-rest storage.
 * Returns a single base64 string containing IV || ciphertext || auth tag.
 *
 * @param {string} plaintext — the token to encrypt. Must be non-empty string.
 * @returns {string} base64(iv[12] || ct || tag[16])
 */
export function encryptToken(plaintext) {
  if (typeof plaintext !== 'string' || plaintext.length === 0) {
    throw new Error('encryptToken requires a non-empty string');
  }

  const key = loadKey();
  const iv = crypto.randomBytes(12); // GCM standard IV length
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16 bytes

  return Buffer.concat([iv, ct, tag]).toString('base64');
}

/**
 * Decrypt a token previously encrypted with `encryptToken`.
 * Throws if the ciphertext is tampered (GCM auth tag check fails).
 *
 * @param {string} b64 — the base64 string produced by encryptToken
 * @returns {string} plaintext
 */
export function decryptToken(b64) {
  if (typeof b64 !== 'string' || b64.length === 0) {
    throw new Error('decryptToken requires a non-empty string');
  }

  const buf = Buffer.from(b64, 'base64');
  if (buf.length < 12 + 16 + 1) {
    throw new Error('decryptToken: ciphertext too short to be valid');
  }

  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(buf.length - 16);
  const ct = buf.subarray(12, buf.length - 16);

  const key = loadKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString('utf8');
}

// ---------------------------------------------------------------------------
// HMAC-SHA256 helpers (used by Shopee and TikTok Shop signers)
// ---------------------------------------------------------------------------

/**
 * Compute HMAC-SHA256 and return lowercase hex.
 * This is the primitive every marketplace signer builds on.
 *
 * @param {string | Buffer} key — the secret (partner_key, app_secret, etc.)
 * @param {string | Buffer} message — the string to sign (already concatenated)
 * @returns {string} lowercase hex digest
 */
export function hmacSha256Hex(key, message) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

/**
 * Compute HMAC-SHA256 and return a Buffer.
 * Used when a raw byte digest is needed (rare — most marketplaces want hex).
 *
 * @param {string | Buffer} key
 * @param {string | Buffer} message
 * @returns {Buffer}
 */
export function hmacSha256Bytes(key, message) {
  return crypto.createHmac('sha256', key).update(message).digest();
}

/**
 * Constant-time string comparison. Use this for webhook signature verification
 * to prevent timing attacks on the header check.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function timingSafeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
