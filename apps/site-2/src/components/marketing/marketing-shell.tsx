import Link from "next/link";
import type { ReactNode } from "react";

import vi from "@messages/vi.json";
import { MarketingNav } from "./marketing-nav";

/* Marketing shell: public routes only. Owns the top nav and footer so
 * workspace and invitation routes never inherit marketing chrome. */

type FooterLink = { href: string; label: string };

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--s2-muted)]">
        {title}
      </p>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[14px] font-medium text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="s2-marketing">
      <MarketingNav />
      <main>{children}</main>
      <footer className="mt-24 border-t border-[var(--s2-line)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
            <div>
              <p className="s2-display text-[26px] font-semibold tracking-tight text-[var(--s2-ink)]">
                {vi.site.name}
              </p>
              <p className="mt-3 max-w-[42ch] text-[14px] leading-relaxed text-[var(--s2-muted)]">
                {vi.site.footer}
              </p>
            </div>
            <FooterColumn
              title={vi.site.footerExplore}
              links={[
                { href: "/mau-thiep", label: vi.site.navTemplates },
                { href: "/bang-gia", label: vi.site.navPricing },
                { href: "/huong-dan", label: vi.site.navHelp },
              ]}
            />
            <FooterColumn
              title={vi.site.footerLegal}
              links={[
                { href: "/dang-nhap", label: vi.site.navLogin },
                { href: "/chinh-sach-bao-mat", label: vi.site.footerPrivacy },
                { href: "/dieu-khoan-su-dung", label: vi.site.footerTerms },
                { href: "/chinh-sach-hoan-tien", label: vi.site.footerRefund },
              ]}
            />
          </div>
          <div className="mt-12 border-t border-[var(--s2-line)] pt-6 text-[13px] text-[var(--s2-muted)]">
            {vi.site.footerCopyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
