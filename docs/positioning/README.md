# Tokoflow Positioning Archive

> Living strategic compass — disusun dari hasil deep ultrathink discussion 26 April 2026.

Ini adalah **bible internal** Tokoflow. Setiap keputusan produk, marketing, design, dan pricing diuji terhadap dokumen-dokumen di folder ini.

---

## Cara Pakai Folder Ini

**Sebelum membuat keputusan produk apapun**, baca dokumen yang relevan. Setiap fitur yang kamu pertimbangkan harus melewati 5 tests di [`00-manifesto.md`](./00-manifesto.md). Setiap copy yang kamu tulis harus konsisten dengan voice di [`02-product-soul.md`](./02-product-soul.md). Setiap design decision harus mengikuti principles di [`04-design-system.md`](./04-design-system.md).

**Bukan dokumen mati.** Living document. Saat kamu belajar dari user, update. Saat strategi berubah, log alasannya di [`07-decisions.md`](./07-decisions.md). Tapi jangan sentuh [`00-manifesto.md`](./00-manifesto.md) tanpa diskusi mendalam—itu jangkar.

**Bukan untuk customer.** Ini internal compass. Marketing copy ke publik diturunkan dari sini, tapi bukan copy-paste.

---

## Struktur Dokumen

| # | File | Topik | Kapan dibaca |
|---|---|---|---|
| 00 | [`00-manifesto.md`](./00-manifesto.md) | Mission, Three-Tier Reality, Test 0 + 5 tests | Setiap kali bingung mau ambil keputusan |
| 01 | [`01-positioning.md`](./01-positioning.md) | Positioning, target user, "Less admin. More making." | Saat tulis marketing copy, saat pitch |
| 02 | [`02-product-soul.md`](./02-product-soul.md) | 6 Iconic Moments, AI voice, empathy moments | Saat design feature baru, saat tulis microcopy |
| 03 | [`03-features.md`](./03-features.md) | Feature list, 3-tier classification, anti-features | Saat propose fitur baru |
| 04 | [`04-design-system.md`](./04-design-system.md) | Visual, motion, sound, microcopy, internal-name discipline | Saat design UI, animasi, notif |
| 05 | [`05-pricing.md`](./05-pricing.md) | Tiers (under Phase-0 review), AI cost framing | Saat ubah pricing atau tambah tier |
| 06 | [`06-roadmap.md`](./06-roadmap.md) | Phased execution Phase 0-6, validation-first Phase 0 | Saat planning sprint |
| 07 | [`07-decisions.md`](./07-decisions.md) | Strategic decision log (D-001 to D-016) | Saat curiga kenapa kita ambil arah X |
| 08 | [`08-the-disappearing-work.md`](./08-the-disappearing-work.md) | 6th iconic moment spec, Background Twin + Foreground Assist | Saat build Phase 1 atau revise twin scope |

---

## Reading Order untuk Onboarding Anggota Baru

Kalau ada anggota tim baru (Ariff, future hire, contractor), urutan baca:

1. **00-manifesto.md** — pahami soul-nya dulu (5 menit)
2. **01-positioning.md** — pahami siapa target & apa kategori (10 menit)
3. **02-product-soul.md** — pahami apa yang membuat Tokoflow Tokoflow (15 menit)
4. **07-decisions.md** — pahami kenapa kita di sini, bukan di tempat lain (10 menit)
5. Sisanya sesuai role mereka

Total onboarding strategic: ~1 jam. Sebelum ini, jangan diskusi fitur atau eksekusi.

---

## Update Protocol

| Aksi | Siapa boleh | Bagaimana |
|---|---|---|
| Edit microcopy contoh | Anyone | Direct edit + commit |
| Add empathy moment baru | Anyone | Direct edit + commit |
| Cut/add feature dari list | Aldi + Ariff | Diskusi 30 menit + log di `07-decisions.md` |
| Ubah pricing tier | Aldi only | Diskusi + market check + log di `07-decisions.md` |
| Ubah positioning statement | Aldi only | Major decision—diskusi mendalam + log + review setelah 30 hari |
| Ubah manifesto | **Tidak boleh** tanpa rapat formal | Itu jangkar. Kalau berubah, produk-nya berubah. |

**Manifesto recently updated (2026-04-28)** through formal session — see [`07-decisions.md` D-013, D-014, D-015, D-016](./07-decisions.md#d-013--root-problem-refined-three-tier-reality). Changes: added Three-Tier Reality, added Test 0, refined mission with AI-as-infrastructure framing. **No further manifesto changes** without another formal session.

---

## Filosofi Penulisan Dokumen Ini

Apple Mike Markkula menulis "Apple Marketing Philosophy" di 1977 — **3 prinsip dalam 1 halaman**. Itu jadi compass Apple untuk dekade.

Tokoflow tidak butuh dokumen 100 halaman. Tokoflow butuh dokumen **yang dibaca ulang dan dihormati**. Setiap kalimat di sini harus earn its place.

Jika dokumen ini jadi terlalu panjang sampai tidak dibaca lagi, **gagal**. Jaga supaya tetap focused.

---

*Disusun: 26 April 2026 · Versi 1.2 · Last reviewed: 28 April 2026*

*Changelog v1.1 (2026-04-28 morning):* Major synthesis pass setelah 8 ultrathink rounds + Steve Jobs lateral framing + devil's advocate red-team. Updated 7 docs (00, 01, 02, 03, 04, 05, 06, 07), added 1 new (08-the-disappearing-work). Core changes:
- Root problem refined dari "operations ate craft" → **Three-Tier Reality** (Pure Craft / Customer Relationship / Mechanical Residue) — D-013
- Solution architecture refined dari "autonomous twin" → **2-layer twin** (Background Twin Tier 3 + Foreground Assist Tier 2) — D-014
- Tagline shipped sebagai "Less admin. More making." ("From snap to sold" demoted to Photo Magic feature tagline)
- 6th iconic moment added: **The Disappearing Work** (felt absence of Tier 3 work)
- Phase 0 expanded → 5 friendly + 5 hostile + manual smoke test + AI cost measurement
- Phase 1 expanded → Photo Magic + Background Twin + Foreground Assist
- Lifestyle vs venture-scale acceptance documented — D-015
- Internal vs customer-facing naming discipline locked — D-016

*Changelog v1.2 (2026-04-28 evening):* Critique-driven refinements (D-017). 9 items:
- **Wave 1-5 expansion hypothesis** (mission-wedge altitude bridge) added to 06
- **Photo Magic v1 reframed extraction-only** (kitchen-protected) — 02 + 03 updated
- **Real moat sharpened** in 01 — 4-dimensional articulation (unstructured input + Bahasa-first + compliance silent + buyer experience)
- **Tax demoted Phase 1 → Pro/Business gated** (SST RM 500K threshold reality)
- **"Love" operationally defined** — Sean Ellis 40% + DAU 70% + referral + NPS 8 + 3hr/week craft saved
- **Phase 2 reframed** milestone → underlying questions (retention, CAC, referral)
- **Kill criteria Phase 0 pre-committed** — 5 explicit triggers
- **Distribution hypothesis** added — FB groups, TikTok, WA komuniti; anti-channels locked
- **"What we refuse to do" list** added to 00 — 10-item restraint as marketing weapon

**Tagline locked**: **"We handle the receipts. Not the recipes."** (Bahasa: *"Resi kami urus. Resep kamu."*). "Less admin. More making." retired as generic.
