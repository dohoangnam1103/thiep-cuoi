import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import {
  findTemplateByRouteSlug,
  getVietnameseTemplateSlug,
  templates,
} from "@/data/chungdoi";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { resolvePublicTemplateRoute } from "@/lib/template-route-aliases";

function localeSlug(sourceSlug: string, locale: Locale) {
  return locale === "vi" ? getVietnameseTemplateSlug(sourceSlug) : sourceSlug;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    templates.map((template) => ({ locale, slug: localeSlug(template.slug, locale) })),
  );
}

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const resolvedRoute = await resolvePublicTemplateRoute(slug);
  const template = resolvedRoute
    ? findTemplateByRouteSlug(resolvedRoute.sourceSlug)
    : undefined;
  if (!template || !resolvedRoute) notFound();

  const canonicalSlug = locale === "vi"
    ? resolvedRoute.canonicalSlug
    : template.slug;
  redirect(
    getPathname({
      href: {
        pathname: "/templates/[slug]/demo",
        params: { slug: canonicalSlug },
      },
      locale,
    }),
  );
}
