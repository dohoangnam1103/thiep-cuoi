import Image from "next/image";

import { Reveal } from "../motion/reveal";
import vi from "@messages/vi.json";

/* Product value as an editorial split: sticky serif title left with a garden
 * still, divider rows right. Text only for the product itself: no fake UI is
 * rendered, the still is brand illustration. */
export function ProductStory() {
  return (
    <section className="grid gap-10 py-16 md:py-24 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <h2 className="s2-display max-w-[16ch] text-3xl font-semibold tracking-tight text-[var(--s2-ink)] md:text-5xl">
          {vi.home.valueTitle}
        </h2>
        <div className="s2-zoom mt-8 hidden overflow-hidden rounded-[var(--s2-card-radius)] border border-[var(--s2-line)] lg:block">
          <Image
            src="/editorial/garden-arch.svg"
            alt={vi.home.heroEditorialAlt}
            width={1200}
            height={800}
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 36vw, 100vw"
            className="aspect-[3/2] w-full object-cover"
          />
        </div>
      </div>
      <ul className="divide-y divide-[var(--s2-line)] border-y border-[var(--s2-line)]">
        {vi.home.value.map((item) => (
          <li key={item.title}>
            <Reveal className="py-6 md:py-7">
              <h3 className="text-lg font-semibold text-[var(--s2-ink)]">
                {item.title}
              </h3>
              <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-[var(--s2-muted)]">
                {item.body}
              </p>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
