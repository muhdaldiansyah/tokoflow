// app/api/marketplace/connect/[provider]/route.js
//
// SCAFFOLDING — not yet wired to a real marketplace OAuth flow.
//
// What this endpoint will eventually do (per provider):
//
//   shopee
//     1. Redirect merchant to https://partner.shopeemobile.com/api/v2/shop/auth_partner
//        with partner_id, redirect URL, and HMAC-SHA256 signed timestamp.
//     2. On callback, exchange the temporary code for an access_token + refresh_token
//        via /api/v2/auth/token/get (signed request, expires in 4 hours).
//     3. Persist into tf_marketplace_connections (channel='shopee', shop_id, ...).
//     4. Schedule first sync.
//   tokopedia
//     Tokopedia uses Mitra/Partner OAuth — flow is similar but different endpoints.
//     See https://developer.tokopedia.com/openapi for the v1 spec.
//   tiktok-shop
//     TikTok Shop Partner Center OAuth.
//     See https://partner.tiktokshop.com/docv2/page/authorization
//
// Required env vars (NONE of these are set yet):
//   SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY, SHOPEE_REDIRECT_URI
//   TOKOPEDIA_CLIENT_ID, TOKOPEDIA_CLIENT_SECRET, TOKOPEDIA_REDIRECT_URI
//   TIKTOKSHOP_APP_KEY, TIKTOKSHOP_APP_SECRET, TIKTOKSHOP_REDIRECT_URI
//
// For now this endpoint:
//   1. Creates a "stub" tf_marketplace_connections row marked is_active=false
//      so the merchant can see it in /marketplace as "Pending — needs OAuth".
//   2. Returns a 501 NOT IMPLEMENTED with a clear message about what's missing.
//
// This deliberately does NOT call any external API. We refuse to fake working
// integration — that would mislead merchants into thinking their stock is sync'd.
import { authenticateRequest } from '../../../../../lib/utils/auth-helpers';
import { requireOwner } from '../../../../../lib/auth/role.js';
import { successResponse, errorResponse, handleSupabaseError } from '../../../../../lib/utils/api-response';

export const runtime = 'nodejs';

const VALID_PROVIDERS = new Set(['shopee', 'tokopedia', 'tiktok-shop']);

export async function POST(request, { params }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.ok) return errorResponse(auth.error || 'Unauthorized', auth.status || 401);
    const gate = await requireOwner(auth);
    if (!gate.ok) return gate.response;

    const { provider } = await params;
    if (!VALID_PROVIDERS.has(provider)) {
      return errorResponse(`Provider tidak dikenal: ${provider}`, 400);
    }

    // Check if real credentials are configured for this provider
    const envChecks = {
      'shopee':      ['SHOPEE_PARTNER_ID', 'SHOPEE_PARTNER_KEY', 'SHOPEE_REDIRECT_URI'],
      'tokopedia':   ['TOKOPEDIA_CLIENT_ID', 'TOKOPEDIA_CLIENT_SECRET', 'TOKOPEDIA_REDIRECT_URI'],
      'tiktok-shop': ['TIKTOKSHOP_APP_KEY', 'TIKTOKSHOP_APP_SECRET', 'TIKTOKSHOP_REDIRECT_URI'],
    };
    const required = envChecks[provider];
    const missing = required.filter(k => !process.env[k]);

    if (missing.length > 0) {
      // Create the stub row so the merchant can see it in the UI as "pending"
      const { data: existing } = await auth.supabase
        .from('tf_marketplace_connections')
        .select('id')
        .eq('channel', provider)
        .is('shop_id', null)
        .maybeSingle();

      if (!existing) {
        const { error: insertError } = await auth.supabase
          .from('tf_marketplace_connections')
          .insert({
            channel: provider,
            shop_id: null,
            shop_name: null,
            last_sync_status: 'failed',
            last_sync_error: `Missing env vars: ${missing.join(', ')}. Konfigurasi credentials di .env dulu.`,
            is_active: false,
            created_by: auth.user.id,
          });
        if (insertError) return handleSupabaseError(insertError);
      }

      return errorResponse(
        `OAuth ${provider} belum dikonfigurasi. Tambahkan env vars: ${missing.join(', ')} ` +
        `lalu restart server. Lihat dokumentasi: docs/marketplace-integration.md`,
        501
      );
    }

    // ===================================================================
    // TODO: Real OAuth implementation goes here.
    //
    // For Shopee:
    //   const timestamp = Math.floor(Date.now() / 1000);
    //   const sign = crypto.createHmac('sha256', process.env.SHOPEE_PARTNER_KEY)
    //     .update(`${process.env.SHOPEE_PARTNER_ID}/api/v2/shop/auth_partner${timestamp}`)
    //     .digest('hex');
    //   const authUrl = `https://partner.shopeemobile.com/api/v2/shop/auth_partner` +
    //     `?partner_id=${process.env.SHOPEE_PARTNER_ID}` +
    //     `&redirect=${encodeURIComponent(process.env.SHOPEE_REDIRECT_URI)}` +
    //     `&timestamp=${timestamp}` +
    //     `&sign=${sign}`;
    //   return successResponse({ redirect_url: authUrl });
    // ===================================================================
    return errorResponse(
      'OAuth flow scaffolded but not yet implemented. See TODO comment in route file.',
      501
    );
  } catch (err) {
    console.error('[marketplace/connect] error', err);
    return errorResponse('Failed to start connection', 500);
  }
}
