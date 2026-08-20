import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { completedTemplates } from "@/data/chungdoi";
import { verifyAdmin } from "@/lib/admin-dal";
import { prisma } from "@/lib/prisma";
import {
  defaultTemplateLabel,
  getTemplateLabelOverrides,
  getTemplateLabels,
  labelFromMap,
} from "@/lib/template-labels";
import { getTemplateMobileThumbnailOverrides } from "@/lib/template-mobile-thumbnails";

import { TemplateMobileThumbnailManager } from "./TemplateMobileThumbnailManager";
import { TemplateNameForm } from "./TemplateNameForm";

export default async function AdminDemosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await verifyAdmin();
  const { tab } = await searchParams;
  const mobileThumbnailTab = tab === "mobile-thumbnail";

  const [demos, labels, overrides, mobileThumbnailUrls, t] = await Promise.all([
    prisma.invitation.findMany({
      where: { isDemo: true },
      orderBy: { templateId: "asc" },
      include: { content: { select: { brideFullName: true, groomFullName: true } } },
    }),
    getTemplateLabels(),
    getTemplateLabelOverrides(),
    getTemplateMobileThumbnailOverrides(),
    getTranslations("adminDemos"),
  ]);
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
          <div className="overflow-x-auto rounded-2xl border border-border bg-background">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("templateColumn")}</th>
                  <th className="px-4 py-3 font-medium">{t("coupleColumn")}</th>
                  <th className="px-4 py-3 font-medium">{t("actionsColumn")}</th>
                </tr>
              </thead>
              <tbody>
                {demos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                      {t("noDemos")}
                    </td>
                  </tr>
                ) : (
                  demos.map((demo) => {
                    const c = demo.content;
                    const couple =
                      c && (c.brideFullName || c.groomFullName)
                        ? `${c.groomFullName} & ${c.brideFullName}`.trim()
                        : "—";
                    return (
                      <tr key={demo.id} className="border-b border-border last:border-0 align-top">
                        <td className="px-4 py-3">
                          <TemplateNameForm
                            templateId={demo.templateId}
                            name={labelFromMap(labels, demo.templateId)}
                            defaultName={defaultTemplateLabel(demo.templateId)}
                            isRenamed={Boolean(overrides[demo.templateId])}
                          />
                        </td>
                        <td className="px-4 py-3">{couple}</td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/demos/${demo.id}`} className="text-sm text-primary hover:underline">
                            {t("edit")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
