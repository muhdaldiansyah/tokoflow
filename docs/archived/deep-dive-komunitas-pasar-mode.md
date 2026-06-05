# Deep Dive: Komunitas/Pasar Mode — Implementasi yang Benar

> Chain-of-thought analysis: bagaimana membangun fitur komunitas yang mengubah KAKIS dari 6/25 ke 19/25
>
> **Tanggal:** 2026-03-22
> **Basis:** 36 kesimpulan realitas + riset platform Indonesia + audit codebase existing
> **Prerequisite:** Baca `deep-dive-architecture-transformation.md` dan `gap-analysis-36-kesimpulan.md`

---

## STEP 1: APA YANG SUDAH ADA (Jangan Bangun Ulang)

### Marketplace/Directory System
- `/toko` — global merchant directory (SSR, filters, search)
- `/toko/[citySlug]` — per-city directory page (dynamic SSR, SEO)
- `/api/directory` — public API (cache 2-5 min, parallel queries)
- `DirectoryGrid.tsx` — client-side filter UI + merchant card grid
- `referral_source` tracking pada orders (`?from=directory`)
- Sitemap dinamis (merchant pages + city pages)
- JSON-LD LocalBusiness pada setiap store page

### Referral System
- `referral_code` auto-generated per user (6-char, UNIQUE)
- `referred_by` tracking pada signup
- 30% commission selama 6 bulan
- Atomic RPC `increment_referral_commission`
- Admin payout via `/admin/mitra`
- **MASALAH:** UI referral di settings sudah DIHAPUS — API ada tapi frontend tidak

### Yang Bisa Di-Reuse
- DirectoryGrid component (filter + card pattern)
- Referral code generation + tracking
- Store page SSR pattern (`/pesan/[slug]`)
- SEO pattern (JSON-LD, OG, sitemap)
- `referral_source` pada orders
- City + category filtering infrastructure

---

## STEP 2: RISET PLATFORM INDONESIA — POLA YANG TERBUKTI

### GrabMart Pasar
- 5,100 pedagang pasar tradisional
- Grouping by **lokasi fisik pasar** (Pasar Mayestik, Pasar Gede, dll)
- "Pesan Sekaligus" — multi-merchant, 1 checkout, 1 ongkir
- **Pola:** Pasar = unit, pedagang = member, konsumen browse per pasar

### GoFood KOMPAG
- **212,000 member** di 104 kota
- Facebook/Telegram groups per kota
- Peer-to-peer support + training content
- **Pola:** Komunitas = sosial (bukan teknologi), berjalan di WA/FB yang sudah ada

### Tokopedia Hyperlocal
- Sales index naik **147%** di kota dengan program hyperlocal
- **5x lebih tinggi** dari kota tanpa program
- **Pola:** Komunitas geografis + training berkala + mentor lokal

### Mitra Bukalapak
- **6.9 juta partner warung**
- 80% partner revenue naik 2x
- Trust transfer lewat jaringan tetangga
- **Pola:** Agent network — 1 warung jadi hub digital untuk komunitas sekitar

### Data CLG (Community-Led Growth) Global
- Community members convert **4.8x** lebih tinggi
- Retensi **37% lebih baik**
- Churn turun **29%**
- Revenue growth **2.1x** lebih cepat
- CAC turun **32%**

### WhatsApp sebagai Infrastruktur
- 6 juta WhatsApp Business user di Indonesia
- WA group = infrastruktur komunitas UMKM yang SUDAH ADA
- "Pasar Jajan WhatsApp" — pop-up marketplace 10 UMKM F&B di 1 WA group
- **Pola:** Jangan ganti WA, komplemen WA

---

## STEP 3: KEPUTUSAN DESAIN KRITIS

### 3.1 Apa itu "Komunitas" di CatatOrder?

**Bukan** lokasi fisik (itu sudah di-handle `/toko/[city]`).
**Bukan** chat group (itu di WA, jangan compete).

**Komunitas = kumpulan UMKM yang saling kenal**, diorganisir oleh 1 orang, punya halaman bersama di CatatOrder, dan di-distribusikan lewat WA group mereka.

