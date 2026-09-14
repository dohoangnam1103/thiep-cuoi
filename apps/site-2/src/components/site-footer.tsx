import Link from "next/link";

import vi from "@messages/vi.json";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--line)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <p className="text-[28px] font-extrabold tracking-tight md:text-[40px]">
          {vi.site.name}
        </p>
        <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed text-[var(--muted)]">
          {vi.site.footer}
        </p>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-medium">
          <Link
            href="/mau-thiep"
            className="text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            {vi.site.navTemplates}
          </Link>
          <Link
            href="/bang-gia"
            className="text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            {vi.site.navPricing}
          </Link>
          <Link
            href="/dang-nhap"
            className="text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            {vi.site.navLogin}
          </Link>
        </div>
      </div>
    </footer>
  );
}
