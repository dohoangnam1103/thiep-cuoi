import Link from "next/link";

import vi from "@messages/vi.json";

/* Closing conversion panel: one headline, one register intent. */
export function FinalCta() {
  return (
    <section className="my-16 rounded-2xl bg-[var(--s2-ink)] px-6 py-14 text-center md:my-24 md:py-20">
      <h2 className="mx-auto max-w-[20ch] text-2xl font-extrabold tracking-tight text-white md:text-4xl">
        {vi.home.finalTitle}
      </h2>
      <Link
        href="/dang-nhap?mode=register"
        className="mt-8 inline-block rounded-full bg-[var(--s2-accent)] px-8 py-3 text-[15px] font-semibold text-[var(--s2-accent-ink)] transition-transform active:scale-[0.98]"
      >
        {vi.home.finalCta}
      </Link>
    </section>
  );
}