Contoh:
- "Katering Bekasi" — 15 ibu katering dari WA group yang sama
- "Bazaar Ramadan Masjid Al-Ikhlas" — 20 tenant bazaar
- "Komunitas Kue Custom Tangerang" — dari grup FB/IG yang sudah ada
- "Pasar UMKM RT 05" — dari arisan/pengajian

### 3.2 Siapa Koordinator?

Pertama: **kamu** (founder). Kamu yang masuk WA group, buat komunitas, ajak member.

Setelah ada traction: **ketua pasar, organizer bazaar, ketua RT, admin WA group** — orang yang sudah punya authority di komunitas itu.

Koordinator **bukan admin CatatOrder** — mereka user biasa yang membuat komunitas.

### 3.3 Model Data: Table Baru vs Extend Existing

**Keputusan: Table baru `communities` + `community_members`.**

Alasan:
- Komunitas ≠ kota (1 kota bisa punya banyak komunitas)
- Komunitas ≠ kategori (1 komunitas bisa campuran)
- Komunitas punya lifecycle (bazaar temporer punya tanggal mulai/akhir)
- Komunitas punya koordinator (relasi 1-to-many)
- Member bisa join/leave

### 3.4 Halaman Komunitas vs Landing Page Utama

```
catatorder.id/                        → Landing page umum (cold traffic, SEO)
catatorder.id/toko                    → Directory semua merchant
catatorder.id/toko/bekasi             → Directory per kota
catatorder.id/komunitas/[slug]        → Landing page komunitas (UTAMA untuk distribusi WA)
catatorder.id/join/[code]             → Shortlink join → redirect ke register + community
catatorder.id/[slug]                  → Store page individual (order form)
```

**`/komunitas/[slug]` adalah pintu masuk UTAMA** — bukan `/`. Saat koordinator share di WA group, link yang di-share adalah halaman komunitas. Orang yang klik melihat nama-nama yang mereka kenal.

### 3.5 Referral: Individual vs Community

**Keputusan: Keduanya.**
- Individual referral tetap ada (champion kit, existing system)
- Community menambah `community_code` di URL (`/join/[code]`)
- Member yang signup via community link → `community_id` di-set di profile
- Orders dari community members → `referral_source: "community:[slug]"` untuk analytics
- Commission tetap per individual (koordinator = referrer), bukan community fund (terlalu kompleks untuk sekarang)

### 3.6 Apa yang Koordinator Dapat?

| Benefit | Detail |
|---------|--------|
| Halaman komunitas branded | `/komunitas/[slug]` dengan nama, deskripsi, member list |
| Stats aggregate | Total pesanan, revenue, member count (sederhana) |
| Referral commission | 30% dari pembayaran member (pakai existing referral system) |
| Status "Koordinator" | Badge di profil + link toko |
| Share tools | Pre-composed WA invite message per komunitas |

---

## STEP 4: DATA MODEL

### Tabel Baru: `communities`

```sql
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "Katering Bekasi"
  slug TEXT UNIQUE NOT NULL,             -- "katering-bekasi"
  description TEXT,                      -- "Komunitas ibu-ibu katering area Bekasi"
  organizer_id UUID NOT NULL REFERENCES auth.users(id),
  invite_code TEXT UNIQUE NOT NULL,      -- 6-char, untuk /join/[code]
  city TEXT,                             -- denormalized dari organizer
  city_slug TEXT,
  category TEXT,                         -- optional: kategori dominan
  is_active BOOLEAN DEFAULT true,
  event_date_start DATE,                 -- null = permanent, set = bazaar/event
  event_date_end DATE,
  member_count INTEGER DEFAULT 1,        -- denormalized counter
  total_orders INTEGER DEFAULT 0,        -- denormalized counter
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_communities_slug ON communities(slug) WHERE is_active = true;
CREATE INDEX idx_communities_organizer ON communities(organizer_id);
CREATE INDEX idx_communities_city ON communities(city_slug) WHERE is_active = true;
```

