"use client";

import { useState } from "react";

import {
  filterArticles,
  helpCategoryLabel,
  presentHelpCategories,
  type HelpArticle,
  type HelpCategory,
} from "../../lib/help";
import vi from "@messages/vi.json";

/* Search-first help index. The article list and the full article bodies share
 * one filter so visitors always see exactly what the result links point to. */
export function HelpSearch({ articles }: { articles: readonly HelpArticle[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HelpCategory | "all">("all");
  const categories = presentHelpCategories(articles);
  const visible = filterArticles(articles, query, category);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="block flex-1">
          <span className="sr-only">{vi.help.searchLabel}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={vi.help.searchPlaceholder}
            className="w-full rounded-full border border-[var(--s2-line)] bg-[var(--s2-surface)] px-5 py-2.5 text-base outline-none placeholder:text-[var(--s2-muted)] focus:border-[var(--s2-accent)]"
          />
        </label>
        <div
          role="group"
          aria-label={vi.help.searchLabel}
          className="flex gap-2 overflow-x-auto pb-1"
        >
          <button
            type="button"
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold ${
              category === "all"
                ? "bg-[var(--s2-accent)] text-[var(--s2-accent-ink)]"
                : "border border-[var(--s2-line)] text-[var(--s2-muted)]"
            }`}
          >
            {vi.help.allCategories}
          </button>
          {categories.map((entry) => (
            <button
              key={entry}
              type="button"
              aria-pressed={category === entry}
              onClick={() => setCategory(entry)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold ${
                category === entry
                  ? "bg-[var(--s2-accent)] text-[var(--s2-accent-ink)]"
                  : "border border-[var(--s2-line)] text-[var(--s2-muted)]"
              }`}
            >
              {helpCategoryLabel(entry)}
            </button>
          ))}
        </div>
      </div>

      <p role="status" className="mt-6 text-[14px] text-[var(--s2-muted)]">
        {visible.length === 0 ? vi.help.emptyResult : null}
      </p>

      {visible.length > 0 ? (
        <nav aria-label={vi.help.searchLabel} className="mt-2">
          <ul className="divide-y divide-[var(--s2-line)] border-y border-[var(--s2-line)]">
            {visible.map((article) => (
              <li key={article.slug}>
                <a
                  href={`#${article.slug}`}
                  className="block py-4 text-[16px] font-bold text-[var(--s2-ink)] transition-colors hover:text-[var(--s2-accent)]"
                >
                  {article.title}
                  <span className="mt-1 block text-[13px] font-normal text-[var(--s2-muted)]">
                    {article.summary}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="mt-12 flex flex-col gap-12">
        {visible.map((article) => (
          <article key={article.slug}>
            <h2
              id={article.slug}
              className="scroll-mt-24 text-xl font-extrabold tracking-tight text-[var(--s2-ink)] md:text-2xl"
            >
              {article.title}
            </h2>
            <ol className="mt-4 flex flex-col gap-3">
              {article.steps.map((step, index) => (
                <li key={index} className="flex items-baseline gap-4">
                  <span className="text-[14px] font-extrabold tabular-nums text-[var(--s2-accent)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] leading-relaxed text-[var(--s2-ink)]">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </div>
  );
}
