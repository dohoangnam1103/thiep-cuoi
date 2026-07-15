"use client";

import { ArrowRight, Star, X } from "lucide-react";
import Image from "next/image";
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
          <h2 className="sr-only">{t("title")}</h2>
          <div className="flex flex-col gap-4 rounded-[2rem] border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
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
  const color = isVietnamese ? t(`colors.${template.color}`) : template.color;

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow transition hover:-translate-y-1 hover:shadow-lg">
      <button
        onClick={onSelect}
        data-ga-event="preview_template"
        data-ga-param-template-id={template.slug}
        data-ga-param-source="listing_card"
        className="block w-full text-left"
      >
        <div className="relative h-[460px] overflow-hidden bg-black">
          <Image
            src={template.listing}
            alt={name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="h-full w-full object-cover object-top transition-[object-position,transform] duration-[10000ms] ease-in-out group-hover:object-bottom group-hover:scale-[1.03]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4">
            <div className="flex items-center gap-2">
              {template.isNew ? (
                <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-black text-primary-foreground">{t("new")}</span>
              ) : null}
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white">{color}</span>
            </div>
          </div>
        </div>
      </button>
      <div className="p-5">
        <h3 className="font-heading text-xl font-black text-foreground">{name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{category}</p>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={onSelect}
            data-ga-event="preview_template"
            data-ga-param-template-id={template.slug}
            data-ga-param-source="listing_card_button"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-secondary px-3 py-2.5 text-sm font-black text-foreground transition hover:bg-muted"
          >
            {t("preview")}
          </button>
          <Link
            href={{ pathname: "/templates/[slug]/demo", params: { slug: demoSlug(template, locale) } }}
            data-ga-event="open_template_demo"
            data-ga-param-template-id={template.slug}
            data-ga-param-source="listing_card"
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
  const modalT = useTranslations("templatePreviewModal");
  const locale = useLocale();

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/40 p-3 backdrop-blur-xl sm:p-6 lg:p-8"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl lg:h-auto lg:max-h-[calc(100dvh-4rem)] lg:max-w-4xl">
        <div className="flex items-center justify-between border-b border-border p-4 sm:px-6 sm:py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{modalT("eyebrow")}</p>
            <h3 className="mt-1 font-heading text-2xl font-black text-foreground">{modalT("title")}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label={modalT("close")}
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-foreground transition hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <p className="max-w-xl leading-7 text-muted-foreground">{modalT("description")}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-secondary p-4">
                <p className="text-xs text-muted-foreground">{modalT("previewTypeLabel")}</p>
                <p className="mt-1 font-black text-foreground">{modalT("previewTypeValue")}</p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary p-4">
                <p className="text-xs text-muted-foreground">{t("trial")}</p>
                <p className="mt-1 font-black text-foreground">{t("trialValue")}</p>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {[modalT("highlightMobile"), modalT("highlightRsvp"), modalT("highlightGallery")].map((item) => (
                <li key={item} className="flex gap-3 text-sm text-muted-foreground">
                  <Star className="mt-0.5 size-4 shrink-0 fill-accent text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={{ pathname: "/templates/[slug]/demo", params: { slug: demoSlug(template, locale) } }}
                data-ga-event="open_template_demo"
                data-ga-param-template-id={template.slug}
                data-ga-param-source="listing_modal"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition hover:bg-primary/90"
              >
                {t("demoCta")} <ArrowRight className="size-4" />
              </Link>
              <form
                action={createInvitation}
                data-ga-event="select_template"
                data-ga-param-template-id={template.slug}
                data-ga-param-source="listing_modal"
              >
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
          <div className="group relative h-[56vh] min-h-[360px] overflow-hidden rounded-3xl border border-border bg-muted shadow-[0_16px_40px_rgb(0_0_0/0.1)] lg:h-[min(520px,calc(100dvh-12rem))] lg:min-h-[420px] lg:w-[360px]">
            <Image
              src={template.listing}
              alt={modalT("imageAlt")}
              fill
              sizes="360px"
              className="h-full w-full object-cover object-top transition-[object-position] duration-[12000ms] ease-in-out group-hover:object-bottom motion-reduce:transition-none"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 via-foreground/35 to-transparent px-5 pb-5 pt-14 transition-opacity duration-300 group-hover:opacity-0">
              <p className="text-sm font-bold text-background">{modalT("hoverHint")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
