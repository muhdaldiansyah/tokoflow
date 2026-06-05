import { formatPhoneForWA } from "@/lib/utils/phone";
import { trackWaSent } from "@/lib/utils/activation";
import { track } from "@/lib/analytics";

export function openWhatsApp(message: string, phone?: string | null): void {
  const formattedPhone = formatPhoneForWA(phone);
  const encoded = encodeURIComponent(message);
  const waUrl = formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(waUrl, "_blank");
  trackWaSent();
  track("wa_sent");
}

export function openWhatsAppPublic(message: string, phone?: string | null): void {
  const formattedPhone = formatPhoneForWA(phone);
  const encoded = encodeURIComponent(message);
  const waUrl = formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(waUrl, "_blank");
}
