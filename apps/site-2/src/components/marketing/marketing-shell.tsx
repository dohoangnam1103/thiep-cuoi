import Link from "next/link";
import type { ReactNode } from "react";

import vi from "@messages/vi.json";
import { MarketingNav } from "./marketing-nav";

/* Marketing shell: public routes only. Owns the top nav and footer so
 * workspace and invitation routes never inherit marketing chrome. */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="s2-marketing">
      <MarketingNav />
      <main>{children}</main>
      <footer className="mt-24 border-t border-[var(--s2-line)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-[28px] font-extrabold tracking-tight md:text-[40px]">
            {vi.site.name}
          </p>
          <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed text-[var(--s2-muted)]">
            {vi.site.footer}
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-medium">
            <Link
              href="/mau-thiep"
              className="text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
            >
              {vi.site.navTemplates}
            </Link>
            <Link
              href="/bang-gia"
              className="text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
            >
              {vi.site.navPricing}
            </Link>
            <Link
              href="/dang-nhap"
              className="text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
            >
              {vi.site.navLogin}
            </Link>
            <Link
              href="/huong-dan"
              className="text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
            >
              {vi.site.navHelp}
            </Link>
            <Link
              href="/chinh-sach-bao-mat"
              className="text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
            >
              {vi.site.footerPrivacy}
            </Link>
            <Link
              href="/dieu-khoan-su-dung"
              className="text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
            >
              {vi.site.footerTerms}
            </Link>
            <Link
              href="/chinh-sach-hoan-tien"
              className="text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-ink)]"
            >
              {vi.site.footerRefund}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
