import type { Metadata } from "next";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Ketentuan Layanan",
  description:
    "Ketentuan layanan Tokoflow — halaman toko, manajemen order, dan e-Faktur DJP untuk UMKM Indonesia.",
  alternates: {
    canonical: "https://tokoflow.co.id/terms",
  },
};

export default function TermsPage() {
  return (
    <>
      <div className="border-b pt-24 lg:pt-28">
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10">
          <nav className="mb-3 flex items-center gap-1.5 text-sm">
            <Link href="/" className="flex items-center gap-1 text-[#475569] transition-colors hover:text-[#1E293B]">
              <Home className="h-3.5 w-3.5" />
              <span>Beranda</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#475569]/40" />
            <span className="font-medium text-[#1E293B]">Ketentuan</span>
          </nav>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#1E293B]">Ketentuan Layanan</h1>
          <p className="mt-1 text-sm lg:text-base text-[#475569]">
            Terakhir diperbarui: 6 Juni 2026
          </p>
        </div>
      </div>

      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-sm text-[#475569]">
            Ketentuan ini mengatur penggunaan Tokoflow olehmu. Dengan membuat akun, kamu menyetujui Ketentuan ini.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">1. Layanan</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Tokoflow menyediakan halaman toko, manajemen order, dan (pada paket Pro) submit e-Faktur DJP. Layanan disediakan apa adanya (&ldquo;as is&rdquo;); kami terus meningkatkan fungsinya.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">2. Akunmu</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Kamu bertanggung jawab melindungi kredensial login dan atas semua aktivitas di akunmu. Jangan bagikan login ke pihak ketiga. Kamu harus berusia 18+ atau memiliki persetujuan orang tua untuk menggunakan Tokoflow untuk tujuan komersial.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">3. Biaya dan tagihan</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Paket gratis mencakup 50 order pertamamu. Top-up dan langganan ditagih dalam Rupiah via Midtrans. Kredit top-up tidak pernah hangus. Paket langganan diperpanjang otomatis tiap bulan kecuali dibatalkan sebelum tanggal perpanjangan. Semua harga belum termasuk PPN jika berlaku.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">4. Kontenmu</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Kamu tetap memiliki seluruh konten dan data yang kamu unggah. Kamu memberi Tokoflow lisensi terbatas untuk menyimpan, menampilkan, dan memproses kontenmu semata-mata untuk menjalankan layanan. Kamu bertanggung jawab atas keakuratan produk, harga, dan data faktur yang kamu masukkan.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">5. Listing direktori</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Saat profil penjualmu mengaktifkan <em>Tampil di direktori</em> (default AKTIF), Tokoflow dapat menampilkan informasi toko publikmu di <code>tokoflow.co.id/store</code> dan <code>tokoflow.co.id/store/[kota]</code>. Informasi publik mencakup nama usaha, deskripsi usaha, kota, kategori usaha, logo, dan produk yang tercantum beserta harga. Link langsungmu <code>tokoflow.co.id/[slug]</code> selalu berfungsi terlepas dari status listing direktori. Kamu bisa mematikan listing direktori kapan saja di <em>Pengaturan</em>. <strong>Order pelanggan langsung tetap 0% komisi dan kamu memiliki penuh hubungan dengan pelanggan.</strong> Fitur penemuan berbasis marketplace di masa depan yang memperkenalkan komisi platform akan bersifat opt-in dan diungkapkan dengan jelas sebelum diaktifkan.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">6. Kepatuhan pajak</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Tokoflow mengirim e-Faktur ke DJP/Coretax atas namamu saat kamu mengaktifkan paket Pro dan memberikan kredensial yang valid. Kamu bertanggung jawab memastikan seluruh data pajak (NPWP, NIB, status PKP, tarif PPN) akurat dan lengkap. Tokoflow bukan konsultan pajak berlisensi; konsultasikan ke akuntanmu untuk pertanyaan perpajakan.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">7. Penggunaan yang wajar</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Jangan gunakan Tokoflow untuk produk ilegal, spam, penipuan, atau konten yang melanggar hukum Indonesia. Kami dapat menangguhkan akun yang melanggar ketentuan ini.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">8. Batasan tanggung jawab</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Total tanggung jawab Tokoflow atas klaim apa pun dibatasi pada biaya yang kamu bayar dalam 3 bulan sebelum klaim. Kami tidak bertanggung jawab atas kerugian tidak langsung atau konsekuensial.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">9. Pengakhiran</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Kamu dapat membatalkan akunmu kapan saja. Kami dapat mengakhiri atau menangguhkan akun atas pelanggaran Ketentuan ini. Saat pengakhiran, kamu dapat mengekspor datamu selama 30 hari sebelum dihapus.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">10. Hukum yang berlaku</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Ketentuan ini tunduk pada hukum Republik Indonesia. Sengketa diselesaikan di pengadilan yang berwenang di Jakarta.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">11. Kontak</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Ada pertanyaan? Email <a href="mailto:hello@tokoflow.co.id" className="text-[#05A660] underline">hello@tokoflow.co.id</a>.
          </p>
        </div>
      </section>
    </>
  );
}
