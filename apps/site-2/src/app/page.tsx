import { SIGNATURE_TEMPLATE_SLUGS } from "@chungdoi/invitation-data";

import Link from "next/link";
import vi from "@messages/vi.json";

export default function Site2Home() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center px-4 pb-16 pt-16 text-center">
      <p className="text-xs uppercase tracking-[0.3em] opacity-70">
        {vi.home.heroEyebrow}
      </p>
      <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
        {vi.home.heroTitle}
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed opacity-80">
        {vi.home.heroSubtitle}
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/mau-thiep"
          className="rounded-full bg-[#9a6a42] px-6 py-2.5 text-sm font-semibold text-white"
        >
          {vi.home.browseCta}
        </Link>
        <Link href="/bang-gia"
          className="rounded-full border border-[#9a6a42] px-6 py-2.5 text-sm font-semibold"
        >
          {vi.home.pricingCta}
        </Link>
      </div>
      <h2 className="mt-16 text-2xl font-bold">{vi.home.collectionTitle}</h2>
      <p className="mt-2 text-sm opacity-70">{vi.home.collectionSubtitle}</p>
      <ul className="mt-6 grid w-full gap-4 md:grid-cols-2">
        {SIGNATURE_TEMPLATE_SLUGS.map((slug) => {
          const card =
            vi.templates.cards[slug as keyof typeof vi.templates.cards];
          return (
            <li
              key={slug}
              data-testid="template-card"
              className="rounded-2xl border border-[#e5dcc8] bg-white/60 p-6 text-left"
            >
              <h3 className="text-xl font-bold">{card.name}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-80">
                {card.description}
              </p>
              <Link
                href={`/mau-thiep/${slug}/demo`}
                className="mt-4 inline-block text-sm font-semibold underline"
              >
                {vi.templates.demoCta}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
