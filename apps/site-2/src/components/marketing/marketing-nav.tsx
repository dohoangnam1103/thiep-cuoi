"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import vi from "@messages/vi.json";

const links = [
  { href: "/mau-thiep", label: vi.site.navTemplates },
  { href: "/bang-gia", label: vi.site.navPricing },
];

/* Marketing top navigation. Ivory glass bar with a serif wordmark, one-line
 * desktop layout at 64px height. Below md the same links collapse into a
 * card drawer. */
export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 12);
    };
    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <header className="s2-glass-nav sticky top-0 z-30" data-scrolled={scrolled}>
      <nav
        aria-label={vi.site.navHome}
        data-testid="marketing-nav"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"
      >
        <Link
          href="/"
          className="s2-display text-[22px] font-semibold tracking-tight text-[var(--s2-ink)]"
        >
          {vi.site.name}
        </Link>
        <div className="hidden items-center gap-8 text-[14px] font-medium md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="s2-link-underline text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/dang-nhap"
            className="s2-link-underline text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
          >
            {vi.site.navLogin}
          </Link>
          <Link
            href="/mau-thiep"
            className="s2-marketing-cta rounded-full bg-[var(--s2-accent)] px-5 py-2 text-[14px] font-semibold text-[var(--s2-accent-ink)] transition-all duration-300 hover:bg-[color-mix(in_oklab,var(--s2-accent)_88%,#0e1a12)] active:scale-[0.98]"
          >
            {vi.site.navCreate}
          </Link>
        </div>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-[var(--s2-input-radius)] text-[var(--s2-ink)] md:hidden"
          aria-expanded={open}
          aria-label={open ? vi.site.navClose : vi.site.navOpen}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>
      </nav>
      {open ? (
        <div className="px-4 pb-4 md:hidden">
          <div className="s2-glass-strong p-3">
            {[...links, { href: "/dang-nhap", label: vi.site.navLogin }].map(
              (link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-[var(--s2-input-radius)] px-3 py-2.5 text-[15px] font-medium text-[var(--s2-ink)] transition-colors hover:bg-[var(--s2-accent-soft)]"
                >
                  {link.label}
                </Link>
              ),
            )}
            <Link
              href="/mau-thiep"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-full bg-[var(--s2-accent)] px-5 py-2.5 text-center text-[15px] font-semibold text-[var(--s2-accent-ink)] active:scale-[0.98]"
            >
              {vi.site.navCreate}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
