// lib/services/marketplace/connections.js
//
// Data-access helpers for tf_marketplace_connections.
//
// These are the ONLY functions in the app that should read or write the
// encrypted token columns (access_token_enc / refresh_token_enc). Everything
// else — sync jobs, OAuth callback, webhook processors — goes through here
// so that encryption is enforced at a single boundary.
//
// All helpers take a Supabase client as the first argument. For routes that
// run with an authenticated user session, pass the session-bound client. For
// webhook handlers and cron jobs that run without a user, pass the service
// role client (see lib/database/supabase-server/service.js, created alongside
// these marketplace routes).

import { encryptToken, decryptToken } from './crypto.js';

const TABLE = 'tf_marketplace_connections';

// Columns we always select. Explicit list avoids leaking stale plaintext
// access_token/refresh_token/token_expires_at columns (kept in schema for
// backward compat but unused by new code).
const CONNECTION_COLUMNS = [
  'id',
  'channel',
  'shop_id',
  'shop_name',
  'seller_type',
  'shop_cipher',
  'access_token_enc',
  'refresh_token_enc',
  'token_expires_at',              // reused as access_token_expires_at
  'refresh_token_expires_at',
  'scope',
  'last_sync_at',
  'last_sync_cursor',
  'last_sync_status',
  'last_sync_error',
  'last_webhook_at',
  'connection_meta',
  'encryption_key_version',
  'is_active',
  'deactivated_at',
  'deactivated_reason',
  'created_by',
  'created_at',
  'updated_at',
].join(', ');

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Load a single connection by id and decrypt its tokens.
 * Returns null if not found. Throws if decryption fails.
 *
 * @param {object} supabase
 * @param {number | string} id
 * @returns {Promise<object | null>} connection with `access_token` and `refresh_token` decrypted in-place
 */
export async function loadConnectionById(supabase, id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select(CONNECTION_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`loadConnectionById: ${error.message}`);
  if (!data) return null;

  return hydrateTokens(data);
}

/**
 * Load all active connections, optionally filtered by channel.
 * Used by the cron coordinator to fan out syncs.
 *
 * @param {object} supabase
 * @param {object} [filter]
 * @param {string} [filter.channel] — e.g. 'tiktok-shop' | 'shopee'
 * @returns {Promise<object[]>}
 */
export async function loadActiveConnections(supabase, { channel } = {}) {
  let query = supabase
    .from(TABLE)
    .select(CONNECTION_COLUMNS)
    .eq('is_active', true);

  if (channel) query = query.eq('channel', channel);

  const { data, error } = await query;
  if (error) throw new Error(`loadActiveConnections: ${error.message}`);
  return (data || []).map(hydrateTokens);
}

/**
 * Find an active connection by (channel, shop_id). Used by the webhook
 * processor to resolve a connection from the `shop_id` in the payload.
 *
 * @param {object} supabase
 * @param {string} channel
 * @param {string} shopId
 * @returns {Promise<object | null>}
 */
