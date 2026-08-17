import type { Metadata } from "next";

import {
  generateTemplateSeoFacetMetadata,
  TemplateSeoFacetPage,
} from "@/components/template-seo-facet-page";
import { colorTemplateSeoFacets } from "@/data/template-seo-facets";
import type { Locale } from "@/i18n/routing";

type ColorFacetPageProps = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return colorTemplateSeoFacets.map((facet) => ({ slug: facet.slug }));
}

export async function generateMetadata({ params }: ColorFacetPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  return generateTemplateSeoFacetMetadata({ kind: "color", locale, slug });
}

export default async function ColorFacetPage({ params }: ColorFacetPageProps) {
  const { locale, slug } = await params;
  return <TemplateSeoFacetPage kind="color" locale={locale} slug={slug} />;
}
