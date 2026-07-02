import { notFound, redirect } from "next/navigation";

import { findTemplateByRouteSlug, getTemplateRouteSlugs, getVietnameseTemplateSlug } from "@/data/chungdoi";

type TemplatePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getTemplateRouteSlugs().map((slug) => ({ slug }));
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  const { slug } = await params;
  const template = findTemplateByRouteSlug(slug);

  if (!template) notFound();

  redirect(`/mau-thiep/${getVietnameseTemplateSlug(template.slug)}/demo`);
}
