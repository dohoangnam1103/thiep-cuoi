import Link from "next/link";

import { Reveal } from "../motion/reveal";
import vi from "@messages/vi.json";

/* Closing conversion panel: deep sage ground, one serif headline, one
 * register intent. */
export function FinalCta() {
  return (
    <section className="my-16 rounded-[var(--s2-card-radius)] bg-[var(--s2-accent)] px-6 py-14 text-center md:my-24 md:py-20">
      <Reveal>
        <h2 className="s2-display mx-auto max-w-[22ch] text-3xl font-semibold tracking-tight text-[var(--s2-accent-ink)] md:text-5xl">
          {vi.home.finalTitle}
        </h2>
        <Link
          href="/dang-nhap?mode=register"
          className="mt-8 inline-block rounded-full bg-[var(--s2-accent-ink)] px-8 py-3 text-[15px] font-semibold text-[var(--s2-accent)] transition-transform duration-300 hover:-translate-y-px active:translate-y-0 active:scale-[0.98]"
        >
          {vi.home.finalCta}
        </Link>
      </Reveal>
    </section>
  );
}
