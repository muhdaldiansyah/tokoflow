# WhatsApp Embedded Signup — Multi-Tenant WA Bot untuk CatatOrder

> Research & Implementation Plan untuk membuat setiap user CatatOrder bisa connect nomor WA bisnis mereka sendiri.

**Tanggal riset:** 2026-02-15
**Status:** Research complete, ready to implement

---

## Daftar Isi

1. [Problem Statement](#1-problem-statement)
2. [Solusi: Meta Embedded Signup](#2-solusi-meta-embedded-signup)
3. [Cara Kerja Embedded Signup](#3-cara-kerja-embedded-signup)
4. [Setup & Requirements](#4-setup--requirements)
5. [App Review Process](#5-app-review-process)
6. [Business Verification](#6-business-verification)
7. [Frontend Implementation](#7-frontend-implementation)
8. [Backend Implementation](#8-backend-implementation)
9. [Multi-Tenant Webhook Architecture](#9-multi-tenant-webhook-architecture)
10. [Token Management](#10-token-management)
11. [Pricing & Cost Model](#11-pricing--cost-model)
12. [WhatsApp Coexistence](#12-whatsapp-coexistence)
13. [Billing Model Options](#13-billing-model-options)
14. [Apa yang Sudah Ada vs Perlu Dibuat](#14-apa-yang-sudah-ada-vs-perlu-dibuat)
15. [Implementation Plan](#15-implementation-plan)
16. [Risk & Mitigasi](#16-risk--mitigasi)
17. [Alternatif yang Dipertimbangkan (Ditolak)](#17-alternatif-yang-dipertimbangkan-ditolak)
18. [Sources](#18-sources)

---

## 1. Problem Statement

### Kondisi Saat Ini

CatatOrder WA Bot saat ini **single-tenant** — hanya bisa digunakan oleh 1 user (owner/developer):

```
Semua customer → pesan ke +6285776158689 (nomor owner)
                         ↓
              Meta Cloud API Webhook
                         ↓
    Lookup wa_connections by phone_number_id
                         ↓
        Dapat user_id → pesanan masuk ke akun owner
```

- Nomor `+6285776158689` terdaftar di Meta Cloud API milik owner
- Di tabel `wa_connections`, nomor itu di-link ke `user_id` owner
- **User baru yang daftar CatatOrder TIDAK punya WA Bot**
- Mereka hanya bisa pakai fitur manual (catat pesanan via web, share via `wa.me/` deep link)

### Mengapa Ini Masalah

1. **Brand identity hilang** — customer pesan ke nomor Strive, bukan nomor toko mereka
2. **Tidak scalable** — 1 nomor = 1 user, tidak bisa dijual sebagai SaaS
3. **Value proposition lemah** — tanpa bot, CatatOrder "cuma" form catat pesanan manual
4. **Competitive disadvantage** — platform lain (WATI, Gallabox, Respond.io) sudah menawarkan per-user WA bot

### Flow User Baru Saat Ini (Tanpa Bot)

```
1. User daftar di catatorder.id (Google OAuth)
2. Isi profil + nama bisnis + nomor HP bisnis
3. Catat pesanan MANUAL (ketik / paste chat WA ke form)
4. Share ke customer via wa.me/ deep link (buka WA app)
   → Pesan include branding "Dibuat dengan CatatOrder"
5. TIDAK bisa terima pesanan otomatis via WA Bot
```

---

## 2. Solusi: Meta Embedded Signup

### Apa Itu Embedded Signup?

Meta Embedded Signup adalah fitur resmi Meta yang memungkinkan SaaS platform membiarkan user connect nomor WA bisnis mereka sendiri — langsung dari dalam dashboard SaaS, tanpa perlu ke Meta Developer Portal.

### Kenapa Embedded Signup (dan Bukan yang Lain)?

| Opsi | Verdict | Alasan |
|------|---------|--------|
| **Meta Embedded Signup** | **RECOMMENDED** | Official, zero ban risk, gratis infra, multi-tenant ready, coexistence support |
| Shared single number | Ditolak | Brand identity hilang (fatal untuk UMKM) |
| Fonnte/Wablas (unofficial API) | Ditolak | Ban risk tinggi, Meta makin agresif enforcement 2025-2026 |
| Virtual numbers per tenant | Ditolak | Terlalu mahal (Rp30-80K/tenant/bulan), margin habis |
| QR code scanning (Baileys) | Ditolak | Unofficial, ban risk, session instability |

### Keuntungan Utama

| Factor | Embedded Signup | Status Quo |
|--------|----------------|------------|
| Ban risk | **ZERO** (official Meta) | N/A |
| Infra cost | **Gratis** (Meta host) | N/A |
| User pakai nomor sendiri | **Yes** | No (manual only) |
| Coexistence | **WA Business App tetap jalan** | N/A |
| Service messages | **Gratis** (customer chat duluan) | N/A |
| Kode existing ready | **~80% done** | Single-tenant |
| Scalable | **Unlimited tenants, $0 marginal cost** | 1 tenant |
| Onboarding time user | **5-10 menit** | N/A |

---

## 3. Cara Kerja Embedded Signup

### High-Level Flow

```
User klik "Hubungkan WhatsApp" di Settings CatatOrder
         ↓
    FB.login() popup muncul
         ↓
   ┌──────────────────────────────────────┐
   │  1. User login Facebook              │
   │  2. Pilih/buat Meta Business Portfolio│
   │  3. Pilih/buat WABA                   │
   │  4. Isi info bisnis                   │
   │  5. Input nomor HP                    │
   │  6. Verifikasi OTP (SMS/voice)        │
   │  7. Konfirmasi permissions            │
   └──────────────────────────────────────┘
         ↓                    ↓
   FB.login callback     postMessage event
   (returns: code)       (returns: waba_id, phone_number_id)
         ↓                    ↓
   ┌──── Wait for BOTH arrive ────────┐
         ↓
   POST /api/whatsapp/connect
   { code, waba_id, phone_number_id }
         ↓
   Backend: exchange code → access_token
   Backend: subscribe WABA to webhooks
   Backend: store in wa_connections table
         ↓
   Bot aktif di nomor user! ✅
```

### Apa yang User (UMKM) Butuhkan

- Akun Facebook (hampir semua orang punya)
- Nomor HP untuk WA Business
- **Tidak perlu technical knowledge**
- **Tidak perlu Meta Developer account**
- **Tidak perlu meninggalkan CatatOrder**
- Proses ~5-10 menit

### Setelah Connected

```
Customer toko → pesan ke nomor WA bisnis user (misal 08123456789)
         ↓
Meta Cloud API Webhook → /api/wa/webhook
         ↓
Lookup wa_connections by phone_number_id
         ↓
Dapat user_id (tenant) → pesanan masuk ke akun user tersebut
         ↓
Bot reply menggunakan access_token milik user
```

---

## 4. Setup & Requirements

### Prerequisites

| Requirement | Status | Notes |
|-------------|--------|-------|
| Meta Developer account | Perlu dibuat | Gratis di developers.facebook.com |
| Meta Business Portfolio (Strive) | Perlu dibuat | Di business.facebook.com |
| Business Verification (Strive) | Perlu disubmit | NIB/IUMK, 1-14 hari |
| Live website HTTPS | **Sudah ada** ✅ | catatorder.id |
| Privacy Policy URL | **Sudah ada** ✅ | catatorder.id/privacy |
| Terms of Service URL | **Sudah ada** ✅ | catatorder.id/terms |

### Meta App Setup (Step-by-Step)

| Step | Action | Detail |
|------|--------|--------|
| 1 | Buka developers.facebook.com → My Apps → Create App | — |
| 2 | Use case: **Other** → Type: **Business** | Harus Business type |
| 3 | Nama app: "CatatOrder" (tidak boleh mengandung "WhatsApp") | Pilih Business Portfolio Strive |
| 4 | Tambah product: **WhatsApp** | Accept Business Terms + Meta Hosting Terms |
| 5 | Tambah product: **Facebook Login for Business** | — |
| 6 | App Settings → Basic | Isi Privacy Policy URL, Terms URL, icon (1024x1024), category: Messaging |

### Configuration ID

Buat di **Facebook Login for Business → Configurations → Create**:

| Setting | Value |
|---------|-------|
| Name | CatatOrder WhatsApp Signup |
| Login variation | **WhatsApp Embedded Signup** |
| Access token type | **System-user access token** |
| Token expiration | **60 days** (atau **Never** untuk permanent) |
| Assets | WhatsApp Accounts |
| Asset permissions | MANAGE, DEVELOP, MANAGE_TEMPLATES, VIEW_PHONE_ASSETS, VIEW_TEMPLATES, MESSAGING |
| Permissions/Scopes | `whatsapp_business_management`, `whatsapp_business_messaging` |

**Save → dapat Configuration ID** (simpan ini)

### OAuth Settings (Wajib Semua Dinyalakan)

Di Facebook Login for Business → Settings → Client OAuth Settings:

- [x] Client OAuth Login
- [x] Web OAuth Login
- [x] Enforce HTTPS
- [x] Embedded Browser OAuth Login
- [x] Use Strict Mode for Redirect URIs
- [x] Login with the JavaScript SDK

Tambahkan domain:

| Field | Value |
|-------|-------|
| Valid OAuth Redirect URIs | `https://catatorder.id/api/whatsapp/callback` |
| Allowed Domains for JS SDK | `https://catatorder.id` |

### Environment Variables

```bash
# Embedded Signup (tambahan ke .env.local yang sudah ada)
NEXT_PUBLIC_FB_APP_ID=xxx              # App Settings → Basic → App ID
FB_APP_SECRET=xxx                       # App Settings → Basic → App Secret (BACKEND ONLY!)
NEXT_PUBLIC_WA_CONFIG_ID=xxx            # Facebook Login for Business → Configuration ID
WA_TOKEN_ENCRYPTION_KEY=xxx             # 32 bytes hex — untuk encrypt token di database
```

---

## 5. App Review Process

### Apa yang Perlu Disubmit

Request **Advanced Access** untuk 2 permissions di App Review → Permissions and Features:

1. `whatsapp_business_management`
2. `whatsapp_business_messaging`

Untuk setiap permission, siapkan:
- Text explanation (kenapa dan bagaimana app menggunakan permission ini)
- Screencast/demo video
- Test login credentials
- Data Handling Questionnaire

### 2 Video Demo

| Video | Apa yang Ditunjukkan | Tips |
|-------|---------------------|------|
| **Video 1** (management) | Buat Message Template dari dalam app CatatOrder — semua field terlihat | Tunjukkan proses lengkap dari awal sampai submit |
| **Video 2** (messaging) | Kirim pesan dari app CatatOrder → terlihat diterima di WhatsApp client (HP) | Tunjukkan both: aksi kirim di app DAN pesan diterima di WA |

**Guidelines:**
- Pakai English UI language
- Kasih narasi/caption yang menjelaskan setiap fitur
- Pakai data real, bukan mock
- Tunjukkan app KAMU, bukan Meta tools
- **Video BERBEDA** untuk setiap permission (video identik = risiko ditolak)

### Timeline

| Phase | Durasi |
|-------|--------|
| Standard access | 2-4 hari |
| Advanced access (yang kita butuhkan) | 3-7 hari (biasanya ~5 hari) |
| Re-approval setelah rejection | 3-5 hari per attempt |

### Common Rejection Reasons

1. Over-requesting permissions yang tidak dipakai
2. Video berkualitas rendah / tidak ada narasi
3. Privacy Policy URL lambat loading atau tidak lengkap
4. Use case tidak jelas bagi reviewer
5. Video identik untuk kedua permissions
6. Menunjukkan Meta tools, bukan app sendiri

### Testing Sebelum Approval

- **Development mode:** Bisa test dengan user yang ditambahkan sebagai tester di Meta App
- Add testers via **Edit Roles** di Business Manager
- **Penting:** Saat Development mode, Embedded Signup akan error untuk user yang tidak terdaftar sebagai tester
- Harus switch ke **Live mode** sebelum onboarding real users

---

## 6. Business Verification

### Apa Itu

Meta Business Verification mengkonfirmasi legitimasi perusahaan. Diperlukan untuk:
- Kirim lebih dari 250 pesan/24 jam
- Mendapat verified display name
- Akses messaging tier yang lebih tinggi
- Menggunakan Embedded Signup untuk onboarding customer

### 3 Jalur Verifikasi

| Metode | Timeline | Detail |
|--------|----------|--------|
| **Partner-led (PLBV)** | 5 menit - 48 jam | WhatsApp only, hingga 20 nomor, tidak perlu website |
| **Standard** | Hingga 14 hari kerja | Semua Meta assets, butuh website SSL |
| **Meta Verified (Berbayar)** | 1-3 hari | Verified badge, premium support |

### Dokumen untuk Indonesia

| Dokumen | Nama Indonesia | Catatan |
|---------|----------------|---------|
| Business ID Number | **NIB** (Nomor Induk Berusaha) | Paling mudah — dari OSS |
| Micro-Small Business Permit | **IUMK** (Izin Usaha Mikro Kecil) | Khusus UMKM |
| Business License | **SIUP** (Surat Izin Usaha Perdagangan) | Format lama, masih diterima |
| Company Registration | **TDP** (Tanda Daftar Perusahaan) | Format lama |
| Tax Entrepreneur Confirmation | **SPPKP** | Untuk PKP |
| Business bank statement | Rekening koran bisnis | Harus ada nama bisnis legal |
| Utility bill | Tagihan utilitas | Harus ada alamat bisnis |

### Catatan untuk UMKM Indonesia

- **NIB** adalah jalur termudah — mayoritas UMKM terdaftar di OSS sudah punya ini
- **IUMK** juga diterima dan spesifik untuk usaha mikro/kecil
- Dokumen harus **official, valid, dan belum expired**
- Nama legal di dokumen harus **match** dengan nama bisnis di Meta
- **Gotcha:** Banyak UMKM tidak punya website dengan SSL → gunakan jalur Partner-led (PLBV) yang tidak butuh website
- Untuk **user CatatOrder**: mereka TIDAK perlu Business Verification sendiri untuk menghubungkan nomor. Yang perlu verifikasi adalah **Strive** (sebagai platform). User cukup login Facebook dan connect nomor.

---

## 7. Frontend Implementation

### Arsitektur: Dua Channel Data yang Terpisah

Data datang dari 2 channel secara bersamaan:

```
Channel 1: FB.login() callback → returns 'code' (authorization code)
Channel 2: window.postMessage  → returns 'waba_id' + 'phone_number_id'
```

Tidak ada guaranteed order — harus handle race condition dengan "wait for both" pattern.

### Callback Events

| Event | Kapan Terjadi | Data |
|-------|---------------|------|
| `FINISH` | User selesai lengkap (WABA + nomor) | `waba_id`, `phone_number_id`, `businessId` |
| `FINISH_ONLY_WABA` | User buat WABA tapi tidak tambah nomor | `waba_id` saja |
| `FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING` | Coexistence mode selesai | `waba_id`, `phone_number_id`, `businessId` |
| `CANCEL` | User tutup popup | `current_step` |
| `ERROR` / `error` | Ada masalah | `error_message` |

### React Component (Production-Ready untuk Next.js App Router)

```tsx
// components/whatsapp-embedded-signup.tsx
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface SignupResult {
  code: string;
  waba_id: string;
  phone_number_id: string;
  business_id?: string;
}

interface WhatsAppEmbeddedSignupProps {
  appId: string;
  configId: string;
  onSuccess: (result: SignupResult) => void;
  onError: (error: string) => void;
  onCancel?: (step: string) => void;
}

export function WhatsAppEmbeddedSignup({
  appId,
  configId,
  onSuccess,
  onError,
  onCancel,
}: WhatsAppEmbeddedSignupProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Store partial results (code and business data arrive separately)
  const authCodeRef = useRef<string | null>(null);
  const businessDataRef = useRef<{
    waba_id: string;
    phone_number_id: string;
    business_id?: string;
  } | null>(null);

  // Try to complete the flow when both pieces of data are available
  const tryComplete = useCallback(() => {
    if (authCodeRef.current && businessDataRef.current) {
      setIsLoading(false);
      onSuccess({
        code: authCodeRef.current,
        waba_id: businessDataRef.current.waba_id,
        phone_number_id: businessDataRef.current.phone_number_id,
        business_id: businessDataRef.current.business_id,
      });
      authCodeRef.current = null;
      businessDataRef.current = null;
    }
  }, [onSuccess]);

  // Load Facebook SDK
  useEffect(() => {
    if (window.FB) {
      window.FB.init({ appId, cookie: true, xfbml: true, version: 'v22.0' });
      setSdkLoaded(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({ appId, cookie: true, xfbml: true, version: 'v22.0' });
      setSdkLoaded(true);
    };

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }, [appId]);

  // Listen for postMessage from Facebook popup
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.origin?.endsWith('facebook.com')) return;

      try {
        const data =
          typeof event.data === 'string'
            ? JSON.parse(event.data)
            : event.data;

        if (data.type !== 'WA_EMBEDDED_SIGNUP') return;

        switch (data.event) {
          case 'FINISH':
          case 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING': {
            const { phone_number_id, waba_id, businessId } = data.data;
            businessDataRef.current = {
              waba_id,
              phone_number_id,
              business_id: businessId,
            };
            tryComplete();
            break;
          }
          case 'FINISH_ONLY_WABA': {
            setIsLoading(false);
            onError(
              `WABA created (${data.data.waba_id}) but no phone number added. Please try again.`
            );
            break;
          }
          case 'CANCEL': {
            setIsLoading(false);
            onCancel?.(data.data?.current_step || 'unknown');
            break;
          }
          case 'ERROR':
          case 'error': {
            setIsLoading(false);
            onError(data.data?.error_message || 'Embedded signup error');
            break;
          }
        }
      } catch {
        // Non-JSON messages from Facebook iframe — normal, ignore
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [tryComplete, onError, onCancel]);

  const launchSignup = useCallback(() => {
    if (!sdkLoaded || !window.FB) {
      onError('Facebook SDK not loaded yet.');
      return;
    }

    setIsLoading(true);
    authCodeRef.current = null;
    businessDataRef.current = null;

    window.FB.login(
      (response: any) => {
        if (response.authResponse?.code) {
          authCodeRef.current = response.authResponse.code;
          tryComplete();
        } else {
          setIsLoading(false);
          if (response.status === 'unknown') {
            onCancel?.('login');
          } else {
            onError('Login failed or was cancelled.');
          }
        }
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          sessionInfoVersion: 3, // Returns waba_id + phone_number_id
          setup: {},
        },
      }
    );
  }, [sdkLoaded, configId, tryComplete, onError, onCancel]);

  return (
    <button
      onClick={launchSignup}
      disabled={!sdkLoaded || isLoading}
      className="h-11 px-6 bg-green-600 text-white rounded-lg font-medium
                 hover:bg-green-700 active:bg-green-800 transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading
        ? 'Menghubungkan...'
        : sdkLoaded
          ? 'Hubungkan WhatsApp'
          : 'Memuat...'}
    </button>
  );
}
```

### Coexistence Mode (User Tetap Pakai WA Business App)

Untuk enable coexistence (user bisa pakai nomor yang sudah ada di WA Business App tanpa kehilangan chat history), tambahkan `featureType`:

```typescript
extras: {
  sessionInfoVersion: 3,
  featureType: 'whatsapp_business_app_onboarding',  // Enable coexistence
  setup: {},
}
```

**Requirements untuk coexistence:**
- Nomor harus sudah di WA Business App minimal **7 hari**
- WA Business App versi terbaru terinstall di HP (perlu kamera untuk QR step)
- Chat history sync hingga **6 bulan** ke belakang
- Throughput terbatas: 5 pesan/detik (vs 80 normal)
- Completion event: `FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING`

### CSP (Content Security Policy)

Jika app menggunakan CSP headers, tambahkan:

```
script-src: https://connect.facebook.net
frame-src: https://www.facebook.com https://web.facebook.com
connect-src: https://graph.facebook.com
```

### Penggunaan di Settings Page

```tsx
// app/(dashboard)/settings/whatsapp/page.tsx
'use client';

import { WhatsAppEmbeddedSignup } from '@/components/whatsapp-embedded-signup';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function WhatsAppSettingsPage() {
  const router = useRouter();

  const handleSuccess = async (result: {
    code: string;
    waba_id: string;
    phone_number_id: string;
  }) => {
    const res = await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });

    if (res.ok) {
      toast.success('WhatsApp berhasil dihubungkan!');
      router.push('/pesanan');
    } else {
      toast.error('Gagal menghubungkan WhatsApp. Coba lagi.');
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Hubungkan WhatsApp</h1>
      <p className="text-sm text-gray-500">
        Hubungkan nomor WhatsApp bisnis kamu agar customer bisa pesan langsung
        via WhatsApp dan pesanan otomatis tercatat.
      </p>
      <WhatsAppEmbeddedSignup
        appId={process.env.NEXT_PUBLIC_FB_APP_ID!}
        configId={process.env.NEXT_PUBLIC_WA_CONFIG_ID!}
        onSuccess={handleSuccess}
        onError={(err) => toast.error(err)}
        onCancel={() => toast.info('Dibatalkan')}
      />
    </div>
  );
}
```

---

## 8. Backend Implementation

### Token Exchange Endpoint

```typescript
// app/api/whatsapp/connect/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encryptToken } from '@/lib/utils/encryption';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code, waba_id, phone_number_id } = await request.json();
  if (!code || !waba_id || !phone_number_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // 1. Exchange code for access token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v22.0/oauth/access_token` +
    `?client_id=${process.env.NEXT_PUBLIC_FB_APP_ID}` +
    `&client_secret=${process.env.FB_APP_SECRET}` +
    `&code=${code}`
  );
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error('Token exchange failed:', tokenData);
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
  }

  const accessToken = tokenData.access_token;
  const expiresIn = tokenData.expires_in || 5184000; // Default 60 days

  // 2. Subscribe app to WABA webhooks (CRITICAL — tanpa ini webhook tidak masuk)
  const subscribeRes = await fetch(
    `https://graph.facebook.com/v22.0/${waba_id}/subscribed_apps`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const subscribeData = await subscribeRes.json();

  if (!subscribeData.success) {
    console.error('Webhook subscription failed:', subscribeData);
    return NextResponse.json({ error: 'Webhook subscription failed' }, { status: 500 });
  }

  // 3. Get phone number details
  const phoneRes = await fetch(
    `https://graph.facebook.com/v22.0/${phone_number_id}` +
    `?fields=display_phone_number,verified_name`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const phoneData = await phoneRes.json();

  // 4. Store connection in database (service role for bypassing RLS)
  const { createServiceClient } = await import('@/lib/supabase/server');
  const serviceClient = await createServiceClient();

  // Deactivate any existing connections for this user
  await serviceClient
    .from('wa_connections')
    .update({ is_active: false })
    .eq('user_id', user.id);

  // Insert new connection
  const { error: insertError } = await serviceClient
    .from('wa_connections')
    .insert({
      user_id: user.id,
      wa_phone_number_id: phone_number_id,
      wa_business_id: waba_id,
      access_token: encryptToken(accessToken),
      display_phone_number: phoneData.display_phone_number || null,
      display_name: phoneData.verified_name || null,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      is_active: true,
    });

  if (insertError) {
    console.error('Database insert error:', insertError);
    return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

### Token Encryption Utility

```typescript
// lib/utils/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.WA_TOKEN_ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encryptToken(token: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptToken(encryptedToken: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Database Schema Update

Kolom tambahan yang diperlukan di `wa_connections`:

```sql
-- Migration: Add Embedded Signup columns to wa_connections
ALTER TABLE wa_connections
  ADD COLUMN IF NOT EXISTS display_phone_number TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Index for webhook routing (sudah ada, tapi pastikan)
CREATE INDEX IF NOT EXISTS idx_wa_connections_phone_number_id
  ON wa_connections(wa_phone_number_id);

-- Index for token refresh cron
CREATE INDEX IF NOT EXISTS idx_wa_connections_token_expires
  ON wa_connections(token_expires_at)
  WHERE is_active = true;
```

---

## 9. Multi-Tenant Webhook Architecture

### Routing — Sudah Ada di CatatOrder!

Webhook payload dari Meta mengandung `phone_number_id` sebagai routing key:

```json
{
  "entry": [{
    "changes": [{
      "value": {
        "metadata": {
          "display_phone_number": "628123456789",
          "phone_number_id": "1234567890"
        },
        "messages": [{
          "from": "628987654321",
          "id": "wamid.HBgL...",
          "type": "text",
          "text": { "body": "Pesan 2 nasi goreng" }
        }]
      }
    }]
  }]
}
```

**CatatOrder sudah handle ini!** Di `lib/wa-bot/handler.ts`:

```typescript
// Line 35-49 — lookup connection by phone_number_id
const { data: connection } = await supabase
  .from('wa_connections')
  .select('*')
  .eq('wa_phone_number_id', phoneNumberId)  // ← routing key
  .eq('is_active', true)
  .single();
```

### Single Webhook Endpoint

- **1 webhook URL** untuk SEMUA tenants: `https://catatorder.id/api/wa/webhook`
- Semua WABA yang di-subscribe ke app kita akan kirim webhook ke URL ini
- Routing berdasarkan `phone_number_id` di payload
- Tidak perlu webhook URL terpisah per tenant

### Webhook Verification

Hanya perlu 1 kali — saat pertama kali configure di Meta Developer Portal:

```typescript
// Sudah ada di app/api/wa/webhook/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WA_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}
```

### Critical: Return 200 dalam 5 Detik

Meta retry webhook jika tidak dapat HTTP 200 dalam 5 detik, dengan exponential backoff hingga 7 hari. CatatOrder sudah handle ini dengan `after()` dari `next/server` — process message secara async setelah return 200.

### Perubahan yang Diperlukan di handler.ts

Minimal — hanya perlu update `getWaConfig()` untuk decrypt token:

```typescript
// Saat ini (hardcoded dari env/db):
const config: WaConfig = {
  accessToken: conn.access_token,  // plaintext dari DB
  phoneNumberId: conn.wa_phone_number_id,
  apiVersion: process.env.WA_API_VERSION || 'v24.0',
};

// Setelah Embedded Signup (dengan decryption):
import { decryptToken } from '@/lib/utils/encryption';

const config: WaConfig = {
  accessToken: decryptToken(conn.access_token),  // decrypt dari DB
  phoneNumberId: conn.wa_phone_number_id,
  apiVersion: process.env.WA_API_VERSION || 'v22.0',
};
```

---

## 10. Token Management

### Token Types

| Tipe | Sumber | Masa Berlaku | Use Case |
|------|--------|-------------|----------|
| Authorization code | `FB.login()` callback | Sekali pakai | Exchange untuk access token |
| System user token | Code exchange (via ES config) | 60 hari | **Recommended** untuk production |
| Permanent token | Meta Business Manager UI | Tidak expire | Untuk WABA milik sendiri (bukan customer) |

### Token Refresh Strategy

Facebook **TIDAK punya refresh token**. Strategi:

1. Simpan `token_expires_at` di `wa_connections`
2. Cron job harian: cek token yang expire dalam 7 hari
3. Exchange token lama untuk yang baru:

```typescript
// api/cron/refresh-wa-tokens/route.ts
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = await createServiceClient();
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Find tokens expiring within 7 days
  const { data: connections } = await supabase
    .from('wa_connections')
    .select('*')
    .eq('is_active', true)
    .lt('token_expires_at', sevenDaysFromNow.toISOString());

  for (const conn of connections || []) {
    const currentToken = decryptToken(conn.access_token);

    const res = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${process.env.NEXT_PUBLIC_FB_APP_ID}` +
      `&client_secret=${process.env.FB_APP_SECRET}` +
      `&fb_exchange_token=${currentToken}`
    );
    const data = await res.json();

    if (data.access_token) {
      await supabase
        .from('wa_connections')
        .update({
          access_token: encryptToken(data.access_token),
          token_expires_at: new Date(Date.now() + (data.expires_in || 5184000) * 1000),
        })
        .eq('id', conn.id);
    } else {
      // Token sudah expired, mark as expired
      await supabase
        .from('wa_connections')
        .update({ is_active: false, status: 'expired' })
        .eq('id', conn.id);
      // TODO: Notify user to re-connect
    }
  }

  return NextResponse.json({ refreshed: connections?.length || 0 });
}
```

### Jika Token Expired

- API calls return HTTP 401 `OAuthException`
- Webhooks tetap delivered (webhook di level app, bukan token)
- Tidak bisa kirim pesan atau manage WABA
- User harus re-authenticate via Embedded Signup
- System detect 401 → mark connection sebagai `expired` → notify tenant

---

## 11. Pricing & Cost Model

### Per-Message Rates Indonesia (Effective July 2025)

| Tipe Pesan | Tarif (IDR) | Tarif (USD) | Kapan Gratis? |
|------------|-------------|-------------|---------------|
| **Service** (reply dalam 24h window) | **Rp0 (GRATIS)** | $0.00 | Selalu gratis, unlimited |
| **Utility template** (dalam 24h window) | **Rp0 (GRATIS)** | $0.00 | Sejak Juli 2025 |
| **Utility template** (di luar 24h window) | **Rp367** | ~$0.022 | — |
| **Marketing template** | **Rp597** | ~$0.036 | Hanya gratis dalam 72h CTWA ads window |
| **Authentication template** | **Rp367** | ~$0.022 | — |

### 24-Hour Customer Service Window

- **Trigger:** Setiap kali customer kirim pesan ke nomor bisnis
- **Durasi:** 24 jam dari pesan terakhir customer (reset setiap ada pesan baru)
- **GRATIS di dalam window:** Service messages (unlimited) + Utility templates
- **TETAP BAYAR di dalam window:** Marketing templates, Authentication templates

### 72-Hour Click-to-WhatsApp Ads Window

- **Trigger:** Customer klik iklan "Click to WhatsApp" → pesan ke bisnis
- **Durasi:** 72 jam (3 hari)
- **GRATIS:** SEMUA tipe pesan (marketing, utility, auth, service)

### Volume Tier Discounts (Utility & Authentication Only)

| Tier | Diskon | Catatan |
|------|--------|---------|
| Tier 1 | 0% (base rate) | 0 sampai V1 pesan |
| Tier 2 | -5% | V1+1 sampai V2 |
| Tier 3 | -10% | V2+1 sampai V3 |
| Tier 4 | -15% | V3+1 sampai V4 |
| Tier 5 | -20% | V4+1 sampai V5 |
| Tier 6 | -25% | V5+ pesan |

Threshold (V1-V5) berbeda per negara, lihat rate card CSV di business.whatsapp.com. Marketing messages **TIDAK eligible** untuk volume discount.

### Cost Model untuk UMKM CatatOrder

#### Skenario: Warung Kecil (20 order/hari)

| Tipe Pesan | Volume/Bulan | Tarif | Biaya |
|------------|-------------|-------|-------|
| Service messages (reply pesanan) | ~600 | GRATIS | Rp0 |
| Utility templates dalam window (konfirmasi, struk) | ~480 (80%) | GRATIS | Rp0 |
| Utility templates di luar window (rekap, reminder) | ~90 | Rp367 | Rp33,030 |
| Marketing templates (promo, menu baru) | ~30 | Rp597 | Rp17,910 |
| **TOTAL** | | | **~Rp51K (~$3)** |

#### Skenario: Toko Sedang (50 order/hari)

| Tipe Pesan | Volume/Bulan | Tarif | Biaya |
|------------|-------------|-------|-------|
| Service messages | ~1,500 | GRATIS | Rp0 |
| Utility dalam window | ~1,200 | GRATIS | Rp0 |
| Utility di luar window | ~200 | Rp367 | Rp73,400 |
| Marketing | ~100 | Rp597 | Rp59,700 |
| **TOTAL** | | | **~Rp133K (~$8)** |

### Key Insight

CatatOrder adalah **customer-initiated workflow** — customer chat duluan untuk pesan. Artinya **mayoritas pesan GRATIS** (service messages). Yang bayar hanya:
1. Proactive templates di luar 24h window (rekap harian, reminder)
2. Marketing messages (promo)

### Cost Optimization Strategy

Kirim rekap dan reminder **DALAM** 24h customer window kapanpun memungkinkan:
- Customer pesan hari ini → kirim rekap malam ini (masih dalam 24h) = **GRATIS**
- Jangan kirim rekap besok pagi (di luar window) = Rp367

---

## 12. WhatsApp Coexistence

### Apa Itu

Fitur resmi Meta (launch Mei 2025) yang memungkinkan bisnis menggunakan **WA Business App DAN Cloud API pada nomor yang SAMA secara bersamaan**.

### Pricing dalam Coexistence Mode

| Aksi | Biaya |
|------|-------|
| Customer kirim pesan, reply via **WA Business App** | **GRATIS** (selalu gratis, sama seperti WA biasa) |
| Customer kirim pesan, reply via **Cloud API** (service) | **GRATIS** (dalam 24h window) |
| Kirim template via **Cloud API** (utility, dalam window) | **GRATIS** |
| Kirim template via **Cloud API** (marketing/auth) | **BAYAR** sesuai rate card |
| Semua pesan via **WA Business App** | **TIDAK PERNAH DITAGIH META** |

### Mengapa Coexistence Ideal untuk UMKM

- UMKM owner reply manual via WA Business App → **gratis**
- Bot CatatOrder handle automation via Cloud API → **murah**
- Best of both worlds: sentuhan personal + otomasi
- Tidak perlu meninggalkan WA Business App yang sudah familiar
- Chat history sync hingga 6 bulan ke belakang

### Limitations

- Disappearing messages disabled
- Broadcast lists disabled
- View-once media disabled
- Throughput: 5 msg/sec (vs 80 normal)
- Butuh WA Business App versi 2.24.17+

---

## 13. Billing Model Options

### Siapa yang Bayar Meta Messaging Fees?

| Model | Cara Kerja | Pro | Con |
|-------|------------|-----|-----|
| **Tech Provider** (recommended awal) | User bayar Meta langsung via credit card di WABA mereka | Zero risk untuk Strive, simple | UMKM mungkin tidak punya kartu kredit |
| **Solution Partner** | Strive bayar Meta, tagih ke user via subscription | Better UX, user tidak perlu kartu | Perlu SP status, credit risk |
| **Partner dengan SP** | Partner dengan BSP lokal (Barantum, Qontak) yang handle billing | Middle ground | SP ambil fee |

### Rekomendasi untuk CatatOrder

**Phase 1 (awal):** Mulai sebagai Tech Provider — user yang punya kartu kredit bayar Meta langsung. Absorb messaging cost ke subscription price bagi yang tidak punya kartu.

**Phase 2 (scale):** Partner dengan Solution Partner lokal (Barantum, Qontak) untuk handle credit line. Atau apply Solution Partner sendiri setelah 10+ clients.

### Pricing CatatOrder + WA Bot

| Plan | Harga | WA Bot? | Estimasi Meta Cost/User |
|------|-------|---------|------------------------|
| Gratis | Rp0 | Tidak | Rp0 |
| Plus | Rp49K | **Ya** | ~Rp33-51K (margin tipis) |
| Pro | Rp99K | **Ya** | ~Rp33-133K (margin okay) |

**Opsi alternatif:** WA Bot sebagai add-on terpisah (Rp49K base + Rp49K WA Bot) untuk menjaga margin.

---

## 14. Apa yang Sudah Ada vs Perlu Dibuat

### Sudah Ada (✅ ~80% Backend Ready)

| Komponen | File | Status |
|----------|------|--------|
| `wa_connections` table (multi-tenant) | DB migration | ✅ Sudah ada |
| Webhook routing by `phone_number_id` | `lib/wa-bot/handler.ts` L35-49 | ✅ Sudah ada |
| Session management per connection | `lib/wa-bot/session.ts` | ✅ Sudah ada |
| Order creation linked to `connection.user_id` | `lib/wa-bot/order-creator.ts` | ✅ Sudah ada |
| Bot messages | `lib/wa-bot/messages.ts` | ✅ Sudah ada |
| `getWaConfig()` helper | `lib/whatsapp/config.ts` | ✅ Sudah ada |
| WA Cloud API client | `lib/whatsapp/client.ts` | ✅ Sudah ada |
| Webhook signature verification | `lib/whatsapp/verify.ts` | ✅ Sudah ada |
| Webhook endpoint (GET + POST) | `app/api/wa/webhook/route.ts` | ✅ Sudah ada |

### Perlu Dibuat

| Komponen | Estimasi | Prioritas |
|----------|----------|-----------|
| Meta App setup di Developer Portal | 1 hari (manual) | P0 |
| Business Verification submit | 1 hari (manual) + tunggu 1-14 hari | P0 |
| App Review submission (2 video + forms) | 1 hari (manual) + tunggu 3-7 hari | P0 |
| Embedded Signup React component | 0.5 hari | P0 |
| `/api/whatsapp/connect` (token exchange + subscribe) | 0.5 hari | P0 |
| Settings page UI "Hubungkan WhatsApp" | 0.5 hari | P0 |
| Token encryption utility | 0.5 hari | P0 |
| DB migration (tambah kolom) | 0.5 hari | P0 |
| Update `handler.ts` untuk decrypt token | 0.5 hari | P0 |
| Token refresh cron job | 0.5 hari | P1 |
| WA connection status page (connected/expired) | 0.5 hari | P1 |
| Disconnect/reconnect flow | 0.5 hari | P2 |

**Total coding effort: ~3-4 hari**
**Total elapsed time: ~1-2 minggu** (termasuk menunggu Meta approval)

---

## 15. Implementation Plan

### Phase 0: Meta Setup (Day 1-2)

- [ ] Buat Meta Business Portfolio untuk Strive di business.facebook.com
- [ ] Submit Business Verification (NIB/IUMK)
- [ ] Buat Meta App (Business type) di developers.facebook.com
- [ ] Tambah product: WhatsApp + Facebook Login for Business
- [ ] Buat Configuration (WhatsApp Embedded Signup)
- [ ] Configure OAuth settings (enable semua, tambah domain)
- [ ] Simpan: App ID, App Secret, Configuration ID

### Phase 1: App Review Prep (Day 2-3)

- [ ] Build minimal template management UI (untuk Video 1)
- [ ] Record Video 1: Template creation flow
- [ ] Record Video 2: Message send + receive
- [ ] Fill Data Handling Questionnaire
- [ ] Submit App Review untuk Advanced Access
- [ ] **Tunggu 3-7 hari**

### Phase 2: Build (Day 3-6, parallel dengan menunggu review)

- [ ] Create DB migration (tambah kolom ke `wa_connections`)
- [ ] Build `lib/utils/encryption.ts` (token encryption)
- [ ] Build `components/whatsapp-embedded-signup.tsx` (React component)
- [ ] Build `app/api/whatsapp/connect/route.ts` (token exchange + webhook subscribe)
- [ ] Build Settings page UI "Hubungkan WhatsApp"
- [ ] Update `handler.ts` — decrypt token sebelum pakai
- [ ] Update `getWaConfig()` — support encrypted tokens

### Phase 3: Test (Day 7-8)

- [ ] Test Embedded Signup dengan test account (Development mode)
- [ ] Test token exchange flow
- [ ] Test webhook routing untuk 2+ connections
- [ ] Test bot flow end-to-end dengan nomor kedua
- [ ] Test token refresh

### Phase 4: Go Live (After App Review Approved)

- [ ] Switch Meta App ke Live mode
- [ ] Deploy ke production
- [ ] Test dengan 1 real user (bukan test account)
- [ ] Monitor webhook delivery dan error rates

### Phase 5: Polish (Week 2-3)

- [ ] Build token refresh cron job
- [ ] Build WA connection status page (connected/expired/disconnected)
- [ ] Build disconnect/reconnect flow
- [ ] Build notification system (email/WA) untuk token expiry
- [ ] Documentation/onboarding guide untuk user

### Future: Scale (Month 2+)

- [ ] Apply Tech Provider status (setelah 10+ clients)
- [ ] Partner dengan Solution Partner lokal untuk credit line
- [ ] White-label Embedded Signup (setelah jadi Tech Provider)
- [ ] Template management UI (user bisa buat template sendiri)
- [ ] Analytics dashboard per tenant (messages sent, costs)

---

## 16. Risk & Mitigasi

| Risk | Severity | Mitigasi |
|------|----------|---------|
| App Review ditolak | Medium | Buat video berkualitas tinggi, ikuti guidelines ketat. Kalau ditolak, fix → resubmit (3-5 hari) |
| Business Verification lama | Low | Submit ASAP, gunakan jalur Partner-led (PLBV) jika tersedia |
| User UMKM tidak punya Facebook | Low | 99%+ orang Indonesia punya Facebook. Bisa sign up gratis |
| Token expired, user tidak re-connect | Medium | Cron job warning 7 hari sebelum expire, kirim email + WA notification |
| UMKM tidak bisa complete Business Verification | Medium | User TIDAK perlu verifikasi — hanya Strive yang perlu. User cukup login Facebook |
| Meta policy changes | Low | Gunakan official API = paling aman. Monitor Meta developer blog |
| Webhook delivery failures | Medium | Return 200 dalam 5 detik (sudah dihandle), implement dead letter queue |
| FINISH_ONLY_WABA (user tidak selesai) | Low | Handle di UI — show error message, minta user coba lagi |

---

## 17. Alternatif yang Dipertimbangkan (Ditolak)

### A. Shared Number dengan Routing

- Semua customer pesan ke 1 nomor CatatOrder, bot routing ke tenant
- **Ditolak karena:** Brand identity hilang (fatal untuk UMKM), collision context antar tenant, melanggar Meta ToS

### B. Fonnte/Wablas (Unofficial API)

- User scan QR code, Fonnte manage session
- **Ditolak karena:** Ban risk tinggi dan meningkat, Meta enforcement makin agresif 2025-2026, supply chain attacks (malicious Baileys npm packages), no support

### C. Virtual Numbers per Tenant

- Beli nomor virtual per user, daftarkan ke WA Business API
- **Ditolak karena:** Biaya Rp30-80K/tenant/bulan untuk nomor saja, margin habis di harga CatatOrder Rp49-99K

### D. QR Code Scanning (Baileys/whatsapp-web.js)

- User link nomor existing via QR code seperti WA Web
- **Ditolak karena:** Unofficial API, ban risk, session instability, no template messages, legal/ToS violation

### E. Tidak Membangun Multi-Tenant (Status Quo)

- Biarkan WA Bot hanya untuk owner, user lain pakai manual
- **Ditolak karena:** Value proposition terlalu lemah, competitive disadvantage, tidak scalable

---

## 18. Sources

### Official Meta Documentation
- [Meta Developers — WhatsApp Embedded Signup](https://developers.facebook.com/docs/whatsapp/embedded-signup/)
- [WhatsApp Business Platform Pricing](https://business.whatsapp.com/products/platform-pricing)
- [Meta — Become a WhatsApp Partner](https://business.whatsapp.com/partners/become-a-partner)

### Implementation Guides
- [Chatwoot — WhatsApp Embedded Signup Docs](https://developers.chatwoot.com/self-hosted/configuration/features/integrations/whatsapp-embedded-signup)
- [Teknasyon Engineering — Embedded Signup Guide](https://engineering.teknasyon.com/embedded-signup-a-solution-to-streamline-transition-to-whatsapp-business-api-cdf57783a2d4)
- [FreJun — Embedded Signup Onboarding Guide](https://frejun.com/whatsapp-business-embedded-signup-guide/)
- [Alibaba Cloud — Implement Embedded Signup](https://www.alibabacloud.com/help/en/chatapp/use-cases/implement-embedded-signup)

### Open Source References
- [Chatwoot GitHub — whatsapp/utils.js](https://github.com/chatwoot/chatwoot/blob/develop/app/javascript/dashboard/routes/dashboard/settings/inbox/channels/whatsapp/utils.js)
- [Gaurang200/whatsapp-embedded-signup (React Example)](https://github.com/Gaurang200/whatsapp-embedded-signup)
- [Evolution API (Multi-tenant WA Gateway)](https://github.com/EvolutionAPI/evolution-api)

### BSP & Tech Provider Documentation
- [Twilio — WhatsApp Tech Provider Integration Guide](https://www.twilio.com/docs/whatsapp/isv/tech-provider-program/integration-guide)
- [Infobip — Tech Provider Program Setup](https://www.infobip.com/docs/whatsapp/tech-provider-program/setup-and-integration)
- [360dialog — Meta Tech Provider Step-by-Step](https://docs.360dialog.com/partner/get-started/tech-provider-program/becoming-a-meta-tech-provider-a-step-by-step-guide)
- [YCloud — Embedded Signup Partner Center](https://helpdocs.ycloud.com/partner-center/english-en-2/ji-shu-kai-fa-huo-ban/embedded-signup)

### Pricing & Billing
- [FlowCall — WhatsApp Business API Pricing 2026](https://flowcall.co/blog/whatsapp-business-api-pricing-2026)
- [Gallabox — Per-Message Pricing](https://docs.gallabox.com/pricing-and-billing-modules/new-per-message-pricing)
- [Barantum — Daftar Biaya WhatsApp API](https://www.barantum.com/blog/whatsapp-api-pricing/)
- [Respond.io — WhatsApp Business API Pricing](https://respond.io/blog/whatsapp-business-api-pricing)
- [ChakraHQ — Pricing Updates July 2025](https://chakrahq.com/article/pricing-updates-for-whatsapp-business-platform-effective-july-2025-onwards/)

### Coexistence & Multi-Tenant
- [PepperCloud — WhatsApp Coexistence Guide](https://blog.peppercloud.com/whatsapp-coexistence-guide/)
- [ChakraHQ — Coexistence Mode Guide](https://chakrahq.com/article/whatsapp-coexistence-all-about-coexistence-mode-pricing-and-how-to-optimize-cost/)
- [WATI — Coexistence Guide](https://support.wati.io/en/articles/11822421-how-to-connect-your-whatsapp-number-to-wati-via-whatsapp-coexistence-coex)

### Webhook Architecture
- [Siri Prasad — Shadow Delivery Mystery (Why Webhooks Silently Fail)](https://medium.com/@siri.prasad/the-shadow-delivery-mystery-why-your-whatsapp-cloud-api-webhooks-silently-fail-and-how-to-fix-2c7383fec59f)
- [360dialog — Webhook Documentation](https://docs.360dialog.com/docs/waba-messaging/webhook)
- [ChatArchitect — Scalable Webhook Architecture](https://www.chatarchitect.com/news/building-a-scalable-webhook-architecture-for-custom-whatsapp-solutions)

### Verification & App Review
- [360dialog — Meta Business Verification](https://docs.360dialog.com/docs/waba-basics/meta-business-verification)
- [Indigitall — Meta Business Verification (Indonesia Documents)](https://documentation.indigitall.com/docs/meta-business-verification)
- [Saurabh Dhar — Meta App Approval Guide](https://www.saurabhdhar.com/blog/meta-app-approval-guide)
- [Anjana Dhakal — WhatsApp Business Platform App Review](https://medium.com/@anjanadhakal09/whatsapp-business-platform-app-review-e1e2a0c34420)

### Security
- [The Register — Malicious Baileys npm Package (Supply Chain Attack)](https://www.theregister.com/2025/12/22/whatsapp_npm_package_message_steal/)
- [Baileys GitHub — Ban Issues Discussion](https://github.com/WhiskeySockets/Baileys/issues/1869)

---

*Last updated: 2026-02-15*
