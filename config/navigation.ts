export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  description?: string;
  requiresBisnis?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// Note: hrefs still use BI route segments (/orders, /products, etc.) — a
// future migration will rename routes to /orders, /products with 301 redirects.
// Labels are already English so menus read correctly today.

export const marketingNav: NavItem[] = [
  { title: "Features", href: "/features" },
  { title: "Pricing", href: "/pricing" },
  { title: "Blog", href: "/blog" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
];

export const dashboardNav: NavItem[] = [
  { title: "Orders", href: "/orders", icon: "ShoppingBag" },
  { title: "Products", href: "/products", icon: "Package" },
  { title: "Customers", href: "/customers", icon: "Users" },
  { title: "Prep", href: "/prep", icon: "ClipboardList" },
  { title: "Recap", href: "/recap", icon: "BarChart3" },
  { title: "Invoices", href: "/invoices", icon: "FileText" },
  { title: "Community", href: "/community", icon: "Users" },
  { title: "Tax", href: "/tax", icon: "Calculator" },
  { title: "Settings", href: "/settings", icon: "Settings" },
];

export const mobileNavItems: NavItem[] = [
  { title: "Orders", href: "/orders", icon: "ShoppingBag" },
  { title: "Products", href: "/products", icon: "Package" },
  { title: "Customers", href: "/customers", icon: "Users" },
  { title: "Recap", href: "/recap", icon: "BarChart3" },
  { title: "Account", href: "/settings", icon: "User" },
];

export const adminNav: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
      { title: "Users", href: "/admin/users", icon: "Users" },
      { title: "Registrations", href: "/admin/registrations", icon: "UserPlus" },
      { title: "Analytics", href: "/admin/analytics", icon: "BarChart3" },
      { title: "Lookup Tables", href: "/admin/lookup", icon: "Database" },
    ],
  },
  {
    title: "",
    items: [
      { title: "Back", href: "/orders", icon: "ArrowLeft" },
    ],
  },
];