### Tabel Baru: `community_members`

```sql
CREATE TABLE community_members (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT DEFAULT 'member',           -- 'organizer' | 'member'
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

-- Index for "my communities" query
CREATE INDEX idx_community_members_user ON community_members(user_id);
```

### Extend: `profiles`

```sql
-- Primary community (for display on store page + attribution)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id);
CREATE INDEX idx_profiles_community ON profiles(community_id) WHERE community_id IS NOT NULL;
```

### RLS Policies

```sql
-- Communities: public read, organizer write
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active communities"
  ON communities FOR SELECT USING (is_active = true);
CREATE POLICY "Organizers can update their communities"
  ON communities FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT WITH CHECK (auth.uid() = organizer_id);

-- Members: authenticated read, self insert/delete
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members visible to authenticated"
  ON community_members FOR SELECT USING (true);
CREATE POLICY "Users can join communities"
  ON community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave communities"
  ON community_members FOR DELETE USING (auth.uid() = user_id);
```

---

## STEP 5: HALAMAN & ROUTES

### 5.1 `/komunitas/[slug]` — Community Landing Page (PUBLIC, SSR)

**Ini halaman TERPENTING.** Ini yang di-share di WA group.

```
┌─────────────────────────────────────┐
│  Komunitas Katering Bekasi          │
│  "Ibu-ibu katering area Bekasi     │
│   yang udah pakai CatatOrder"       │
│                                     │
│  👥 8 UMKM sudah bergabung         │
│  📦 234 pelanggan dilayani          │
│                                     │
│  ┌─────────┐ ┌─────────┐          │
│  │ Rina's  │ │ Dapur   │          │
│  │ Kitchen │ │ Bu Siti │          │
│  │ Kue     │ │ Katerin │          │
│  │ 47 pesan│ │ 82 pesan│          │
│  └─────────┘ └─────────┘          │
│  ┌─────────┐ ┌─────────┐          │
│  │ Catering│ │ Kue     │          │
│  │ Barokah │ │ Mama Ina│          │
│  └─────────┘ └─────────┘          │
│  ... +4 lagi                        │
│                                     │
│  [Gabung Komunitas — Gratis]        │
│                                     │
│  Buat link toko, pelanggan pesan    │
│  sendiri. Dari jualan jadi usaha.   │
└─────────────────────────────────────┘
```

**Data yang ditampilkan:**
- Community name + description
- Member count + total orders (aggregate)
- Grid of member stores (reuse DirectoryGrid card pattern)
- Each card: logo, business name, category, completed orders
- CTA: "Gabung Komunitas" → `/register?community=[invite_code]`
- Optional: event dates untuk bazaar temporer

**SEO:**
- JSON-LD Organization + hasMember (array of LocalBusiness)
- OG: "Komunitas Katering Bekasi — 8 UMKM | CatatOrder"
- Sitemap: auto-include active communities

### 5.2 `/join/[code]` — Shortlink Redirect

```
/join/ABC123 → /register?community=ABC123
           → (jika sudah login) /komunitas/join-confirm?code=ABC123
```

Pendek, mudah diketik, bisa di-print di banner bazaar.

### 5.3 `/komunitas` — My Communities (Dashboard, AUTH)

Settings/dashboard section untuk user:
- List komunitas yang di-join
- Tombol "Buat Komunitas" → form (nama, deskripsi, tipe: permanen/event)
- Untuk koordinator: member list, aggregate stats, share tools

### 5.4 Register Page Extension

Kalau URL punya `?community=[code]`:
- Banner hijau: "Kamu diundang bergabung **Komunitas Katering Bekasi**"
- Setelah signup, auto-join community
- Set `community_id` pada profile
- Set `referred_by` ke koordinator's referral_code (commission tracking)

### 5.5 Store Page Extension

Kalau merchant punya `community_id`:
- Badge di store page: "Anggota Komunitas Katering Bekasi"
- Link ke `/komunitas/[slug]` → "Lihat toko lain di komunitas ini"

---

