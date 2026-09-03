import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { completedTemplates, retiredTemplateSlugs } from "@/data/chungdoi";
import { verifyAdmin } from "@/lib/admin-dal";
import { prisma } from "@/lib/prisma";
import {
  defaultTemplateLabel,
  getTemplateLabelOverrides,
  getTemplateLabels,
  labelFromMap,
} from "@/lib/template-labels";
import { getTemplateMobileThumbnailOverrides } from "@/lib/template-mobile-thumbnails";
import {
  getTemplateDisplayOrder,
  sortByTemplateDisplayOrder,
} from "@/lib/template-display-order";
import {
  getTemplateVisibilityOverrides,
  isTemplateVisible,
} from "@/lib/template-visibility";

import { DemoOrderManager, type DemoOrderItem } from "./DemoOrderManager";
import { TemplateMobileThumbnailManager } from "./TemplateMobileThumbnailManager";

export default async function AdminDemosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await verifyAdmin();
  const { tab } = await searchParams;
  const mobileThumbnailTab = tab === "mobile-thumbnail";

  const [
    demos,
    usageCounts,
    labels,
    overrides,
    mobileThumbnailUrls,
    displayOrder,
    visibilityOverrides,
    t,
  ] = await Promise.all([
    prisma.invitation.findMany({
      where: { isDemo: true, templateId: { notIn: [...retiredTemplateSlugs] } },
      orderBy: { templateId: "asc" },
      include: { content: { select: { brideFullName: true, groomFullName: true } } },
    }),
    prisma.invitation.groupBy({
      by: ["templateId"],
      where: { isDemo: false },
      _count: { _all: true },
    }),
    getTemplateLabels(),
    getTemplateLabelOverrides(),
    getTemplateMobileThumbnailOverrides(),
    getTemplateDisplayOrder(),
    getTemplateVisibilityOverrides(),
    getTranslations("adminDemos"),
  ]);
  const usageByTemplate = new Map(
    usageCounts.map((row) => [row.templateId, row._count._all]),
  );
  const fallbackOrder = Object.fromEntries(
    completedTemplates.map((template, index) => [template.slug, index]),
  );
  const orderedDemos = sortByTemplateDisplayOrder(
    demos,
    displayOrder,
    (demo) => demo.templateId,
    fallbackOrder,
  );
  const demoOrderItems: DemoOrderItem[] = orderedDemos.map((demo) => {
    const content = demo.content;
    const couple =
      content && (content.brideFullName || content.groomFullName)
        ? `${content.groomFullName} & ${content.brideFullName}`.trim()
        : "—";

    return {
      id: demo.id,
      templateId: demo.templateId,
      name: labelFromMap(labels, demo.templateId),
      defaultName: defaultTemplateLabel(demo.templateId),
      isRenamed: Boolean(overrides[demo.templateId]),
      isVisible: isTemplateVisible(visibilityOverrides, demo.templateId),
      couple,
      usageCount: usageByTemplate.get(demo.templateId) ?? 0,
    };
  });
  const mobileThumbnailTemplates = completedTemplates.map((template) => ({
    slug: template.slug,
    name: labelFromMap(labels, template.slug),
    listing: template.listing,
  }));

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl text-foreground">
        {mobileThumbnailTab ? t("mobileTitle") : t("title", { count: demos.length })}
      </h1>

      <nav aria-label={t("tabNavLabel")} className="flex w-fit rounded-xl border border-border bg-background p-1">
        <Link
          href="/admin/demos"
          aria-current={mobileThumbnailTab ? undefined : "page"}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mobileThumbnailTab
              ? "text-muted-foreground hover:bg-muted hover:text-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {t("tabs.demos")}
        </Link>
        <Link
          href="/admin/demos?tab=mobile-thumbnail"
          aria-current={mobileThumbnailTab ? "page" : undefined}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mobileThumbnailTab
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {t("tabs.mobileThumbnails")}
        </Link>
      </nav>

      {mobileThumbnailTab ? (
        <TemplateMobileThumbnailManager
          templates={mobileThumbnailTemplates}
          initialThumbnailUrls={mobileThumbnailUrls}
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t("demosDescription")}</p>
          {demoOrderItems.length ? (
            <DemoOrderManager initialItems={demoOrderItems} />
          ) : (
            <div className="rounded-2xl border border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
              {t("noDemos")}
            </div>
          )}
        </>
      )}
    </div>
  );
}
