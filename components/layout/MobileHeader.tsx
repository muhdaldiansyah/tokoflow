"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, User, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { dashboardNav, adminNav } from "@/config/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Settings,
  ShoppingBag,
  Package,
  Users,
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  ArrowLeft,
  FileText,
  Database,
  Calculator,
  UserPlus,
  Sun,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Settings,
  User,
  ShoppingBag,
  Package,
  Users,
  BarChart3,
  ClipboardList,
  Shield,
  LayoutDashboard,
  ArrowLeft,
  FileText,
  Database,
  Calculator,
  UserPlus,
  Sun,
};

interface MobileHeaderProps {
  userName?: string;
  userEmail?: string;
  variant?: "dashboard" | "admin";
  userRole?: string;
  ordersRemaining?: number;
  isBisnisActive?: boolean;
  totalOrders?: number;
}

// Cognitive cut: hide locked items entirely. Mirrors Sidebar.getVisibleNav.
function getVisibleNav(totalOrders: number, isBisnisActive: boolean) {
  return dashboardNav.filter((item) => {
    if (item.requiresBisnis && !isBisnisActive) return false;
    if (item.href === "/orders" && totalOrders < 10) return false;
    if (item.href === "/customers" && totalOrders < 20) return false;
    if (item.href === "/recap" && totalOrders < 20) return false;
    return true;
  });
}

export function MobileHeader({
  userName,
  userEmail,
  variant = "dashboard",
  userRole,
  ordersRemaining,
  isBisnisActive,
  totalOrders = 0,
}: MobileHeaderProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAdmin = userRole === "admin" || userRole === "moderator";

  // Auto-close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="sticky top-0 z-50 flex-shrink-0 h-12 border-b border-border/60 bg-background/80 backdrop-blur-lg flex items-center px-2 lg:hidden">
        <button
          className="h-10 w-10 flex items-center justify-center shrink-0"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          href={variant === "admin" ? "/admin" : "/today"}
          className="font-semibold text-base text-foreground"
        >
          {variant === "admin" ? "Admin" : siteConfig.name}
        </Link>

        <div className="flex-1" />

        <Link
          href="/settings"
          className="h-10 w-10 flex items-center justify-center shrink-0"
          aria-label="Settings"
        >
          <User className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="p-0 flex flex-col">
          <SheetHeader className="p-4 pb-2 text-left">
            <SheetTitle className="text-base font-bold">
              {variant === "admin" ? "Admin" : siteConfig.name}
            </SheetTitle>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto px-3 pb-3">
            {variant === "admin" ? (
              <div className="space-y-4">
                {adminNav.map((group) => (
                  <div key={group.title || "ungrouped"}>
                    {group.title && (
                      <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider px-3 mb-2">
                        {group.title}
                      </p>
                    )}
                    <ul className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon
                          ? iconMap[item.icon]
                          : undefined;
                        const isActive =
                          item.href === "/admin"
                            ? pathname === "/admin"
                            : pathname === item.href ||
                              pathname.startsWith(item.href + "/");

                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-200",
                                isActive
                                  ? "bg-accent text-foreground"
                                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                              )}
                            >
                              {Icon && (
                                <Icon className="h-[18px] w-[18px] shrink-0" />
                              )}
                              <span>{item.title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-1">
                {getVisibleNav(totalOrders, isBisnisActive ?? false).map((item) => {
                  const Icon = item.icon ? iconMap[item.icon] : undefined;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-200",
                          isActive
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                      >
                        {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
                        <span className="flex-1">{item.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </nav>

          <div className="border-t border-border p-3">
            {(userName || userEmail) && (
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {userName || "User"}
                  </p>
                  {userEmail && (
                    <p className="text-xs text-muted-foreground truncate">
                      {userEmail}
                    </p>
                  )}
                </div>
                {variant === "dashboard" && ordersRemaining !== undefined && (
                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                    ordersRemaining <= 0 ? "bg-red-50 text-red-600" : ordersRemaining <= 5 ? "bg-amber-50 text-amber-600" : "bg-muted text-muted-foreground"
                  }`}>
                    {ordersRemaining === Infinity ? "∞" : ordersRemaining}
                  </span>
                )}
              </div>
            )}
            {isAdmin && variant === "dashboard" && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors mb-1"
              >
                <Shield className="h-4 w-4" />
                Kelola Pengguna
              </Link>
            )}
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