## STEP 6: API ROUTES

| Method | Route | Auth | Fungsi |
|--------|-------|------|--------|
| GET | `/api/communities` | Public | List active communities (filtered by city/category) |
| GET | `/api/communities/[slug]` | Public | Community detail + members |
| POST | `/api/communities` | Auth | Create community |
| PUT | `/api/communities/[id]` | Auth (organizer) | Update community |
| POST | `/api/communities/[id]/join` | Auth | Join community |
| DELETE | `/api/communities/[id]/leave` | Auth | Leave community |
| GET | `/api/communities/[id]/stats` | Auth (organizer) | Aggregate stats |
| GET | `/api/communities/my` | Auth | My communities |

---

## STEP 7: FLOW UTAMA — DARI WA GROUP KE CATATORDER

```
1. Founder/koordinator masuk WA group ibu katering
   ↓
2. Buat komunitas di CatatOrder: "Katering Bekasi"
   → Dapat /komunitas/katering-bekasi + /join/ABC123
   ↓
3. Share di WA group:
   "Hai bu-ibu! Saya udah pakai CatatOrder buat terima pesanan.
    Pelanggan pesan sendiri lewat link, langsung tercatat rapi.

    Saya bikin komunitas buat kita:
    catatorder.id/join/ABC123

    Gratis — dari jualan jadi usaha ✨"
   ↓
4. Ibu A klik link → lihat halaman komunitas
   → Lihat "3 UMKM sudah bergabung" (termasuk nama yang dikenal)
   → Klik "Gabung Komunitas — Gratis"
   → Register → auto-join → setup 3 langkah → link toko siap
   ↓
5. Ibu B lihat Ibu A sudah join → "kok kamu sudah punya link toko?"
   → Buka link komunitas → lihat "4 UMKM sudah bergabung"
   → Join juga (social proof + shame mechanism)
   ↓
6. Setelah 8 member:
   → Halaman komunitas punya 8 toko → pelanggan bisa browse semua
   → Morning brief ke semua member
   → Koordinator lihat aggregate stats
   → KAKIS: Komunitas ✅ Akses ✅ Kuasa ✅ Identitas ✅ Shame ✅ = 19/25
```

---

## STEP 8: KAKIS SCORE ANALYSIS

| Dimensi | Tanpa Komunitas | Dengan Komunitas | Mekanisme |
|---------|----------------|-----------------|-----------|
| **Komunitas** | 1 — individual | **4** — member lihat sesama, share experience | Member list visible, aggregate stats |
| **Akses** | 3 — free, mobile | **4** — invite link 1-tap dari WA | `/join/[code]` → register → auto-join |
| **Kuasa** | 1 — no authority | **4** — koordinator = orang dipercaya | Koordinator share di WA = endorsement |
| **Identitas** | 1 — sendirian | **4** — "Anggota Komunitas X" badge | Badge di store page + community page |
| **Shame** | 0 — no pressure | **3** — "8 UMKM sudah join, kamu belum?" | Member count visible, social proof |
| **Total** | **6/25** | **19/25** | +13 points |

---

## STEP 9: IMPLEMENTASI — FILE YANG PERLU DIBUAT/DIMODIFIKASI

### File Baru (8)

| File | Fungsi |
|------|--------|
| `supabase/migrations/069_communities.sql` | Schema: communities + community_members + RLS |
| `app/api/communities/route.ts` | List + Create communities |
| `app/api/communities/[id]/route.ts` | Get + Update + Join + Leave |
| `app/api/communities/[id]/stats/route.ts` | Aggregate stats untuk koordinator |
| `app/api/communities/my/route.ts` | User's communities |
| `app/(marketing)/komunitas/[slug]/page.tsx` | Community landing page (PUBLIC, SSR) |
| `app/(marketing)/join/[code]/route.ts` | Shortlink redirect |
| `app/(dashboard)/komunitas/page.tsx` | My communities dashboard section |

### File Dimodifikasi (5)

