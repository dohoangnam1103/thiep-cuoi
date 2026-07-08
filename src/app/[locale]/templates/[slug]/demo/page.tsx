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
import { templateAlternates } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";
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
    return { title: { absolute: "Demo | Thiệp Mừng Online" } };
  }

  const title = template.title;
  const image = absoluteUrl(template.landscape);

  return {
    title: { absolute: title },
    description: template.description,
    alternates: templateAlternates(slug) ?? undefined,
    openGraph: {
      type: "website",
      title,
      description: template.description,
      images: [{ url: image }],
      siteName: "Thiệp Mừng Online",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: template.description,
      images: [image],
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
