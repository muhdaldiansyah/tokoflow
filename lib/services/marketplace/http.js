// lib/services/marketplace/http.js
//
// HTTP client wrapper for marketplace API calls.
//
// Built on top of Node's global `fetch` (which is dispatched through the
// undici keep-alive agent installed by lib/http/keepalive.js when the server
// boots). No extra dependencies.
//
// What this adds on top of raw fetch:
//
//   1. Request timeout via AbortController (default 30s, configurable).
//   2. JSON envelope parsing (returns { httpStatus, headers, body } tuple).
//   3. Classifies errors via a provider-specific classifier function and
//      retries with exponential backoff on retryable errors.
//   4. Logs per-attempt info to console with request_id when available so
//      production issues can be traced from Vercel logs.
//
// The retry loop intentionally does NOT retry ValidationError / AuthError —
// those mean the request is broken or the token is dead, and retrying wastes
// quota. Only ServerError, RateLimitError, and NetworkError are retried.
//
// Usage:
//
//   const result = await marketplaceFetch({
//     url: 'https://open-api.tiktokglobalshop.com/order/202309/orders/search?sign=...',
//     method: 'POST',
//     headers: { 'x-tts-access-token': token, 'content-type': 'application/json' },
//     body: JSON.stringify({ ... }),
//     classifier: classifyTikTokShopError,
//     providerLabel: 'tiktok-shop',
//   });
//   // result.body is the parsed JSON on success, or an error is thrown.

import {
  MarketplaceError,
  NetworkError,
  RateLimitError,
  isRetryable,
} from './errors.js';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_ATTEMPTS = 4; // initial + 3 retries
const DEFAULT_BASE_DELAY_MS = 1_000;
const DEFAULT_MAX_DELAY_MS = 30_000;
const USER_AGENT = 'Tokoflow-Marketplace/1.0 (+https://tokoflow.vercel.app)';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Perform a marketplace API call with timeout, retry, and error classification.
 *
 * @param {object} opts
 * @param {string} opts.url — fully-formed URL (query params already on it)
 * @param {'GET' | 'POST' | 'PUT' | 'DELETE'} [opts.method='GET']
 * @param {Record<string, string>} [opts.headers]
 * @param {string | Buffer | null} [opts.body] — already-serialized body
 * @param {number} [opts.timeoutMs]
 * @param {number} [opts.maxAttempts]
 * @param {(args: { httpStatus: number, body: any, headers: Headers }) => MarketplaceError} opts.classifier
 *        provider-specific error classifier (classifyShopeeError, classifyTikTokShopError)
 * @param {string} opts.providerLabel — 'shopee' | 'tiktok-shop', used for log prefix
 * @returns {Promise<{ httpStatus: number, headers: Headers, body: any }>}
 */
