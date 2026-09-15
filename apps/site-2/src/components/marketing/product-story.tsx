import vi from "@messages/vi.json";

/* Product value as an editorial split: sticky title left, divider rows right.
 * Text only for now. Real app screenshots replace this section after the
 * dashboard and editor redesigns land; no fake UI is rendered meanwhile. */
export function ProductStory() {
  return (
    <section className="grid gap-10 py-16 md:py-24 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <h2 className="max-w-[16ch] text-2xl font-extrabold tracking-tight text-[var(--s2-ink)] md:text-4xl">
          {vi.home.valueTitle}
        </h2>
      </div>
      <ul className="divide-y divide-[var(--s2-line)] border-y border-[var(--s2-line)]">
        {vi.home.value.map((item) => (
          <li key={item.title} className="s2-reveal py-6">
            <h3 className="text-lg font-bold text-[var(--s2-ink)]">
              {item.title}
            </h3>
            <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-[var(--s2-muted)]">
              {item.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
