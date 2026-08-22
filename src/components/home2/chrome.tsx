"use client";

import { Menu, X } from "lucide-react";
import NextLink from "next/link";
import { useEffect, useState } from "react";

import { LogoMark } from "@/components/logo-mark";

import { home2Copy } from "./copy";
import { Shell } from "./primitives";

const copy = home2Copy;

/**
 * Header/footer riêng cho trang chủ v2.
 *
 * Vì sao không dùng `SiteHeader`/`SiteFooter` sẵn có: cả hai được dựng cho bảng
 * màu hiện tại (nền trắng hồng, nút pill đỏ có bóng màu, chữ font-black). Đặt
 * chúng lên nền giấy kem sẽ thành hai ngôn ngữ thị giác đánh nhau ngay ở màn
 * hình đầu tiên — đúng chỗ quan trọng nhất. Đường link và hành vi giữ nguyên,
 * chỉ đổi lớp trình bày.
 */

const NAV: Array<{ label: string; href: string }> = [
  { label: copy.header.templates, href: "/mau-thiep" },
  { label: copy.header.howItWorks, href: "#cach-hoat-dong" },
  { label: copy.header.guests, href: "#khach-moi" },
  { label: copy.header.pricing, href: "/bang-gia" },
];

export function Home2Header({ createHref }: { createHref: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      <header className="hp-paper sticky top-0 z-50 border-b border-[color:var(--hp-rule)] bg-[color:color-mix(in_oklab,var(--hp-paper)_88%,transparent)] backdrop-blur-md">
        <Shell className="flex h-[4.25rem] items-center justify-between gap-6">
          <NextLink
            href="/"
            aria-label="Thiệp Mừng Online"
            className="shrink-0 transition-opacity hover:opacity-70"
          >
            <LogoMark eager className="h-8 w-auto sm:h-9" />
          </NextLink>

          <nav className="hidden items-center gap-9 lg:flex">
            {NAV.map((item) => (
              <NextLink
                key={item.href}
                href={item.href}
                className="hp-label transition-colors hover:text-[color:var(--hp-fg)]"
              >
                {item.label}
              </NextLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a href={createHref} className="hp-btn hp-btn-solid hidden !px-5 !py-2.5 sm:inline-flex">
              {copy.header.createNow}
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={copy.header.menu}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className="flex size-10 items-center justify-center lg:hidden"
            >
              <Menu className="size-5" strokeWidth={1.5} />
            </button>
          </div>
        </Shell>
      </header>

      <div
        className={`fixed inset-0 z-[60] lg:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          aria-label={copy.header.closeMenu}
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-[oklch(0.183_0.058_21_/_0.55)] transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label={copy.header.menu}
          className={`hp-paper absolute inset-y-0 right-0 flex w-[19rem] max-w-[84%] flex-col transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[color:var(--hp-rule)] px-6 py-5">
            <LogoMark className="h-8 w-auto" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label={copy.header.closeMenu}
              className="flex size-9 items-center justify-center"
            >
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </div>
          <nav className="hp-rule-y flex flex-col px-6">
            {NAV.map((item) => (
              <NextLink
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="hp-display py-5 text-xl"
              >
                {item.label}
              </NextLink>
            ))}
          </nav>
          <div className="mt-auto p-6">
            <a href={createHref} className="hp-btn hp-btn-solid w-full">
              {copy.header.createNow}
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}

const FOOTER_COLUMNS: Array<{ heading: string; links: Array<{ label: string; href: string }> }> = [
  {
    heading: copy.footer.productHeading,
    links: [
      { label: copy.footer.templates, href: "/mau-thiep" },
      { label: copy.footer.pricing, href: "/bang-gia" },
      { label: copy.footer.howItWorks, href: "/tao-thiep-cuoi-online" },
    ],
  },
  {
    heading: copy.footer.toolsHeading,
    links: [
      { label: copy.footer.tools, href: "/cong-cu" },
      { label: copy.footer.blog, href: "/blog" },
    ],
  },
  {
    heading: copy.footer.resourcesHeading,
    links: [
      { label: copy.footer.help, href: "/help" },
      { label: copy.footer.privacy, href: "/chinh-sach-bao-mat" },
      { label: copy.footer.terms, href: "/dieu-khoan-su-dung" },
      { label: copy.footer.refund, href: "/chinh-sach-hoan-tien" },
    ],
  },
];

export function Home2Footer() {
  return (
    <footer className="hp-wine-deep hp-grain pb-14 pt-16">
      <Shell>
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <LogoMark className="h-9 w-auto brightness-0 invert" />
            <p className="hp-body mt-5 max-w-xs">{copy.footer.tagline}</p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h2 className="hp-label">{column.heading}</h2>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <NextLink href={link.href} className="hp-body-sm hover:text-[color:var(--hp-fg)]">
                      {link.label}
                    </NextLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-[color:var(--hp-rule)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="hp-body-sm">{copy.footer.copyright}</p>
          <p className="hp-body-sm opacity-70">{copy.footer.draftNotice}</p>
        </div>
      </Shell>
    </footer>
  );
}
