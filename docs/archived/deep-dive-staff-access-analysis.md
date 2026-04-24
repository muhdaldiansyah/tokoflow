# Deep Dive: Staff Access (Multi-User) — Research & Analysis

> Riset lengkap fitur Staff Access untuk CatatOrder:
> bagaimana kompetitor melakukannya, arsitektur teknis saat ini,
> pendekatan terbaik, dan apakah perlu dibangun sekarang.
>
> Tanggal: 2026-03-15

---

## Daftar Isi

1. [Bagaimana Kompetitor Melakukannya](#1-kompetitor)
2. [Pola Operasional UMKM Indonesia](#2-pola-operasional)
3. [Arsitektur CatatOrder Saat Ini](#3-arsitektur-saat-ini)
4. [2 Pendekatan Teknis](#4-pendekatan-teknis)
5. [Rekomendasi: Pendekatan Mana](#5-rekomendasi)
6. [Desain Fitur Detail](#6-desain-fitur)
7. [Effort Estimate](#7-effort-estimate)
8. [Kapan Harus Dibangun](#8-kapan)

---

## 1. Kompetitor

### POS Indonesia — Staff Login

| App | Login Method | Roles | Staff Gratis? | Harga Plan |
|-----|-------------|-------|---------------|-----------|
| **Moka** | PIN code | Owner + Employee | Included | Rp249-299K/bln |
| **Majoo** | 6-digit PIN | Owner/Kasir/Manager/Admin/Custom | Majoolite free | Rp1.700/hari+ |
| **Kasir Pintar** | Email+password | Owner/Admin/Manager/Kasir | 5 gratis (Pro) | Rp55K/bln |
| **Pawoon** | Back Office | Cashier/Staff/Manager | Included | Rp149-299K/bln |
| **Olsera** | Staff Code | Supervisor/Cashier/Waiter | Unlimited (Premium) | Rp218K/bln |

### Food Delivery — Merchant Staff

| Platform | Multi-user | Roles |
|----------|-----------|-------|
| **GoBiz** | Ya | Owner / Manager / Kasir (kasir tidak bisa lihat data sensitif) |
| **GrabMerchant** | Ya | Owner / Store Manager / Cashier |
| **ShopeeFood** | Ya | Admin / Staff |

### Global POS

| App | Login | Roles | Pricing |
|-----|-------|-------|---------|
| **Shopify POS** | PIN (4-6 digit) | Full staff + POS-only staff + Custom | POS Pro $89/bln |
| **Square** | PIN/Badge | Standard/Enhanced/Full/Custom | Free basic, Team Plus $45/bln |
| **Toast** | PIN | 5 layers (POS → Account Admin) | Free starter, add-on $90/bln |

### Pola Universal

1. **PIN-based login** adalah standar industri (bukan email+password per staff)
2. **3 role** adalah sweet spot: Owner, Manager/Kasir, Staff
3. **Shared device** (tablet di konter) + **personal device** (HP staff) harus didukung
4. **Void/refund** butuh approval manager (PIN override)
5. **Activity log** — siapa melakukan apa, kapan

---

## 2. Pola Operasional UMKM Indonesia

### Siapa yang Mengoperasikan?

| Skala Bisnis | % UMKM | Operator Harian | Pola |
|---|---|---|---|
| **Solo** (owner saja) | 52% | Owner = kasir = kurir | Tidak perlu staff access |
| **Mikro** (1-4 orang) | 83% total | Owner + 1-3 keluarga/karyawan | **Sharing password** atau owner operasikan sendiri |
| **Kecil** (5-19 orang) | 17% | Kasir dedicated + staff lain | **Butuh staff access** |

### Pola Nyata di Lapangan

**Warung/Kedai (dine-in):**
- Owner di dapur masak
- Kasir (istri/anak/karyawan) terima pesanan + terima bayar
- Kasir pakai tablet/HP di konter — **ini yang buka CatatOrder**
- Owner cek rekap di malam hari dari HP sendiri

**Katering/Kue (pre-order):**
- Owner terima pesanan via WA + production planning
- Anak/keponakan bantu input pesanan ke CatatOrder
- Staff kirim pesanan — perlu tahu alamat + status

**Yang Terjadi Tanpa Staff Access:**
- Owner kasih password ke kasir → kasir bisa akses billing, ubah harga, hapus data
- Atau owner input sendiri semua → bottleneck, gak scalable
- Atau staff pakai WA manual → kembali ke cara lama

### Data Gaji Kasir Warung

| Role | Gaji/bulan |
|------|-----------|
| Kasir warung | Rp1.8-3.5M |
| Pelayan | Rp1.5-3M |
| Koki | Rp2-5M |

**Insight:** Kasir warung adalah pekerjaan NYATA dengan gaji UMR. CatatOrder Staff Access tidak menciptakan "pekerjaan baru" — tapi membuat pekerjaan kasir yang sudah ada bisa menggunakan CatatOrder tanpa risiko keamanan.

---

## 3. Arsitektur CatatOrder Saat Ini

### Data Model: 1 User = 1 Toko

```
auth.users (Supabase Auth)
    │
    └── 1:1 ── profiles (id = auth.uid())
                    │
                    ├── orders (user_id = auth.uid())
                    ├── customers (user_id = auth.uid())
                    ├── products (user_id = auth.uid())
                    ├── receipts (user_id = auth.uid())
                    └── ai_analyses (user_id = auth.uid())
```

### RLS Pattern

Semua tabel utama menggunakan:
```sql
CREATE POLICY "Users can CRUD own data"
ON orders FOR ALL
USING (auth.uid() = user_id);
```

### Apa yang Harus Berubah untuk Staff Access?

| Komponen | Saat Ini | Perlu Berubah? |
|----------|----------|----------------|
| Auth users | 1 user = 1 toko | Tergantung pendekatan |
| profiles | id = auth.uid() | Mungkin perlu store_id |
| RLS policies | auth.uid() = user_id | Mungkin perlu join ke team table |
| Semua service files | getUser() → user.id | Mungkin perlu "active store" context |
| Public order form | Lookup by slug → user_id | Tetap sama (slug = store identifier) |
| Billing | Per user | Tetap per owner |

---

## 4. Dua Pendekatan Teknis

### Pendekatan A: Full Multi-Tenant (Berat)

```
auth.users ─── profiles
                  │
stores ───────── store_members (user_id, store_id, role)
   │
   ├── orders (store_id)
   ├── customers (store_id)
   ├── products (store_id)
   └── receipts (store_id)
```

**Cara kerja:**
- Setiap staff punya Supabase auth account sendiri
- Tabel `stores` sebagai entitas terpisah dari user
- Tabel `store_members` menghubungkan user ke store dengan role
- Semua tabel utama berubah dari `user_id` ke `store_id`
- RLS berubah: `store_id IN (SELECT store_id FROM store_members WHERE user_id = auth.uid())`

**Kelebihan:**
- Staff login dari device sendiri dengan akun sendiri
- Proper multi-tenant — clean architecture
- Bisa scale ke "1 user kelola banyak toko" di masa depan
- Bisa scale ke "1 user jadi staff di banyak toko"

**Kekurangan:**
- **MASSIVE migration:** Tambah kolom `store_id` ke SEMUA tabel, backfill data, ubah SEMUA RLS policies
- **Ubah SEMUA service files:** Setiap query yang pakai `user_id` harus berubah
- **Ubah SEMUA components:** Context "active store" harus ditambahkan
- **RLS recursion risk:** `store_members` RLS referencing itself → butuh SECURITY DEFINER functions
- **Breaking change:** Tidak bisa incremental, harus big bang
- **Estimate: 3-5 minggu** kerja full-time untuk solo developer

---

### Pendekatan B: Lightweight Staff PIN (Ringan)

```
auth.users ─── profiles (tetap 1:1)
                  │
                  └── staff (owner_id, name, pin_hash, role, is_active)

RLS: TIDAK BERUBAH (semua tetap auth.uid() = user_id)
Session: tetap pakai owner's auth session
Staff switching: PIN di UI, bukan auth
```

**Cara kerja:**
- Owner login normal (email/Google)
- Owner tambah staff di Pengaturan → nama + PIN 4-6 digit + role
- Staff tabel: `staff(id, owner_id, name, pin_hash, role, is_active)`
- Di dashboard, ada tombol "Ganti Staff" → modal input PIN → UI berubah sesuai role
- Semua data access tetap pakai owner's auth session → **RLS TIDAK BERUBAH**
- Setiap action catat `staff_id` di activity log
- Staff di device sendiri: owner share "staff link" → login dengan owner's credentials + PIN staff

**Kelebihan:**
- **RLS tidak berubah** — zero migration risk pada data existing
- **Service files tidak berubah** — semua query tetap pakai `auth.uid()`
- **Incremental** — bisa dibangun tanpa breaking changes
- **PIN = standar industri** (Moka, Majoo, Shopify, Square semua pakai PIN)
- **Estimate: 3-5 hari**

**Kekurangan:**
- Staff tidak punya akun sendiri — harus "login" via owner session
- "Staff link" untuk device sendiri = essentially sharing session (tapi dengan role restriction)
- Tidak bisa scale ke "staff jadi member di banyak toko"
- Kurang "proper" secara arsitektur — tapi CUKUP untuk UMKM mikro

---

### Perbandingan

| Aspek | A: Full Multi-Tenant | B: Staff PIN |
|-------|---------------------|-------------|
| **Effort** | 3-5 minggu | 3-5 hari |
| **Risk** | Tinggi (semua berubah) | Rendah (additive) |
| **RLS migration** | Semua policy berubah | Tidak ada |
| **Service file changes** | Semua | Minimal |
| **Staff punya akun sendiri** | Ya | Tidak (PIN di bawah owner) |
| **Shared device (tablet)** | Support | Support (PIN switching) |
| **Personal device (HP staff)** | Support (login akun sendiri) | Partial (butuh share session) |
| **Scale ke multi-toko** | Ya | Tidak |
| **Cocok untuk UMKM mikro** | Over-engineered | Tepat |
| **Industry standard** | Enterprise SaaS | POS apps (Moka, Majoo, Square) |

---

## 5. Rekomendasi

### Pendekatan B: Staff PIN — untuk sekarang dan 12+ bulan ke depan.

**Alasan:**

1. **83% target UMKM = mikro (1-4 orang).** Full multi-tenant adalah over-engineering untuk ibu kue yang mau anaknya bantu catat pesanan.

2. **PIN adalah standar industri POS Indonesia.** Moka, Majoo, Olsera — semua pakai PIN. User tidak akan bingung.

3. **3-5 hari vs 3-5 minggu.** Solo developer. Setiap minggu yang dihabiskan untuk arsitektur = minggu yang tidak dipakai untuk distribusi.

4. **Skenario "staff pakai HP sendiri"** bisa solved dengan cara:
   - Owner login di HP staff sekali → save session → staff pakai PIN untuk switch
   - Atau: "Staff Link" — URL khusus yang auto-login ke owner's session dengan role terbatas

5. **Kalau CatatOrder scale ke 5.000+ user** dan butuh proper multi-tenant, BARU migrate ke Pendekatan A. Dengan revenue dan (mungkin) tim di titik itu, migration effort justified.

### Kapan Pendekatan A Diperlukan?

- Ketika ada demand: "Saya punya 3 outlet, mau kelola dari 1 akun" → multi-store
- Ketika ada demand: "Staff saya juga pakai CatatOrder untuk bisnis sendiri" → multi-membership
- Ketika revenue justify: Rp5M+ MRR → bisa invest 3-5 minggu tanpa opportunity cost besar

---

## 6. Desain Fitur Detail (Pendekatan B)

### Database

```sql
-- Tabel baru
CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  pin_hash TEXT NOT NULL,              -- bcrypt hash of 4-6 digit PIN
  role VARCHAR(20) DEFAULT 'kasir',    -- 'kasir' atau 'manager'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_owner ON staff(owner_id);

-- RLS: hanya owner bisa kelola staff-nya
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages own staff"
  ON staff FOR ALL USING (auth.uid() = owner_id);

-- Activity log (opsional, tapi recommended)
CREATE TABLE activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  staff_id UUID REFERENCES staff(id),  -- null = owner did it
  action TEXT NOT NULL,                 -- 'order_created', 'status_changed', etc.
  details JSONB,                        -- { order_id, old_status, new_status }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_owner ON activity_log(owner_id, created_at DESC);
```

### Role Permissions

```
Owner (full access):
├── Semua fitur
├── Pengaturan (slug, mode, kapasitas)
├── Billing (beli paket, unlimited)
├── Staff management (tambah, edit, nonaktifkan)
├── Hapus data (pesanan, pelanggan, produk)
└── Lihat activity log

Manager:
├── Pesanan: lihat, buat, edit status, edit pembayaran
├── Pelanggan: lihat, buat
├── Produk: lihat, edit (harga, stok, availability)
├── Rekap: lihat, kirim WA, download Excel
├── Struk: buat, kirim
├── Persiapan: lihat, kirim WA, download
├── Kirim WA konfirmasi/pengingat
└── TIDAK bisa: pengaturan, billing, staff mgmt, hapus data

Kasir:
├── Pesanan: lihat, buat, edit status
├── Pelanggan: lihat
├── Produk: lihat (read-only)
├── Kirim WA konfirmasi
└── TIDAK bisa: edit pembayaran, rekap, pengaturan, billing,
    staff mgmt, hapus data, edit produk, struk
```

### UX Flow

**1. Owner Tambah Staff**
```
Pengaturan → "Staff" section → "Tambah Staff"
→ Modal: Nama + PIN (4-6 digit) + Role (Kasir/Manager)
→ Simpan → Muncul di daftar staff
```

**2. Staff Switch di Shared Device (tablet di konter)**
```
Header/sidebar → Avatar/nama → "Ganti Staff"
→ Modal: Masukkan PIN
→ PIN matched → UI berubah (nama staff di header, menu terbatas sesuai role)
→ "Kembali ke Owner" → masukkan PIN owner atau re-login
```

**3. Staff Login di HP Sendiri**
```
Owner buka Pengaturan → Staff → pilih staff → "Bagikan Akses"
→ Generate link: catatorder.id/staff-login?token=xxx (one-time, 24h expiry)
→ Staff buka link di HP → auto-login ke owner's session dengan role terbatas
→ Session persist di HP staff (refresh token works)
→ Staff lihat dashboard dengan menu sesuai role
```

**4. Activity Log**
```
Pengaturan → "Aktivitas" tab
→ Daftar: [waktu] [nama staff] [action] [detail]
→ "14:30 Rina mengubah status pesanan WO-20260315-0042 ke Diproses"
→ "15:45 Dina membuat pesanan baru WO-20260315-0043"
```

### Context: Active Staff

```typescript
// Client-side context
interface StaffContext {
  activeStaff: {
    id: string | null;      // null = owner
    name: string;
    role: 'owner' | 'manager' | 'kasir';
  };
  switchStaff: (pin: string) => Promise<boolean>;
  switchToOwner: (pin: string) => Promise<boolean>;
  canAccess: (feature: Feature) => boolean;
}

// Usage in components:
const { activeStaff, canAccess } = useStaffContext();
if (!canAccess('billing')) return null; // Hide billing for non-owner
```

---

## 7. Effort Estimate (Pendekatan B)

| Task | Effort | Detail |
|------|--------|--------|
| DB migration (staff + activity_log) | 1 jam | Tabel baru, RLS, indexes |
| Staff CRUD di Pengaturan | 3-4 jam | Tambah/edit/nonaktifkan staff, PIN input |
| Staff context provider | 2-3 jam | React context, PIN verification, role check |
| PIN switch modal | 1-2 jam | UI modal, PIN input, bcrypt verify |
| Permission gating di semua pages | 3-4 jam | canAccess() checks, hide/show menu items |
| Staff link generation | 2-3 jam | Token generation, auto-login route |
| Activity logging | 2-3 jam | Log actions di order/customer/product services |
| Header staff indicator | 1 jam | Show active staff name + switch button |
| **Total** | **~15-20 jam (2-3 hari)** | |

---

## 8. Kapan Harus Dibangun

### Sinyal untuk Mulai Build

| Sinyal | Threshold |
|--------|-----------|
| User aktif | 20+ user |
| User yang sharing password | 3+ user melaporkan |
| Dine-in mode active | 10+ warung/kedai pakai dine-in |
| User minta fitur ini | 5+ request organik |

### Kenapa BUKAN Sekarang

1. **1 user** — tidak ada data apakah fitur ini benar-benar dibutuhkan
2. **52% UMKM mikro = solo operator** — lebih dari separuh tidak butuh staff
3. **Setiap hari coding = hari tidak distribusi** — opportunity cost tinggi
4. **Sharing password "works"** di fase awal (jelek tapi fungsional)

### Kenapa BISA Jadi Sekarang (Counter-argument)

1. Owner warung memang delegasi ke kasir — ini bukan assumption, ini fakta industri
2. Tanpa staff access, CatatOrder **tidak bisa dipakai** oleh warung yang kasirnya bukan owner
3. Ini differentiator: tidak ada WA order management tool di Rp15-39K yang punya staff access
4. Effort hanya 2-3 hari — relatively low cost

### Verdict

**Jangan bangun sekarang. Tapi siapkan migration file + desain, supaya bisa build dalam 2-3 hari begitu ada sinyal.**

Fokus saat ini: **distribusi → dapat 20 user → validasi apakah staff access benar-benar dibutuhkan.**

---

## Sumber

### POS Indonesia
- Moka: PIN login, Owner + Employee roles, Rp249-299K/bln
- Majoo: 6-digit PIN, Owner/Kasir/Manager/Admin/Custom, void auth via manager PIN
- Kasir Pintar: Email+password, 4 roles, 5 free staff on Pro
- Olsera: Staff Code, Supervisor/Cashier/Waiter, unlimited on Premium
- Pawoon: Cashier/Staff/Manager, Rp149-299K/bln

### Food Delivery
- GoBiz: Owner/Manager/Kasir, "Kelola Pegawai" feature (2020)
- GrabMerchant: Owner/Store Manager/Cashier, employee management
- ShopeeFood: Admin/Staff accounts

### Global POS
- Shopify POS: PIN (4-6 digit), full + POS-only staff, POS Pro $89/bln
- Square: Free basic team mgmt, Team Plus $45/bln, unlimited custom roles
- Toast: 5-layer permissions, free starter, payroll add-on $90/bln

### UMKM Indonesia
- 83% usaha mikro (1-4 orang), 52% solo
- Kasir warung: Rp1.8-3.5M/bulan
- 6.4 juta UMKM F&B (BPS 2024)
- Digital tool sharing: password sharing adalah default behavior

### Teknis
- Supabase RLS: SECURITY DEFINER functions untuk avoid recursion
- PIN implementation: bcrypt hash, client-side or RPC verification
- Multi-tenant patterns: shared schema + junction table vs lightweight staff table

---

*Last updated: 2026-03-15*
