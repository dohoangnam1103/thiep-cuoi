import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { createInvitation } from "@/app/dashboard/actions";
import { AnalyticsEventOnView } from "@/components/analytics-interactions";
import { ChungDoiDemo } from "@/components/chungdoi-demo";
import { RouteMessages } from "@/components/route-messages";
import { invitationMessageNamespaces } from "@/i18n/message-scopes";
import {
  findTemplateByRouteSlug,
  retiredTemplateSlugs,
  type ChungDoiTemplate,
} from "@/data/chungdoi";
import { chungdoiDemoContent } from "@/data/chungdoi-demo-content";
import type { Locale } from "@/i18n/routing";
import { getCover3dEnabled } from "@/lib/cover-3d-config";
import { getCachedPublicDemoContent } from "@/lib/public-demo-content";
import { pageSeo, templateAlternates } from "@/lib/seo";
import { getTemplateLabelOverrides } from "@/lib/template-labels";
import { templatePreviewUrl } from "@/lib/template-preview-url";

const TEMPLATE_PREVIEW_WIDTH = 2400;
const TEMPLATE_PREVIEW_HEIGHT = 1260;

async function localizedTemplateCopy(locale: Locale, template: ChungDoiTemplate) {
  const [listingT, demoT, nameOverrides] = await Promise.all([
    getTranslations({ locale, namespace: "listing" }),
    getTranslations({ locale, namespace: "templateDemoSeo" }),
    getTemplateLabelOverrides(),
  ]);
  const nameKey = `templates.${template.slug}.name`;
  const descriptionKey = `templates.${template.slug}.description`;
  const name =
    nameOverrides[template.slug]?.trim()
    || (listingT.has(nameKey) ? listingT(nameKey) : template.name);
  const description = listingT.has(descriptionKey)
    ? listingT(descriptionKey)
    : template.description;

  return {
    description,
    heading: demoT("heading", { name }),
    imageAlt: demoT("imageAlt", { name }),
    name,
    title: demoT("metaTitle", { name }),
  };
}

export async function publicDemoMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const template = findTemplateByRouteSlug(slug);

  if (!template || retiredTemplateSlugs.has(template.slug)) {
    return { title: { absolute: "Demo | Thiệp Mừng Online" } };
  }

  const copy = await localizedTemplateCopy(locale, template);
  const alternates = templateAlternates(slug, locale);
  if (!alternates) {
    return { title: { absolute: "Demo | Thiệp Mừng Online" } };
  }

  return pageSeo({
    title: copy.title,
    description: copy.description,
    alternates,
    locale,
    image: templatePreviewUrl(template.landscape),
    imageAlt: copy.imageAlt,
    imageWidth: TEMPLATE_PREVIEW_WIDTH,
    imageHeight: TEMPLATE_PREVIEW_HEIGHT,
    imageType: "image/webp",
  });
}

export async function PublicTemplateDemo({
  params,
  captureMode = false,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
  captureMode?: boolean;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "demoCta" });

  const template = findTemplateByRouteSlug(slug);
  if (!template || retiredTemplateSlugs.has(template.slug)) notFound();
  const copy = await localizedTemplateCopy(locale, template);

  const [storedContent, cover3dEnabled] = await Promise.all([
    getCachedPublicDemoContent(template.slug),
    getCover3dEnabled(),
  ]);
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
    : storedContent ?? fallbackContent;

  return (
    <RouteMessages namespaces={invitationMessageNamespaces}>
      {!captureMode ? (
        <AnalyticsEventOnView
          eventName="view_template_demo"
          params={{ template_id: template.slug, locale }}
        />
      ) : null}
      <ChungDoiDemo
        template={template}
        content={content}
        captureMode={captureMode}
        heading={copy.heading}
        cover3dEnabled={cover3dEnabled}
      />
      {!captureMode ? (
        <form
          action={createInvitation}
          data-ga-event="select_template"
          data-ga-param-template-id={template.slug}
          data-ga-param-source="template_demo"
          className="fixed right-3 top-3 z-[95] sm:right-5 sm:top-5"
        >
          <input type="hidden" name="templateId" value={template.slug} />
          <button
            type="submit"
            className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold tracking-tight text-primary-foreground shadow-lg ring-1 ring-white/60 transition duration-200 hover:bg-primary/90 hover:shadow-xl active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:px-6 sm:py-3 sm:text-sm"
          >
            {t("useTemplate")}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>
        </form>
      ) : null}
    </RouteMessages>
  );
}
