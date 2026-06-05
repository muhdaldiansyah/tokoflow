import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  ArrowRight,
  Camera,
  Heart,
  Sun,
  Mic,
  Sparkles,
  ShoppingBag,
  UtensilsCrossed,
  Scissors,
  ChefHat,
  Shirt,
  Package,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Tentang",
  description:
    "Tokoflow membantu UMKM Indonesia memiliki channel jualannya sendiri — terima order dari halaman sendiri, miliki data pelanggan, dan kurangi ketergantungan pada marketplace.",
  alternates: {
    canonical: "https://tokoflow.co.id/about",
  },
};

type Belief = { icon: LucideIcon; title: string; description: string };

const beliefs: Belief[] = [
  {
    icon: Camera,
    title: "Setup seharusnya menghilang",
    description:
      "Kalau alatmu butuh wizard, tutorial, atau checklist, ia sudah gagal. Satu foto adalah satu-satunya setup yang kami minta.",
  },
  {
    icon: Heart,
    title: "Teknologi seharusnya menghormatimu",
    description:
      "Tanpa notifikasi di luar jam tenang. Tanpa streak yang menghukum hari libur. Tanpa badge merah yang menciptakan kecemasan. Waktu dan energimu berharga.",
  },
  {
    icon: Mic,
    title: "Tangan untuk berkarya",
    description:
      "Saat tanganmu penuh — di wajan, di mesin jahit, di lini produksi — kamu harus bisa bicara ke tokomu. Suara menggantikan formulir.",
  },
  {
    icon: Sun,
    title: "Setiap hari layak ditutup dengan baik",
    description:
      "Setiap malam, Tokoflow menceritakan kisah harimu — hangat di hari sibuk, lembut di hari sepi. Tanpa menghakimi. Selalu memuliakan.",
  },
  {
    icon: Sparkles,
    title: "Kepatuhan seharusnya tak terlihat",
    description:
      "DJP, PPN, e-Faktur — semuanya penting, tapi tak satu pun perlu memenuhi pikiranmu. Tokoflow mengurusnya diam-diam di latar belakang.",
  },
  {
    icon: ShoppingBag,
    title: "Pelangganmu milikmu",
    description:
      "Saat seseorang memesan dari halaman Tokoflow-mu, hubungan itu milikmu — bukan algoritma platform. Tanpa komisi atas penjualanmu. Data tidak dijual. Tidak ada rekomendasi ke kompetitormu.",
  },
];

const targetUsers: { icon: LucideIcon; label: string }[] = [
  { icon: ChefHat, label: "F&B & dapur rumahan" },
  { icon: UtensilsCrossed, label: "Katering & meal-prep" },
  { icon: Package, label: "IKM & produsen kecil" },
  { icon: Sparkles, label: "Kosmetik & skincare" },
  { icon: Shirt, label: "Fashion & busana muslim" },
  { icon: Scissors, label: "Pengrajin & penjahit" },
  { icon: Heart, label: "Kesehatan & wellness" },
  { icon: ShoppingBag, label: "Retailer independen" },
];

