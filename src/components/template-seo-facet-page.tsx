import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  ChungDoiListing,
  type TemplateSeoFacetContent,
} from "@/components/chungdoi-listing";
import { TemplateNameOverridesProvider } from "@/components/template-name-overrides";
import {
  findTemplateSeoFacet,
  templatesForSeoFacet,
  type TemplateSeoFacet,
  type TemplateSeoFacetKind,
} from "@/data/template-seo-facets";
import { getVietnameseTemplateSlug } from "@/data/chungdoi";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { pageSeo, templateFacetAlternates } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";
import { getPublicTemplateNameOverrides } from "@/lib/template-labels";
import { templatePreviewUrl } from "@/lib/template-preview-url";

const TEMPLATE_PREVIEW_WIDTH = 2400;
const TEMPLATE_PREVIEW_HEIGHT = 1260;

function resolveFacet(kind: TemplateSeoFacetKind, slug: string): TemplateSeoFacet {
  const facet = findTemplateSeoFacet(kind, slug);
  if (!facet) notFound();
  return facet;
}

function facetPath(facet: TemplateSeoFacet, locale: Locale): string {
  if (facet.kind === "style") {
    return getPathname({
      href: {
        pathname: "/templates/style/[slug]",
        params: { slug: facet.slug },
      },
      locale,
    });
  }

  return getPathname({
    href: {
      pathname: "/templates/color/[slug]",
      params: { slug: facet.slug },
    },
    locale,
  });
}

export async function generateTemplateSeoFacetMetadata({
  kind,
  locale,
  slug,
}: {
  kind: TemplateSeoFacetKind;
  locale: Locale;
  slug: string;
}): Promise<Metadata> {
  const facet = resolveFacet(kind, slug);
  const templates = templatesForSeoFacet(facet);
  const t = await getTranslations({ locale, namespace: "templateSeoFacets" });
  const listingT = await getTranslations({ locale, namespace: "listing" });
  const title = t(`items.${facet.id}.metaTitle`);
  const description = t(`items.${facet.id}.metaDescription`, {
    count: templates.length,
  });
  const preview = templates[0];
  const previewNameKey = preview ? `templates.${preview.slug}.name` : "";
  const previewName = preview && listingT.has(previewNameKey)
    ? listingT(previewNameKey)
    : preview?.name ?? title;

  return pageSeo({
    title,
    description,
    alternates: templateFacetAlternates(facet.kind, facet.slug, locale),
    locale,
    image: preview ? templatePreviewUrl(preview.landscape) : undefined,
    imageAlt: t("socialImageAlt", { name: previewName }),
    imageWidth: preview ? TEMPLATE_PREVIEW_WIDTH : undefined,
    imageHeight: preview ? TEMPLATE_PREVIEW_HEIGHT : undefined,
    imageType: preview ? "image/webp" : undefined,
  });
}

export async function TemplateSeoFacetPage({
  kind,
  locale,
  slug,
}: {
  kind: TemplateSeoFacetKind;
  locale: Locale;
  slug: string;
}) {
  const facet = resolveFacet(kind, slug);
  const templates = templatesForSeoFacet(facet);
  if (templates.length === 0) notFound();

  setRequestLocale(locale);
  const [t, listingT, templateNameOverrides] = await Promise.all([
    getTranslations({ locale, namespace: "templateSeoFacets" }),
    getTranslations({ locale, namespace: "listing" }),
    getPublicTemplateNameOverrides(),
  ]);

  const title = t(`items.${facet.id}.title`);
  const description = t(`items.${facet.id}.metaDescription`, {
    count: templates.length,
  });
  const path = facetPath(facet, locale);
  const canonicalUrl = absoluteUrl(path);
  const templateItems = templates.map((template, index) => {
    const nameKey = `templates.${template.slug}.name`;
    const defaultName = listingT.has(nameKey) ? listingT(nameKey) : template.name;
    const name = templateNameOverrides[template.slug]?.trim() || defaultName;
    const demoPath = getPathname({
      href: {
        pathname: "/templates/[slug]/demo",
        params: { slug: getVietnameseTemplateSlug(template.slug) },
      },
      locale,
    });

    return {
      "@type": "ListItem",
      position: index + 1,
      name,
      url: absoluteUrl(demoPath),
    };
  });
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: t("breadcrumb.home"),
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: t("breadcrumb.templates"),
            item: absoluteUrl(getPathname({ href: "/templates", locale })),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: title,
            item: canonicalUrl,
          },
        ],
      },
      {
        "@type": "CollectionPage",
        "@id": canonicalUrl,
        url: canonicalUrl,
        name: title,
        description,
        inLanguage: locale,
        isPartOf: { "@id": `${absoluteUrl("/")}#website` },
        breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
        mainEntity: { "@id": `${canonicalUrl}#item-list` },
      },
      {
        "@type": "ItemList",
        "@id": `${canonicalUrl}#item-list`,
        name: title,
        numberOfItems: templateItems.length,
        itemListElement: templateItems,
      },
    ],
  };
  const content: TemplateSeoFacetContent = {
    facetId: facet.id,
    breadcrumbAriaLabel: t("breadcrumb.ariaLabel"),
    homeLabel: t("breadcrumb.home"),
    templatesLabel: t("breadcrumb.templates"),
    currentLabel: t(`items.${facet.id}.linkLabel`),
    eyebrow: t("eyebrow"),
    title,
    subtitle: t(`items.${facet.id}.subtitle`, { count: templates.length }),
    intro: t(`items.${facet.id}.intro`),
    resultsTitle: t("resultsTitle"),
    guideTitle: t(`items.${facet.id}.guideTitle`),
    guide: t(`items.${facet.id}.guide`),
    faqTitle: t("faqTitle"),
    faqs: [
      {
        question: t(`items.${facet.id}.faq1Question`),
        answer: t(`items.${facet.id}.faq1Answer`),
      },
      {
        question: t(`items.${facet.id}.faq2Question`),
        answer: t(`items.${facet.id}.faq2Answer`),
      },
    ],
  };

  return (
    <TemplateNameOverridesProvider value={templateNameOverrides}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ChungDoiListing initialTemplates={templates} facetContent={content} />
    </TemplateNameOverridesProvider>
  );
}
