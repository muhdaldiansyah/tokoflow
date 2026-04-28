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

// Routes and labels are English. Legacy BI paths (/pesanan, /produk, …) are
// 301-redirected by middleware.ts so old WhatsApp / bookmark links survive.

export const marketingNav: NavItem[] = [
  { title: "Features", href: "/features" },
  { title: "Pricing", href: "/pricing" },
  { title: "Blog", href: "/blog" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
];

// Cognitive-cut nav. Hide locked items entirely (don't dim).
// Gates raised aggressively: secondary surfaces only appear once the merchant
// has enough volume to actually want them. /today is the primary daily surface.
export const dashboardNav: NavItem[] = [
  { title: "Today", href: "/today", icon: "Sun" },
  { title: "Orders", href: "/orders", icon: "ShoppingBag" },
  { title: "Products", href: "/products", icon: "Package" },
  { title: "Customers", href: "/customers", icon: "Users" },
  { title: "Recap", href: "/recap", icon: "BarChart3" },
  { title: "Invoices", href: "/invoices", icon: "FileText", requiresBisnis: true },
  { title: "Tax", href: "/tax", icon: "Calculator", requiresBisnis: true },
  { title: "Settings", href: "/settings", icon: "Settings" },
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
      { title: "Back", href: "/today", icon: "ArrowLeft" },
    ],
  },
];