export async function findConnectionByShop(supabase, channel, shopId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select(CONNECTION_COLUMNS)
    .eq('channel', channel)
    .eq('shop_id', String(shopId))
    .maybeSingle();

  if (error) throw new Error(`findConnectionByShop: ${error.message}`);
  if (!data) return null;
  return hydrateTokens(data);
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Upsert a fresh connection (new OAuth) or update tokens on an existing one.
 * Encrypts tokens on the way in. Sets is_active=true and clears any prior
 * deactivation reason.
 *
 * Either updates the row identified by `id`, or upserts by (channel, shop_id)
 * if `id` is not provided.
 *
 * @param {object} supabase
 * @param {object} args
 * @param {number} [args.id] — update an existing row
 * @param {string} args.channel
 * @param {string} args.shopId
 * @param {string} [args.shopName]
 * @param {string} [args.sellerType]
 * @param {string} [args.shopCipher]
 * @param {string} args.accessToken — plaintext, will be encrypted
 * @param {string} args.refreshToken — plaintext, will be encrypted
 * @param {Date} args.accessTokenExpiresAt
 * @param {Date} [args.refreshTokenExpiresAt]
 * @param {string} [args.scope]
 * @param {object} [args.connectionMeta] — jsonb stash of provider-specific fields
 * @param {string} [args.createdBy] — Supabase auth.users.id (for new rows)
 * @returns {Promise<object>} the upserted row (with tokens hydrated)
 */
export async function upsertConnectionWithTokens(supabase, args) {
  const row = {
    channel: args.channel,
    shop_id: String(args.shopId),
    shop_name: args.shopName ?? null,
    seller_type: args.sellerType ?? null,
    shop_cipher: args.shopCipher ?? null,
    access_token_enc: encryptToken(args.accessToken),
    refresh_token_enc: encryptToken(args.refreshToken),
    token_expires_at: toIsoOrNull(args.accessTokenExpiresAt),
    refresh_token_expires_at: toIsoOrNull(args.refreshTokenExpiresAt),
    scope: args.scope ?? null,
    connection_meta: args.connectionMeta ?? {},
    encryption_key_version: 1,
    is_active: true,
    deactivated_at: null,
    deactivated_reason: null,
    last_sync_status: 'idle',
    last_sync_error: null,
    updated_at: new Date().toISOString(),
  };

  let data;
  let error;

  if (args.id) {
    ({ data, error } = await supabase
      .from(TABLE)
      .update(row)
      .eq('id', args.id)
      .select(CONNECTION_COLUMNS)
      .single());
  } else {
    // New connection — include created_by on insert
    const insertRow = { ...row, created_by: args.createdBy ?? null };
    ({ data, error } = await supabase
      .from(TABLE)
      .upsert(insertRow, { onConflict: 'channel,shop_id' })
      .select(CONNECTION_COLUMNS)
      .single());
  }

  if (error) throw new Error(`upsertConnectionWithTokens: ${error.message}`);
  return hydrateTokens(data);
}

/**
 * Update only the token fields after a refresh_token grant. Does NOT touch
 * shop metadata or sync status.
 *
 * @param {object} supabase
 * @param {number} id
 * @param {object} tokens
 * @param {string} tokens.accessToken
 * @param {string} [tokens.refreshToken] — optional if platform returns a new refresh token
 * @param {Date} tokens.accessTokenExpiresAt
 * @param {Date} [tokens.refreshTokenExpiresAt]
 */
export async function updateConnectionTokensAfterRefresh(supabase, id, tokens) {
  const patch = {
    access_token_enc: encryptToken(tokens.accessToken),
    token_expires_at: toIsoOrNull(tokens.accessTokenExpiresAt),
    updated_at: new Date().toISOString(),
  };
  if (tokens.refreshToken) {
    patch.refresh_token_enc = encryptToken(tokens.refreshToken);
  }
  if (tokens.refreshTokenExpiresAt) {
    patch.refresh_token_expires_at = toIsoOrNull(tokens.refreshTokenExpiresAt);
  }

  const { error } = await supabase.from(TABLE).update(patch).eq('id', id);
  if (error) throw new Error(`updateConnectionTokensAfterRefresh: ${error.message}`);
}

/**
 * Set last_sync_* fields on a connection. Call at start with status='running'
 * and again at end with status='success' or 'failed'.
 *
 * @param {object} supabase
 * @param {number} id
 * @param {object} args
 * @param {'idle' | 'running' | 'success' | 'failed'} args.status
 * @param {string | null} [args.error]
 * @param {Date} [args.cursor] — new last_sync_cursor watermark (max update_time of synced rows)
 * @param {Date} [args.completedAt]
 */
export async function updateSyncStatus(supabase, id, args) {
  const patch = {
    last_sync_status: args.status,
    last_sync_error: args.error ?? null,
    updated_at: new Date().toISOString(),
  };
  if (args.cursor) patch.last_sync_cursor = toIsoOrNull(args.cursor);
  if (args.completedAt) patch.last_sync_at = toIsoOrNull(args.completedAt);

  const { error } = await supabase.from(TABLE).update(patch).eq('id', id);
  if (error) throw new Error(`updateSyncStatus: ${error.message}`);
}

/**
 * Mark a connection inactive — called when we receive a deauth webhook or
 * when a refresh_token grant fails with an irrecoverable auth error.
 *
 * @param {object} supabase
 * @param {number} id
 * @param {string} reason
 */
export async function deactivateConnection(supabase, id, reason) {
  const { error } = await supabase
    .from(TABLE)
    .update({
      is_active: false,
      deactivated_at: new Date().toISOString(),
      deactivated_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(`deactivateConnection: ${error.message}`);
}

/**
 * Touch last_webhook_at on receiving a verified push event. Used so the
 * merchant UI can show "last event: 3 min ago" even when sync hasn't run.
 *
 * @param {object} supabase
 * @param {number} id
 */
export async function markWebhookReceived(supabase, id) {
  const { error } = await supabase
    .from(TABLE)
    .update({ last_webhook_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`markWebhookReceived: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Decrypt the access_token / refresh_token columns in-place and expose them
 * as `access_token` / `refresh_token` on the returned row. The encrypted
 * columns stay on the row too (the caller can ignore them).
 *
 * @param {object} row
 * @returns {object}
 */
function hydrateTokens(row) {
  if (!row) return row;
  const out = { ...row };
  if (row.access_token_enc) {
    try {
      out.access_token = decryptToken(row.access_token_enc);
    } catch (err) {
      // Don't leak plaintext on failure — leave the field undefined and
      // annotate the row so the caller can log/handle.
      out._decrypt_error = err.message;
    }
  }
  if (row.refresh_token_enc) {
    try {
      out.refresh_token = decryptToken(row.refresh_token_enc);
    } catch (err) {
      out._decrypt_error = err.message;
    }
  }
  return out;
}

function toIsoOrNull(d) {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString();
  if (typeof d === 'string') return d;
  return null;
}
