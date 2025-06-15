// app/(private)/koreksi/help/page.js
"use client";

import { motion } from "framer-motion";
import { 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  Mail, 
  FileText,
  Lightbulb,
  Users,
  Shield,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  const helpSections = [
    {
      title: "Memulai",
      icon: BookOpen,
      description: "Pelajari cara menggunakan KoreksiNilai",
      items: [
        { title: "Membuat tugas baru", link: "#create-task" },
        { title: "Mengupload lembar jawaban", link: "#upload-answers" },
        { title: "Menilai otomatis dengan AI", link: "#auto-grade" },
        { title: "Melihat hasil penilaian", link: "#view-results" }
      ]
    },
    {
      title: "Panduan Penggunaan",
      icon: FileText,
      description: "Dokumentasi lengkap fitur-fitur",
      items: [
        { title: "Format file yang didukung", link: "#file-formats" },
        { title: "Cara kerja AI grading", link: "#ai-grading" },
        { title: "Ekspor hasil penilaian", link: "#export-results" },
        { title: "Pengelolaan data siswa", link: "#manage-students" }
      ]
    },
    {
      title: "Tips & Trik",
      icon: Lightbulb,
      description: "Maksimalkan penggunaan KoreksiNilai",
      items: [
        { title: "Best practice upload file", link: "#best-practices" },
        { title: "Memastikan akurasi penilaian", link: "#accuracy" },
        { title: "Menghemat waktu penilaian", link: "#save-time" },
        { title: "Troubleshooting umum", link: "#troubleshooting" }
      ]
    }
  ];

  const contactMethods = [
    {
      title: "Pusat Bantuan",
      description: "Temukan jawaban dari pertanyaan umum",
      icon: HelpCircle,
      action: "Kunjungi Pusat Bantuan",
      link: "#help-center"
    },
    {
      title: "Hubungi Support",
      description: "Tim kami siap membantu Anda",
      icon: MessageCircle,
      action: "Chat dengan Support",
      link: "#chat-support"
    },
    {
      title: "Email Kami",
      description: "Kirim pertanyaan via email",
      icon: Mail,
      action: "support@koreksinilai.com",
      link: "mailto:support@koreksinilai.com"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Bagaimana kami bisa membantu Anda?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Temukan panduan, dokumentasi, dan dukungan untuk memaksimalkan penggunaan KoreksiNilai
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Cari bantuan..."
              className="w-full px-6 py-4 pr-12 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600">
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
        </motion.div>

        {/* Help Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {helpSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <section.icon className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {section.description}
                  </p>
                </div>
              </div>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.title}>
                    <Link
                      href={item.link}
                      className="flex items-center text-sm text-gray-600 hover:text-gray-900 py-1"
                    >
                      <ChevronRight className="w-4 h-4 mr-1" />
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Contact Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gray-900 rounded-2xl p-8 md:p-12"
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Butuh bantuan lebih lanjut?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method) => (
              <Link
                key={method.title}
                href={method.link}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-colors text-center group"
              >
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors">
                  <method.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {method.title}
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  {method.description}
                </p>
                <span className="text-sm text-white font-medium group-hover:underline">
                  {method.action}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Additional Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Users className="w-8 h-8 text-gray-700 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Komunitas Pengguna
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Bergabung dengan komunitas guru dan pendidik yang menggunakan KoreksiNilai
            </p>
            <Link
              href="#community"
              className="text-gray-900 font-medium hover:underline"
            >
              Gabung Komunitas →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-8 h-8 text-gray-700 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Kebijakan & Keamanan
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Pelajari bagaimana kami melindungi data Anda dan siswa Anda
            </p>
            <Link
              href="#privacy"
              className="text-gray-900 font-medium hover:underline"
            >
              Baca Kebijakan →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}