import { SIGNATURE_TEMPLATE_SLUGS } from "@chungdoi/invitation-data";

import Link from "next/link";
import vi from "@messages/vi.json";

export default function Site2TemplateListing() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-16">
      <h1 className="text-center text-3xl font-bold">{vi.templates.title}</h1>
      <p className="mt-2 text-center opacity-70">{vi.templates.subtitle}</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {SIGNATURE_TEMPLATE_SLUGS.map((slug) => {
          const card =
            vi.templates.cards[slug as keyof typeof vi.templates.cards];
          return (
            <li
              key={slug}
              data-testid="template-card"
              className="rounded-2xl border border-[#e5dcc8] bg-white/60 p-6"
            >
              <h2 className="text-xl font-bold">{card.name}</h2>
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
