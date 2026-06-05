import type { Metadata } from "next";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  Mail,
  MessageSquare,
  Clock,
  HelpCircle,
} from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Hubungi kami via WhatsApp atau email. Manusia sungguhan, jawaban jujur. Kami balas dalam sehari.",
  alternates: {
    canonical: "https://tokoflow.co.id/contact",
  },
};

const faqs = [
  {
    question: "Apakah Tokoflow gratis?",
    answer:
      "Ya. 50 order pertamamu gratis, termasuk onboarding Photo Magic, link tokomu, pembayaran pelanggan (QRIS / transfer bank / e-wallet via Midtrans, 0% komisi), draft balasan, Ringkasan Harian, dan listing gratis di direktori Tokoflow. Pro (Rp 99.000/bln) membuka order tanpa batas, companion AI penuh, dan kepatuhan e-Faktur + PPN yang senyap. Business (Rp 199.000/bln) menambah akun multi-staf.",
  },
  {
    question: "Apakah saya perlu instal aplikasi?",
    answer:
      "Tidak. Tokoflow berjalan di browser HP-mu dan terasa seperti aplikasi (PWA) saat kamu tambahkan ke layar utama. Tanpa download, tanpa review App Store, tanpa ribet instal.",
  },
  {
    question: "Bagaimana pelanggan menemukan penjual Tokoflow?",
    answer:
      "Dua cara. Pertama, link langsung tokoflow.co.id/[slug-mu] — bagikan di WhatsApp, IG, TikTok, di mana saja; pelanggan tap dan pesan, 0% komisi. Kedua, direktori publik di tokoflow.co.id/store dengan halaman per kota (tokoflow.co.id/store/jakarta-selatan, dll.) — terdaftar secara default, bisa dimatikan kapan saja di Pengaturan. Keduanya mengarahkan order ke dashboard-mu dengan kamu yang memiliki hubungan pelanggan.",
  },
  {
    question: "Apakah data saya aman?",
    answer:
      "Ya. Server terenkripsi, isolasi data per pengguna, backup rutin. Kami tidak pernah menjual atau membagikan datamu. Sesuai UU Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022).",
  },
  {
    question: "Bagaimana cara menghapus akun saya?",
    answer:
      "Sekali tap di Pengaturan. Atau email hello@tokoflow.co.id — datamu akan dihapus permanen dalam 5 hari kerja. Tanpa survei keluar, tanpa ribet.",
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

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="border-b pt-24 lg:pt-28">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
          <nav className="mb-3 flex items-center gap-1.5 text-sm">
            <Link href="/" className="flex items-center gap-1 text-[#475569] transition-colors hover:text-[#1E293B]">
              <Home className="h-3.5 w-3.5" />
              <span>Beranda</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#475569]/40" />
            <span className="font-medium text-[#1E293B]">Kontak</span>
          </nav>

          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#1E293B]">
            Hubungi kami.
          </h1>
          <p className="mt-1 text-sm lg:text-base text-[#475569]">
            Manusia sungguhan, jawaban jujur. WhatsApp atau email — keduanya bisa.
          </p>
        </div>
      </div>

      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid gap-8 lg:gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-start gap-4 rounded-[2rem] border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F6F0]">
                  <MessageSquare className="h-6 w-6 text-[#05A660]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-base lg:text-lg font-bold text-[#1E293B]">WhatsApp</h3>
                  <p className="mt-0.5 text-sm text-[#475569]">Chat untuk bantuan cepat.</p>
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-[#475569]">
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                    <span>Balas dalam 24 jam</span>
                  </div>
                  <a
                    href={`https://wa.me/${siteConfig.supportWhatsapp}?text=Halo%20Tokoflow%2C%20saya%20ada%20pertanyaan`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#05A660] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#048C51]"
                  >
                    Chat WhatsApp
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-[2rem] border border-[#E2E8F0] bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F6F0]">
                  <Mail className="h-6 w-6 text-[#05A660]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-base lg:text-lg font-bold text-[#1E293B]">Email</h3>
                  <p className="mt-0.5 text-sm text-[#475569]">Untuk pertanyaan detail atau kerja sama.</p>
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-[#475569]">
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                    <span>Balas dalam 1-2 hari kerja</span>
                  </div>
                  <a
                    href="mailto:hello@tokoflow.co.id"
                    className="mt-3 inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#1E293B] transition-colors hover:bg-[#E8F6F0] hover:border-[#05A660]/30"
                  >
                    hello@tokoflow.co.id
                  </a>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#E2E8F0] bg-slate-50 p-6">
                <h3 className="text-sm lg:text-base font-bold text-[#1E293B]">Halaman lain</h3>
                <div className="mt-3 flex flex-col gap-2">
                  <Link href="/features" className="text-sm text-[#475569] hover:text-[#1E293B] transition-colors">
                    Fitur →
                  </Link>
                  <Link href="/pricing" className="text-sm text-[#475569] hover:text-[#1E293B] transition-colors">
                    Harga →
                  </Link>
                  <Link href="/about" className="text-sm text-[#475569] hover:text-[#1E293B] transition-colors">
                    Tentang Tokoflow →
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-[2rem] border border-[#E2E8F0] bg-white p-6 sm:p-8 lg:p-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F6F0]">
                    <HelpCircle className="h-6 w-6 text-[#05A660]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-lg lg:text-xl font-bold text-[#1E293B]">
                      Pertanyaan umum
                    </h2>
                    <p className="text-sm text-[#475569]">
                      Jawaban untuk hal yang paling sering ditanya penjual.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {faqs.map((faq) => (
                    <div key={faq.question} className="border-b border-[#E2E8F0] pb-5 last:border-0 last:pb-0">
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
          </div>
        </div>
      </section>
    </>
  );
}
