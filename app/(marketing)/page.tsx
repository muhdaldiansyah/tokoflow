import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Store, RefreshCw, Zap, Building2, MessageCircle, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { H1, Lead, P } from "@/components/ui/typography";
import { PhotoMagicHero } from "./PhotoMagicHero";
import { MarketplaceCostCalculator } from "./MarketplaceCostCalculator";
import ComingSoon from "./ComingSoon";

const isMaintenanceMode =
  process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

const homepageTitle = isMaintenanceMode
  ? "Tokoflow — Segera Hadir"
  : "Tokoflow — Website Order Sendiri untuk UMKM Indonesia";

const homepageDescription = isMaintenanceMode
  ? "Tokoflow segera hadir. Cara paling simpel untuk mulai jualan — cukup satu foto untuk meluncurkan tokomu."
  : "Terima order dari halaman tokomu sendiri, data pelanggan tetap milikmu, dan kurangi ketergantungan pada marketplace. Siap hari ini, mulai Rp 99.000/bulan. Dibuat untuk UMKM Indonesia.";

export const metadata: Metadata = {
  title: { absolute: homepageTitle },
  description: homepageDescription,
  alternates: {
    canonical: "https://tokoflow.co.id",
  },
  openGraph: {
    title: homepageTitle,
    description: homepageDescription,
    url: "https://tokoflow.co.id",
  },
  twitter: {
    title: homepageTitle,
    description: homepageDescription,
  },
};

const ownership = [
  { lead: "Pelangganmu, datamu", tail: "tidak pernah dibagi atau dikunci di dalam marketplace mana pun" },
  { lead: "Hargamu, keputusanmu", tail: "kami tidak pernah menentukannya untukmu" },
  { lead: "Pelanggan setiamu, channelmu", tail: "mereka kembali ke kamu, bukan ke platform" },
  { lead: "Ritmemu sendiri", tail: "tanpa streak, tanpa badge, tanpa tekanan target harian" },
  { lead: "Kebebasanmu", tail: "batalkan sekali tap, ekspor semua data" },
  { lead: "0% komisi dari Tokoflow", tail: "yang kamu hasilkan, kamu simpan" },
];

const entryPaths = [
  {
    icon: Building2,
    heading: "Produkmu serius, tapi channel digitalmu masih WhatsApp?",
    body: "Kamu sudah punya stok, branding, dan pelanggan — beri mereka halaman order yang setara dengan kualitas produk yang kamu jual.",
    cta: "Buat website order saya",
    href: "/register",
  },
  {
    icon: MessageCircle,
    heading: "Order masuk lewat WhatsApp, makin susah dilacak?",
    body: "Biarkan pelanggan memilih dan memesan sendiri. Order masuk rapi, dan order ulang tidak mulai dari chat kosong.",
    cta: "Rapikan order saya",
    href: "/register",
  },
  {
    icon: BarChart2,
    heading: "Omzet kelihatan bagus, tapi tidak yakin sisanya berapa?",
    body: "Biaya platform bukan cuma komisi. Hitung gambaran lengkapnya — lalu bandingkan dengan channel order milikmu sendiri.",
    cta: "Hitung biaya platform saya",
    href: "#calculator",
  },
];

const coreMessages = [
  {
    icon: Store,
    title: "Tampil lebih profesional",
    body: "Pelanggan memesan dari tokoflow.co.id/namamu — halaman ber-branding milikmu. Bukan chat WhatsApp, bukan listing marketplace.",
  },
  {
    icon: RefreshCw,
    title: "Pertahankan pelanggan setiamu",
    body: "Pakai TikTok dan Shopee untuk ditemukan. Saat mereka siap order ulang, bawa ke channel milikmu — di sini rekomendasi berikutnya milikmu, bukan platform.",
  },
  {
    icon: Zap,
    title: "Jadi hari ini. Tanpa perlu tim IT.",
    body: "Upload foto produk. AI menyusun katalogmu. Halaman ordermu siap dibagikan — dalam hitungan menit, bukan bulan.",
  },
];

