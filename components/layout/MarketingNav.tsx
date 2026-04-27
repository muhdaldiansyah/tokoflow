"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { marketingNav } from "@/config/navigation";
import { cn } from "@/lib/utils";

const HEADER_H = "h-14";

export function MarketingNav() {
  const pathname = usePathname();
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
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const renderLinkItem = (
    item: { title: string; href: string },
    isMobile = false
  ) => {
    const isActive = pathname === item.href;
    const baseClasses = "text-sm font-medium transition-all";
    const desktopClasses = cn(
      baseClasses,
      "inline-flex items-center rounded-lg px-2.5 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50",
      isActive && "text-foreground"
    );
    const mobileClasses = cn(
      baseClasses,
      "flex w-full px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg",
      isActive && "text-foreground bg-muted/50"
    );

    if (isMobile) {
      return (
        <Link
          key={item.title}
          href={item.href}
          onClick={() => setMobileOpen(false)}
          className={mobileClasses}
        >
          {item.title}
        </Link>
      );
    }
    return (
      <Link key={item.title} href={item.href} className={desktopClasses}>
        {item.title}
      </Link>
    );
  };

  return (
    <>
      {/* FIXED NAVBAR */}
      <nav
        className={cn(
          "fixed inset-x-0 top-0 z-50 backdrop-blur-sm transition-all duration-300",
          scrolled
            ? "bg-white/95 shadow-sm border-b border-border"
            : "bg-white/90"
        )}
        aria-label="Main navigation"
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className={cn("flex items-center justify-between", HEADER_H)}>
            {/* Logo */}
            <Link
              href="/"
              className="flex-shrink-0 flex items-center gap-2"
              aria-label={`${siteConfig.name} Home`}
            >
              <Image
                src="/images/logo.png"
                alt={`${siteConfig.name} Logo`}
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-lg font-medium text-foreground">
                {siteConfig.name}
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-0.5">
              {marketingNav.map((item) => renderLinkItem(item, false))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link
                href="/login"
                className="inline-flex items-center rounded-lg text-sm font-medium px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-[#05A660] hover:bg-[#05A660]/90 shadow-sm transition-colors"
              >
                Start free
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                aria-controls="mobile-menu"
                aria-expanded={mobileOpen}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-muted-foreground hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-border transition-all"
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
        className={cn(
          "fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm transition-opacity duration-300",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer Panel */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed right-0 top-0 bottom-0 z-[70] w-full max-w-xs bg-white border-l border-border flex flex-col shadow-lg transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu Navigasi Mobile"
      >
        {/* Drawer Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 border-b border-border flex-shrink-0",
            HEADER_H
          )}
        >
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <Image
              src="/images/logo.png"
              alt={`${siteConfig.name} Logo`}
              width={28}
              height={28}
              className="w-7 h-7"
            />
            <span className="text-base font-medium text-foreground">
              {siteConfig.name}
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="p-1 rounded-lg text-muted-foreground hover:text-muted-foreground hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-border"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Drawer Navigation List */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {marketingNav.map((item) => renderLinkItem(item, true))}
          </div>
        </nav>

        {/* Drawer Auth Section */}
        <div className="border-t border-border p-4 mt-auto flex-shrink-0">
          <div className="space-y-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block w-full rounded-lg bg-muted py-2.5 text-center text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="block w-full rounded-lg bg-[#05A660] py-2.5 text-center text-sm font-medium text-white shadow-sm hover:bg-[#05A660]/90 transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
