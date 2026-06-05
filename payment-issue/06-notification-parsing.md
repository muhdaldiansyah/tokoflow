# 06 — Notification Parsing (Android)

> Intercept notifikasi SMS/WhatsApp dari bank di HP seller, parse amount, match dengan order. Gratis tapi experimental.

## Cara Kerja

```
Customer bayar via QRIS/transfer
  → Bank kirim SMS/WhatsApp notifikasi ke HP seller
  → CatatOrder app (Android) intercept notifikasi
  → Parse: amount, sender, timestamp
  → Kirim ke CatatOrder backend
  → Match dengan pending order
  → Auto-confirm jika match
```

## Teknologi Android

### NotificationListenerService
- API Android untuk intercept SEMUA notifikasi (termasuk WhatsApp, SMS, banking app).
- User harus grant "Notification Access" permission di Settings.
- Bisa baca: package name, title, text, timestamp.

### SMS BroadcastReceiver
- Intercept incoming SMS langsung.
- Perlu `RECEIVE_SMS` permission.
- Lebih reliable dari NotificationListenerService untuk SMS.

## Implementasi (Pseudocode)

```kotlin
class PaymentNotificationListener : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val pkg = sbn.packageName
        val text = sbn.notification.extras.getString("android.text")

        // Filter: hanya banking apps
        if (pkg in BANK_PACKAGES) {
            val amount = parseAmount(text)  // regex extract
            if (amount != null) {
                sendToBackend(amount, pkg, text)
            }
        }
    }

    private fun parseAmount(text: String): Long? {
        // BCA: "Saldo Masuk Rp 150.000,00 dari ..."
        // BRI: "Transfer masuk Rp150000 ..."
        // Mandiri: "CR Rp 150.000 ..."
        val regex = Regex("""Rp\s?[\d.,]+""")
        val match = regex.find(text) ?: return null
        return match.value
            .replace("Rp", "")
            .replace(".", "")
            .replace(",00", "")
            .trim()
            .toLongOrNull()
    }
}
```

### Bank Package Names (Android)

| Bank | Package Name |
|---|---|
| BCA Mobile | `com.bca.android` |
| BRI Mobile | `id.co.bri.brimo` |
| Mandiri Livin | `id.bmri.livin` |
| BNI Mobile | `src.bni.android` |
| Bank Jago | `id.jago.app` |
| SeaBank | `com.seabank.id` |

## Library yang Ada

### transaction-sms-parser (npm)
- GitHub: https://github.com/saurabhgupta050890/transaction-sms-parser
- Parse SMS transaksi ke structured data.
- **Hanya support bank India** (HDFC, ICICI, dll). Tidak ada bank Indonesia.
- Bisa dijadikan template untuk build parser Indonesia.

### Custom: Butuh build sendiri
- Kumpulkan sample SMS/notifikasi dari bank-bank Indonesia.
- Buat regex pattern per bank.
- Test dengan dataset real.

## Kelebihan

- **Gratis** — tidak ada biaya per transaksi.
- **Real-time** — secepat bank kirim notifikasi (biasanya < 30 detik).
- **Works dengan semua bank** — selama bank kirim notifikasi, bisa di-parse.
- **Tidak perlu credential** — tidak login ke iBanking.

## Limitasi Kritis

1. **Android only** — iOS tidak izinkan intercept notifikasi dari app lain.
2. **Invasive permission** — user mungkin tidak trust.
3. **Fragile** — bank ubah format notifikasi → parser break.
4. **Battery optimization** — Android bisa kill background service.
5. **Google Play policy** — Google mungkin reject app yang request Notification Access tanpa strong justification.
6. **Matching ambigu** — nominal sama, waktu berdekatan → false match.
7. **Tidak semua bank kirim notifikasi** — beberapa bank perlu diaktifkan manual.

## Verdict

**Eksperimental. Bukan production-grade.**

Bisa dipakai sebagai:
- Fallback untuk seller yang belum onboard ke payment gateway.
- Feature tambahan "auto-detect payment" di app Android.
- Proof of concept untuk validate demand.

Tidak bisa diandalkan sebagai satu-satunya mekanisme payment detection.

## Referensi

- Android NotificationListenerService: https://developer.android.com/reference/android/service/notification/NotificationListenerService
- transaction-sms-parser: https://github.com/saurabhgupta050890/transaction-sms-parser