const tiers = [
  {
    name: "Gratis",
    price: "Rp 0",
    period: "50 order pertama",
    blurb: "Semua yang kamu butuh untuk mulai. Tanpa kartu kredit.",
    cta: "Mulai gratis",
    href: "/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: "Rp 99.000",
    period: "/ bulan",
    blurb: "Order tanpa batas, parsing suara + foto, faktur, dan sistem lengkap.",
    cta: "Coba Pro",
    href: "/register",
    highlight: true,
  },
  {
    name: "Business",
    price: "Rp 199.000",
    period: "/ bulan",
    blurb: "Semua di Pro plus akun multi-staf dan penugasan order untuk tim.",
    cta: "Hubungi kami",
    href: "/contact",
    highlight: false,
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tokoflow",
  url: "https://tokoflow.co.id",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
    description: "50 order pertama gratis",
  },
  description:
    "Website order sendiri untuk UMKM Indonesia. Terima order dari halamanmu sendiri, miliki data pelanggan, dan kurangi ketergantungan marketplace. Siap hari ini, mulai Rp 99.000/bulan.",
  featureList: [
    "Halaman order sendiri — tokoflow.co.id/namamu",
    "Pembayaran pelanggan — QRIS, transfer bank, e-wallet",
    "0% komisi — dana masuk langsung ke rekeningmu",
    "Katalog produk dari AI cukup satu foto",
    "Data pelanggan milikmu dan bisa diekspor",
    "Riwayat order pelanggan langganan",
    "Tarif ongkir per zona",
    "Pelacakan stok dan faktur otomatis",
    "Daftar packing untuk order pending",
    "Bisa offline",
  ],
  inLanguage: "id",
  author: {
    "@type": "Organization",
    name: "Tokoflow",
    url: "https://tokoflow.co.id",
  },
};

