"use client";

import Link from "next/link";
import { useState } from "react";

import vi from "@messages/vi.json";

const links = [
  { href: "/mau-thiep", label: vi.site.navTemplates },
  { href: "/bang-gia", label: vi.site.navPricing },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur">
      <nav
        aria-label={vi.site.navHome}
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"
      >
        <Link
          href="/"
          className="text-[17px] font-extrabold tracking-tight text-[var(--ink)]"
        >
          {vi.site.name}
        </Link>
        <div className="hidden items-center gap-7 text-[14px] font-medium md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/dang-nhap"
            className="text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            {vi.site.navLogin}
          </Link>
          <Link
            href="/mau-thiep"
            className="rounded-[var(--radius-pill)] bg-[var(--accent)] px-5 py-2 text-[14px] font-semibold text-[var(--accent-ink)] transition-transform active:scale-[0.98]"
          >
            {vi.site.navCreate}
          </Link>
        </div>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-[var(--radius-input)] text-[var(--ink)] md:hidden"
          aria-expanded={open}
          aria-label={open ? vi.site.navClose : vi.site.navOpen}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden className="relative block h-3 w-5">
            <span
              className={`absolute left-0 top-0 h-0.5 w-full bg-current transition-transform ${open ? "translate-y-[5px] rotate-45" : ""}`}
            />
            <span
              className={`absolute bottom-0 left-0 h-0.5 w-full bg-current transition-transform ${open ? "-translate-y-[5px] -rotate-45" : ""}`}
            />
          </span>
        </button>
      </nav>
      {open ? (
        <div className="border-t border-[var(--line)] px-4 py-3 md:hidden">
          {[...links, { href: "/dang-nhap", label: vi.site.navLogin }].map(
            (link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-[var(--radius-input)] px-2 py-2.5 text-[15px] font-medium"
              >
                {link.label}
              </Link>
            ),
          )}
          <Link
            href="/mau-thiep"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-[var(--radius-pill)] bg-[var(--accent)] px-5 py-2.5 text-center text-[15px] font-semibold text-[var(--accent-ink)]"
          >
            {vi.site.navCreate}
          </Link>
        </div>
      ) : null}
    </header>
  );
}
