# Profil CatatOrder — Redesign Analysis

> Deep dive research & analysis for making the CatatOrder company profile outstanding
> March 2026

---

## 1. Audience Definition

The profile is NOT for UMKM users (that's what the website and panduan are for).

**Primary readers:**
- Investors (angel/seed) evaluating opportunity
- Partners (communities, government programs) evaluating legitimacy
- Media looking for a story angle
- B2B contacts deciding whether to collaborate

**Decision:** Write in third person throughout. Professional-warm, not "kamu." The UMKM owner appears as a character in the story, not as the reader.

---

## 2. Emotional Architecture

Each page should take the reader through a deliberate emotional journey:

| Page | Emotion | Takeaway |
|------|---------|----------|
| 1. Cover | Curiosity | "What is CatatOrder?" |
| 2. Masalah (cerita) | Empathy | "I can picture this chaos" |
| 3. Masalah (skala) | Intellectual shock | "$300M failed? Why?" |
| 4. Pendekatan | Relief, clarity | "Oh — this is different" |
| 5. Cara Kerja | Confidence | "This is genuinely simple" |
| 6. Produk | Impressed | "It's real and polished" |
| 7. Model Bisnis | Respect | "Smart, sustainable" |
| 8. Visi | Inspired | "This could actually matter" |
| 9. Hubungi Kami | Action | "I want to reach out" |

---

## 3. Current Problems

### Narrative Arc

Current flow:
```
Cover (screenshot) -> Masalah -> Solusi -> Cara Kerja (2 pages!) -> Fitur (spec table) -> Harga -> Dampak & Visi
```

**Problems:**
1. Opens with a raw screenshot, not a brand identity
2. "Why others failed" data is buried on the LAST page — should come before the solution
3. Cara Kerja burns 2 pages on 3 simple steps
4. Fitur page is a 12-row spec sheet — reads like documentation, not a profile
5. No traction/status section (product is live, v2.4.0, 37 pages built — where is this?)
6. No closing/contact page — PDF just ends after Visi
7. The "lingkaran setan" diagram from the markdown source is missing entirely
8. Most powerful content (competitor failures, vision) crammed together on last page

### Voice & Register Confusion

Three different voices in one document:

| Page | Current voice | Problem |
|------|--------------|---------|
| 2 (Masalah) | "Bayangkan kamu..." | Speaking to UMKM owner, not profile reader |
| 3 (Solusi) | Marketing copy | "tanpa perlu salin-tempel" is user-facing |
| 6 (Fitur) | Spec sheet | "Geser kartu: Baru -> Diproses -> Dikirim -> Selesai" |
| 7 (Harga) | User pricing page | "Bayar hanya kalau rame" |
| 8 (Dampak) | Investor data | "$142 juta, Sequoia, Tiger Global" |

### Wording Issues

| Current | Problem | Better |
|---------|---------|--------|
| "kamu" | Addresses UMKM, not reader | "pelaku UMKM", "pemilik usaha", persona name |
| "rame" | Too informal for a profile | "ramai" or "berkembang" |
| "ribet" | Slang | "rumit" or drop it |
| "gak" | Slang | "tidak" |
| "Pelaku UMKM, Quora Indonesia" | Weak sourcing, hurts credibility | Remove attribution or cite BPS/UNDP |
| "50 pesanan gratis" (4x repeated) | Redundant, feels like marketing push | Say it once powerfully, once at closing |

### Design Issues

1. Raw markdown-to-PDF export — no actual design
2. Massive white space on pages 1, 3, 5, 7 (40-60% blank)
3. Screenshots on pages 4-6 too small to read
4. No page numbers, no header/footer, no consistent grid
5. No visual system — green boxes, tables, code blocks all look different
6. Cover uses a browser screenshot with chrome visible

---

## 4. The 5 Anchor Lines

Every great profile has 3-5 sentences that stick. These are CatatOrder's — they should be the most visually prominent text on their respective pages:

### Line 1 — The Positioning
> "Link toko gratis untuk UMKM — pelanggan pesan sendiri, pesanan langsung tercatat rapi."

### Line 2 — The Reframe
> "Kompetitor CatatOrder bukan aplikasi SaaS — kompetitornya adalah buku tulis."

**Currently:** Buried at the bottom of a paragraph on page 2.
**Should be:** Pull quote or section closer. This is the line people will remember.

### Line 3 — The Insight
> "Pesanan adalah aktivitas harian. Pembukuan adalah aktivitas bulanan. UMKM butuh solusi untuk yang mereka hadapi hari ini."

**Currently:** Small italic text on page 8.
**Should be:** The intellectual centerpiece of the "why competitors failed" page. Largest text on that page.

### Line 4 — The Price Anchor
> "Rp15.000 per 50 pesanan — kurang dari harga satu nasi padang."

**Currently:** Paraphrased loosely on page 7.
**Should be:** Bold, prominent, memorable. This is the line that makes pricing click instantly.

### Line 5 — The Vision
> "Setiap pesanan yang tercatat hari ini adalah satu langkah menuju visibilitas keuangan UMKM besok."

**Currently:** Lost in a text block on page 8.
**Should be:** The emotional closer of the Visi page. The last meaningful sentence before the contact page.

---

## 5. Ideal Structure (9 Pages)

### Page 1 — Cover

**Purpose:** Brand identity, not a product demo.

- CatatOrder logo (clean, not a screenshot)
- **"Link Toko & Kelola Pesanan untuk UMKM Indonesia"**
- catatorder.id
- "Company Profile — Maret 2026"
- Minimal, confident, white space used intentionally
- No screenshot, no feature list, no pricing

### Page 2 — "65 Juta UMKM. Satu Masalah yang Sama."

**Purpose:** Make the reader feel the chaos. Empathy through specificity.

- Open with third-person story: "Setiap pagi, Bu Ratna membuka WhatsApp dan menemukan 23 chat pesanan yang masuk semalam. Masing-masing memesan item berbeda, minta antar di jam berbeda, bayar dengan cara berbeda. Satu pesanan katering saja memiliki 7 hal yang harus diingat: menu, jumlah, jadwal, pengiriman, catatan khusus, kemasan, dan pembayaran."
- Brief: she scrolls, writes, calculates, forgets. One paragraph, specific, sensory.
- "Bu Ratna bukan sendiri."
- The 4 stat boxes: 85%, 15-30%, 1-3 jam/hari, 98%
- Close with bold pull quote: **"Kompetitor CatatOrder bukan aplikasi SaaS — kompetitornya adalah buku tulis."**

**One takeaway:** The problem is real, massive, and daily.

### Page 3 — "Rp4,8 Triliun Sudah Diinvestasikan. UMKM Masih Manual."

**Purpose:** Intellectual shock. Why existing solutions failed.

- Context: "Lebih dari $300 juta sudah diinvestasikan ke berbagai aplikasi UMKM."
- Competitor failure table:

| Startup | Dana | Hasil |
|---------|------|-------|
| BukuKas | $142 juta (Sequoia, Tiger Global) | Tutup Sept 2023. 4 pivot, kembalikan ~$70 juta. |
| BukuWarung | $80 juta (Y Combinator, DST Global) | 7 juta user, $1,7 juta revenue. Pivot ke fintech. |
| Selly | — | Tutup Agustus 2025. |

- "Hasilnya? 70% UMKM masih manual."
- The key insight: "Mereka semua menyelesaikan masalah pembukuan — bukan masalah pesanan."
- Pull quote (largest text on page): **"Pesanan adalah aktivitas harian. Pembukuan adalah aktivitas bulanan."**

**One takeaway:** Throwing money at the wrong problem doesn't work.

### Page 4 — "Pelanggan Pesan Sendiri. Pesanan Langsung Tercatat."

**Purpose:** The approach — philosophy, not features.

- Before/After comparison (visually balanced):
  - Sebelum: 4 WA chats -> scroll -> catat di buku -> hitung manual -> lupa follow up
  - Sesudah: Pelanggan buka link -> pilih item -> pesanan masuk otomatis -> dashboard rapi -> rekap otomatis
- Four principles (one line each):
  - **Gratis** — tidak ada hambatan biaya untuk mulai
  - **Sederhana** — 3 langkah, langsung jalan, tanpa pelatihan
  - **Berbasis WhatsApp** — melengkapi WA, bukan menggantikan
  - **Fokus pesanan** — bukan POS kasir, bukan pembukuan
- "Konfirmasi pesanan, pengingat bayar, dan struk tetap dikirim lewat WhatsApp — satu tap dari dashboard."

**One takeaway:** Fundamentally different approach.

### Page 5 — "3 Langkah. Langsung Jalan."

**Purpose:** Show simplicity. Build confidence.

- **Langkah 1 — Buat Toko:** Daftar gratis. Isi nama bisnis, nomor WhatsApp, daftar produk. Langsung dapat link toko: catatorder.id/nama-bisnis
- **Langkah 2 — Bagikan Link:** Share ke pelanggan lewat WhatsApp, status WA, Instagram bio. Pelanggan buka link, pilih item, kirim pesanan.
- **Langkah 3 — Kelola Pesanan:** Pesanan masuk otomatis ke dashboard. Geser untuk ubah status, tandai pembayaran, kirim konfirmasi ke WhatsApp.
- Screenshots: pengaturan.png, link-toko-public.png, pesanan-list.png — LARGE enough to read
- ALL on one page
- Footer: "Tanpa download aplikasi. Buka di browser HP. Bisa dipakai langsung."

**One takeaway:** It's dead simple.

### Page 6 — "Produk yang Sudah Jalan"

**Purpose:** Show the product is real, polished, and comprehensive.

NOT a 12-row feature table. Instead, 3 capability blocks:

**Terima Pesanan**
Link toko, tempel chat WA, catat pakai suara, foto screenshot — semua jadi pesanan otomatis dengan AI.

**Kelola & Kirim**
Status pesanan, lacak pembayaran, struk digital, pengingat bayar — semua dikirim ke WhatsApp pelanggan satu tap.

**Data & Rekap**
Daftar pelanggan otomatis, rekap harian, laporan bulanan, analisis AI — tanpa hitung manual.

- 2 large readable screenshots (link-toko-public + pesanan-list, or pesanan-detail + rekap-harian)
- Status line: "Live di catatorder.id — v2.4.0 — 37 halaman — Semua fitur gratis termasuk AI"

**One takeaway:** This is real, polished, and already live.

### Page 7 — "Gratis Selamanya. Bayar Hanya Kalau Berkembang."

**Purpose:** Show the business model is smart and sustainable.

- 3 pricing cards:
  - Gratis Rp0: 50 pesanan/bulan, semua fitur, selamanya
  - Isi Ulang Rp15.000: +50 pesanan, tidak kadaluarsa
  - Unlimited Rp35.000/bulan: pesanan tak terbatas

- Why this model:
  - Sachet economy: Rp500/pesanan mendapat 70-80% penerimaan vs 15-20% untuk langganan bulanan
  - "Rp15.000 — kurang dari harga satu nasi padang"

- GoFood comparison:
  - GoFood/GrabFood: memotong 20-30% dari setiap pesanan
  - CatatOrder: kurang dari 1% — pelanggan pesan langsung ke pemilik usaha

- Unit economics: margin 83% per pack
- Break-even: 5 user membeli 1 pack
- "Tidak ada biaya bulanan wajib. Tidak ada kontrak."

**One takeaway:** Smart model, sustainable unit economics.

### Page 8 — "Data Pesanan Hari Ini, Fondasi Keuangan UMKM Besok"

**Purpose:** The bigger picture. Why this matters beyond order management.

- The "lingkaran setan" (MUST include — currently missing from PDF):

```
Tidak ada catatan pesanan
        |
Tidak tahu untung rugi
        |
Tidak bisa buktikan kelayakan kredit
        |
Tidak dapat modal -> tetap kecil
        |
Tidak ada alasan untuk mulai mencatat
        |
(kembali ke atas)
```

- "Rp1.600 triliun — kesenjangan kredit UMKM di Indonesia. Bukan karena bank tidak mau meminjamkan. Tapi karena UMKM tidak punya data untuk membuktikan bisnis mereka layak."
- "CatatOrder memutus lingkaran ini dari titik paling awal: pencatatan pesanan."
- Vision statement: "Setiap UMKM di Indonesia — dari ibu yang jualan kue di rumah sampai katering yang kirim ratusan nasi box — punya cara yang rapi untuk terima dan kelola pesanan. Tanpa harus jago teknologi. Tanpa harus bayar mahal."
- Bold closer: **"Setiap pesanan yang tercatat hari ini adalah satu langkah menuju visibilitas keuangan UMKM besok."**
- "Dimulai dari 50 pesanan gratis per bulan."

**One takeaway:** This vision is meaningful and grounded.

### Page 9 — Hubungi Kami

**Purpose:** Enable action.

- CatatOrder logo
- catatorder.id + QR code
- Contact channels:
  - WhatsApp: wa.me/6285711552484
  - Email: hello@catatorder.id
  - Instagram: @catat.order
  - TikTok: @catat.order
- "Kami bantu setup dari awal sampai bisa jalan sendiri."
- Clean, professional, no clutter

---

## 6. Wording Philosophy

### The "Coffee Test"

Every sentence should sound natural if read aloud to a smart colleague over coffee. Not a government brochure. Not a WhatsApp message. Think Tempo magazine tone — informed, clear, human.

**Fails the test:**
- "Bayar hanya kalau bisnis sudah rame" (too casual)
- "Geser kartu untuk ubah: Baru -> Diproses -> Dikirim -> Selesai" (spec language)
- "Bilang aja pesanannya — langsung jadi daftar item" (marketing copy)

**Passes the test:**
- "Kompetitor CatatOrder bukan aplikasi SaaS — kompetitornya adalah buku tulis" (sharp, memorable)
- "Pesanan adalah aktivitas harian. Pembukuan adalah aktivitas bulanan." (insight, not slogan)
- "Rp15.000 — kurang dari harga satu nasi padang" (concrete, relatable)

### Key Principles

1. **Third person throughout.** Not "kamu" but "pelaku UMKM", "pemilik usaha", or persona names (Bu Ratna).
2. **Professional-warm.** Not formal. Not slang. Smart friend with business sense.
3. **Specific over vague.** "23 chat pesanan" not "banyak chat." "7 hal per pesanan" not "banyak hal."
4. **Short sentences for impact. Longer sentences for narrative.** Alternate rhythm.
5. **State facts, let them speak.** Don't say "ini sangat penting" — present the data and let the reader conclude.
6. **One mention, not four.** "50 pesanan gratis" appears once powerfully (page 7) and once as a closer (page 8). Not on every page.

---

## 7. Design Principles

For whoever designs the final PDF:

1. **One message per page.** If you can't state the page's purpose in one sentence, it's doing too much.
2. **Consistent footer:** `catatorder.id` + page number on every page.
3. **Screenshots must be readable.** If text inside a screenshot is too small to read, make it bigger or don't include it.
4. **Green as accent, not decoration.** Green stat boxes and headers work. Green on every element doesn't.
5. **Pull quotes for anchor lines.** The 5 key lines should be visually distinct — larger font, left border, or highlighted background.
6. **No markdown artifacts.** Horizontal rules, code blocks, table borders should be designed, not default HTML rendering.
7. **White space is intentional.** Use it to let key messages breathe. Don't leave it because the page ran out of content.
8. **Typography hierarchy:** Page title (largest) > Section header > Pull quote > Body text > Caption.

---

## 8. Content to Keep from Current Version

These elements are strong and should survive into the new version:

- The katering story opening (rewrite in third person)
- The 4 stat boxes (85%, 15-30%, 1-3 jam, 98%)
- The before/after comparison (redesign for visual balance)
- The 3-step "Cara Kerja" structure
- The competitor failure table (BukuKas, BukuWarung, Selly)
- The "daily pain vs monthly pain" insight
- The "kompetitornya adalah buku tulis" line
- The GoFood/GrabFood comparison
- The 3-tier pricing model
- The vision statement
- Product screenshots (pengaturan, link-toko-public, pesanan-list, rekap-harian)

---

## 9. Content to Cut

- The 12-row feature spec table (replace with 3 capability blocks)
- Repeated "50 pesanan gratis" on every page
- The Quora attribution ("Pelaku UMKM, Quora Indonesia")
- "CatatOrder bukan pengganti WhatsApp" defensive paragraph (reframe as positive: "melengkapi WhatsApp")
- Excessive white space pages
- The raw website screenshot as cover

---

## 10. Content to Add

- Proper cover page with brand identity
- "Why others failed" section moved to page 3 (before solution)
- Traction/status: "Live di catatorder.id — v2.4.0 — 37 halaman"
- The "lingkaran setan" diagram (in markdown source but missing from PDF)
- Contact/CTA closing page with QR code
- Page numbers and consistent footer

---

## Summary: 5 Actions

1. **Restructure:** Move competitor failures BEFORE the solution. Add traction. Add contact page. Merge Cara Kerja into one page.
2. **Rewrite voice:** Third person, professional-warm. Drop "kamu", "rame", "ribet". One consistent register.
3. **Elevate key lines:** The 5 anchor sentences should be the most visible text on their pages.
4. **Cut repetition:** "50 pesanan gratis" once powerfully, not four times. Feature table becomes capability blocks.
5. **Design properly:** Not a markdown export — a designed document with consistent layout, readable screenshots, and intentional white space.

---

*Research completed: March 2026*
