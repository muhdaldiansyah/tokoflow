// lib/services/marketplace/errors.js
//
// Error taxonomy for marketplace integrations.
//
// Every marketplace API returns failures in its own envelope shape (Shopee
// uses a top-level `error` field, TikTok Shop uses numeric `code` with a
// message, HTTP 4xx/5xx semantics vary). We normalize all of that into a
// small set of error classes that the callers can switch on:
//
//   AuthError       — token expired / invalid / scope missing / signature
//                     mismatch. Not retryable in a loop; the caller must
//                     refresh the token (if expired) or re-authorize the
//                     shop (if revoked or scope missing).
//
//   RateLimitError  — 429 or platform-specific rate-limit code. Retryable
//                     with exponential backoff. Carries an optional
//                     `retryAfter` hint in seconds if the platform provided
//                     a Retry-After header.
//
//   ServerError     — 5xx from the platform. Retryable with backoff.
//
//   ValidationError — 4xx non-auth (bad params, missing field, etc.).
//                     NOT retryable — the request is broken, fix the code.
//
//   NetworkError    — the request never got a response (DNS, timeout, reset).
//                     Retryable with backoff.
//
// Every error carries `provider` ('shopee' | 'tiktok-shop'), the original
// `code` from the platform (for logging), and an optional `cause` for chain
// inspection.
//
// Usage in the sync loop:
//
//   try {
//     const orders = await tiktokShop.searchOrders(...);
//   } catch (err) {
//     if (err instanceof AuthError) {
//       // refresh token or mark connection inactive
//     } else if (isRetryable(err)) {
//       // caught by retry wrapper
//     } else {
//       // log and bail
//     }
//   }

// ---------------------------------------------------------------------------
// Base class
// ---------------------------------------------------------------------------

export class MarketplaceError extends Error {
  /**
   * @param {string} message — human-readable description
   * @param {object} meta
   * @param {'shopee' | 'tiktok-shop'} meta.provider
   * @param {string | number} [meta.code] — platform-native error code
   * @param {number} [meta.httpStatus] — HTTP status if relevant
   * @param {string} [meta.requestId] — platform request ID for support tickets
   * @param {Error} [meta.cause] — original error chain
   * @param {boolean} [meta.retryable] — override the default classification
   */
  constructor(message, { provider, code, httpStatus, requestId, cause, retryable } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.provider = provider;
    this.code = code;
    this.httpStatus = httpStatus;
    this.requestId = requestId;
    if (cause) this.cause = cause;
    if (typeof retryable === 'boolean') this._retryable = retryable;
  }

  /**
   * Default retryability per class. Subclasses override.
   * @returns {boolean}
   */
  get retryable() {
    return this._retryable ?? false;
  }
}

// ---------------------------------------------------------------------------
// Subclasses
// ---------------------------------------------------------------------------

export class AuthError extends MarketplaceError {
  get retryable() {
    return false;
  }
}

export class RateLimitError extends MarketplaceError {
  constructor(message, meta = {}) {
    super(message, meta);
    this.retryAfterSeconds = meta.retryAfterSeconds ?? null;
  }
  get retryable() {
    return true;
  }
}

export class ServerError extends MarketplaceError {
  get retryable() {
    return true;
  }
}

export class ValidationError extends MarketplaceError {
  get retryable() {
    return false;
  }
}

