"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";
import { WeddingFaqSection } from "@/components/chungdoi-faq";
import { useTemplateMobileThumbnail } from "@/components/template-mobile-thumbnail-overrides";
import { useTemplateName } from "@/components/template-name-overrides";
import { TemplatePreviewModal, demoSlug } from "@/components/template-preview-modal";
import { TemplateSuggestionCta } from "@/components/template-suggestion-cta";
import { HorizontalPillScroller } from "@/components/ui/horizontal-pill-scroller";
import { Link } from "@/i18n/navigation";
import {
  completedTemplates,
  templateCategories,
  templateColors,
  type ChungDoiTemplate,
} from "@/data/chungdoi";
import {
  colorTemplateSeoFacets,
  styleTemplateSeoFacets,
} from "@/data/template-seo-facets";
import { templatePreviewUrl } from "@/lib/template-preview-url";
import {
  blockTitleClass,
  bodyClass,
  bodySmallClass,
  cardTitleClass,
  eyebrowClass,
  labelClass,
  noteClass,
  pageTitleClass,
  pillClass,
  sectionDescClass,
  sectionTitleClass,
} from "@/lib/typography";

const listingImageHeights = {
  baroque_gold: 7666,
  boho_floral_brown: 7629,
  boho_floral_green: 8355,
  boho_floral_pink: 7576,
  brocade_flower_red: 8118,
  chateau_blue: 9381,
  chateau_green: 9536,
  cherry_blossom_pink: 8414,
  chibi_red: 7931,
  co_ba_red: 8130,
  crystal_floral_blue: 9168,
  double_dragon_blue: 7814,
  double_dragon_green: 8354,
  double_dragon_red: 7838,
  double_phoenix_green: 6856,
  double_phoenix_red: 7742,
  dragon_phoenix_black: 8694,
  dragon_phoenix_blue: 8904,
  dragon_phoenix_green: 8264,
  dragon_phoenix_red_480: 8904,
  dragon_phoenix_v2_red: 7450,
  dragon_phoenix_v3_red: 7056,
  elegant_leaf_green: 8106,
  glass_garden_green: 8045,
  hoa_tinh_red: 7310,
  jasmine_white: 8254,
  minimalism_red: 7411,
  nhat_binh_red: 7946,
  qasr_gold: 8350,
  qasr_green: 8746,
  royal_blue: 6613,
  royal_green: 6646,
  royal_red: 6677,
  silk_flora_brown: 8310,
  song_hy_green: 7853,
  song_hy_red: 7885,
  spring_garden_blue: 9226,
  spring_garden_green: 7698,
  spring_garden_red: 7670,
} as const;

function listingImageHeight(src: string) {
  const filename = src.slice(src.lastIndexOf("/") + 1, -".webp".length);
  return listingImageHeights[filename as keyof typeof listingImageHeights] ?? 768;
}

export type TemplateSeoFacetContent = {
  facetId: string;
  breadcrumbAriaLabel: string;
  homeLabel: string;
  templatesLabel: string;
  currentLabel: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  intro: string;
  resultsTitle: string;
  guideTitle: string;
  guide: string;
  faqTitle: string;
  faqs: ReadonlyArray<{ question: string; answer: string }>;
};

