"use client";

import { ArrowRight, Star, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { createInvitation } from "@/app/dashboard/actions";
import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";
import { Link } from "@/i18n/navigation";
import {
  completedTemplates,
  getVietnameseTemplateSlug,
  templateCategories,
  templateColors,
  type ChungDoiTemplate,
} from "@/data/chungdoi";

function demoSlug(template: ChungDoiTemplate, locale: string) {
  return locale === "vi" ? getVietnameseTemplateSlug(template.slug) : template.slug;
}

export function ChungDoiListing() {
  const t = useTranslations("listing");
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

  useEffect(() => {
    if (!selected) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [selected]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border bg-background py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">{t("eyebrow")}</p>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{t("subtitle")}</p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <FilterPills label={t("styleLabel")} options={[...templateCategories]} value={category} onChange={setCategory} />
            <FilterPills label={t("colorLabel")} options={[...templateColors]} value={color} onChange={setColor} />
          </div>
          <div className="mt-6 rounded-full border border-border bg-card px-5 py-2 text-sm font-bold text-foreground inline-block">
            {filtered.length} / {completedTemplates.length} {t("countSuffix")}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((template) => (
              <TemplateCard key={template.slug} template={template} onSelect={() => setSelected(template)} />
            ))}
          </div>
        </div>
      </section>

      {selected ? <TemplateModal template={selected} onClose={() => setSelected(null)} /> : null}
      <SiteFooter />
    </main>
  );
}

function FilterPills({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
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
          {option}
        </button>
      ))}
    </div>
  );
}

function TemplateCard({ template, onSelect }: { template: ChungDoiTemplate; onSelect: () => void }) {
  const t = useTranslations("listing");
  const locale = useLocale();

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow transition hover:-translate-y-1 hover:shadow-lg">
      <button onClick={onSelect} className="block w-full text-left">
        <div className="relative h-[460px] overflow-hidden bg-black">
          <img
            src={template.listing}
            alt={template.name}
            className="h-full w-full object-cover object-top transition-[object-position,transform] duration-[10000ms] ease-in-out group-hover:object-bottom group-hover:scale-[1.03]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4">
            <div className="flex items-center gap-2">
              {template.isNew ? (
                <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-black text-primary-foreground">{t("new")}</span>
              ) : null}
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white">{template.color}</span>
            </div>
          </div>
        </div>
      </button>
      <div className="p-5">
        <h3 className="font-heading text-xl font-black text-foreground">{template.name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{template.category}</p>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{template.description}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={onSelect}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary px-3 py-2.5 text-sm font-black text-foreground transition hover:bg-muted"
          >
            {t("preview")}
          </button>
          <Link
            href={{ pathname: "/templates/[slug]/demo", params: { slug: demoSlug(template, locale) } }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-3 py-2.5 text-sm font-black text-primary-foreground transition hover:bg-primary/90"
          >
            {t("demo")} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function TemplateModal({ template, onClose }: { template: ChungDoiTemplate; onClose: () => void }) {
  const t = useTranslations("listing");
  const locale = useLocale();

  return (
    <div className="fixed inset-0 z-[80] bg-foreground/40 p-4 backdrop-blur-xl" role="dialog" aria-modal="true">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{template.category}</p>
            <h3 className="mt-1 font-heading text-2xl font-black text-foreground">{template.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-foreground transition hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-muted-foreground">{template.description}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-secondary p-4">
                <p className="text-xs text-muted-foreground">{t("colorWord")}</p>
                <p className="mt-1 font-black text-foreground">{template.color}</p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary p-4">
                <p className="text-xs text-muted-foreground">{t("trial")}</p>
                <p className="mt-1 font-black text-foreground">{t("trialValue")}</p>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {template.highlights.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-muted-foreground">
                  <Star className="mt-0.5 size-4 shrink-0 fill-accent text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={{ pathname: "/templates/[slug]/demo", params: { slug: demoSlug(template, locale) } }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition hover:bg-primary/90"
              >
                {t("demoCta")} <ArrowRight className="size-4" />
              </Link>
              <form action={createInvitation}>
                <input type="hidden" name="templateId" value={template.slug} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-6 py-3 text-sm font-black text-foreground transition hover:bg-muted"
                >
                  {t("useStyle")}
                </button>
              </form>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.65fr_1fr]">
            <div className="max-h-[70vh] overflow-y-auto rounded-3xl border border-border bg-black">
              <img src={template.portrait} alt={`${template.name} portrait preview`} className="w-full object-contain" />
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-3xl border border-border bg-white">
              <img src={template.landscape} alt={`${template.name} landscape preview`} className="w-full object-contain" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