export async function marketplaceFetch({
  url,
  method = 'GET',
  headers = {},
  body = null,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  classifier,
  providerLabel,
}) {
  if (!classifier || typeof classifier !== 'function') {
    throw new Error('marketplaceFetch: `classifier` is required');
  }
  if (!providerLabel) {
    throw new Error('marketplaceFetch: `providerLabel` is required for logging');
  }

  // Always attach a User-Agent so platform logs can identify us, and make
  // sure Accept is set to JSON so we don't accidentally get HTML error pages.
  const mergedHeaders = {
    'user-agent': USER_AGENT,
    accept: 'application/json',
    ...headers,
  };

  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    let httpStatus = 0;
    let responseHeaders = null;
    let rawText = '';

    try {
      const response = await fetch(url, {
        method,
        headers: mergedHeaders,
        body,
        signal: controller.signal,
      });

      httpStatus = response.status;
      responseHeaders = response.headers;

      // Marketplace APIs almost always return JSON, but a 5xx can return HTML
      // or empty body; read as text first, then try to parse.
      rawText = await response.text();

      let parsedBody;
      if (rawText) {
        try {
          parsedBody = JSON.parse(rawText);
        } catch {
          parsedBody = { _raw: rawText.slice(0, 500) };
        }
      } else {
        parsedBody = {};
      }

      // Success path: HTTP 2xx AND (for platforms that use a top-level
      // numeric code) that code is success. Shopee success = no `error` field
      // or error === ''; TikTok Shop success = code === 0.
      const isTikTokShopOk = parsedBody?.code === 0 || parsedBody?.code === undefined;
      const isShopeeOk = !parsedBody?.error || parsedBody.error === '';
      const envelopeOk =
        providerLabel === 'tiktok-shop' ? isTikTokShopOk : isShopeeOk;

      if (response.ok && envelopeOk) {
        logAttempt({
          providerLabel,
          attempt,
          url,
          method,
          httpStatus,
          requestId: parsedBody?.request_id,
          outcome: 'ok',
        });
        return { httpStatus, headers: responseHeaders, body: parsedBody };
      }

      // Non-success: classify and decide retry.
      const err = classifier({ httpStatus, body: parsedBody, headers: responseHeaders });
      lastError = err;

      logAttempt({
        providerLabel,
        attempt,
        url,
        method,
        httpStatus,
        requestId: err.requestId || parsedBody?.request_id,
        outcome: err.constructor.name,
        errorCode: err.code,
        errorMessage: err.message,
      });

      if (!isRetryable(err) || attempt === maxAttempts) {
        throw err;
      }

      await sleep(computeBackoffMs(attempt, err));
      continue;
    } catch (caught) {
      clearTimeout(timeoutHandle);

      // Already a MarketplaceError from the block above — let the retry loop
      // decide (we already slept before re-throwing, this path only hits on
      // the final attempt).
      if (caught instanceof MarketplaceError) {
        throw caught;
      }

      // AbortError means our timeout fired, or a deeper network abort.
      // Treat as NetworkError so we retry with backoff.
      const wrapped = new NetworkError(caught?.message || 'network error', {
        provider: providerLabel,
        cause: caught,
      });
      lastError = wrapped;

      logAttempt({
        providerLabel,
        attempt,
        url,
        method,
        httpStatus: 0,
        outcome: 'NetworkError',
        errorMessage: wrapped.message,
      });

      if (attempt === maxAttempts) {
        throw wrapped;
      }

      await sleep(computeBackoffMs(attempt, wrapped));
      continue;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  // Defensive — loop should always return or throw.
  throw lastError || new MarketplaceError('marketplaceFetch: exhausted retries without result', {
    provider: providerLabel,
  });
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Exponential backoff with full jitter + Retry-After honor.
 *
 * attempt=1 → 1s ± jitter
 * attempt=2 → 2s ± jitter
 * attempt=3 → 4s ± jitter
 * attempt=4 → 8s ± jitter
 * capped at DEFAULT_MAX_DELAY_MS
 *
 * If the error is a RateLimitError with an explicit retryAfterSeconds, use
 * that value directly (clamped to max delay).
 *
 * @param {number} attempt — 1-indexed attempt number
 * @param {MarketplaceError | null} err
 * @returns {number} milliseconds to sleep before next attempt
 */
function computeBackoffMs(attempt, err) {
  if (err instanceof RateLimitError && err.retryAfterSeconds) {
    return Math.min(err.retryAfterSeconds * 1000, DEFAULT_MAX_DELAY_MS);
  }
  const expo = DEFAULT_BASE_DELAY_MS * 2 ** (attempt - 1);
  const capped = Math.min(expo, DEFAULT_MAX_DELAY_MS);
  // Full jitter: uniform in [0, capped]
  return Math.floor(Math.random() * capped);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Structured log line for one HTTP attempt. Console only for now; shows up in
 * Vercel log drains as JSON so it's easy to grep.
 *
 * @param {object} info
 */
function logAttempt(info) {
  // Drop URL query string in logs to avoid leaking access_token / sign values.
  const urlForLog = typeof info.url === 'string' ? info.url.split('?')[0] : info.url;
  const line = {
    tag: 'marketplace-fetch',
    provider: info.providerLabel,
    attempt: info.attempt,
    method: info.method,
    url: urlForLog,
    http: info.httpStatus,
    outcome: info.outcome,
    requestId: info.requestId,
    errorCode: info.errorCode,
    errorMessage: info.errorMessage,
  };
  // Single-line JSON for log aggregation.
  console.log(JSON.stringify(line));
}
