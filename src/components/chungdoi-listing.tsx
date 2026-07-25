"use client";

import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";
import { WeddingFaqSection } from "@/components/chungdoi-faq";
import { TemplatePreviewModal, demoSlug } from "@/components/template-preview-modal";
import { TemplateSuggestionCta } from "@/components/template-suggestion-cta";
import { Link } from "@/i18n/navigation";
import {
  completedTemplates,
  templateCategories,
  templateColors,
  type ChungDoiTemplate,
} from "@/data/chungdoi";

export function ChungDoiListing() {
  const t = useTranslations("listing");
  const locale = useLocale();
  const [category, setCategory] = useState("All");
  const [color, setColor] = useState("All");
  const [selected, setSelected] = useState<ChungDoiTemplate | null>(null);

  const filtered = useMemo(
    () =>
      completedTemplates.filter(
        (template) =>
          (category === "All" || template.category === category) &&
          (color === "All" || template.color === color),
      ),
    [category, color],
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div
        aria-hidden={selected ? true : undefined}
        className={`transition-[filter,transform] duration-200 ease-out ${selected ? "scale-[0.998] blur-[6px]" : "blur-none"}`}
      >
        <SiteHeader hideCreateButton />
        <section className="border-b border-border bg-background py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">{t("eyebrow")}</p>
            <h1 className="mt-4 max-w-3xl font-heading text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-normal leading-8 text-muted-foreground">{t("subtitle")}</p>
            <p className="mt-2 max-w-2xl text-lg font-normal leading-8 text-muted-foreground">{t("editingHint")}</p>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="sr-only">{t("title")}</h2>
            <div className="inline-block rounded-full border border-border bg-card px-5 py-2 text-sm font-bold text-foreground">
              {filtered.length} / {completedTemplates.length} {t("countSuffix")}
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((template) => (
                <TemplateCard key={template.slug} template={template} onSelect={() => setSelected(template)} />
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 rounded-[2rem] border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <FilterPills
                label={t("styleLabel")}
                options={[...templateCategories]}
                value={category}
                onChange={setCategory}
                getOptionLabel={(option) => (locale === "vi" ? t(`categories.${option}`) : option)}
              />
              <FilterPills
                label={t("colorLabel")}
                options={[...templateColors]}
                value={color}
                onChange={setColor}
                getOptionLabel={(option) => (locale === "vi" ? t(`colors.${option}`) : option)}
              />
            </div>
            <TemplateSuggestionCta />
          </div>
        </section>

        <WeddingFaqSection />
        <SiteFooter />
      </div>

      {selected ? <TemplatePreviewModal template={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}

function FilterPills({
  label,
  options,
  value,
  onChange,
  getOptionLabel,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  getOptionLabel: (value: string) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`rounded-full border border-border px-4 py-1.5 text-sm font-bold transition ${
            value === option
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          {getOptionLabel(option)}
        </button>
      ))}
    </div>
  );
}

function TemplateCard({ template, onSelect }: { template: ChungDoiTemplate; onSelect: () => void }) {
  const t = useTranslations("listing");
  const locale = useLocale();
  const isVietnamese = locale === "vi";
  const name = isVietnamese ? t(`templates.${template.slug}.name`) : template.name;
  const description = isVietnamese ? t(`templates.${template.slug}.description`) : template.description;
  const category = isVietnamese ? t(`categories.${template.category}`) : template.category;

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow transition hover:-translate-y-1 hover:shadow-lg">
      <button
        onClick={onSelect}
        data-ga-event="preview_template"
        data-ga-param-template-id={template.slug}
        data-ga-param-source="listing_card"
        className="block w-full text-left"
      >
        <div className="relative h-[460px] overflow-hidden rounded-2xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={template.listing}
            alt={name}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full max-w-none transition-transform duration-[10000ms] ease-in-out group-hover:translate-y-[calc(460px_-_100%)]"
          />
        </div>
      </button>
      <div className="p-5">
        <h3 className="font-heading text-xl font-black text-foreground">{name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{category}</p>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-5 grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-2">
          <button
            onClick={onSelect}
            data-ga-event="preview_template"
            data-ga-param-template-id={template.slug}
            data-ga-param-source="listing_card_button"
            className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full border border-border bg-secondary px-2 py-2.5 text-xs font-bold text-foreground transition hover:bg-muted"
          >
            {t("preview")}
          </button>
          <Link
            href={{ pathname: "/templates/[slug]/demo", params: { slug: demoSlug(template, locale) } }}
            data-ga-event="open_template_demo"
            data-ga-param-template-id={template.slug}
            data-ga-param-source="listing_card"
            className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full bg-primary px-2 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            {t("demo")} <ArrowRight className="size-3.5 shrink-0" />
          </Link>
        </div>
      </div>
    </article>
  );
}
