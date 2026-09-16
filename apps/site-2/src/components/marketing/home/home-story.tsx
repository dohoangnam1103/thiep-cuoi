import Image from "next/image";

import { Glass } from "../../ui/glass";
import { Reveal } from "../../motion/reveal";
import vi from "@messages/vi.json";

/* Product story: two-column editorial layout with parallax image layer and
 * glass-framed copy. Communicates the emotional value of a beautiful
 * invitation. */
export function HomeStory() {
  return (
    <section className="py-16 md:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        {/* Image column with parallax */}
        <Reveal className="s2-zoom relative overflow-hidden rounded-[var(--s2-card-radius)]">
          <Image
            src="/editorial/flatlay-invitation.svg"
            alt={vi.home.storyImageAlt ?? ""}
            width={800}
            height={1000}
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 42vw, 80vw"
            className="aspect-[4/5] w-full object-cover"
          />
        </Reveal>

        {/* Copy column */}
        <Reveal>
          <Glass variant="default" className="p-8 md:p-10">
            <h2 className="s2-display text-3xl font-semibold tracking-tight text-[var(--s2-ink)] md:text-4xl">
              {vi.home.storyTitle}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--s2-muted)]">
              {vi.home.storyBody}
            </p>
          </Glass>
        </Reveal>
      </div>
    </section>
  );
}
