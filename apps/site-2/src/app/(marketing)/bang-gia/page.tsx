import Link from "next/link";

import { getVisibleCatalogTemplates } from "../../../lib/catalog";
import { getSite2Session } from "../../../lib/session";
import { getSite2Pricing } from "../../../lib/pricing";
import { PricingFaq } from "../../../components/pricing-faq";
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
      <h1 className="max-w-[18ch] text-3xl font-extrabold tracking-tight text-[var(--s2-ink)] md:text-5xl">
        {vi.pricing.title}
      </h1>
      <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-[var(--s2-muted)]">
        {vi.pricing.subtitle}
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
        <div className="h-fit rounded-2xl bg-[var(--s2-ink)] p-8 text-white md:p-10">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] opacity-70">
            {pricing.planName}
          </p>
          <p className="mt-4 text-5xl font-extrabold tracking-tight">
            {pricing.priceLabel}
          </p>
          <p className="mt-1 text-[14px] opacity-70">{pricing.periodLabel}</p>
          <Link
            href={pricing.ctaHref}
            className="mt-8 block rounded-full bg-[var(--s2-accent)] px-6 py-3 text-center text-[15px] font-semibold text-[var(--s2-accent-ink)] transition-transform active:scale-[0.98]"
          >
            {vi.pricing.planCta}
          </Link>
          <p className="mt-5 text-[13px] leading-relaxed opacity-70">
            {vi.pricing.guarantee}
          </p>
        </div>
        <div>
          <ul className="divide-y divide-[var(--s2-line)] border-y border-[var(--s2-line)]">
            {pricing.features.map((feature, index) => (
              <li key={feature} className="flex items-baseline gap-4 py-4">
                <span className="text-[14px] font-extrabold tabular-nums text-[var(--s2-accent)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[16px] font-semibold text-[var(--s2-ink)]">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
          <h2 className="mb-4 mt-12 text-xl font-extrabold tracking-tight text-[var(--s2-ink)] md:text-2xl">
            {vi.pricing.faqTitle}
          </h2>
          <PricingFaq items={vi.pricing.faq} />
        </div>
      </div>
    </div>
  );
}
