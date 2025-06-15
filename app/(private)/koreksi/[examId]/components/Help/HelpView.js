// app/dashboard/autograde/[examId]/components/Help/HelpView.js
'use client';

import React from 'react';
import { useResponsive, useResponsiveLayout } from '../../hooks/useResponsive';
import { HelpCircle, BookOpen, FileQuestion, Key, Upload, Calculator, Settings, Video, FileText } from 'lucide-react';

const HelpSection = ({ title, icon: Icon, children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { isMobile } = useResponsive();
  
  if (isMobile) {
    return (
      <details className="border border-gray-200 dark:border-gray-600 rounded-lg mb-4">
        <summary 
          className="w-full px-4 py-3 text-left flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100 cursor-pointer min-h-[44px]"
          style={{ touchAction: 'manipulation' }}
        >
          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          {title}
        </summary>
        <div className="px-4 pb-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {children}
        </div>
      </details>
    );
  }
  
  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100"
      >
        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        {title}
      </button>
      {isOpen && (
        <div className="px-4 pb-3 text-sm text-gray-700 dark:text-gray-300">
          {children}
        </div>
      )}
    </div>
  );

}; 

export default function HelpView({ ctx }) {
  const { isMobile } = useResponsive();
  const { layoutMode, getContainerPadding } = useResponsiveLayout();
  
  return (
    <div 
      className="p-6 overflow-y-auto"
      role="article"
      aria-label="Help center"
    >
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Pusat Bantuan AutoGrade
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Panduan lengkap untuk menggunakan sistem AutoGrade
          </p>
        </div>
        
        {/* Panduan Umum */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Panduan Umum</h3>
          
          <HelpSection title="1. Dashboard Overview" icon={BookOpen}>
            Dashboard menampilkan ringkasan ujian Anda. Anda dapat melihat total siswa, file yang dikumpulkan, nilai rata-rata, dan status pengumpulan. Klik pada kartu statistik untuk memfilter daftar siswa.
          </HelpSection>
          
          <HelpSection title="2. Manajemen Siswa" icon={FileQuestion}>
            <ul className="list-disc list-inside space-y-1">
              <li>Klik "Tambah Siswa" untuk mendaftarkan siswa baru</li>
              <li>Gunakan pencarian untuk mencari siswa tertentu</li>
              <li>Filter daftar dengan tombol: Semua, Belum Upload, Perlu Review, Selesai</li>
              <li>Klik nama siswa untuk melihat detail jawaban mereka</li>
            </ul>
          </HelpSection>
          
          <HelpSection title="3. Upload File Jawaban" icon={Upload}>
            <ul className="list-disc list-inside space-y-1">
              <li>Pilih siswa dari daftar</li>
              <li>Drag & drop file jawaban atau klik untuk browse</li>
              <li>Format yang didukung: PDF, JPG, PNG, DOC, DOCX</li>
              <li>Maksimum ukuran file: 10MB</li>
            </ul>
          </HelpSection>
          
          <HelpSection title="4. Mengelola Kunci Jawaban" icon={Key}>
            <ul className="list-disc list-inside space-y-1">
              <li>Klik "Kunci Jawaban" di header navigasi</li>
              <li>Upload file kunci jawaban dengan format yang sama</li>
              <li>Setiap exam membutuhkan minimal 1 kunci jawaban</li>
              <li>Anda dapat mengupload beberapa file kunci jawaban</li>
            </ul>
          </HelpSection>
          
          <HelpSection title="5. Sistem Penilaian" icon={Calculator}>
            <ul className="list-disc list-inside space-y-1">
              <li>Klik "Mulai Nilai" pada halaman detail siswa</li>
              <li>Sistem akan membandingkan jawaban siswa dengan kunci jawaban</li>
              <li>Hasil penilaian muncul dalam format persentase (0-100%)</li>
              <li>Detail penilaian dapat dilihat di tab "Hasil Penilaian"</li>
            </ul>
          </HelpSection>
          
          <HelpSection title="6. Edit Pengaturan Exam" icon={Settings}>
            Klik "Edit Exam" untuk mengubah judul ujian dan pengaturan lainnya. Perubahan akan segera disimpan.
          </HelpSection>
        </div>
        
        {/* FAQ */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h3>
          
          <HelpSection title="Bagaimana cara upload file?" icon={Upload}>
            Pilih siswa dari daftar, lalu gunakan area drag & drop di halaman detail siswa. File akan otomatis terupload dan dapat langsung dinilai.
          </HelpSection>
          
          <HelpSection title="Format file apa yang didukung?" icon={FileText}>
            Sistem mendukung PDF, DOC, DOCX, JPG, dan PNG. Ukuran maksimum file adalah 10MB.
          </HelpSection>
          
          <HelpSection title="Bagaimana cara mengubah kunci jawaban?" icon={Key}>
            Klik "Kunci Jawaban" di header, lalu hapus file lama dengan ikon tempat sampah dan upload file baru.
          </HelpSection>
          
          <HelpSection title="Mengapa nilai tidak muncul?" icon={Calculator}>
            Pastikan file kunci jawaban sudah diupload dan file jawaban siswa sudah lengkap. Proses penilaian membutuhkan kedua file tersebut.
          </HelpSection>
        </div>
        
        {/* Additional Resources */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resources Tambahan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a 
              href="#" 
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Video className="h-4 w-4" />
              Video Tutorial
            </a>
            <a 
              href="#" 
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <FileText className="h-4 w-4" />
              Dokumentasi PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
