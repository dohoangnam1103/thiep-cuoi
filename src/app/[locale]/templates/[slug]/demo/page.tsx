import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { createInvitation } from "@/app/dashboard/actions";
import { AnalyticsEventOnView } from "@/components/analytics-interactions";
import { ChungDoiDemo } from "@/components/chungdoi-demo";
import {
  findTemplateByRouteSlug,
  getVietnameseTemplateSlug,
  templates,
} from "@/data/chungdoi";
import { chungdoiDemoContent } from "@/data/chungdoi-demo-content";
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
  const { locale, slug } = await params;
  const template = findTemplateByRouteSlug(slug);

  if (!template) {
    return { title: { absolute: "Demo | Thiệp Mừng Online" } };
  }

  const title = template.title;
  const image = absoluteUrl(template.landscape);

  return {
    title: { absolute: title },
    description: template.description,
    alternates: templateAlternates(slug, locale) ?? undefined,
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
  searchParams,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<{ capture?: string }>;
}) {
  const { locale, slug } = await params;
  const { capture } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "demoCta" });

  const template = findTemplateByRouteSlug(slug);
  if (!template) notFound();

  const invitation = await prisma.invitation.findFirst({
    where: { isDemo: true, templateId: template.slug },
    include: { content: true, schedule: true, gallery: true, wishes: true },
  });
  const storedContent = invitation ? toDemoContent(invitation) : undefined;
  const fallbackContent = chungdoiDemoContent[template.slug];
  const content = storedContent && fallbackContent
    ? {
        ...storedContent,
        theme: {
          ...storedContent.theme,
          assets: fallbackContent.theme.assets,
        },
        portraits: fallbackContent.portraits,
        gallery: storedContent.gallery.length > 0 ? storedContent.gallery : fallbackContent.gallery,
        wishes: storedContent.wishes.length > 0 ? storedContent.wishes : fallbackContent.wishes,
      }
    : storedContent;
  const captureMode = capture === "1";

  return (
    <>
      {!captureMode ? (
        <AnalyticsEventOnView
          eventName="view_template_demo"
          params={{ template_id: template.slug, locale }}
        />
      ) : null}
      <ChungDoiDemo template={template} content={content} captureMode={captureMode} />
      {!captureMode ? (
        <form
          action={createInvitation}
          data-ga-event="select_template"
          data-ga-param-template-id={template.slug}
          data-ga-param-source="template_demo"
          className="fixed right-3 top-3 z-[95] rounded-full border border-white/60 bg-white/90 p-1 shadow-2xl backdrop-blur-md sm:right-5 sm:top-5"
        >
          <input type="hidden" name="templateId" value={template.slug} />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-6 sm:py-3"
          >
            {t("useTemplate")}
          </button>
        </form>
      ) : null}
    </>
  );
}
