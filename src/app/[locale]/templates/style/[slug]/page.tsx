import type { Metadata } from "next";

import {
  generateTemplateSeoFacetMetadata,
  TemplateSeoFacetPage,
} from "@/components/template-seo-facet-page";
import { styleTemplateSeoFacets } from "@/data/template-seo-facets";
import type { Locale } from "@/i18n/routing";

type StyleFacetPageProps = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return styleTemplateSeoFacets.map((facet) => ({ slug: facet.slug }));
}

export async function generateMetadata({ params }: StyleFacetPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  return generateTemplateSeoFacetMetadata({ kind: "style", locale, slug });
}

export default async function StyleFacetPage({ params }: StyleFacetPageProps) {
  const { locale, slug } = await params;
  return <TemplateSeoFacetPage kind="style" locale={locale} slug={slug} />;
}
