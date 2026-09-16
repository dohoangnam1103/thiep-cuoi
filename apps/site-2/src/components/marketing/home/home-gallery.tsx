import Image from "next/image";
import Link from "next/link";

import type { Site2ListingItem } from "../../../lib/catalog";
import { templatePreviewOptimizedUrl } from "../../../lib/template-preview";
import { Glass } from "../../ui/glass";
import { RevealGroup, RevealItem } from "../../motion/reveal";
import vi from "@messages/vi.json";

/* Template gallery wall: optimized thumbnails in a responsive grid. Each
 * card uses Next.js Image Optimization to serve viewport-appropriate sizes
 * instead of the 6000-9000px originals. Stagger reveal on scroll. */
export function HomeGallery({ templates }: { templates: Site2ListingItem[] }) {
  const display = templates.slice(0, 8);

  return (
    <section className="py-16 md:py-24">
      <div className="mb-10 flex items-end justify-between gap-4">
        <h2 className="s2-display max-w-[20ch] text-3xl font-semibold tracking-tight text-[var(--s2-ink)] md:text-5xl">
          {vi.home.galleryTitle}
        </h2>
        <Link
          href="/mau-thiep"
          className="hidden text-[15px] font-semibold text-[var(--s2-accent)] underline decoration-[var(--s2-line)] underline-offset-4 transition-colors hover:decoration-[var(--s2-accent)] md:inline-block"
        >
          {vi.home.galleryViewAll.replace("{count}", String(templates.length))}
        </Link>
      </div>

      <RevealGroup className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {display.map((item) => (
          <RevealItem key={item.slug}>
            <Link
              href={`/mau-thiep/${item.slug}/demo`}
              className="group block"
            >
              <Glass variant="default" sheen className="overflow-hidden">
                <Image
                  src={templatePreviewOptimizedUrl(item.listing, 400)}
                  alt={item.name}
                  width={400}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 1024px) 18vw, (min-width: 768px) 28vw, 45vw"
                  className="aspect-[2/3] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span className="block px-3 py-2.5">
                  <span className="block truncate text-[13px] font-semibold text-[var(--s2-ink)]">
                    {item.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-medium tracking-wide text-[var(--s2-muted)] uppercase">
                    {item.categoryVi}
                  </span>
                </span>
              </Glass>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>

      {/* Mobile-only view-all link */}
      <div className="mt-8 text-center md:hidden">
        <Link
          href="/mau-thiep"
          className="inline-block rounded-full border border-[var(--s2-line)] px-6 py-2.5 text-[14px] font-semibold text-[var(--s2-ink)] transition-colors hover:border-[var(--s2-accent)]"
        >
          {vi.home.galleryViewAll.replace("{count}", String(templates.length))}
        </Link>
      </div>
    </section>
  );
}
