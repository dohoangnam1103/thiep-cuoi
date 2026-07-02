import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChungDoiDemo } from "@/components/chungdoi-demo";
import { findTemplateByRouteSlug, getTemplateRouteSlugs, getVietnameseTemplateSlug } from "@/data/chungdoi";

type DemoPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getTemplateRouteSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: DemoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = findTemplateByRouteSlug(slug);

  if (!template) {
    return {
      title: "Demo thiệp cưới | ChungDoi",
    };
  }

  return {
    title: `Demo ${template.name} | ChungDoi Clone`,
    description: `Xem demo thiệp cưới online mẫu ${template.name} với hiệu ứng mở thiệp, ảnh cưới, lịch, bản đồ và RSVP.`,
    alternates: {
      canonical: `/mau-thiep/${getVietnameseTemplateSlug(template.slug)}/demo`,
    },
    openGraph: {
      title: `Demo ${template.name}`,
      description: template.description,
      images: [template.landscape],
    },
  };
}

export default async function DemoPage({ params }: DemoPageProps) {
  const { slug } = await params;
  const template = findTemplateByRouteSlug(slug);

  if (!template) notFound();

  return <ChungDoiDemo template={template} />;
}
