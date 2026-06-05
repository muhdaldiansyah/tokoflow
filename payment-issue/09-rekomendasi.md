# 09 — Rekomendasi & Roadmap

> Action plan untuk CatatOrder payment solution.

## Rekomendasi Utama

**Langsung ke Xendit xenPlatform. Skip mutation monitoring.**

Alasan:
1. **0% MDR untuk usaha mikro ≤ Rp 500K** — mayoritas transaksi CatatOrder kemungkinan di bawah ini.
2. **Instant webhook** — menghilangkan konfirmasi manual sepenuhnya.
3. **Sub-merchant model** — setiap seller punya akun sendiri, uang langsung ke mereka.
4. **Platform fee** — CatatOrder bisa monetize dari payment flow via Split Rules.
5. **Professional** — seller terlihat lebih pro dengan QRIS per-transaksi.

Mutation monitoring (Moota) terlalu banyak trade-off (credential iBanking, 15 min delay, limited bank support) untuk gain yang sama — auto-confirm.

## Roadmap

### Sprint 1: Foundation (Week 1)

- [ ] Daftar Xendit account + aktifkan xenPlatform
- [ ] Setup sandbox/test environment
- [ ] Build seller onboarding flow:
  - Seller input nama usaha + upload KTP
  - CatatOrder create Xendit sub-account via API
  - Track KYC status (pending → approved)
- [ ] Handle KYC rejection flow

### Sprint 2: Payment Integration (Week 2)

- [ ] API: Create QRIS per order
  - `POST /payment_requests` dengan `for-user-id` header
  - Store `qr_string` + `payment_request_id` di order record
- [ ] UI: Render QR code di `/r/{orderId}` (order page customer)
  - QR code besar, nominal jelas, countdown expiry
  - Deep link support (klik → buka e-wallet langsung)
- [ ] Webhook handler:
  - `POST /api/webhooks/xendit`
  - Verify callback token
  - Match `reference_id` → update order status
  - Kirim push notification ke seller: "Pesanan #123 dibayar!"
- [ ] Handle edge cases:
  - Payment expired → show "waktu habis, generate ulang"
  - Duplicate webhook → idempotency check
  - Partial payment → reject (QRIS selalu exact amount)

### Sprint 3: Polish + Platform Fee (Week 3)

- [ ] Split Rules: CatatOrder ambil platform fee per transaksi
- [ ] Seller dashboard: lihat saldo Xendit, history pembayaran, withdrawal
- [ ] Reconciliation: daily job cocokkan Xendit data dengan CatatOrder orders
- [ ] Fallback: jika seller belum onboard Xendit → show old flow (manual confirm)

### Sprint 4: Rollout

- [ ] Beta test dengan 5-10 seller
- [ ] Monitor: webhook reliability, settlement accuracy, seller feedback
- [ ] Iterate based on feedback
- [ ] Gradually migrate semua seller

## Arsitektur

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Customer    │    │  CatatOrder  │    │   Xendit    │
│  Browser     │    │  Backend     │    │   API       │
└──────┬───────┘    └──────┬───────┘    └──────┬──────┘
       │                   │                    │
       │  GET /r/{id}      │                    │
       │──────────────────>│                    │
       │                   │  POST /payment_req │
       │                   │  (for-user-id: X)  │
       │                   │───────────────────>│
       │                   │  { qr_string }     │
       │                   │<───────────────────│
       │  [QR Code Image]  │                    │
       │<──────────────────│                    │
       │                   │                    │
       │  [Scan & Pay]     │                    │
       │────────────────────────────────────────>
       │                   │                    │
       │                   │  POST /webhook     │
       │                   │  payment.succeeded  │
       │                   │<───────────────────│
       │                   │                    │
       │                   │  [Update order]     │
       │                   │  [Notify seller]    │
       │                   │                    │
       │  [Order confirmed]│                    │
       │<──────────────────│                    │
```

## Metrik Sukses

| Metrik | Target |
|---|---|
| Payment confirmation time | < 10 detik (vs 15+ menit manual) |
| Manual confirm rate | < 10% (hanya seller yang belum onboard) |
| Seller onboarding conversion | > 50% dalam 3 bulan |
| Payment dispute rate | < 1% |
| Platform fee revenue | Mulai bulan 2 setelah launch |

## Koneksi ke Intel Patterns

- **P1 (Arsitektur > Kemauan)**: Payment gateway = architectural intervention. Bukan "suruh seller lebih rajin cek mutasi" (motivational) tapi "ubah flow sehingga konfirmasi terjadi otomatis."
- **M14 (Compound Disadvantage Intervention)**: Payment automation address multiple disadvantages sekaligus: cognitive load (cek mutasi), error rate (salah nominal), time waste, trust issue.
- **P39 (UMKM Perfect Storm)**: Manual payment = salah satu compounding disadvantage. Menghilangkannya buka positive feedback loop.

## Biaya untuk CatatOrder

| Item | Biaya |
|---|---|
| Xendit signup | Rp 0 |
| Monthly fee | Rp 0 |
| MDR per transaksi (mikro, ≤500K) | **0%** |
| MDR per transaksi (mikro, >500K) | 0.3% |
| MDR per transaksi (non-mikro) | 0.7% |
| Development effort | 2-3 minggu |

**Net cost untuk mayoritas transaksi UMKM mikro di bawah Rp 500K = Rp 0.**

## Referensi Kunci

- Xendit xenPlatform: https://docs.xendit.co/docs/xenplatform-overview
- Xendit Payment Request API: https://docs.xendit.co/docs/payment-request
- Xendit Webhook: https://docs.xendit.co/docs/webhook-notifications
- Midtrans QRIS (backup): https://docs.midtrans.com/reference/mpm-api-qris
