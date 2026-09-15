import Link from "next/link";

import { getCatalogTemplates } from "../../lib/catalog";
import { templatePreviewUrl } from "../../lib/template-preview";
import vi from "@messages/vi.json";

export default async function Site2Home() {
  const catalog = getCatalogTemplates();
  const featured = catalog.slice(0, 5);
  const heroMain = catalog[0];
  const heroSecond = catalog[10] ?? catalog[1];
  const categories = [...new Set(catalog.map((item) => item.category))];
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <style>{`@media (prefers-reduced-motion: no-preference) {
  .site2-hero-enter { animation: site2-hero-enter 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .site2-hero-enter-late { animation: site2-hero-enter 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both; }
  .site2-marquee-track { animation: site2-marquee 36s linear infinite; }
  .site2-marquee:hover .site2-marquee-track { animation-play-state: paused; }
}
@keyframes site2-hero-enter {
  from { opacity: 0; transform: translateY(22px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes site2-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}`}</style>

      {/* Hero: split copy + collage */}
      <section className="grid items-center gap-10 pt-10 md:pt-16 lg:grid-cols-2 lg:gap-14">
        <div className="site2-hero-enter">
          <p className="inline-block rounded-[var(--radius-pill)] border border-[var(--line)] px-4 py-1.5 text-[13px] font-semibold text-[var(--muted)]">
            {catalog.length} {vi.home.badge}
          </p>
          <h1 className="mt-5 max-w-[15ch] text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl">
            {vi.home.heroTitle}
          </h1>
          <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-[var(--muted)]">
            {vi.home.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/mau-thiep"
              className="rounded-[var(--radius-pill)] bg-[var(--accent)] px-7 py-3 text-[15px] font-semibold text-[var(--accent-ink)] transition-transform active:scale-[0.98]"
            >
              {vi.home.browseCta}
            </Link>
            <Link
              href="/bang-gia"
              className="rounded-[var(--radius-pill)] border border-[var(--line)] px-7 py-3 text-[15px] font-semibold transition-colors hover:border-[var(--ink)]"
            >
              {vi.home.pricingCta}
            </Link>
          </div>
          <div className="mt-10 grid max-w-md grid-cols-3 divide-x divide-[var(--line)]">
            <div className="pr-4">
              <p className="text-2xl font-extrabold tabular-nums">
                {catalog.length}+
              </p>
              <p className="mt-1 text-[13px] text-[var(--muted)]">
                {vi.home.statsTemplates}
              </p>
            </div>
            <div className="px-4">
              <p className="text-2xl font-extrabold tabular-nums">3</p>
              <p className="mt-1 text-[13px] text-[var(--muted)]">
                {vi.home.statsSteps}
              </p>
            </div>
            <div className="pl-4">
              <p className="text-2xl font-extrabold">0đ</p>
              <p className="mt-1 text-[13px] text-[var(--muted)]">
                {vi.home.statsDemo}
              </p>
            </div>
          </div>
        </div>
        <div className="site2-hero-enter-late relative h-[420px] lg:min-h-[560px]">
          <img
            src={templatePreviewUrl(heroMain.listing)}
            alt={heroMain.name}
            width={768}
            height={1024}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute right-0 top-0 h-[82%] w-[78%] rounded-[var(--radius-card)] border border-[var(--line)] object-cover object-top"
          />
          <img
            src={templatePreviewUrl(heroSecond.listing)}
            alt={heroSecond.name}
            width={768}
            height={1024}
            loading="lazy"
            decoding="async"
            className="absolute bottom-0 left-0 h-[46%] w-[52%] rounded-[var(--radius-card)] border-4 border-[var(--paper)] object-cover object-top shadow-xl"
          />
        </div>
      </section>

      {/* Category marquee (the one marquee on this page) */}
      <section aria-label={vi.home.marqueeLabel} className="site2-marquee mt-16 overflow-hidden border-y border-[var(--line)] py-4 md:mt-24">
        <div className="site2-marquee-track flex w-max gap-10 whitespace-nowrap">
          {[...categories, ...categories].map((category, index) => (
            <span
              key={`${category}-${index}`}
              aria-hidden={index >= categories.length}
              className="text-[15px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
            >
              {category}
            </span>
          ))}
        </div>
      </section>

      {/* Featured: asymmetric 1 large + 4 small + CTA cell */}
      <section className="mt-16 md:mt-24">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-4xl">
            {vi.home.featuredTitle}
          </h2>
          <Link
            href="/mau-thiep"
            className="text-[14px] font-semibold text-[var(--accent)]"
          >
            {vi.home.featuredCta} →
          </Link>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {featured.map((template, index) => (
            <li
              key={template.slug}
              data-testid="template-card"
              className={
                index === 0
                  ? "sm:col-span-2 lg:col-span-4 lg:row-span-2"
                  : "lg:col-span-2"
              }
            >
              <Link
                href={`/mau-thiep/${template.slug}/demo`}
                className="group block overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-white"
              >
                <span className="block overflow-hidden">
                  <img
                    src={templatePreviewUrl(template.listing)}
                    alt={template.name}
                    loading={index < 2 ? "eager" : "lazy"}
                    decoding="async"
                    className={`w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] ${index === 0 ? "aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[420px]" : "aspect-[4/3]"}`}
                  />
                </span>
                <span className="block p-5">
                  <span className="block text-[17px] font-bold">
                    {template.name}
                  </span>
                  <span className="mt-1 line-clamp-1 block text-[13px] text-[var(--muted)]">
                    {template.description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
          <li className="sm:col-span-2 lg:col-span-2">
            <Link
              href="/mau-thiep"
              className="flex h-full min-h-[180px] flex-col items-start justify-between rounded-[var(--radius-card)] bg-[var(--ink)] p-6 text-white"
            >
              <span className="text-[15px] font-semibold uppercase tracking-[0.14em] opacity-70">
                {catalog.length}+
              </span>
              <span className="text-xl font-bold">
                {vi.home.featuredCta} →
              </span>
            </Link>
          </li>
        </ul>
      </section>

      {/* Steps: numbered divide list, no cards */}
      <section className="mt-16 md:mt-24">
        <h2 className="max-w-[16ch] text-2xl font-extrabold tracking-tight md:text-4xl">
          {vi.home.stepsTitle}
        </h2>
        <ol className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {vi.home.steps.map((step, index) => (
            <li key={step.title} className="grid gap-2 py-6 md:grid-cols-[80px_1fr_2fr] md:items-baseline">
              <span className="text-[15px] font-extrabold tabular-nums text-[var(--accent)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-bold">{step.title}</h3>
              <p className="max-w-[52ch] text-[15px] leading-relaxed text-[var(--muted)]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      <section className="mt-16 rounded-[var(--radius-card)] border border-[var(--line)] px-6 py-14 text-center md:mt-24">
        <h2 className="mx-auto max-w-[20ch] text-2xl font-extrabold tracking-tight md:text-4xl">
          {vi.home.finalTitle}
        </h2>
        <Link
          href="/dang-nhap?mode=register"
          className="mt-8 inline-block rounded-[var(--radius-pill)] bg-[var(--accent)] px-8 py-3 text-[15px] font-semibold text-[var(--accent-ink)] transition-transform active:scale-[0.98]"
        >
          {vi.home.finalCta}
        </Link>
      </section>
    </div>
  );
}
