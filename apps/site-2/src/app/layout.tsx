import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

import vi from "@messages/vi.json";
import { SiteFooter } from "../components/site-footer";
import { SiteNav } from "../components/site-nav";
import "./globals.css";

const siteFont = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-site",
  display: "swap",
});

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
    <html lang="vi" className={siteFont.variable}>
      <body className="min-h-screen antialiased">
        <SiteNav />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
