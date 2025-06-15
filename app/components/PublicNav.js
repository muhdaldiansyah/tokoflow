// app/components/PublicNav.js
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const HEADER_H = "h-14";
const COLORS = {
  primaryBg: "[#1D1E22]",
  primaryBgHover: "gray-800",
  textPrimary: "gray-800",
  textSecondary: "gray-600",
  textMuted: "gray-400",
  linkHoverBg: "gray-50",
  white: "white",
};

export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "Layanan", href: "/layanan" },
    { label: "Investasi", href: "/investasi" },
    { label: "Panduan", href: "/panduan" },
    { label: "Tentang", href: "/tentang" },
  ];

  const baseTextStyle = `text-${COLORS.textSecondary}`;
  const hoverTextStyle = `hover:text-${COLORS.textPrimary}`;
  const hoverBgStyle = `hover:bg-${COLORS.linkHoverBg}`;

  const renderLinkItem = (item, isMobile = false) => {
    const commonClasses = `inline-flex items-center rounded-lg text-sm font-medium transition-all`;
    const desktopClasses = `${commonClasses} px-2.5 py-2 ${baseTextStyle} ${hoverTextStyle} ${hoverBgStyle}`;
    const mobileClasses = `flex w-full px-4 py-2.5 ${baseTextStyle} ${hoverTextStyle} ${hoverBgStyle}`;

    if (isMobile) {
      return (
        <Link
          key={item.label}
          href={item.href}
          onClick={() => setMobileOpen(false)}
          className={mobileClasses}
        >
          {item.label}
        </Link>
      );
    }
    return (
      <Link key={item.label} href={item.href} className={desktopClasses}>
        {item.label}
      </Link>
    );
  };

  const logoPath = "/images/logo.png";

  return (
    <>
      {/* FIXED NAVBAR */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 backdrop-blur-sm transition-all duration-300
                   ${scrolled ? "bg-white/95 shadow-sm border-b border-gray-100" : "bg-white/90"}`}
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between ${HEADER_H}`}>
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2" aria-label="TokoFlow Home">
              <Image
                src={logoPath}
                alt="TokoFlow Logo"
                width={28}
                height={28}
                className="h-7 w-auto rounded-lg"
                priority
              />
              <span className={`text-lg font-medium text-${COLORS.textPrimary}`}>
                TokoFlow
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-0.5">
              {menuItems.map((item) => renderLinkItem(item, false))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 shadow-sm transition-colors"
              >
                Register
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Buka menu navigasi"
                aria-controls="mobile-menu"
                aria-expanded={mobileOpen}
                className={`p-1.5 rounded-lg text-${COLORS.textMuted} ${hoverTextStyle} ${hoverBgStyle} focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all`}
              >
                <Menu className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer Panel */}
      <div
        id="mobile-menu"
        className={`fixed right-0 top-0 bottom-0 z-[70] w-full max-w-xs bg-white border-l border-gray-100 flex flex-col shadow-lg transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu Navigasi Mobile"
      >
        {/* Drawer Header */}
        <div className={`flex items-center justify-between px-4 border-b border-gray-100 flex-shrink-0 ${HEADER_H}`}>
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <Image src={logoPath} alt="TokoFlow Logo" width={24} height={24} className="h-6 w-auto rounded-lg" />
            <span className="text-base font-medium text-gray-800">TokoFlow</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu navigasi"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-200"
          >
            <X className="w-5 h-5" strokeWidth={1.5}/>
          </button>
        </div>

        {/* Drawer Navigation List */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {menuItems.map((item) => renderLinkItem(item, true))}
          </div>
        </nav>

        {/* Drawer Auth Section */}
        <div className="border-t border-gray-100 p-4 mt-auto flex-shrink-0">
          <div className="space-y-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block w-full rounded-lg border border-gray-300 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="block w-full rounded-lg bg-gray-900 py-2.5 text-center text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}