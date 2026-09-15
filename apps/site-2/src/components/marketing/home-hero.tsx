import Image from "next/image";
import Link from "next/link";

import type { ChungDoiTemplate } from "../../lib/catalog";
import {
  listingImageHeight,
  templatePreviewUrl,
} from "../../lib/template-preview";
import vi from "@messages/vi.json";

/* Asymmetric split hero: short copy left, layered real previews right. The
 * first preview is the LCP image with reserved dimensions. Entrance motion
 * comes from .s2-hero-enter leaves in marketing.css. */
export function HomeHero({
  templates,
  totalCount,
}: {
  templates: readonly ChungDoiTemplate[];
  totalCount: number;
}) {
  const first = templates[0];
  if (!first) return null;
  const second = templates[1] ?? first;
  return (
    <section className="grid items-center gap-10 pt-10 md:pt-16 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:pt-0">
      <div className="s2-hero-enter">
        <p className="inline-block rounded-full border border-[var(--s2-line)] bg-[var(--s2-surface)] px-4 py-1.5 text-[13px] font-semibold text-[var(--s2-muted)]">
          {totalCount} {vi.home.badge}
        </p>
        <h1 className="mt-5 max-w-[14ch] text-4xl font-extrabold leading-[1.08] tracking-tight text-[var(--s2-ink)] md:text-6xl">
          {vi.home.heroTitle}
        </h1>
        <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-[var(--s2-muted)]">
          {vi.home.heroSubtitle}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/mau-thiep"
            className="s2-marketing-cta rounded-full bg-[var(--s2-accent)] px-7 py-3 text-[15px] font-semibold text-[var(--s2-accent-ink)] transition-transform active:scale-[0.98]"
          >
            {vi.home.browseCta}
          </Link>
          <Link
            href="/dang-nhap?mode=register"
            className="s2-marketing-cta rounded-full border border-[var(--s2-line)] bg-[var(--s2-surface)] px-7 py-3 text-[15px] font-semibold text-[var(--s2-ink)] transition-colors hover:border-[var(--s2-accent)]"
          >
            {vi.home.heroSecondaryCta}
          </Link>
        </div>
      </div>
      <div className="s2-hero-enter-late relative h-[440px] sm:h-[520px] lg:h-auto lg:min-h-[560px] lg:self-stretch">
        <Image
          src={templatePreviewUrl(first.listing)}
          alt={first.name}
          width={768}
          height={listingImageHeight(first.listing)}
          priority
          fetchPriority="high"
          decoding="async"
          sizes="(min-width: 1024px) 38vw, 78vw"
          className="absolute right-0 top-0 h-[82%] w-[76%] rounded-2xl border border-[var(--s2-line)] object-cover object-top"
        />
        <Image
          src={templatePreviewUrl(second.listing)}
          alt={second.name}
          width={768}
          height={listingImageHeight(second.listing)}
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1024px) 26vw, 52vw"
          className="absolute bottom-0 left-0 h-[44%] w-[50%] rounded-2xl border border-[var(--s2-line)] object-cover object-top"
        />
      </div>
    </section>
  );
}
