import Link from "next/link";

import { Glass } from "../../ui/glass";
import { Reveal } from "../../motion/reveal";
import vi from "@messages/vi.json";

/* Finale CTA: large glass block with champagne glow, serif headline, and
 * primary register button. Wax seal SVG is decorative — static, no
 * animation to keep it lightweight. */
export function HomeFinale() {
  return (
    <section className="s2-champagne-glow my-16 md:my-24">
      <Reveal>
        <Glass
          variant="strong"
          className="px-6 py-14 text-center md:py-20"
        >
          {/* Decorative seal */}
          <div
            aria-hidden
            className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full border-2 border-[var(--s2-accent)] bg-[color-mix(in_oklab,var(--s2-accent)_8%,transparent)] text-[var(--s2-accent)]"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>

          <h2 className="s2-display mx-auto max-w-[22ch] text-3xl font-semibold tracking-tight text-[var(--s2-ink)] md:text-5xl">
            {vi.home.finalTitle}
          </h2>
          <Link
            href="/dang-nhap?mode=register"
            className="mt-8 inline-block rounded-full bg-[var(--s2-accent)] px-8 py-3.5 text-[15px] font-semibold text-[var(--s2-accent-ink)] transition-transform duration-300 hover:-translate-y-px active:translate-y-0 active:scale-[0.98]"
          >
            {vi.home.finalCta}
          </Link>
        </Glass>
      </Reveal>
    </section>
  );
}