export function ChungDoiListing({
  initialTemplates = completedTemplates,
  facetContent,
}: {
  initialTemplates?: ChungDoiTemplate[];
  facetContent?: TemplateSeoFacetContent;
}) {
  const t = useTranslations("listing");
  const locale = useLocale();
  const [category, setCategory] = useState("All");
  const [color, setColor] = useState("All");
  const [selected, setSelected] = useState<ChungDoiTemplate | null>(null);

  const filtered = useMemo(
    () => {
      if (facetContent) return initialTemplates;

      return initialTemplates.filter(
        (template) =>
          (category === "All" || template.category === category) &&
          (color === "All" || template.color === color),
      );
    },
    [category, color, facetContent, initialTemplates],
  );

  return (
    <main className="font-app-sans min-h-screen bg-background text-foreground">
      <div
        aria-hidden={selected ? true : undefined}
        className={`transition-[filter,transform] duration-200 ease-out ${selected ? "scale-[0.998] blur-[6px]" : "blur-none"}`}
      >
        <SiteHeader hideCreateButton />
        <section className="bg-background pt-6 pb-3 sm:pt-8 sm:pb-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {facetContent ? (
              <nav aria-label={facetContent.breadcrumbAriaLabel} className={`mb-5 ${bodyClass} text-muted-foreground`}>
                <ol className="flex flex-wrap items-center gap-2">
                  <li><Link href="/" className="transition hover:text-primary">{facetContent.homeLabel}</Link></li>
                  <li aria-hidden>/</li>
                  <li><Link href="/templates" className="transition hover:text-primary">{facetContent.templatesLabel}</Link></li>
                  <li aria-hidden>/</li>
                  <li className="font-bold text-foreground" aria-current="page">{facetContent.currentLabel}</li>
                </ol>
              </nav>
            ) : null}
            <p className={`${eyebrowClass} text-primary`}>
              {facetContent?.eyebrow ?? t("eyebrow")}
            </p>
            <h1 className={`mt-4 max-w-3xl ${pageTitleClass} text-foreground`}>
              {facetContent?.title ?? t("title")}
            </h1>
            <p className={`mt-3 max-w-3xl ${sectionDescClass} text-muted-foreground`}>
              {facetContent?.subtitle ?? t("subtitle")}
            </p>
            <p className={`mt-1 max-w-3xl ${noteClass} text-muted-foreground`}>
              {facetContent?.intro ?? t("editingHint")}
            </p>
          </div>
        </section>

        <section className="pb-4 pt-0 sm:pb-6 sm:pt-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="sr-only">{facetContent?.resultsTitle ?? t("title")}</h2>
            <TemplateSeoFacetLinks currentFacetId={facetContent?.facetId} />

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((template) => (
                <TemplateCard key={template.slug} template={template} onSelect={() => setSelected(template)} />
              ))}
            </div>

            {!facetContent ? (
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
            ) : null}
            {facetContent ? <TemplateFacetEditorial content={facetContent} /> : null}
            <TemplateSuggestionCta />
          </div>
        </section>

        {!facetContent ? <WeddingFaqSection /> : null}
        <SiteFooter />
      </div>

      {selected ? <TemplatePreviewModal template={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}

function TemplateSeoFacetLinks({ currentFacetId }: { currentFacetId?: string }) {
  const t = useTranslations("templateSeoFacets");

  return (
    <section className="mt-3 rounded-[2rem] border border-border bg-card p-5 sm:mt-4 sm:p-7" aria-labelledby="template-collections-title">
      <h2 id="template-collections-title" className={`sr-only ${sectionTitleClass} text-foreground sm:not-sr-only`}>
        {t("navigation.title")}
      </h2>
      <p className={`mt-2 hidden max-w-3xl ${sectionDescClass} text-muted-foreground sm:block`}>{t("navigation.description")}</p>
      <div className="mt-0 grid gap-5 sm:mt-5 lg:grid-cols-2">
        <div className="min-w-0">
          <h3 className={`${labelClass} text-muted-foreground`}>
            {t("navigation.styleTitle")}
          </h3>
          <HorizontalPillScroller
            data-testid="template-facet-style-links"
            className="mt-3"
          >
            {styleTemplateSeoFacets.map((facet) => (
              <Link
                key={facet.id}
                href={{ pathname: "/templates/style/[slug]", params: { slug: facet.slug } }}
                aria-current={currentFacetId === facet.id ? "page" : undefined}
                className={`shrink-0 snap-start whitespace-nowrap rounded-full border px-4 py-2 ${pillClass} transition sm:shrink sm:whitespace-normal ${
                  currentFacetId === facet.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-foreground hover:border-primary/50 hover:text-primary"
                }`}
              >
                {t(`items.${facet.id}.linkLabel`)}
              </Link>
            ))}
          </HorizontalPillScroller>
        </div>
        <div className="min-w-0">
          <h3 className={`${labelClass} text-muted-foreground`}>
            {t("navigation.colorTitle")}
          </h3>
          <HorizontalPillScroller
            data-testid="template-facet-color-links"
            className="mt-3"
          >
            {colorTemplateSeoFacets.map((facet) => (
              <Link
                key={facet.id}
                href={{ pathname: "/templates/color/[slug]", params: { slug: facet.slug } }}
                aria-current={currentFacetId === facet.id ? "page" : undefined}
                className={`shrink-0 snap-start whitespace-nowrap rounded-full border px-4 py-2 ${pillClass} transition sm:shrink sm:whitespace-normal ${
                  currentFacetId === facet.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-foreground hover:border-primary/50 hover:text-primary"
                }`}
              >
                {t(`items.${facet.id}.linkLabel`)}
              </Link>
            ))}
          </HorizontalPillScroller>
        </div>
      </div>
    </section>
  );
}

function TemplateFacetEditorial({ content }: { content: TemplateSeoFacetContent }) {
  return (
    <section className="mt-12 grid gap-8 rounded-[2rem] border border-border bg-secondary p-6 sm:p-9 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <h2 className={`${sectionTitleClass} text-foreground`}>{content.guideTitle}</h2>
        <p className={`mt-3 ${sectionDescClass} text-muted-foreground`}>{content.guide}</p>
      </div>
      <div>
        <h2 className={`${sectionTitleClass} text-foreground`}>{content.faqTitle}</h2>
        <div className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {content.faqs.map((item) => (
            <details key={item.question} className="group p-5">
              <summary className={`cursor-pointer list-none ${blockTitleClass} text-foreground`}>
                {item.question}
              </summary>
              <p className={`mt-2 ${bodyClass} text-muted-foreground`}>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
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
      <span className={`mr-1 ${labelClass} text-muted-foreground`}>{label}</span>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`rounded-full border border-border px-4 py-1.5 ${pillClass} transition ${
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
  const templateName = useTemplateName();
  const mobileThumbnailUrl = useTemplateMobileThumbnail(template.slug);
  const isVietnamese = locale === "vi";
  const name = templateName(
    template.slug,
    isVietnamese ? t(`templates.${template.slug}.name`) : template.name,
  );
  const description = isVietnamese ? t(`templates.${template.slug}.description`) : template.description;
  const category = isVietnamese ? t(`categories.${template.category}`) : template.category;
  const demoHref = {
    pathname: "/templates/[slug]/demo" as const,
    params: { slug: demoSlug(template, locale) },
  };

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
          {mobileThumbnailUrl ? (
            <>
              <Image
                src={mobileThumbnailUrl}
                alt={name}
                fill
                sizes="(max-width: 639px) 50vw, 1px"
                loading="lazy"
                decoding="async"
                data-testid={`template-mobile-thumbnail-${template.slug}`}
                className="block object-cover object-center sm:hidden"
              />
              <Image
                src={templatePreviewUrl(template.listing)}
                alt={name}
                width={768}
                height={listingImageHeight(template.listing)}
                sizes="(max-width: 639px) 1px, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 208px"
                loading="lazy"
                decoding="async"
                data-testid={`template-listing-thumbnail-${template.slug}`}
                className="hidden h-auto w-full max-w-none transition-transform duration-[10000ms] ease-in-out group-hover:translate-y-[calc(460px_-_100%)] sm:block"
              />
            </>
          ) : (
            <Image
              src={templatePreviewUrl(template.listing)}
              alt={name}
              width={768}
              height={listingImageHeight(template.listing)}
              sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 208px"
              loading="lazy"
              decoding="async"
              data-testid={`template-listing-thumbnail-${template.slug}`}
              className="block h-auto w-full max-w-none transition-transform duration-[10000ms] ease-in-out group-hover:translate-y-[calc(460px_-_100%)]"
            />
          )}
        </div>
      </button>
      <div className="p-5">
        <h3 className={`${cardTitleClass} text-foreground`}>
          <Link href={demoHref} className="transition hover:text-primary">
            {name}
          </Link>
        </h3>
        <p className={`mt-2 ${bodySmallClass} text-muted-foreground`}>{category}</p>
        <p className={`mt-3 line-clamp-2 ${bodySmallClass} text-muted-foreground`}>{description}</p>
        <div className="mt-5 grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-2">
          <button
            onClick={onSelect}
            data-ga-event="preview_template"
            data-ga-param-template-id={template.slug}
            data-ga-param-source="listing_card_button"
            className={`inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full border border-border bg-secondary px-2 py-2.5 ${pillClass} text-foreground transition hover:bg-muted`}
          >
            {t("preview")}
          </button>
          <Link
            href={demoHref}
            data-ga-event="open_template_demo"
            data-ga-param-template-id={template.slug}
            data-ga-param-source="listing_card"
            className={`inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full bg-primary px-2 py-2.5 ${pillClass} text-primary-foreground transition hover:bg-primary/90`}
          >
            {t("demo")} <ArrowRight className="size-3.5 shrink-0" />
          </Link>
        </div>
      </div>
    </article>
  );
}
