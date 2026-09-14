"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { TemplateCardImage } from "./template-card-image";
import vi from "@messages/vi.json";

export type ListingItem = {
  slug: string;
  name: string;
  description: string;
  category: string;
  listing: string;
  portrait: string;
};

export function TemplateListingClient({
  items,
  categories,
}: {
  items: ListingItem[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category && item.category !== category) return false;
      if (!needle) return true;
      return (
        item.name.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle)
      );
    });
  }, [items, query, category]);

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 border-b border-[var(--line)] bg-[var(--paper)]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">{vi.templates.searchLabel}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={vi.templates.searchPlaceholder}
              className="w-full rounded-[var(--radius-pill)] border border-[var(--line)] bg-white px-5 py-2.5 text-[14px] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            />
          </label>
          <div
            role="group"
            aria-label={vi.templates.categoryLabel}
            className="flex gap-2 overflow-x-auto pb-1"
          >
            <FilterPill
              active={category === ""}
              onClick={() => setCategory("")}
              label={vi.templates.allCategories}
            />
            {categories.map((entry) => (
              <FilterPill
                key={entry}
                active={category === entry}
                onClick={() =>
                  setCategory((current) => (current === entry ? "" : entry))
                }
                label={entry}
              />
            ))}
          </div>
        </div>
      </div>

      <p role="status" className="mt-6 text-[14px] text-[var(--muted)]">
        {vi.templates.resultCount.replace("{count}", String(filtered.length))}
      </p>
      {filtered.length === 0 ? (
        <p className="mt-8 rounded-[var(--radius-card)] border border-[var(--line)] p-8 text-center text-[15px] text-[var(--muted)]">
          {vi.templates.emptyResult}
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((template, index) => (
            <li
              key={template.slug}
              data-testid="template-card"
              className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-white"
            >
              <TemplateCardImage
                source={template.listing}
                portrait={template.portrait}
                alt={template.name}
                slug={template.slug}
                href={`/mau-thiep/${template.slug}/demo`}
                eager={index < 5}
              />
              <div className="p-4 sm:p-5">
                <h2 className="text-[16px] font-bold leading-snug sm:text-[17px]">
                  <Link
                    href={`/mau-thiep/${template.slug}/demo`}
                    className="transition-colors hover:text-[var(--accent)]"
                  >
                    {template.name}
                  </Link>
                </h2>
                <p className="mt-1 text-[13px] text-[var(--muted)]">
                  {template.category}
                </p>
                <p className="mt-2 line-clamp-2 hidden text-[13px] leading-relaxed text-[var(--muted)] sm:block">
                  {template.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-[var(--radius-pill)] px-4 py-2 text-[13px] font-semibold transition-transform active:scale-[0.98] ${
        active
          ? "bg-[var(--ink)] text-white"
          : "border border-[var(--line)] text-[var(--muted)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
      }`}
    >
      {label}
    </button>
  );
}
