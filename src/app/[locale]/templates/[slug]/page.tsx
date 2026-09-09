import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { TemplateSeoDetailPage, templateDetailMetadata } from "@/components/template-seo-detail-page";
import { findTemplateByRouteSlug } from "@/data/chungdoi";
import { templateSeoDetailStatus } from "@/data/template-seo-details";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { resolvePublicTemplateRoute } from "@/lib/template-route-aliases";

// Runtime alias edits must not leave stale canonical URLs in build-time HTML.
export const dynamic = "force-dynamic";

type DetailProps = { params: Promise<{ locale: Locale; slug: string }> };

async function resolveDetail(slug: string) {
  const route = await resolvePublicTemplateRoute(slug);
  const template = route ? findTemplateByRouteSlug(route.sourceSlug) : undefined;
  if (!route || !template || templateSeoDetailStatus(template.slug) === "retired") notFound();
  return { route, template };
}

export async function generateMetadata({ params }: DetailProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const { route, template } = await resolveDetail(slug);
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
