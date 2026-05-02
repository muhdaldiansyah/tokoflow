"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { dashboardNav, adminNav } from "@/config/navigation";
import { useDashboardRealtime } from "@/components/DashboardRealtimeProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PanelLeft,
  LogOut,
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

interface SidebarProps {
  userName?: string;
  userEmail?: string;
  variant?: "dashboard" | "admin";
  userRole?: string;
  ordersRemaining?: number;
  isBisnisActive?: boolean;
  totalOrders?: number;
}

// Pro-gated items hide until the merchant upgrades; everything else is
// visible from day 1. Hiding core surfaces (Orders, Customers, Recap) was
// over-aggressive — they ARE the product, not advanced unlocks.
function getVisibleNav(_totalOrders: number, isBisnisActive: boolean) {
  return dashboardNav.filter((item) => {
    if (item.requiresBisnis && !isBisnisActive) return false;
    return true;
  });
}

export function Sidebar({
  userName,
  userEmail,
  variant = "dashboard",
  userRole,
  ordersRemaining,
  isBisnisActive,
  totalOrders = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { unreadCount } = useDashboardRealtime();

  const isAdmin = userRole === "admin" || userRole === "moderator";

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : userEmail?.charAt(0).toUpperCase() || "U";

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r bg-sidebar h-screen sticky top-0 transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center h-14 border-b px-4",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <Link
            href={variant === "admin" ? "/admin" : "/today"}
            className="font-bold text-xl text-foreground truncate"
          >
            {variant === "admin" ? "Admin" : siteConfig.name}
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <PanelLeft className="h-4 w-4" />
          <span className="sr-only">Toggle Sidebar</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        {variant === "admin" ? (
          <div className="space-y-4">
            {adminNav.map((group) => (
              <div key={group.title || "ungrouped"}>
                {group.title && !collapsed && (
                  <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider px-3 mb-2">
                    {group.title}
                  </p>
                )}
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon ? iconMap[item.icon] : undefined;
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
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                            collapsed && "justify-center px-2"
                          )}
                          title={collapsed ? item.title : undefined}
                        >
                          {Icon && (
                            <Icon className="h-[18px] w-[18px] shrink-0" />
                          )}
                          {!collapsed && <span>{item.title}</span>}
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
              const showUnreadDot = item.href === "/today" && unreadCount > 0;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    <span className="relative shrink-0">
                      {Icon && <Icon className="h-[18px] w-[18px]" />}
                      {showUnreadDot && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-warm-rose ring-2 ring-sidebar" aria-label={`${unreadCount} new`} />
                      )}
                    </span>
                    {!collapsed && <span className="flex-1">{item.title}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* User section */}
      <div className="border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors",
                collapsed && "justify-center"
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">
                    {userName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                </div>
              )}
              {!collapsed && variant === "dashboard" && ordersRemaining !== undefined && (
                <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                  ordersRemaining <= 0 ? "bg-red-50 text-red-600" : ordersRemaining <= 5 ? "bg-amber-50 text-amber-600" : "bg-muted text-muted-foreground"
                }`}>
                  {ordersRemaining === Infinity ? "∞" : ordersRemaining}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {userName || "User"}
                </p>
                {userEmail && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            {isAdmin && variant === "dashboard" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    Kelola Pengguna
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action="/api/auth/logout" method="POST" className="w-full">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
