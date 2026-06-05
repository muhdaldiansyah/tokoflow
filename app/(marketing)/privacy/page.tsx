import type { Metadata } from "next";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan Privasi Tokoflow — bagaimana kami mengumpulkan, menggunakan, dan melindungi datamu sesuai UU Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022).",
  alternates: {
    canonical: "https://tokoflow.co.id/privacy",
  },
};

export default function PrivacyPage() {
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
            <span className="font-medium text-[#1E293B]">Privasi</span>
          </nav>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#1E293B]">Kebijakan Privasi</h1>
          <p className="mt-1 text-sm lg:text-base text-[#475569]">
            Terakhir diperbarui: 6 Juni 2026
          </p>
        </div>
      </div>

      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-sm text-[#475569]">
            Kebijakan Privasi ini menjelaskan bagaimana Tokoflow (&ldquo;kami&rdquo;) mengumpulkan, menggunakan, mengungkapkan, dan melindungi data pribadi sesuai dengan Undang-Undang Perlindungan Data Pribadi Republik Indonesia (UU PDP No. 27 Tahun 2022).
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">1. Informasi yang kami kumpulkan</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Dua kategori — yang penjual berikan tentang diri mereka, dan yang pelanggan berikan ke penjual melalui kami.
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-[#475569] space-y-1">
            <li><strong>Akun penjual</strong> — nama, email, nomor HP, nama usaha, NPWP, NIB, status PKP, kategori usaha, kota, alamat usaha, deskripsi usaha, logo / foto sampul.</li>
            <li><strong>Data order &amp; faktur</strong> — nama pelanggan, nomor HP, item, jumlah, status pembayaran, tanggal pengiriman, alamat pengiriman, nomor resi + nama kurir (saat penjual menambahkannya), catatan.</li>
            <li><strong>Data pembayaran</strong> — diproses oleh Midtrans / gateway pihak ketiga; kami hanya menyimpan pengenal referensi.</li>
            <li><strong>Data penggunaan</strong> — cookie, info perangkat, kunjungan halaman untuk analitik dan pencegahan penyalahgunaan.</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">2. Bagaimana kami menggunakan datamu</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-[#475569] space-y-1">
            <li>Untuk menjalankan layanan: halaman toko, order, faktur, pembayaran, notifikasi transaksional WhatsApp / email.</li>
            <li>Untuk menampilkan penjual yang opt-in di direktori publik di <code>/store</code> (lihat &sect; 4 di bawah).</li>
            <li>Untuk memenuhi kewajiban hukum: submit e-Faktur DJP, pelaporan PPN, catatan pajak.</li>
            <li>Untuk menyampaikan informasi penting layanan dan pembaruan produk opsional.</li>
            <li>Untuk meningkatkan layanan via analitik anonim.</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">3. Dengan siapa kami berbagi data</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Datamu hanya dibagikan dengan: (a) pemroses pembayaran untuk menyelesaikan transaksi, (b) DJP (Coretax/e-Faktur) untuk kepatuhan pajak atas instruksi eksplisitmu, (c) penyedia infrastruktur cloud di bawah perjanjian pemrosesan data, (d) pihak berwenang jika diwajibkan oleh hukum Indonesia. <strong>Kami tidak menjual atau menyewakan datamu.</strong>
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">4. Listing direktori &amp; apa yang publik</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Penjual terdaftar secara opt-in di direktori publik di <code>tokoflow.co.id/store</code>. Saat terdaftar, hal berikut terlihat oleh siapa saja: nama usaha, deskripsi usaha, kota, kategori usaha, logo (jika diunggah), foto produk &amp; harga (jika kamu menandai produk tersedia), dan slug link tokomu. Email pribadi, nomor HP, alamat, NPWP, NIB, dan status PKP-mu <strong>tidak pernah</strong> ditampilkan di direktori. Matikan listing kapan saja di <em>Pengaturan &rarr; Tampil di direktori</em>; link langsungmu <code>tokoflow.co.id/[slug]</code> tetap berfungsi.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">5. Struk order &amp; link konfirmasi pelanggan</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Saat pelanggan membuat order, penjual dapat membagikan link struk (<code>/r/[id]</code>) dan link konfirmasi pengiriman opsional (<code>/a/[token]</code>). URL ini memakai token UUID yang tidak bisa ditebak dan tidak diindeks mesin pencari. Siapa pun yang memegang URL dapat melihat detail order. Penjual memilih dengan siapa membagikannya; perlakukan seperti membagikan link Google Drive.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">6. Retensi data</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Catatan transaksi dan faktur disimpan minimal 10 tahun untuk memenuhi ketentuan perpajakan dan dokumen perusahaan Indonesia. Data profil akun disimpan selama akunmu aktif, plus 90 hari setelah permintaan penghapusan.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">7. Hak-hakmu</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Berdasarkan UU PDP, kamu dapat mengakses, mengoreksi, atau meminta penghapusan data pribadimu; menarik persetujuan untuk pemrosesan opsional; mengekspor seluruh akun + riwayat order kapan saja; dan mengajukan keluhan ke lembaga pelindungan data pribadi. Email hello@tokoflow.co.id untuk menggunakan hak-hak ini.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">8. Transfer lintas batas</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Data diproses pada infrastruktur yang berlokasi di Singapura (Supabase <code>ap-southeast-1</code>) dan jaringan edge global Vercel. Transfer mengikuti ketentuan transfer data lintas batas dalam UU PDP.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-[#1E293B]">9. Kontak</h2>
          <p className="mt-2 text-sm text-[#475569]">
            Pejabat Pelindungan Data — email <a href="mailto:hello@tokoflow.co.id" className="text-[#05A660] underline">hello@tokoflow.co.id</a>.
          </p>
        </div>
      </section>
    </>
  );
}