| File | Perubahan |
|------|-----------|
| `features/receipts/types/receipt.types.ts` | Add `community_id` to Profile |
| `app/api/profile/route.ts` | Accept `community_id` in PUT |
| `app/api/auth/callback/route.ts` | Handle `?community=` param, auto-join |
| `features/auth/components/RegisterForm.tsx` | Show community banner + set cookie |
| `app/sitemap.ts` | Include community pages |

### File Reuse (3)

| File | Apa yang di-reuse |
|------|-------------------|
| `DirectoryGrid.tsx` pattern | Card grid layout + filtering (adapt for community members) |
| `/toko/[citySlug]/page.tsx` pattern | SSR + JSON-LD + OG pattern |
| Referral system | Commission tracking untuk koordinator |

---

## STEP 10: PRIORITAS IMPLEMENTASI

| # | Item | Effort | Urgensi | Catatan |
|---|------|--------|---------|---------|
| 1 | Migration + data model | LOW | HARUS | Fondasi |
| 2 | API routes (CRUD + join) | MEDIUM | HARUS | Backend |
| 3 | Community landing page | MEDIUM | HARUS | Halaman terpenting |
| 4 | Join shortlink | LOW | HARUS | Distribution entry point |
| 5 | Register flow + auto-join | LOW | HARUS | Seamless onboarding |
| 6 | My communities dashboard | LOW | BISA NANTI | Koordinator management |
| 7 | Store page badge | LOW | BISA NANTI | Community identity signal |
| 8 | Sitemap + SEO | LOW | BISA NANTI | Discovery |

**Minimum untuk launch: #1-5** (data model + API + community page + join link + register integration).

#6-8 bisa ditambahkan setelah ada 1 komunitas aktif pertama.

---

## STEP 11: YANG TIDAK PERLU DIBANGUN

| Item | Alasan Skip |
|------|-------------|
| Chat/forum dalam komunitas | WA sudah ada, jangan compete |
| Multi-merchant checkout ("Pesan Sekaligus") | Terlalu kompleks, setiap toko punya harga/stok berbeda |
| Community fund / shared commission | Terlalu kompleks, pakai individual referral dulu |
| Coordinator admin panel penuh | Sederhana saja — member list + 3 stats |
| Training/education content | Manual di WA group, bukan dalam produk |
| Community discovery/search | Komunitas di-distribute lewat WA, bukan di-search di website |

---

## STEP 12: RISIKO & MITIGASI

| Risiko | Mitigasi |
|--------|---------|
| Tidak ada yang buat komunitas | Founder buat sendiri untuk 3 WA group pertama |
| Komunitas sepi (1-2 member) | Minimum 3 member untuk publish halaman. Tampilkan "Segera dibuka" untuk < 3 |
| Koordinator tidak aktif | Auto-deactivate komunitas jika 0 new members dalam 30 hari |
| Spam/abuse | Rate limit community creation (max 3 per user). Manual review jika > 3 |
| SEO thin pages | Noindex communities < 3 members |

---

## META: KENAPA INI BEKERJA

Dari 36 kesimpulan:

1. **Arsitektur > Pikiran (#1):** Komunitas page = arsitektur yang membuat "ajak teman" menjadi default behavior, bukan keputusan individual
2. **Unit of change = komunitas (#20):** Fitur ini LITERALLY membuat komunitas menjadi unit of change
3. **TPCL (#25):** Invite di WA group = Trusted Person (koordinator) + Trusted Place (WA group) + Colloquial Language (pesan informal) + Liturgical Timing (saat ada event/bazaar)
4. **Cerita > Argumen (#6):** Halaman komunitas MENUNJUKKAN siapa yang sudah join (bukan argumen kenapa harus join)
5. **Social proof/mere exposure (#7):** Setiap kali member baru join, counter naik, reinforcing adoption
6. **Death valley (#4):** Member yang saling kenal = mutual accountability, mengurangi dropout

**Satu kalimat:**
> Komunitas mode mengubah CatatOrder dari "tool yang harus kamu coba sendiri" menjadi "sesuatu yang orang-orang yang kamu kenal sudah pakai."
