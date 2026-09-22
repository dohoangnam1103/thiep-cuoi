import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { createInvitation } from "@/app/dashboard/actions";
import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";
import { RouteMessages } from "@/components/route-messages";
import { TemplateSeoDetailView, TEMPLATE_DETAIL_PREVIEW_HEIGHT, TEMPLATE_DETAIL_PREVIEW_WIDTH } from "@/components/template-seo-detail-view";
import { completedTemplates, type ChungDoiTemplate } from "@/data/chungdoi";
import { resolveTemplateSeoDetailContent, templateSeoDetailKey, templateSeoDetailStatus } from "@/data/template-seo-details";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPublishedBlogPostsBySlugs } from "@/lib/blog-posts";
import { pageSeo, templateDetailAlternates } from "@/lib/seo";
import { getPublicTemplateRouteOverrides, templateRouteSlugFromMap } from "@/lib/template-route-aliases";
import { getPublicTemplateSeoOverrides, overrideContent } from "@/lib/template-seo-overrides";
import { templateFullPreviewUrl, templatePreviewUrl } from "@/lib/template-preview-url";

/** Admin-authored override, the locale catalog, then the generated fallback. */
export async function getDetailCopy(locale: Locale, template: ChungDoiTemplate) {
  const overrides = await getPublicTemplateSeoOverrides();
  const stored = overrides[template.slug];
  if (stored) {
    // Validated on write and re-validated on read, so the fail-fast catalog
    // assertion is deliberately skipped here: bad marketing input must degrade
    // to the built-in copy rather than 500 the landing page.
    return overrideContent(stored);
  }

  const t = await getTranslations({ locale, namespace: "templateSeoDetails" });
  let copy: unknown;
  try {
    copy = t.raw(templateSeoDetailKey(template));
  } catch {
    copy = undefined;
  }
  // next-intl returns a missing-key string for raw lookups; treat that as
  // absent so non-pilot templates can use the validated ChungDoi fallback.
  if (!copy || typeof copy !== "object" || Array.isArray(copy)) copy = undefined;
  return resolveTemplateSeoDetailContent(template, copy);
}

/**
 * `robots` lives on the override row rather than inside `content`, so metadata
 * has to read the row separately instead of trusting a default.
 */
export async function templateDetailRobots(
  template: ChungDoiTemplate,
): Promise<Metadata["robots"]> {
  const overrides = await getPublicTemplateSeoOverrides();
  const stored = overrides[template.slug];
  if (!stored) return { index: true, follow: true };
  return {
    index: stored.robots.startsWith("index"),
    follow: stored.robots.endsWith("follow"),
  };
}

export async function templateDetailMetadata(locale: Locale, template: ChungDoiTemplate, canonicalSlug: string): Promise<Metadata> {
  const [copy, robots] = await Promise.all([
    getDetailCopy(locale, template),
    templateDetailRobots(template),
  ]);
  return pageSeo({
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: templateDetailAlternates(canonicalSlug, locale),
    robots,
    locale,
    image: templatePreviewUrl(template.landscape),
    imageAlt: copy.imageAlt,
    imageWidth: TEMPLATE_DETAIL_PREVIEW_WIDTH,
    imageHeight: TEMPLATE_DETAIL_PREVIEW_HEIGHT,
    imageType: "image/webp",
  });
}

export async function TemplateSeoDetailPage({ locale, template, canonicalSlug }: { locale: Locale; template: ChungDoiTemplate; canonicalSlug: string }) {
  const [copy, t, routes] = await Promise.all([
    getDetailCopy(locale, template),
    getTranslations({ locale, namespace: "templateSeoDetails" }),
    getPublicTemplateRouteOverrides(),
  ]);
  const labels = {
    breadcrumbAriaLabel: t("breadcrumbAriaLabel"), preview: t("preview"), home: t("home"), templates: t("templates"), demo: t("demo"),
    highlights: t("highlights"), suitableFor: t("suitableFor"), features: t("features"), steps: t("steps"),
    faq: t("faq"), relatedTemplates: t("relatedTemplates"), relatedBlog: t("relatedBlog"),
    templateEyebrow: t("templateEyebrow"), previewHint: t("previewHint"), aboutDesign: t("aboutDesign"),
  };
  const detailHref = getPathname({ href: { pathname: "/templates/[slug]", params: { slug: canonicalSlug } }, locale });
  const demoHref = getPathname({ href: { pathname: "/templates/[slug]/demo", params: { slug: canonicalSlug } }, locale });
  const relatedTemplates = copy.relatedSlugs.flatMap((slug) => {
    if (templateSeoDetailStatus(slug) !== "enabled") return [];
    const relatedTemplate = completedTemplates.find((candidate) => candidate.slug === slug);
    if (!relatedTemplate) return [];
    const relatedCopy = resolveTemplateSeoDetailContent(relatedTemplate);
    return [{
      name: relatedCopy.heading,
      href: getPathname({ href: { pathname: "/templates/[slug]", params: { slug: templateRouteSlugFromMap(routes, slug) } }, locale }),
      image: templatePreviewUrl(relatedTemplate.landscape),
      imageAlt: relatedCopy.imageAlt,
    }];
  });
  // Published posts only: editorial references cannot accidentally link drafts.
  // One batched query rather than one per slug — the admin form allows up to
  // six references, and this render path is revalidated on every marketing save.
  const postBySlug = await getPublishedBlogPostsBySlugs(copy.relatedBlogSlugs);
  const relatedBlog = copy.relatedBlogSlugs.flatMap((slug) => {
    const post = postBySlug.get(slug);
    return post ? [{ name: post.title, href: getPathname({ href: { pathname: "/blog/[slug]", params: { slug: post.slug } }, locale }) }] : [];
  });
  return (
    <RouteMessages namespaces={["chrome"]}>
      <SiteHeader />
      <TemplateSeoDetailView
        copy={copy} labels={labels} locale={locale} homeHref={getPathname({ href: "/", locale })}
        listingHref={getPathname({ href: "/templates", locale })} detailHref={detailHref} demoHref={demoHref}
        image={templatePreviewUrl(template.landscape)} fullPreviewImage={templateFullPreviewUrl(template.listing)} relatedTemplates={relatedTemplates} relatedBlog={relatedBlog}
        createCta={<form action={createInvitation} data-ga-event="select_template" data-ga-param-template-id={template.slug} data-ga-param-source="template_detail"><input type="hidden" name="templateId" value={template.slug} /><button type="submit" className="rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">{t("create")}</button></form>}
      />
      <SiteFooter />
    </RouteMessages>
  );
}
