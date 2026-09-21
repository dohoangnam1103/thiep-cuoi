import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { TemplateSeoDetailPage, templateDetailMetadata } from "@/components/template-seo-detail-page";
import { completedTemplates, findTemplateByRouteSlug } from "@/data/chungdoi";
import { templateSeoDetailStatus } from "@/data/template-seo-details";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { resolvePublicTemplateRoute } from "@/lib/template-route-aliases";

/**
 * Statically prerendered and revalidated by tag when an admin edits copy.
 * Marketing edits land through `updateTag(TEMPLATE_SEO_OVERRIDE_TAG)` plus a
 * targeted `revalidatePath`, so the HTML is rebuilt on demand instead of on
 * every request.
 *
 * Pages whose slug resolves to no canonical alias (an admin cleared the name)
 * are generated on demand and cached afterwards.
 */
export const dynamicParams = true;
export const revalidate = false;

type DetailProps = { params: Promise<{ locale: Locale; slug: string }> };

/**
 * Prerenders the canonical Vietnamese alias for every template that has a
 * detail page. Overrides do not change which slugs exist, so this list does not
 * depend on the admin-editable copy.
 */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    completedTemplates
      .filter((template) => templateSeoDetailStatus(template.slug) === "enabled")
      .map((template) => ({ locale, slug: template.slug })),
  );
}

async function resolveDetail(slug: string) {
  const route = await resolvePublicTemplateRoute(slug);
  const template = route ? findTemplateByRouteSlug(route.sourceSlug) : undefined;
  if (!route || !template || templateSeoDetailStatus(template.slug) === "retired") notFound();
  return { route, template };
}

export async function generateMetadata({ params }: DetailProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const { route, template } = await resolveDetail(slug);
  // Not-enabled templates redirect to the demo when the page renders; metadata
  // still has to refuse indexing for the occasional direct crawler hit.
  if (templateSeoDetailStatus(template.slug) !== "enabled") {
    return { robots: { index: false, follow: true } };
  }
  return templateDetailMetadata(locale, template, route.canonicalSlug);
}

export default async function TemplatePage({ params }: DetailProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const { route, template } = await resolveDetail(slug);
  // The proxy handles permanent alias redirects; keep a route-level fallback.
  if (slug !== route.canonicalSlug) {
    redirect(getPathname({ href: { pathname: "/templates/[slug]", params: { slug: route.canonicalSlug } }, locale }));
  }
  if (templateSeoDetailStatus(template.slug) !== "enabled") {
    redirect(getPathname({ href: { pathname: "/templates/[slug]/demo", params: { slug: route.canonicalSlug } }, locale }));
  }
  return <TemplateSeoDetailPage locale={locale} template={template} canonicalSlug={route.canonicalSlug} />;
}
