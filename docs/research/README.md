# Research: Payment & UX Improvement for CatatOrder Public Order Flow

> Deep-dive research conducted 2026-03-09
> Covers payment gateways, QRIS APIs, UX best practices, competitor analysis, and code audit

---

## Research Files

| File | Contents |
|------|----------|
| [01-payment-gateways.md](01-payment-gateways.md) | All payment gateway options for multi-merchant (Xendit, Midtrans, DOKU, etc.) |
| [02-qris-dynamic-api.md](02-qris-dynamic-api.md) | Static vs dynamic QRIS, API providers, fees, BI regulations, hybrid approaches |
| [03-ux-best-practices.md](03-ux-best-practices.md) | Mobile payment UX, trust signals, conversion optimization, micro-interactions |
| [04-competitor-analysis.md](04-competitor-analysis.md) | 17+ competitor platforms analyzed (Indonesian + international) |
| [05-code-audit.md](05-code-audit.md) | Current codebase analysis — bugs, UX pain points, quick wins |
| [06-recommendation.md](06-recommendation.md) | **Final recommendation — phased roadmap with prioritized actions** |

## Context

CatatOrder's current payment flow for public orders (link toko):
1. Customer places order via `catatorder.id/{slug}`
2. Success page shows seller's **static QRIS image** (uploaded manually)
3. Customer scans QRIS, pays via their banking/e-wallet app
4. Customer taps "Konfirmasi Pembayaran via WA" to notify seller
5. Seller manually verifies payment in their bank app, marks order as paid

**Problem:** Payment verification is entirely manual. No auto-confirmation, no proof of payment, fragile UX.

**Goal:** Find the best approach to improve this flow — from quick UX wins to full payment gateway integration.