export default function HomePage() {
  if (isMaintenanceMode) {
    return <ComingSoon />;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative pt-20 pb-16 md:pt-24 md:pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
        <div className="max-w-5xl relative mx-auto px-4 z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-1 pr-4 text-sm font-medium text-[#1E293B] shadow-sm cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warm-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-warm-green"></span>
                </span>
                Untuk UMKM Indonesia
              </div>

              <div className="space-y-5">
                <H1 className="tracking-tight text-[#1E293B] text-3xl lg:text-4xl lg:leading-tight">
                  Website order{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-warm-green to-warm-green-hover">
                    milikmu sendiri.
                  </span>
                  <br className="hidden md:block" />
                  Bukan sekadar listing marketplace.
                </H1>

                <Lead className="text-[#475569] leading-relaxed font-normal">
                  Terima order dari halamanmu sendiri, data pelanggan tetap milikmu, dan kurangi ketergantungan pada marketplace — jadi hari ini, mulai Rp 99.000/bulan.
                </Lead>
                <P className="text-[#475569] leading-relaxed">
                  Pakai TikTok dan Shopee untuk ditemukan. Pakai Tokoflow untuk membawa pelanggan setia kembali ke channel milikmu.
                </P>
              </div>

              <div className="pt-2">
                <PhotoMagicHero />
              </div>

              <p className="text-xs text-[#94A3B8]">
                50 order pertama gratis · Tanpa kartu kredit · Batalkan kapan saja
              </p>

              <p className="text-xs text-[#64748B] pt-1">
                Atau{" "}
                <Link
                  href="/store"
                  className="font-medium text-[#05A660] underline-offset-2 hover:underline"
                >
                  jelajahi penjual lokal di Tokoflow
                </Link>
                .
              </p>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative aspect-square w-full max-w-[480px] overflow-hidden rounded-3xl shadow-[0_32px_80px_-8px_rgba(0,0,0,0.18)]">
                <Image
                  src="/images/marketing/hero-craft.webp"
                  alt="Pemilik UMKM Indonesia mengecek halaman order Tokoflow-nya di smartphone di samping produk-produknya."
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 480px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain → Promise */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="border-l-2 border-red-200 pl-5">
            <p className="text-[11px] font-semibold text-red-400 uppercase tracking-[0.12em] mb-2">Masalahnya</p>
            <p className="text-[#475569] leading-relaxed">
              Setiap kali pelanggan memesan lewat TikTok atau Shopee, platform mengambil potongan — dan rekomendasi berikutnya bisa saja mengarahkan pelanggan itu ke kompetitor. Kamu tidak memiliki hubungan itu.
            </p>
          </div>

          <div className="flex justify-center my-4">
            <ArrowRight className="h-4 w-4 text-warm-green/50 rotate-90" />
          </div>

          <div className="border-l-2 border-warm-green pl-5">
            <p className="text-[11px] font-semibold text-warm-green uppercase tracking-[0.12em] mb-2">Dengan Tokoflow</p>
            <p className="text-[#475569] leading-relaxed">
              Pelanggan memesan dari link-mu. Pembayaran masuk langsung ke rekeningmu. Data mereka tetap milikmu. Saat siap order ulang, mereka kembali ke{" "}
              <em className="not-italic font-medium text-[#1E293B]">halamanmu</em> — bukan marketplace.
            </p>
          </div>
        </div>
      </section>

      {/* Problem Selector — 3 entry paths */}
      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              Mana yang paling mirip kamu?
            </h2>
            <p className="mt-3 text-[#475569] lg:text-lg">
              Pilih yang paling sesuai dengan situasimu.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {entryPaths.map((path) => {
              const Icon = path.icon;
              return (
                <div
                  key={path.heading}
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-6 flex flex-col shadow-sm"
                >
                  <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center mb-4 shrink-0">
                    <Icon className="h-5 w-5 text-warm-green" />
                  </div>
                  <h3 className="font-semibold text-[#1E293B] mb-2 leading-snug">
                    {path.heading}
                  </h3>
                  <p className="text-sm text-[#475569] leading-relaxed flex-1">
                    {path.body}
                  </p>
                  <Link
                    href={path.href}
                    className="mt-5 inline-flex items-center justify-center h-10 rounded-xl text-sm font-semibold border border-warm-green text-warm-green hover:bg-green-50 transition-colors"
                  >
                    {path.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 Core Messages */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              Dibuat untuk bisnis dengan produk nyata dan pelanggan nyata
            </h2>
            <p className="mt-3 text-[#475569] lg:text-lg">
              Bukan alat untuk pemula. Bukan proyek IT Rp 10 juta. Jalan tengah yang sebelumnya belum ada.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {coreMessages.map((msg) => {
              const Icon = msg.icon;
              return (
                <div key={msg.title} className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
                  <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-warm-green" />
                  </div>
                  <h3 className="font-semibold text-[#1E293B] mb-2">{msg.title}</h3>
                  <p className="text-sm text-[#475569] leading-relaxed">{msg.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Marketplace Cost Calculator */}
      <section id="calculator" className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              Sebenarnya berapa biaya jualan di marketplace?
            </h2>
            <p className="mt-3 text-[#475569] lg:text-lg">
              Biaya platform bukan cuma komisi. Hitung gambaran lengkapnya.
            </p>
          </div>
          <MarketplaceCostCalculator />
        </div>
      </section>

      {/* Yours. All of it. */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              Semuanya milikmu.
            </h2>
            <p className="mt-3 text-[#475569] lg:text-lg">
              Pelanggan, data, dan channelmu — sudah milikmu sebelum Tokoflow, dan tetap milikmu.
            </p>
          </div>

          <ul className="space-y-3 max-w-xl mx-auto">
            {ownership.map((item) => (
              <li key={item.lead} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-warm-green shrink-0" aria-hidden />
                <span className="text-[#475569] leading-relaxed">
                  <span className="font-semibold text-[#1E293B]">{item.lead}</span>
                  <span> — {item.tail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Real shops anchor */}
      <section className="border-t border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 py-12 lg:py-16">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-sm">
            <Image
              src="/images/marketing/real-shops.webp"
              alt="Pemilik UMKM Indonesia menata produk di samping smartphone yang menampilkan halaman order Tokoflow-nya."
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
          <p className="mt-4 text-center text-sm text-[#475569]">
            Tokomu. Channelmu. Pelangganmu.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
              Harga sederhana. Bayar hanya saat kamu berkembang.
            </h2>
            <p className="mt-3 text-[#475569] lg:text-lg">
              Batalkan kapan saja. Ekspor semua data. Tanpa kartu kredit untuk mulai.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-6 ${
                  tier.highlight
                    ? "border-warm-green bg-white shadow-md"
                    : "border-[#E2E8F0] bg-white"
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center h-6 px-3 text-[11px] font-semibold rounded-full bg-warm-green text-white">
                    Paling populer
                  </span>
                )}
                <p className="text-sm font-semibold text-[#1E293B]">{tier.name}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#1E293B]">{tier.price}</span>
                  <span className="text-xs text-[#94A3B8]">{tier.period}</span>
                </div>
                <p className="mt-3 text-sm text-[#475569] leading-relaxed">{tier.blurb}</p>
                <Link
                  href={tier.href}
                  className={`mt-5 inline-flex items-center justify-center w-full h-10 rounded-xl text-sm font-semibold transition-colors ${
                    tier.highlight
                      ? "bg-warm-green text-white hover:bg-warm-green-hover"
                      : "bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-slate-50"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center mt-6 text-xs text-[#94A3B8]">
            <Link href="/pricing" className="underline hover:text-[#475569]">
              Lihat detail harga lengkap →
            </Link>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[#E2E8F0] py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="relative z-10">
            <h2 className="mx-auto max-w-2xl text-2xl lg:text-3xl font-bold tracking-tight text-[#1E293B]">
              Bangun website order milikmu hari ini.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base text-[#475569]">
              50 order pertamamu gratis. Tanpa kartu kredit. Tanpa komisi dari Tokoflow. Data pelanggan tetap milikmu.
            </p>

            <div className="mt-8">
              <Button size="lg" className="h-12 px-8 text-base font-semibold bg-warm-green text-white w-full sm:w-auto hover:bg-warm-green-hover" asChild>
                <Link href="/register">
                  Mulai gratis
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
