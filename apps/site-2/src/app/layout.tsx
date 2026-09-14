import type { Metadata } from "next";
import Link from "next/link";

import vi from "@messages/vi.json";
import "./globals.css";

export const metadata: Metadata = {
  title: vi.site.name,
  description: vi.site.tagline,
};

export default function Site2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen antialiased">
        <header className="border-b border-[#e5dcc8]">
          <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-bold tracking-wide">
              {vi.site.name}
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/">{vi.site.navHome}</Link>
              <Link href="/mau-thiep">{vi.site.navTemplates}</Link>
              <Link href="/bang-gia">{vi.site.navPricing}</Link>
              <Link href="/dang-nhap">{vi.site.navLogin}</Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mt-16 border-t border-[#e5dcc8]">
          <p className="mx-auto max-w-4xl px-4 py-6 text-center text-sm opacity-70">
            {vi.site.footer}
          </p>
        </footer>
      </body>
    </html>
  );
}