export default function AboutPage() {
  return (
    <>
      <div className="border-b pt-24 lg:pt-28">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
          <nav className="mb-3 flex items-center gap-1.5 text-sm">
            <Link
              href="/"
              className="flex items-center gap-1 text-[#475569] transition-colors hover:text-[#1E293B]"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Beranda</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#475569]/40" />
            <span className="font-medium text-[#1E293B]">Tentang</span>
          </nav>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#1E293B]">
            Tentang Tokoflow
          </h1>
          <p className="mt-1 text-sm lg:text-base text-[#475569]">
            Setiap bisnis independen berhak memiliki channel jualannya sendiri — bukan sekadar menyewa lapak di platform orang lain.
          </p>
        </div>
      </div>

      {/* Hero image */}
      <section className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-8 lg:py-10">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-sm">
            <Image
              src="/images/marketing/about-hero.webp"
              alt="Tangan pemilik UMKM Indonesia sedang berkarya, dengan halaman order Tokoflow terlihat di perangkat di dekatnya."
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-[2rem] border border-[#E2E8F0] bg-white p-8 lg:p-10 shadow-sm">
            <p className="text-xs font-bold text-[#05A660] uppercase tracking-wider">
              Misi kami
            </p>
            <h2 className="mt-3 text-xl lg:text-2xl font-bold text-[#1E293B]">
              Miliki channel jualanmu. Bukan sekadar lapak di platform orang lain.
            </h2>
            <p className="mt-4 text-sm lg:text-base leading-relaxed text-[#475569]">
              Tahun 1977, komputer hanya untuk korporasi dan penggemar teknologi. Apple percaya komputer harus untuk semua orang — bukan dengan membuatnya lebih murah, tapi dengan membuatnya terasa berbeda. Manusiawi. Intuitif. Milikmu.
            </p>
            <p className="mt-3 text-sm lg:text-base leading-relaxed text-[#475569]">
              Hari ini, jualan online bisa diakses siapa saja — TikTok, Shopee, Tokopedia, Lazada. Siapa pun bisa pasang produk. Tapi ini yang tidak berubah: saat kamu jualan di platform orang lain, platform itu yang memiliki hubungan dengan pelanggan. Mereka mengambil potongan dari setiap order. Saat pelanggan itu ingin beli lagi, platform yang menentukan apa yang mereka lihat berikutnya — bisa jadi kompetitor. Kamu yang kerja keras. Kamu yang bayar untuk dapat perhatian mereka. Tapi hasilnya bukan milikmu.
            </p>
            <p className="mt-3 text-sm lg:text-base leading-relaxed text-[#475569]">
              <strong className="text-[#1E293B]">Tokoflow hadir untuk mengubah itu.</strong> Bukan dengan menggantikan marketplace — pakai mereka untuk ditemukan. Tapi dengan memberi setiap UMKM Indonesia channel jualannya sendiri: halaman yang milik mereka, order yang masuk ke inbox mereka, data pelanggan yang menjadi milik mereka, pembayaran yang masuk langsung ke rekening mereka. Tanpa perusahaan IT. Tanpa berbulan-bulan setup. Jadi hari ini.
            </p>
          </div>
        </div>
      </section>

      {/* What we believe */}
      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xl lg:text-2xl font-bold text-[#1E293B]">
              Yang kami yakini
            </h2>
            <p className="mt-2 text-sm lg:text-base text-[#475569]">
              Enam keyakinan yang membentuk setiap keputusan kami.
            </p>
          </div>

          <div className="mt-8 lg:mt-10 grid gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {beliefs.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F6F0]">
                  <item.icon
                    className="h-5 w-5 text-[#05A660]"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="mt-4 font-semibold text-base text-[#1E293B]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Tokoflow is for */}
      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl lg:text-2xl font-bold text-[#1E293B]">
            Untuk siapa Tokoflow
          </h2>
          <p className="mt-2 text-sm lg:text-base text-[#475569]">
            Bisnis yang sudah punya produk nyata dan pelanggan nyata — dan siap memiliki channel-nya sendiri. Dari produsen IKM di Bandung sampai penjual F&B di Jabodetabek, dari pembuat kosmetik sampai penjahit dan pengrajin. Kalau produkmu sudah terbukti laku, Tokoflow membantumu memiliki langkah berikutnya.
          </p>

          <div className="mt-6 lg:mt-8 grid grid-cols-2 gap-3 lg:gap-4 sm:grid-cols-4">
            {targetUsers.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F6F0]">
                  <item.icon
                    className="h-4 w-4 text-[#05A660]"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-sm font-medium text-[#1E293B]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-[#475569]">
            Pakai TikTok dan Shopee untuk ditemukan. Pakai Tokoflow untuk membawa pelanggan setia ke channel milikmu.
          </p>
        </div>
      </section>

      {/* Our promise */}
      <section className="border-t border-[#E2E8F0] bg-slate-50 py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-[2rem] border border-[#E2E8F0] bg-white p-8 lg:p-10 shadow-sm">
            <p className="text-xs font-bold text-[#05A660] uppercase tracking-wider">
              Janji kami
            </p>
            <h2 className="mt-3 text-xl lg:text-2xl font-bold text-[#1E293B]">
              Manusiawi bukan pilihan tambahan.
            </h2>
            <p className="mt-4 text-sm lg:text-base leading-relaxed text-[#475569]">
              Saat merancang Tokoflow, kami selalu menghadapi trade-off yang sama: kirim lebih cepat versus kerjakan dengan teliti, lebih banyak fitur versus lebih sedikit kebisingan, pertumbuhan agresif versus harga yang adil. Kami selalu memilih yang manusiawi. Tanpa kecuali.
            </p>
            <p className="mt-3 text-sm lg:text-base leading-relaxed text-[#475569]">
              Itu janji kami untukmu, dan janji kami untuk diri kami sendiri.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="mx-auto max-w-2xl text-2xl lg:text-3xl font-bold tracking-tight text-[#1E293B]">
            Bangun website order milikmu hari ini.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-[#475569]">
            50 order pertamamu gratis. Tanpa kartu kredit. Tanpa komisi dari Tokoflow. Data pelanggan tetap milikmu.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base font-semibold border-[#E2E8F0] text-[#1E293B] hover:bg-[#E8F6F0] hover:border-[#05A660]/30"
              asChild
            >
              <Link href="/contact">Hubungi kami</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
