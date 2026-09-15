import vi from "@messages/vi.json";

/* Three creation steps as numbered rows, distinct from the value section
 * above through the numeral column and three-column desktop grid. */
export function CreateSteps() {
  return (
    <section className="py-16 md:py-24">
      <h2 className="max-w-[16ch] text-2xl font-extrabold tracking-tight text-[var(--s2-ink)] md:text-4xl">
        {vi.home.stepsTitle}
      </h2>
      <ol className="mt-8 divide-y divide-[var(--s2-line)] border-y border-[var(--s2-line)]">
        {vi.home.steps.map((step, index) => (
          <li
            key={step.title}
            className="grid gap-2 py-6 md:grid-cols-[80px_1fr_2fr] md:items-baseline"
          >
            <span className="text-[15px] font-extrabold tabular-nums text-[var(--s2-accent)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-lg font-bold text-[var(--s2-ink)]">
              {step.title}
            </h3>
            <p className="max-w-[52ch] text-[15px] leading-relaxed text-[var(--s2-muted)]">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
