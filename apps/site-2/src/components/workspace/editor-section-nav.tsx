"use client";

import vi from "@messages/vi.json";

const SECTIONS = ["couple", "ceremony", "family", "venue"] as const;

/* Section navigation for the editor form. Desktop gets a sticky anchor list;
 * narrow viewports get one compact select that jumps to the same fieldsets. */
export function EditorSectionNav() {
  const groups = vi.editor.groups as Record<(typeof SECTIONS)[number], string>;
  return (
    <>
      <nav
        aria-label={vi.editor.sectionsNavLabel}
        className="sticky top-24 hidden self-start xl:block"
      >
        <ul className="flex flex-col gap-1 border-l border-[var(--s2-line)] pl-4">
          {SECTIONS.map((section) => (
            <li key={section}>
              <a
                href={`#editor-section-${section}`}
                className="block py-1.5 text-[14px] font-medium text-[var(--s2-muted)] transition-colors hover:text-[var(--s2-accent)]"
              >
                {groups[section]}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sticky top-14 z-20 -mx-4 border-b border-[var(--s2-line)] bg-[var(--s2-canvas)]/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 xl:hidden">
        <label className="block">
          <span className="sr-only">{vi.editor.sectionsNavLabel}</span>
          <select
            aria-label={vi.editor.sectionsNavLabel}
            defaultValue=""
            onChange={(event) => {
              const target = document.getElementById(event.target.value);
              target?.scrollIntoView({ block: "start" });
              event.target.value = "";
            }}
            className="w-full rounded-[var(--s2-input-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] px-4 py-2.5 text-base text-[var(--s2-ink)] outline-none focus:border-[var(--s2-accent)]"
          >
            <option value="" disabled>
              {vi.editor.sectionsNavLabel}
            </option>
            {SECTIONS.map((section) => (
              <option key={section} value={`editor-section-${section}`}>
                {groups[section]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}
