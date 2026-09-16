import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Cormorant_Garamond } from "next/font/google";

import vi from "@messages/vi.json";
import "./globals.css";

const siteFont = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-site",
  display: "swap",
});

const displayFont = Cormorant_Garamond({
  subsets: ["vietnamese", "latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: vi.site.name,
  description: vi.site.tagline,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#121a15" },
  ],
};

export default function Site2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${siteFont.variable} ${displayFont.variable}`}
      data-s2-theme="light"
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
