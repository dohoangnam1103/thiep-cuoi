import Image from "next/image";
import Link from "next/link";

import type { Site2ListingItem } from "../../lib/catalog";
import { templatePreviewUrl } from "../../lib/template-preview";
import { RevealGroup, RevealItem } from "../motion/reveal";
import { TiltCard } from "../motion/tilt-card";
import vi from "@messages/vi.json";

/* Curated gallery from real catalog data with Vietnamese names. Mosaic
 * rhythm (one large card, then small cards) so the section never reads as
 * equal feature cards; covers keep the master hover-scroll preview. */
export function CuratedTemplates({
  templates,
}: {
  templates: readonly Site2ListingItem[];
}) {
  if (templates.length === 0) return null;
  return (
    <section className="py-16 md:py-24">
      <div className="flex items-end justify-between gap-4">
        <h2 className="s2-display max-w-[16ch] text-3xl font-semibold tracking-tight text-[var(--s2-ink)] md:text-5xl">
          {vi.home.featuredTitle}
        </h2>
        <Link
          href="/mau-thiep"
          className="s2-link-underline shrink-0 text-[14px] font-semibold whitespace-nowrap text-[var(--s2-accent)]"
        >
          {vi.home.featuredCta}
        </Link>
      </div>
      <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template, index) => (
          <RevealItem
            key={template.slug}
            className={index === 0 ? "sm:col-span-2 lg:col-span-2" : ""}
          >
            <TiltCard className="h-full">
              <Link
                href={`/mau-thiep/${template.slug}/demo`}
                data-testid="template-card"
                className="group block h-full overflow-hidden rounded-[var(--s2-card-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] transition-all duration-300 hover:border-[color-mix(in_oklab,var(--s2-accent)_35%,var(--s2-line))] hover:shadow-[0_18px_36px_-22px_rgb(31_42_35/0.28)]"
              >
                <span className="block overflow-hidden">
                  <Image
                    src={templatePreviewUrl(template.listing)}
                    alt={template.name}
                    width={768}
                    height={576}
                    loading="lazy"
                    fetchPriority="low"
                    decoding="async"
                    sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw"
                    className={`w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] ${index === 0 ? "aspect-[16/10]" : "aspect-[4/3]"}`}
                  />
                </span>
                <span className="block p-5">
                  <span className="block text-[17px] font-semibold text-[var(--s2-ink)] transition-colors group-hover:text-[var(--s2-accent)]">
                    {template.name}
                  </span>
                  <span className="mt-1 block text-[12px] font-semibold tracking-[0.12em] text-[var(--s2-muted)] uppercase">
                    {template.categoryVi}
                  </span>
                </span>
              </Link>
            </TiltCard>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
