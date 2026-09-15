import Image from "next/image";
import Link from "next/link";

import type { ChungDoiTemplate } from "../../lib/catalog";
import {
  listingImageHeight,
  templatePreviewUrl,
} from "../../lib/template-preview";
import vi from "@messages/vi.json";

/* Curated gallery from real catalog data. Mosaic rhythm (one large card,
 * then small cards) so the section never reads as equal feature cards. */
export function CuratedTemplates({
  templates,
}: {
  templates: readonly ChungDoiTemplate[];
}) {
  if (templates.length === 0) return null;
  return (
    <section className="py-16 md:py-24">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--s2-ink)] md:text-4xl">
          {vi.home.featuredTitle}
        </h2>
        <Link
          href="/mau-thiep"
          className="shrink-0 text-[14px] font-semibold text-[var(--s2-accent)]"
        >
          {vi.home.featuredCta}
        </Link>
      </div>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template, index) => (
          <li
            key={template.slug}
            data-testid="template-card"
            className={`s2-reveal ${index === 0 ? "sm:col-span-2 lg:col-span-2" : ""}`}
          >
            <Link
              href={`/mau-thiep/${template.slug}/demo`}
              className="group block h-full overflow-hidden rounded-2xl border border-[var(--s2-line)] bg-[var(--s2-surface)]"
            >
              <span className="block overflow-hidden">
                <Image
                  src={templatePreviewUrl(template.listing)}
                  alt={template.name}
                  width={768}
                  height={listingImageHeight(template.listing)}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw"
                  className={`w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] ${index === 0 ? "aspect-[16/10]" : "aspect-[4/3]"}`}
                />
              </span>
              <span className="block p-5">
                <span className="block text-[17px] font-bold text-[var(--s2-ink)]">
                  {template.name}
                </span>
                <span className="mt-1 line-clamp-1 block text-[13px] text-[var(--s2-muted)]">
                  {template.category}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
