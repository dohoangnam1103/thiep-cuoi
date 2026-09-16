"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { TemplateCardImage } from "./template-card-image";
import type { Site2ListingItem } from "../lib/catalog";
import vi from "@messages/vi.json";

export type ListingCategory = { value: string; label: string };

/* Catalog listing: sticky search + category rail, uniform cards with the
 * master hover-scroll preview. Card copy is Vietnamese only (name, category
 * label); the shared English catalog descriptions are never rendered, they
 * only feed search alongside the Vietnamese generated copy. */
export function TemplateListingClient({
  items,
  categories,
}: {
  items: Site2ListingItem[];
  categories: ListingCategory[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const filtered = items.filter((item) => {
    const needle = query.trim().toLowerCase();
    if (category && item.category !== category) return false;
    if (!needle) return true;
    return (
      item.name.toLowerCase().includes(needle) ||
      item.categoryVi.toLowerCase().includes(needle) ||
      (item.descriptionVi?.toLowerCase().includes(needle) ?? false)
    );
  });
  const hasActiveFilters = query.trim() !== "" || category !== "";

  function clearFilters() {
    setQuery("");
    setCategory("");
  }

  useEffect(() => {
    if (!filtersOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFiltersOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [filtersOpen]);

  const pills = (
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
          key={entry.value}
          active={category === entry.value}
          onClick={() =>
            setCategory((current) => (current === entry.value ? "" : entry.value))
          }
          label={entry.label}
        />
      ))}
    </div>
  );

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 border-b border-[var(--s2-line)] bg-[var(--s2-canvas)]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">{vi.templates.searchLabel}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={vi.templates.searchPlaceholder}
              className="w-full rounded-full border border-[var(--s2-line)] bg-[var(--s2-surface)] px-5 py-2.5 text-base outline-none transition-colors duration-200 placeholder:text-[var(--s2-muted)] focus:border-[var(--s2-accent)] focus:ring-2 focus:ring-[var(--s2-accent-soft)]"
            />
          </label>
          <div className="hidden min-w-0 flex-1 md:block">{pills}</div>
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="catalog-filter-panel"
            onClick={() => setFiltersOpen((value) => !value)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--s2-line)] bg-[var(--s2-surface)] px-5 py-2.5 text-[14px] font-semibold text-[var(--s2-ink)] md:hidden"
          >
            {vi.templates.filterButton}
            {category ? (
              <span
                aria-hidden
                className="inline-block size-2 rounded-full bg-[var(--s2-accent)]"
              />
            ) : null}
          </button>
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-black/40"
            onClick={() => setFiltersOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={vi.templates.filterTitle}
            data-testid="catalog-filter-panel"
            className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-[var(--s2-card-radius)] bg-[var(--s2-surface)] p-5 pb-8"
          >
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-bold text-[var(--s2-ink)]">
                {vi.templates.filterTitle}
              </p>
              <button
                type="button"
                aria-label={vi.templates.filterClose}
                onClick={() => {
                  setFiltersOpen(false);
                  triggerRef.current?.focus({ preventScroll: true });
                }}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--s2-input-radius)] text-[var(--s2-ink)]"
              >
                <span aria-hidden className="text-xl leading-none">
                  ×
                </span>
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{pills}</div>
          </div>
        </div>
      ) : null}

      <p role="status" className="mt-6 text-[14px] text-[var(--s2-muted)]">
        {vi.templates.resultCount.replace("{count}", String(filtered.length))}
      </p>
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-[var(--s2-card-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] p-8 text-center">
          <p className="text-[15px] text-[var(--s2-muted)]">
            {vi.templates.emptyResult}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-full bg-[var(--s2-accent)] px-6 py-2.5 text-[14px] font-semibold text-[var(--s2-accent-ink)] transition-transform active:scale-[0.98]"
            >
              {vi.templates.clearFilters}
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((template) => (
            <li
              key={template.slug}
              data-testid="template-card"
              className="s2-reveal-soft group overflow-hidden rounded-[var(--s2-card-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] transition-all duration-300 hover:border-[color-mix(in_oklab,var(--s2-accent)_35%,var(--s2-line))] hover:shadow-[0_18px_36px_-22px_rgb(31_42_35/0.28)]"
            >
              <TemplateCardImage
                source={template.listing}
                portrait={template.portrait}
                alt={template.name}
                slug={template.slug}
                href={`/mau-thiep/${template.slug}/demo`}
              />
              <div className="p-4 sm:p-5">
                <h2 className="text-[16px] font-semibold leading-snug text-[var(--s2-ink)] sm:text-[17px]">
                  <Link
                    href={`/mau-thiep/${template.slug}/demo`}
                    className="transition-colors group-hover:text-[var(--s2-accent)]"
                  >
                    {template.name}
                  </Link>
                </h2>
                <p className="mt-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--s2-muted)]">
                  {template.categoryVi}
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
      className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] ${
        active
          ? "bg-[var(--s2-accent)] text-[var(--s2-accent-ink)] shadow-[0_10px_20px_-12px_rgb(31_42_35/0.5)]"
          : "border border-[var(--s2-line)] bg-[var(--s2-surface)] text-[var(--s2-muted)] hover:border-[var(--s2-accent)] hover:text-[var(--s2-ink)]"
      }`}
    >
      {label}
    </button>
  );
}
