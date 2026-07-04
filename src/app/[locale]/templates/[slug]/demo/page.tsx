import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { ChungDoiDemo } from "@/components/chungdoi-demo";
import {
  findTemplateByRouteSlug,
  getVietnameseTemplateSlug,
  templates,
} from "@/data/chungdoi";
import { routing, type Locale } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { toDemoContent } from "@/lib/to-demo-content";

function localeSlug(sourceSlug: string, locale: Locale) {
  return locale === "vi" ? getVietnameseTemplateSlug(sourceSlug) : sourceSlug;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    templates.map((template) => ({ locale, slug: localeSlug(template.slug, locale) })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const template = findTemplateByRouteSlug(slug);

  if (!template) {
    return { title: "Demo | Thiệp Mừng Online" };
  }

  return {
    title: `${template.name} Demo | Thiệp Mừng Online Clone`,
    description: template.description,
    openGraph: {
      title: `${template.name} Demo`,
      description: template.description,
      images: [template.landscape],
    },
  };
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const template = findTemplateByRouteSlug(slug);
  if (!template) notFound();

  const invitation = await prisma.invitation.findFirst({
    where: { isDemo: true, templateId: template.slug },
    include: { content: true, schedule: true, gallery: true, wishes: true },
  });
  const content = invitation ? toDemoContent(invitation) : undefined;

  return <ChungDoiDemo template={template} content={content} />;
}
