import Image from "next/image";
import Link from "next/link";

import type { Site2ListingItem } from "../../lib/catalog";
import { templatePreviewUrl } from "../../lib/template-preview";
import { Parallax } from "../motion/parallax";
import vi from "@messages/vi.json";

/* Asymmetric split hero: short serif copy left, editorial still right with a
 * real invitation cover floating above it on scroll parallax. The cover is
 * the LCP image with reserved dimensions; entrance motion comes from the
 * .s2-hero-enter leaves in marketing.css. */
export function HomeHero({
  cover,
  totalCount,
}: {
  cover: Site2ListingItem;
  totalCount: number;
}) {
  return (
    <section className="grid items-center gap-10 pt-10 md:pt-16 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:pt-0">
      <div className="s2-hero-enter">
        <p className="inline-block rounded-full border border-[var(--s2-line)] bg-[var(--s2-surface)] px-4 py-1.5 text-[13px] font-semibold text-[var(--s2-muted)]">
          {totalCount} {vi.home.badge}
        </p>
        <h1 className="s2-display mt-5 max-w-[14ch] text-5xl font-semibold leading-[1.06] tracking-tight text-[var(--s2-ink)] md:text-7xl">
          {vi.home.heroTitle}
        </h1>
        <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-[var(--s2-muted)]">
          {vi.home.heroSubtitle}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/mau-thiep"
            className="s2-marketing-cta rounded-full bg-[var(--s2-accent)] px-7 py-3 text-[15px] font-semibold whitespace-nowrap text-[var(--s2-accent-ink)] transition-all duration-300 hover:bg-[color-mix(in_oklab,var(--s2-accent)_88%,#0e1a12)] active:scale-[0.98]"
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
      <div className="s2-hero-enter-late relative h-[480px] sm:h-[560px] lg:h-auto lg:min-h-[600px] lg:self-stretch">
        <Image
          src="/editorial/flatlay-invitation.svg"
          alt={vi.home.heroEditorialAlt}
          width={900}
          height={1200}
          priority
          fetchPriority="high"
          decoding="async"
          sizes="(min-width: 1024px) 40vw, 80vw"
          className="absolute top-0 right-0 h-[86%] w-[78%] rounded-[var(--s2-card-radius)] border border-[var(--s2-line)] object-cover"
        />
        <Parallax
          distance={30}
          className="absolute bottom-0 left-0 w-[52%] max-w-[340px]"
        >
          <span className="s2-shadow-lift block overflow-hidden rounded-[var(--s2-card-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)]">
            <Image
              src={templatePreviewUrl(cover.listing)}
              alt={vi.home.heroCoverAlt.replace("{name}", cover.name)}
              width={640}
              height={960}
              loading="eager"
              decoding="async"
              sizes="(min-width: 1024px) 22vw, 44vw"
              className="aspect-[2/3] w-full object-cover object-top"
            />
            <span className="block px-4 py-3">
              <span className="block truncate text-[14px] font-semibold text-[var(--s2-ink)]">
                {cover.name}
              </span>
              <span className="mt-0.5 block text-[12px] font-semibold tracking-[0.12em] text-[var(--s2-muted)] uppercase">
                {cover.categoryVi}
              </span>
            </span>
          </span>
        </Parallax>
      </div>
    </section>
  );
}
