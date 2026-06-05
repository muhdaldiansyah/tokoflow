import type { Metadata } from "next";
import Link from "next/link";
import { Gift, Smartphone, MessageSquare, HelpCircle } from "lucide-react";
import SignupForm from "./SignupForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: { absolute: "Coba Tokoflow — Akses awal" },
  description:
    "Punya jualan? Coba Tokoflow saat akses awal. Tokomu, tinggal satu foto. Bantu bentuk produknya dan dapat saldo e-wallet sebagai terima kasih.",
  alternates: {
    canonical: "https://tokoflow.co.id/coba-aplikasi",
  },
};

const faqs = [
  {
    question: "Benar-benar gratis?",
    answer: "Ya. 50 order pertamamu gratis — termasuk Onboarding 1-Foto, link tokomu, pembayaran pelanggan via Midtrans (QRIS / transfer / e-wallet, 0% komisi, dana langsung ke rekeningmu), dan listing gratis di direktori Tokoflow.",
  },
  {
    question: "Apakah pelanggan akan menemukan saya?",
    answer: "Tokomu otomatis muncul di tokoflow.co.id/store dan halaman kotamu — matikan kapan saja di Pengaturan. Kamu juga dapat link langsung tokoflow.co.id/[slug-mu] untuk dibagikan di WhatsApp, IG, atau di mana saja. Keduanya sama: order masuk ke dashboard-mu, 0% komisi.",
  },
  {
    question: "Apakah saya perlu instal sesuatu?",
    answer: "Tidak. Tokoflow berjalan di browser HP-mu. Pasang sebagai PWA kalau mau ikon aplikasi — sama cepatnya, tanpa nunggu App Store.",
  },
  {
    question: "Kapan saya dapat saldonya?",
    answer: "Setelah 14 hari pemakaian plus obrolan feedback singkat dengan kami.",
  },
];

export default function CobaAplikasiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Coba Tokoflow — akses awal",
            url: "https://tokoflow.co.id/coba-aplikasi",
          }),
        }}
      />

      {/* Hero + Form */}
      <section className="pt-20 pb-12 lg:pt-24 lg:pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Left */}
            <div className="space-y-6 lg:pt-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#05A660]/20 bg-[#E8F6F0] px-3 py-1 pr-4 text-sm font-medium text-[#05A660]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#05A660] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#05A660]"></span>
                </span>
                Slot terbatas
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#1E293B] leading-snug">
                Tokomu,
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05A660] to-[#048C51]">
                  tinggal satu foto.
                </span>
              </h1>

              <p className="text-[#475569] leading-relaxed">
                Tokoflow sedang akses awal — kami mencari penjual yang ingin alat yang menghormati waktu dan memuliakan pekerjaannya. Bantu bentuk keajaibannya.
              </p>

              <div className="space-y-2.5">
                {[
                  { icon: Gift, text: "Pulsa Rp 25.000 setelah 14 hari pakai" },
                  { icon: Smartphone, text: "50 order pertama gratis" },
                  { icon: MessageSquare, text: "Feedback-mu membentuk produk" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4 text-[#05A660] shrink-0" strokeWidth={1.5} />
                    <span className="text-sm text-[#1E293B]">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:sticky lg:top-24">
              <div className="rounded-[2rem] border border-[#E2E8F0] bg-white shadow-lg p-6 lg:p-8">
                <h2 className="text-lg font-bold text-[#1E293B] mb-1">Dapatkan akses awal</h2>
                <p className="text-sm text-[#94A3B8] mb-6">Kami akan menghubungimu via WhatsApp dalam 1–2 hari.</p>
                <SignupForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — compact */}
      <section className="border-t border-[#E2E8F0] py-10 lg:py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-[#94A3B8] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <p key={faq.question} className="text-sm text-[#475569]">
                    <strong className="text-[#1E293B]">{faq.question}</strong>{" "}{faq.answer}
                  </p>
                ))}
                <p className="text-sm text-[#475569]">
                  Pertanyaan lain?{" "}
                  <Link href={`https://wa.me/${siteConfig.supportWhatsapp}?text=Halo%2C%20saya%20mau%20tanya%20soal%20beta%20Tokoflow`} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#05A660] hover:underline">Chat WhatsApp</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
