import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import {
  findTemplateByRouteSlug,
  getVietnameseTemplateSlug,
  templates,
} from "@/data/chungdoi";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

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

  const template = findTemplateByRouteSlug(slug);
  if (!template) notFound();

  permanentRedirect(
    getPathname({
      href: {
        pathname: "/templates/[slug]/demo",
        params: { slug: localeSlug(template.slug, locale) },
      },
      locale,
    }),
  );
}
