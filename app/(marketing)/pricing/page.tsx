import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { FREE_STARTER_ORDERS } from "@/config/plans";
import { PricingTiers } from "./PricingTiers";

export const metadata: Metadata = {
  title: `Harga — ${siteConfig.tagline}`,
  description:
    "50 order gratis untuk mulai. Pro Rp 99.000/bulan membuka order tanpa batas dan companion penuh. Business Rp 199.000/bulan menambah akun multi-staf.",
  alternates: {
    canonical: "https://tokoflow.co.id/pricing",
  },
};

const faqs = [
  {
    question: "Benar-benar gratis?",
    answer:
      "Ya. Paket Gratis memberi kamu 50 order untuk mulai — tanpa kartu kredit, tanpa batas waktu. Onboarding 1-Foto, link tokomu, dan menerima pembayaran pelanggan semuanya termasuk.",
  },
  {
    question: "Apakah pelanggan bisa bayar lewat link tokoku?",
    answer:
      "Bisa — hubungkan akun Midtrans-mu di Pengaturan. Pelanggan bayar via QRIS, transfer bank (VA), atau e-wallet (GoPay/OVO/DANA/ShopeePay), dan uangnya masuk langsung ke rekeningmu. Tokoflow tidak pernah menahan danamu dan tidak mengambil komisi. Kalau tidak mau, kamu tetap bisa pakai QRIS statis dengan konfirmasi manual — pilihan ada di tanganmu.",
  },
  {
    question: `Apa yang terjadi setelah ${FREE_STARTER_ORDERS} order gratis pertama?`,
    answer:
      "Upgrade ke Pro Rp 99.000/bulan untuk order tanpa batas, companion AI penuh, dan kepatuhan e-Faktur + PPN yang senyap. Business Rp 199.000/bulan menambah akun multi-staf dan penugasan order untuk penjual yang jalan dengan tim. Apa pun pilihanmu, datamu tetap milikmu — tanpa lock-in, batalkan kapan saja.",
  },
  {
    question: "Kenapa upgrade ke Pro?",
    answer:
      'Pro memberi order tanpa batas, pengingat cerdas, pricing whisper, dan kepatuhan e-Faktur + PPN yang senyap. Halaman tokomu kehilangan footer "Dibuat dengan Tokoflow". Harga Rp 99.000/bulan. Kebanyakan penjual aktif pindah ke Pro dalam beberapa minggu.',
  },
  {
    question: "Apa tambahan di Business?",
    answer:
      "Business (Rp 199.000/bulan) untuk penjual yang jalan dengan tim. Semua di Pro, plus akun multi-staf (2 termasuk), penugasan order ke staf, dan dukungan prioritas (respons 24 jam).",
  },
  {
    question: "Apakah Tokoflow yang melaporkan PPN saya?",
    answer:
      "Tidak — Tokoflow menghitung PPN dan menyiapkan e-Faktur, tetapi pelaporan SPT-nya tetap lewat Coretax/DJP. Tokoflow merapikan angkamu supaya saat waktu lapor, datanya sudah siap.",
  },
  {
    question: "Bagaimana cara bayar paket Pro / Business?",
    answer:
      "QRIS, transfer bank (VA), atau e-wallet via Midtrans. Tanpa biaya tersembunyi. Tanpa biaya setup. Batalkan kapan saja — datamu tetap bisa diakses.",
  },
  {
    question: "Apakah fitur AI (foto, suara, paste) gratis?",
    answer:
      "Ya — setiap paket termasuk parsing order via foto, suara, dan paste chat WhatsApp. Onboarding Photo Magic gratis untuk semua.",
  },
  {
    question: "Bagaimana kalau saya mau berhenti?",
    answer:
      "Sekali tap untuk batalkan. Tanpa telepon, tanpa survei keluar. Datamu tetap bisa diakses sampai periode tagihan berakhir. Aktifkan lagi kapan saja dalam 90 hari — semuanya masih ada.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};


export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Pricing Hero */}
      <section className="pt-24 lg:pt-28 pb-12 lg:pb-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#1E293B]">
            Harga sederhana, syarat yang adil.
          </h1>
          <p className="mt-3 text-[#475569] lg:text-lg max-w-xl mx-auto">
            50 order gratis untuk mulai. Upgrade hanya saat kamu butuh lebih — bukan karena kami bikin kamu cemas.
          </p>
        </div>

        <div className="mt-12 max-w-5xl mx-auto px-4">
          <PricingTiers />
        </div>
      </section>

      {/* Value anchoring */}
      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-xs font-bold text-[#1E293B]/70 uppercase tracking-wider text-center mb-6">
            Pelangganmu tetap milikmu
          </p>
          <div className="space-y-3 text-sm bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <div className="flex items-center justify-between">
              <span className="text-[#475569]">GoFood / GrabFood</span>
              <span className="font-semibold text-[#1E293B] line-through decoration-[#94A3B8]">
                komisi 20–30%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#475569]">POS kasir (Moka / Olsera)</span>
              <span className="font-semibold text-[#1E293B] line-through decoration-[#94A3B8]">
                Rp 250rb–1jt/bln
              </span>
            </div>
            <div className="border-t border-[#E2E8F0] pt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#05A660]">Tokoflow Pro</span>
                <span className="font-bold text-[#05A660]">Rp 99.000/bln</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-semibold text-[#05A660]">Tokoflow Business</span>
                <span className="font-bold text-[#05A660]">Rp 199.000/bln</span>
              </div>
              <p className="mt-3 text-xs text-[#475569] text-center">
                0% komisi. Pembayaran pelanggan masuk langsung ke rekeningmu — Tokoflow tidak pernah menyentuh uangnya. Pelanggan dan data tetap milikmu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-[2rem] border border-[#E2E8F0] bg-white p-6 sm:p-8 lg:p-10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F6F0]">
                <HelpCircle className="h-6 w-6 text-[#05A660]" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-[#1E293B]">
                  Pertanyaan soal harga
                </h2>
                <p className="text-sm lg:text-base text-[#475569]">
                  Jawaban jujur, tanpa syarat tersembunyi.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="border-b border-[#E2E8F0] pb-5 last:border-0 last:pb-0"
                >
                  <h3 className="text-sm lg:text-base font-semibold text-[#1E293B]">
                    {faq.question}
                  </h3>
                  <p className="mt-1.5 text-sm lg:text-base leading-relaxed text-[#475569]">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#1E293B]">
            Tokomu. Tinggal satu foto.
          </h2>
          <p className="mt-3 text-base text-[#475569]">
            Tanpa kartu kredit. Tanpa komisi. Batalkan kapan saja.
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-[#05A660] text-white hover:bg-[#048C51]"
              asChild
            >
              <Link href="/login">
                Mulai gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
