"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../hooks/useAuthSimple";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  FileText,
  Settings,
  DollarSign,
  Store,
  ClipboardList,
  GitBranch,
  Users,
  Shield,
  Warehouse as WarehouseIcon,
  ScanLine
} from "lucide-react";

const PrivateNav = () => {
  const pathname = usePathname();
  const { user, session, profile, signOut } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const isOwner = profile?.role === 'owner';

  // Poll the alert count every 60s. Cheap call (LEFT JOIN against ~500 rows max)
  // and ETag-supported, so most requests will 304.
  useEffect(() => {
    if (!session?.access_token) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/alerts", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const j = await res.json();
        if (!cancelled && j.success) {
          setUnreadAlerts(j.data?.counts?.unread || 0);
        }
      } catch {
        // ignore — bell just stays at last known value
      }
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [session?.access_token, pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Routes that staff shouldn't see in the nav (they can't write to them
  // anyway — the API gates return 403). Hide them so the UI doesn't dangle.
  // Matched by startsWith so '/admin/users' is gated by '/admin'.
  // NOTE: '/marketplace' is the integration page (owner only). Be careful
  // not to confuse with '/marketplace-fees'.
  const OWNER_ONLY_PREFIXES = [
    '/marketplace-fees',
    '/marketplace',
    '/product-costs',
    '/admin',
    '/warehouses',
  ];
  const isOwnerOnly = (href) =>
    OWNER_ONLY_PREFIXES.some(p => href === p || href.startsWith(p + '/'));

  const rawMenu = [
    {
      type: 'single',
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard
    },
    {
      type: 'category',
      key: 'product-management',
      name: "Product Management",
      icon: Package,
      items: [
        { name: "Products", href: "/products", icon: Package },
        { name: "Product Compositions", href: "/product-compositions", icon: Settings }
      ]
    },
    {
      type: 'category',
      key: 'sales-orders',
      name: "Sales & Orders",
      icon: ShoppingCart,
      items: [
        { name: "Sales Input",   href: "/sales",         icon: ShoppingCart },
        { name: "Scanner",       href: "/scanner",       icon: ScanLine },
        { name: "Sales History", href: "/sales-history", icon: FileText },
        { name: "Customers",     href: "/customers",     icon: Users }
      ]
    },
    {
      type: 'category',
      key: 'inventory-management',
      name: "Inventory Management",
      icon: ClipboardList,
      items: [
        { name: "Inventory", href: "/inventory", icon: ClipboardList },
        { name: "Incoming Goods", href: "/incoming-goods", icon: Boxes },
        { name: "Stock Adjustments", href: "/stock-adjustments", icon: GitBranch }
      ]
    },
    {
      type: 'category',
      key: 'financial-fees',
      name: "Financial & Fees",
      icon: Store,
      items: [
        { name: "Marketplace Fees", href: "/marketplace-fees", icon: Store }
      ]
    },
    {
      type: 'category',
      key: 'admin',
      name: "Admin",
      icon: Shield,
      items: [
        { name: "Warehouses",      href: "/warehouses",    icon: WarehouseIcon },
        { name: "Marketplace",     href: "/marketplace",   icon: Store },
        { name: "User Management", href: "/admin/users",   icon: Users }
      ]
    }
  ];

  // Filter the menu for the current role. For staff: drop owner-only items
  // and any category that becomes empty as a result.
  const menuStructure = isOwner
    ? rawMenu
    : rawMenu
        .map(section => {
          if (section.type === 'single') {
            return isOwnerOnly(section.href) ? null : section;
          }
          if (section.type === 'category') {
            const items = section.items.filter(it => !isOwnerOnly(it.href));
            return items.length > 0 ? { ...section, items } : null;
          }
          return section;
        })
        .filter(Boolean);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <h1 className="text-xl font-bold text-gray-900">TokoFlow</h1>
          <Link
            href="/inventory?filter=alert"
            className="relative p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            title="Stok perlu perhatian"
          >
            <Bell className="h-5 w-5" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 text-[10px] font-semibold leading-none text-white bg-red-500 rounded-full">
                {unreadAlerts > 99 ? '99+' : unreadAlerts}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="hidden lg:flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">TokoFlow</h1>
            <Link
              href="/inventory?filter=alert"
              className="relative p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              title="Stok perlu perhatian"
            >
              <Bell className="h-5 w-5" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 text-[10px] font-semibold leading-none text-white bg-red-500 rounded-full">
                  {unreadAlerts > 99 ? '99+' : unreadAlerts}
                </span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuStructure.map((section) => {
              if (section.type === 'single') {
                const Icon = section.icon;
                const isActive = pathname === section.href;

                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      flex items-center px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-colors duration-150 ease-in-out
                      ${isActive
                        ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-700' : 'text-gray-400'}`} />
                    {section.name}
                  </Link>
                );
              }

              if (section.type === 'category') {
                return (
                  <div key={section.key} className="space-y-2">
                    {/* Category Label - Non-clickable */}
                    <div className="px-3 py-1">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {section.name}
                      </h3>
                    </div>

                    {/* Category Items - No indentation */}
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`
                              flex items-center px-3 py-2.5 rounded-lg text-sm font-medium
                              transition-colors duration-150 ease-in-out
                              ${isActive
                                ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-700'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                              }
                            `}
                          >
                            <ItemIcon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-700' : 'text-gray-400'}`} />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default PrivateNav;
