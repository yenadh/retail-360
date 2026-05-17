"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

const shopLinks = [
  { label: "Products", href: "/products" },
  { label: "Cart", href: "/cart" },
  { label: "My Orders", href: "/my-orders" },
  { label: "Checkout", href: "/checkout" },
];

const adminLinks = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/category" },
  { label: "Reports", href: "/admin/reports" },
];

const hiddenFooterRoutes = ["/login", "/register", "/unauthorized"];

export default function Footer() {
  const pathname = usePathname();

  const shouldHideFooter = hiddenFooterRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (shouldHideFooter) {
    return null;
  }

  return (
    <footer className="border-t border-purple-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2E1065] via-[#7C3AED] to-[#EC4899] text-white shadow-lg shadow-purple-900/25">
              <ShoppingBag className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">Retail360</h2>
              <p className="text-xs text-slate-500">Retail Management</p>
            </div>
          </Link>

          <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
            A complete retail platform for product discovery, order management,
            inventory control, deliveries, and staff operations.
          </p>

          <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-[#7C3AED]" />
              Secure verified accounts
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-4 w-4 text-[#7C3AED]" />
              Fast order and delivery tracking
            </div>
          </div>
        </div>

        <FooterLinkGroup title="Shop" links={shopLinks} />
        <FooterLinkGroup title="Operations" links={adminLinks} />

        <div>
          <h3 className="font-bold text-slate-900">Contact</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-500">
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-[#7C3AED]" />
              Colombo, Sri Lanka
            </p>
            <p className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[#7C3AED]" />
              +94 77 000 0000
            </p>
            <p className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#7C3AED]" />
              support@retail360.local
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-purple-100 px-4 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Retail360. Built for smarter retail
        operations.
      </div>
    </footer>
  );
}

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="font-bold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block text-sm text-slate-500 transition hover:text-[#7C3AED]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
