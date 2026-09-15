import vi from "@messages/vi.json";

export type LegalSection = {
  heading: string;
  paragraphs: readonly string[];
};

/* Readable legal layout: narrow measure, sticky contents on desktop, only
 * site-2 facts inside. No claim renders without catalog copy behind it. */
export function LegalLayout({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: readonly LegalSection[];
}) {
  return (
    <div className="s2-marketing-container pb-20 pt-10 md:pt-14">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-14">
        <nav
          aria-label={title}
          className="hidden lg:block lg:self-start lg:sticky lg:top-24"
        >
          <ul className="flex flex-col gap-2 border-l border-[var(--s2-line)] pl-4">
            {sections.map((section, index) => (
              <li key={section.heading}>
                <a
                  href={`#muc-${index + 1}`}
                  className="block py-1 text-[14px] font-medium text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-accent)]"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <article className="max-w-[68ch]">
          <h1 className="max-w-[18ch] text-3xl font-extrabold tracking-tight text-[var(--s2-ink)] md:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-[13px] font-medium text-[var(--s2-muted)]">
            {vi.legal.updated}
          </p>
          <p className="mt-5 text-[16px] leading-relaxed text-[var(--s2-ink)]">
            {intro}
          </p>
          {sections.map((section, index) => (
            <section key={section.heading} className="mt-10">
              <h2
                id={`muc-${index + 1}`}
                className="scroll-mt-24 text-xl font-extrabold tracking-tight text-[var(--s2-ink)]"
              >
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p
                  key={`muc-${index + 1}-p-${paragraphIndex + 1}`}
                  className="mt-3 text-[15px] leading-relaxed text-[var(--s2-ink)]"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
