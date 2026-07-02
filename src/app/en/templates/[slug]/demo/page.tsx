import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChungDoiDemo } from "@/components/chungdoi-demo";
import { findTemplateByRouteSlug, templates } from "@/data/chungdoi";

type EnglishDemoPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return templates.map((template) => ({ slug: template.slug }));
}

export async function generateMetadata({ params }: EnglishDemoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = findTemplateByRouteSlug(slug);

  if (!template) {
    return {
      title: "Invitation demo | ChungDoi",
    };
  }

  return {
    title: `${template.name} Demo | ChungDoi Clone`,
    description: `Preview the ${template.name} wedding invitation demo with cover animation, gallery, event details and RSVP.`,
    openGraph: {
      title: `${template.name} Demo`,
      description: template.description,
      images: [template.landscape],
    },
  };
}

export default async function EnglishDemoPage({ params }: EnglishDemoPageProps) {
  const { slug } = await params;
  const template = findTemplateByRouteSlug(slug);

  if (!template) notFound();

  return <ChungDoiDemo template={template} />;
}