export class NetworkError extends MarketplaceError {
  get retryable() {
    return true;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Is this error safe to retry with backoff?
 * Accepts any value (including non-errors) and returns a boolean.
 *
 * @param {unknown} err
 * @returns {boolean}
 */
export function isRetryable(err) {
  if (err instanceof MarketplaceError) return err.retryable;
  // Unknown errors — be conservative and don't retry.
  return false;
}

/**
 * Shopee v2 error classifier.
 *
 * Shopee responses look like:
 *   { error: 'error_auth',   message: '...', request_id: '...' }         (4xx/5xx)
 *   { error: 'error_param',  message: '...', request_id: '...' }         (4xx)
 *   { error: 'error_server', message: '...', request_id: '...' }         (5xx)
 *   { error: 'error_auth', ... } with httpStatus 403 for token/signature issues
 *
 * @param {object} args
 * @param {number} args.httpStatus
 * @param {object} args.body — parsed JSON response
 * @param {Headers | Record<string, string>} [args.headers]
 * @returns {MarketplaceError}
 */
export function classifyShopeeError({ httpStatus, body, headers }) {
  const code = body?.error || 'unknown';
  const message = body?.message || `Shopee API error ${httpStatus}`;
  const requestId = body?.request_id;
  const meta = { provider: 'shopee', code, httpStatus, requestId };

  // Shopee auth failures: error_auth, error_permission, error_inner_sign,
  // error_token_not_exist, error_invalid_refresh_token, etc.
  if (typeof code === 'string' && /^error_(auth|permission|sign|token|invalid_token|invalid_refresh)/i.test(code)) {
    return new AuthError(message, meta);
  }

  if (httpStatus === 429 || (typeof code === 'string' && /rate|quota|frequency/i.test(code))) {
    const retryAfter = readRetryAfter(headers);
    return new RateLimitError(message, { ...meta, retryAfterSeconds: retryAfter });
  }

  if (httpStatus >= 500 || code === 'error_server') {
    return new ServerError(message, meta);
  }

  if (httpStatus >= 400) {
    return new ValidationError(message, meta);
  }

  return new MarketplaceError(message, meta);
}

/**
 * TikTok Shop Partner Center error classifier.
 *
 * Responses look like:
 *   { code: 0, message: 'Success', data: {...}, request_id: '...' }
 *   { code: 105005, message: 'apply auth pkg', request_id: '...' }  — 105xxx = scope
 *   { code: 36004008, message: 'access token expired', ... }         — 360xxx = token
 *   { code: 20001, message: 'rate limit', ... }                      — 20001-20003 rate limit
 *   { code: 12000001, message: 'invalid param', ... }                — 12000xx = validation
 *
 * Per EcomPHP SDK the numeric prefix determines the class:
 *   105xxx   → AuthError (scope missing / package not applied)
 *   360xxx   → AuthError (token invalid/expired — caller should refresh)
 *   20001-3  → RateLimitError
 *   12000xx  → ValidationError
 *   9xxx/5xx → ServerError
 *
 * @param {object} args
 * @param {number} args.httpStatus
 * @param {object} args.body
 * @param {Headers | Record<string, string>} [args.headers]
 * @returns {MarketplaceError}
 */
export function classifyTikTokShopError({ httpStatus, body, headers }) {
  const code = body?.code ?? httpStatus;
  const message = body?.message || `TikTok Shop API error ${httpStatus} / code=${code}`;
  const requestId = body?.request_id;
  const meta = { provider: 'tiktok-shop', code, httpStatus, requestId };

  const codeStr = String(code);

  if (codeStr.startsWith('105') || codeStr.startsWith('360')) {
    return new AuthError(message, meta);
  }

  if (codeStr === '20001' || codeStr === '20002' || codeStr === '20003' || httpStatus === 429) {
    const retryAfter = readRetryAfter(headers);
    return new RateLimitError(message, { ...meta, retryAfterSeconds: retryAfter });
  }

  if (codeStr.startsWith('12000')) {
    return new ValidationError(message, meta);
  }

  if (httpStatus >= 500 || codeStr.startsWith('9')) {
    return new ServerError(message, meta);
  }

  if (httpStatus === 401 || httpStatus === 403) {
    return new AuthError(message, meta);
  }

  if (httpStatus >= 400) {
    return new ValidationError(message, meta);
  }

  return new MarketplaceError(message, meta);
}

/**
 * Read the Retry-After header and return seconds (or null).
 * Handles both delta-seconds and HTTP-date forms.
 *
 * @param {Headers | Record<string, string> | undefined} headers
 * @returns {number | null}
 */
function readRetryAfter(headers) {
  if (!headers) return null;
  const raw = typeof headers.get === 'function' ? headers.get('retry-after') : headers['retry-after'];
  if (!raw) return null;
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber) && asNumber >= 0) return asNumber;
  const asDate = Date.parse(raw);
  if (Number.isFinite(asDate)) {
    return Math.max(0, Math.ceil((asDate - Date.now()) / 1000));
  }
  return null;
}
