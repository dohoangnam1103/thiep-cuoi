import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { getVisibleCatalogTemplates } from "../../../lib/catalog";
import { getSite2Session } from "../../../lib/session";
import { getSite2Pricing } from "../../../lib/pricing";
import { PricingFaq } from "../../../components/pricing-faq";
import { Reveal } from "../../../components/motion/reveal";
import vi from "@messages/vi.json";

export default async function Site2Pricing() {
  const [templates, session] = await Promise.all([
    getVisibleCatalogTemplates(),
    getSite2Session(),
  ]);
  const pricing = getSite2Pricing({
    templateCount: templates.length,
    ctaHref: session ? "/dashboard" : "/dang-nhap?mode=register",
  });
  return (
    <div className="s2-marketing-container pb-20 pt-10 md:pt-14">
      <Reveal>
        <h1 className="s2-display max-w-[18ch] text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--s2-ink)] md:text-6xl">
          {vi.pricing.title}
        </h1>
        <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed text-[var(--s2-muted)]">
          {vi.pricing.subtitle}
        </p>
      </Reveal>

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <Reveal className="h-fit rounded-[var(--s2-card-radius)] bg-[var(--s2-accent)] p-8 text-[var(--s2-accent-ink)] md:p-10">
          <p className="text-[12px] font-bold tracking-[0.14em] uppercase opacity-75">
            {pricing.planName}
          </p>
          <p className="s2-display mt-4 text-6xl font-semibold tracking-tight">
            {pricing.priceLabel}
          </p>
          <p className="mt-2 text-[14px] opacity-75">{pricing.periodLabel}</p>
          <Link
            href={pricing.ctaHref}
            className="mt-8 flex items-center justify-center gap-2 rounded-full bg-[var(--s2-accent-ink)] px-6 py-3 text-center text-[15px] font-semibold text-[var(--s2-accent)] transition-transform duration-300 hover:-translate-y-px active:translate-y-0 active:scale-[0.98]"
          >
            {vi.pricing.planCta}
            <ArrowRight size={17} aria-hidden />
          </Link>
          <p className="mt-5 text-[13px] leading-relaxed opacity-75">
            {vi.pricing.guarantee}
          </p>
        </Reveal>
        <div>
          <ul className="divide-y divide-[var(--s2-line)] border-y border-[var(--s2-line)]">
            {pricing.features.map((feature) => (
              <li key={feature}>
                <Reveal className="flex items-center gap-4 py-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--s2-accent-soft)] text-[var(--s2-accent)]">
                    <Check size={16} aria-hidden />
                  </span>
                  <span className="text-[16px] font-semibold text-[var(--s2-ink)]">
                    {feature}
                  </span>
                </Reveal>
              </li>
            ))}
          </ul>
          <div className="s2-zoom mt-10 hidden overflow-hidden rounded-[var(--s2-card-radius)] border border-[var(--s2-line)] sm:block">
            <Image
              src="/editorial/paper-detail.svg"
              alt={vi.home.heroEditorialAlt}
              width={900}
              height={1100}
              loading="lazy"
              decoding="async"
              sizes="(min-width: 1024px) 44vw, 100vw"
              className="aspect-[16/10] w-full object-cover object-top"
            />
          </div>
          <h2 className="s2-display mt-12 mb-4 text-2xl font-semibold tracking-tight text-[var(--s2-ink)] md:text-3xl">
            {vi.pricing.faqTitle}
          </h2>
          <PricingFaq items={vi.pricing.faq} />
        </div>
      </div>
    </div>
  );
}
