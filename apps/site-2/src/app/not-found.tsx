import Link from "next/link";

import vi from "@messages/vi.json";

export default function Site2NotFound() {
  return (
    <div className="s2-glass mx-auto max-w-xl px-6 py-24 text-center sm:py-32">
      <p className="text-[15px] font-extrabold tabular-nums text-[var(--s2-accent)]">
        404
      </p>
      <h1 className="s2-display mt-3 text-4xl font-semibold tracking-tight text-[var(--s2-ink)] md:text-5xl">
        {vi.demo.notFoundTitle}
      </h1>
      <p className="mx-auto mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[var(--s2-muted)]">
        {vi.demo.notFoundBody}
      </p>
      <Link
        href="/mau-thiep"
        className="mt-8 inline-block rounded-full bg-[var(--s2-accent)] px-7 py-3 text-[15px] font-semibold text-[var(--s2-accent-ink)] transition-all duration-300 hover:bg-[color-mix(in_oklab,var(--s2-accent)_88%,#0e1a12)] active:scale-[0.98]"
      >
        {vi.demo.backToListing}
      </Link>
    </div>
  );
}
