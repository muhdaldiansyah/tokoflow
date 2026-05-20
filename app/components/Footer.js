// app/components/Footer.js

import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  const year = new Date().getFullYear();

  // Define footer navigation structure
  const footerNav = {
    produk: [
      { label: "Inventory Management", href: "/layanan#inventory" },
      { label: "Multi-channel Sales", href: "/layanan#sales" },
      { label: "Business Intelligence", href: "/layanan#analytics" },
      { label: "Pricing", href: "/investasi" },
    ],
    perusahaan: [
      { label: "Tentang Kami", href: "/tentang" },
      { label: "Panduan", href: "/panduan" },
      { label: "Blog", href: "/blog" },
    ],
    dukungan: [
      { label: "FAQ", href: "/#faq" },
      { label: "Dokumentasi", href: "/panduan" },
      { label: "support@tokoflow.com", href: "mailto:support@tokoflow.com" },
      { label: "WhatsApp Support", href: "https://wa.me/6282311639949", isExternal: true },
    ],
    legal: [
      { label: "Kebijakan Privasi", href: "/kebijakan-privasi" },
      { label: "Syarat & Ketentuan", href: "/syarat-ketentuan" },
    ],
  };

  // Define social media links
  const socialLinks = [
    { label: "Twitter", href: "#", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743A11.65 11.65 0 012 4.778a4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.051a4.105 4.105 0 003.292 4.023 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407A11.616 11.616 0 008.29 20.25" /></svg> },
    { label: "LinkedIn", href: "#", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 0H5C2.239 0 0 2.239 0 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5V5c0-2.761-2.238-5-5-5zM8 19H5V8h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.784 1.764-1.75 1.764zM20 19h-3v-5.604c0-3.368-4-3.113-4 0V19h-3V8h3v1.765c1.396-2.586 7-2.777 7 2.476V19z" /></svg> },
    { label: "Instagram", href: "#", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.05 1.791.218 2.427.466a4.9 4.9 0 011.772 1.153 4.9 4.9 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.066.06 1.406.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.9 4.9 0 01-1.153 1.772 4.9 4.9 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465A4.9 4.9 0 012.525 18.55a4.9 4.9 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427C.86 13.295.848 12.955.848 10.24v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427A4.9 4.9 0 012.526 2.525 4.9 4.9 0 014.298 1.37c.636-.247 1.363-.416 2.427-.465C8.901.858 9.256.848 11.685.848h.63zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" /></svg> },
  ];

  // Footer Link Renderer
  const FooterLink = ({ item }) => {
    const linkClasses = "text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-200";
    if (item.isExternal) {
      return (
        <a href={item.href} target="_blank" rel="noopener noreferrer" className={linkClasses}>
          {item.label}
        </a>
      );
    }
    if (item.href?.startsWith('mailto:')) {
        return (
            <a href={item.href} className={linkClasses}>
                {item.label}
            </a>
        );
    }
    return (
      <Link href={item.href || '#'} className={linkClasses}>
        {item.label}
      </Link>
    );
  };

  return (
    <footer className="bg-white border-t border-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Left Column: Brand, Description, Socials */}
          <div className="space-y-6">
             <Link href="/" className="inline-block" aria-label="TokoFlow Home">
              <Image
                src="/images/logo.png"
                alt="TokoFlow Logo"
                width={140} height={35}
                className="h-auto w-auto"
              />
            </Link>
             <div className="text-sm text-gray-600 leading-relaxed max-w-sm">
               <h4 className="font-semibold text-gray-900 mb-2">Sistem Inventory & Penjualan</h4>
               <p>
                 TokoFlow adalah platform manajemen inventory dan penjualan yang dirancang khusus untuk UMKM Indonesia. 
                 Kelola stok, penjualan multi-channel, dan analisis profit dalam satu sistem terintegrasi.
               </p>
            </div>
             {/* Social Media Links */}
             <div className="flex space-x-3">
               {socialLinks.map((item) => (
                 <a
                   key={item.label}
                   href={item.href}
                   target="_blank"
                   rel="noopener noreferrer"
                   aria-label={`TokoFlow di ${item.label}`}
                   className="text-gray-400 hover:text-gray-500 transition-colors p-1"
                 >
                   <span className="sr-only">{item.label}</span>
                   {item.icon}
                 </a>
               ))}
             </div>
          </div>

          {/* Right Columns: Navigation Links */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            {/* Column 1: Produk & Perusahaan */}
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-gray-900 uppercase tracking-wider mb-4">
                  Produk
                </h3>
                <ul role="list" className="space-y-3">
                  {footerNav.produk.map((item) => (
                    <li key={item.label}>
                      <FooterLink item={item} />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-gray-900 uppercase tracking-wider mb-4">
                  Perusahaan
                </h3>
                <ul role="list" className="space-y-3">
                  {footerNav.perusahaan.map((item) => (
                    <li key={item.label}>
                      <FooterLink item={item} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Column 2: Dukungan & Legal */}
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-gray-900 uppercase tracking-wider mb-4">
                  Dukungan
                </h3>
                <ul role="list" className="space-y-3">
                  {footerNav.dukungan.map((item) => (
                    <li key={item.label}>
                       <FooterLink item={item} />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-gray-900 uppercase tracking-wider mb-4">
                  Legal
                </h3>
                <ul role="list" className="space-y-3">
                  {footerNav.legal.map((item) => (
                    <li key={item.label}>
                       <FooterLink item={item} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
           <p className="text-xs leading-5 text-gray-500">
             © {year} PT TOKOFLOW DIGITAL INDONESIA. Hak cipta dilindungi.
           </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;