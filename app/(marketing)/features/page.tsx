import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Mic,
  Heart,
  Sun,
  LinkIcon,
  Sparkles,
  ShoppingBag,
  CalendarClock,
  QrCode,
  MessageSquare,
  ClipboardList,
  Bell,
  BarChart3,
  Users,
  WifiOff,
  PackageCheck,
  Truck,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Fitur — ${siteConfig.tagline}`,
  description:
    "Dirancang seputar momen-momen yang membuat jualan terasa manusiawi: Photo Magic, Order Suara, Notifikasi Halus, Geser Maju, Rangkulan Malam, dan Pekerjaan yang Menghilang.",
  alternates: {
    canonical: "https://tokoflow.co.id/features",
  },
};

type Feature = { icon: LucideIcon; title: string; desc: string };

type Section = {
  label: string;
  intro: string;
  features: Feature[];
  image?: { src: string; alt: string };
};

const sections: Section[] = [
  {
    label: "Photo Magic",
    image: {
      src: "/images/marketing/feature-photo-magic.webp",
      alt: "Tampak atas tangan memegang smartphone di atas meja, membingkai nampan kue dan risoles.",
    },
    intro: "Enam puluh detik dari foto ke toko online. Tanpa wizard setup, tanpa dropdown jenis usaha, tanpa formulir. Cukup kamera yang sudah kamu pakai.",
    features: [
      { icon: Camera, title: "Onboarding 1-foto", desc: "Arahkan kamera ke dagangan atau dapurmu. AI membacanya dan menyusun nama toko, cerita, menu, dan harga dalam hitungan detik — fotomu tetap apa adanya." },
      { icon: Sparkles, title: "Default cerdas dari konteks", desc: "Lokasi, waktu, foto — Tokoflow menyimpulkan jenis usaha, jam buka, dan mata uangmu. Kamu tidak perlu memilih dari dropdown." },
      { icon: LinkIcon, title: "Bagikan sekali tap", desc: "Begitu tokomu live, bagikan ke bio IG, TikTok, atau status WhatsApp cukup sekali tap." },
    ],
  },
  {
    label: "Halaman Toko",
    image: {
      src: "/images/marketing/feature-storefront.webp",
      alt: "Pelanggan memegang smartphone yang menampilkan halaman toko bersih dengan foto profil kue lapis dan tombol hijau Tambah ke order.",
    },
    intro: "Link dengan wajah — ceritamu, menumu, dan jalur pelanggan dari penasaran ke pesan.",
    features: [
      { icon: LinkIcon, title: "Halaman toko yang cantik", desc: "Fotomu, ceritamu, menumu. Berkarakter, bukan template." },
      { icon: MessageSquare, title: "Alur order percakapan", desc: "Menu visual sebagai default. Pelanggan menambah item, atur jumlah, tulis catatan — dan link-mu menangkap order tanpa kamu mengetik satu pesan pun." },
      { icon: Heart, title: "Blok cerita personal", desc: "Dua-tiga baris tentang siapa kamu. Pelanggan merasa membeli dari seorang manusia, bukan penjual tanpa wajah." },
      { icon: QrCode, title: "Pembayaran pelanggan, dalam alur", desc: "QRIS, transfer bank (VA), dan e-wallet (GoPay/OVO/DANA/ShopeePay) via Midtrans. Dana masuk langsung ke rekeningmu — Tokoflow tidak pernah menyentuh uangnya. 0% komisi. Opsional, default mati sampai kamu hubungkan." },
      { icon: ShoppingBag, title: "Antar atau ambil sendiri, pilihan mereka", desc: "Saat kamu menawarkan keduanya, pelanggan memilih di form order dan mengisi alamat pengiriman. Kamu melihat preferensinya di tiap order — tanpa bolak-balik WhatsApp." },
      { icon: Heart, title: "Tampil di direktori, opt-in", desc: "Tokomu otomatis muncul di tokoflow.co.id/store dan halaman kotamu — matikan kapan saja di Pengaturan. Gratis. Order via link langsung tetap 0% komisi; link langsung berfungsi terlepas dari listing." },
    ],
  },
  {
    label: "Notifikasi Halus, Geser, Suara",
    intro: "Saat pekerjaan sedang berlangsung, Tokoflow menghilang. Saat kamu butuh, satu gerakan sudah cukup.",
    features: [
      { icon: Heart, title: "Notifikasi getar saja", desc: "Getaran lembut saat order masuk. Tanpa suara mengagetkan sebagai default. Tokoflow menghormati dapur, tangan, dan alur kerjamu." },
      { icon: ShoppingBag, title: "Geser maju", desc: "Geser ke kanan untuk memajukan order: diterima → diproses → siap → dikirim → selesai. Satu gerakan per langkah. Selesai." },
      { icon: Mic, title: "Order Suara", desc: "Tap mikrofon dan ucapkan ordernya. \"Tambah ayam geprek 27 ribu, kue lapis dua, kirim besok.\" Tokoflow mengubah ucapanmu jadi order rapi — tanpa mengetik." },
      { icon: Bell, title: "Jam tenang sebagai default", desc: "21:00–05:00 otomatis senyap. Waktu keluarga tetap waktu keluarga." },
    ],
  },
  {
    label: "Sang Pendamping",
    intro: "Kehadiran yang tahu kapan membantu, dan kapan diam.",
    features: [
      { icon: MessageSquare, title: "Draft balasan, bukan auto-reply", desc: "Saat pelanggan bertanya soal jam buka, harga, atau permintaan khusus, Tokoflow menyiapkan draft balasan untuk kamu kirim. Kamu yang selalu mengirim — suaramu, keputusanmu." },
      { icon: ClipboardList, title: "Pesan status sekali tap", desc: "\"Pesananmu siap.\" \"Sedang dikirim.\" \"Terima kasih.\" Sekali tap mengisi draft WhatsApp — kamu tekan kirim saat terasa pas." },
      { icon: PackageCheck, title: "Konfirmasi terima oleh pelanggan", desc: "Saat order dikirim, kirim link konfirmasi sekali tap via WhatsApp. Pelanggan tap saat barang diterima — tak perlu lagi nanya \"sudah sampai belum?\". Tokoflow tidak melacak kurir; hanya konfirmasi pelanggan yang berlaku." },
      { icon: Layers, title: "Manajemen stok dengan riwayat", desc: "Perbarui semua jumlah setelah produksi dari satu halaman. Setiap perubahan tercatat — order mana yang memakai stok, kapan restock, dan berapa. Bisa diekspor CSV untuk catatanmu." },
      { icon: BarChart3, title: "Bisikan harga", desc: "Sekali seminggu, dorongan halus: \"Penjual lain di Bandung jual kue lapis Rp 25.000, kamu Rp 20.000. Bisa naik sedikit.\" Opsional, tidak pernah memaksa." },
    ],
  },
  {
    label: "Rangkulan Malam",
    image: {
      src: "/images/marketing/feature-evening.webp",
      alt: "Meja kayu bersih saat senja dengan ponsel menampilkan kartu ringkasan yang lembut bercahaya.",
    },
    intro: "Setiap malam, Tokoflow punya sesuatu yang baik untuk dikatakan. Bukan grafik — cerita.",
    features: [
      { icon: Sun, title: "Ringkasan harian, disampaikan hangat", desc: "\"Hari ini kamu hebat. 23 order, Rp 1.247.000. Pak Andi bilang kue lapismu enak banget.\" Di hari sepi: \"Hari ini lebih sepi. Tidak apa-apa. Istirahat dulu.\"" },
      { icon: Heart, title: "Cerita bulanan", desc: "\"Bulan ini — 12 pelanggan baru, semua suka. Item teratas: kue lapis, dipesan 84×.\" Angka diceritakan sebagai narasi." },
      { icon: Users, title: "Pengenalan pelanggan", desc: "\"Pak Andi balik lagi! Ketiga kalinya bulan ini. Mau saya tandai 'langganan'?\"" },
      { icon: CalendarClock, title: "Kesadaran musiman", desc: "Dua minggu sebelum Ramadan: \"Mau bantuan siapkan menu takjil?\" Tokoflow paham ritme perdagangan Indonesia." },
    ],
  },
  {
    label: "Keandalan",
    intro: "Hal-hal senyap yang tinggal jalan. Supaya kamu percaya alatnya, lalu melupakannya.",
    features: [
      { icon: WifiOff, title: "Bisa offline", desc: "Sinyal hilang? Tetap terima order. Semua tersinkron saat kamu kembali online." },
      { icon: ShoppingBag, title: "Stok berkurang otomatis", desc: "Saat habis terjual, menu otomatis menonaktifkan item itu. Tanpa update manual." },
      { icon: Truck, title: "Pelacakan kiriman untuk pelanggan", desc: "Tambahkan nomor resi dan kurir saat kamu kirim. Struk pelanggan menampilkan kartu 'Dalam perjalanan' — JNE, J&T, SiCepat, AnterAja, Ninja Xpress, sekali tap untuk lacak." },
      { icon: ClipboardList, title: "Daftar persiapan harian", desc: "Total hari ini per produk, sekali tap. Bawa ke dapur, kirim ke timmu via WhatsApp." },
      { icon: Sparkles, title: "Penomoran faktur otomatis", desc: "Berurutan, tidak pernah ganda, siap saat kamu butuh." },
    ],
  },
];

function FeatureCard({ icon: Icon, title, desc }: Feature) {
  return (
    <div className="flex gap-3.5 items-start">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#05A660]/10 text-green-600">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-24 lg:pt-28 pb-10 lg:pb-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            Dirancang seputar momen-momen yang berarti.
          </h1>
          <p className="mt-3 text-muted-foreground lg:text-lg">
            Photo Magic. Notifikasi Halus. Geser Maju. Order Suara. Rangkulan Malam. Pekerjaan yang Menghilang. Semua yang lain ada untuk mendukung ini — dengan tenang.
          </p>
        </div>
      </section>

      {/* Feature Sections */}
      {sections.map((section, i) => (
        <section key={section.label} className={`py-12 lg:py-14 ${i > 0 ? "border-t" : ""}`}>
          <div className="max-w-2xl mx-auto px-4">
            {section.image && (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-border shadow-sm mb-6">
                <Image
                  src={section.image.src}
                  alt={section.image.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 672px"
                  className="object-cover"
                />
              </div>
            )}
            <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
              {section.label}
            </p>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {section.intro}
            </p>
            <div className="divide-y divide-border">
              {section.features.map((f) => (
                <div key={f.title} className="py-4">
                  <FeatureCard {...f} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Tax compliance — silent footnote. PPN + e-Faktur only matter to a small
          slice of merchants and surface only when the business needs them. */}
      <section className="border-t py-10 lg:py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">
            Satu hal lagi
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Kalau suatu hari kamu jadi PKP, Tokoflow mengurus PPN dan e-Faktur diam-diam di latar belakang. Kamu tidak akan menyadarinya sampai benar-benar butuh — dan itu masih lama.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-12 lg:py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">
            Tokomu. Tinggal satu foto.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            50 order pertamamu gratis. Tanpa kartu kredit. Tanpa komisi.
          </p>
          <div className="mt-6">
            <Button
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-[#05A660] text-white hover:bg-[#05A660]/90"
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
