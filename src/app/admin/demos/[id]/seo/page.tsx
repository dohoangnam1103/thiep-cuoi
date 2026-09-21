import Link from "next/link";
import { notFound } from "next/navigation";

import { getDetailCopy } from "@/components/template-seo-detail-page";
import { completedTemplates, retiredTemplateSlugs } from "@/data/chungdoi";
import { templateSeoDetailStatus } from "@/data/template-seo-details";
import { verifyAdmin } from "@/lib/admin-dal";
import { prisma } from "@/lib/prisma";
import { getTemplateLabels, labelFromMap } from "@/lib/template-labels";
import { templatePreviewUrl } from "@/lib/template-preview-url";
import { getPublicTemplateRouteOverrides, templateRouteSlugFromMap } from "@/lib/template-route-aliases";
import {
  getTemplateSeoOverrides,
  isOverridableTemplateSlug,
  overrideContent,
} from "@/lib/template-seo-overrides";

import { TemplateSeoForm } from "./TemplateSeoForm";

export default async function AdminDemoSeoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifyAdmin();
  const { id } = await params;

  const invitation = await prisma.invitation.findFirst({
    where: { id, isDemo: true, templateId: { notIn: [...retiredTemplateSlugs] } },
    select: { id: true, templateId: true },
  });
  if (!invitation) notFound();

  const sourceSlug = invitation.templateId;
  if (!isOverridableTemplateSlug(sourceSlug)) notFound();

  const template = completedTemplates.find((candidate) => candidate.slug === sourceSlug);
  if (!template) notFound();

  const [labels, overrides, routes, blogPosts] = await Promise.all([
    getTemplateLabels(),
    getTemplateSeoOverrides(),
    getPublicTemplateRouteOverrides(),
    prisma.blogPost.findMany({
      where: { status: "published" },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, title: true },
      take: 60,
    }),
  ]);

  const stored = overrides[sourceSlug] ?? null;
  // Seed the form with whatever the public page renders today, so the first
  // save never silently drops the built-in copy.
  const effective = stored
    ? overrideContent(stored)
    : await getDetailCopy("vi", template);

  const relatedCandidates = completedTemplates
    .filter((candidate) =>
      candidate.slug !== sourceSlug
      && templateSeoDetailStatus(candidate.slug) === "enabled")
    .map((candidate) => ({
      slug: candidate.slug,
      name: labelFromMap(labels, candidate.slug),
    }));

  return (
    <div className="space-y-4">
      <Link href="/admin/demos" className="text-sm text-primary hover:underline">
        ← Danh sách thiệp demo
      </Link>
      <TemplateSeoForm
        sourceSlug={sourceSlug}
        templateName={labelFromMap(labels, sourceSlug)}
        publicPath={`/mau-thiep/${templateRouteSlugFromMap(routes, sourceSlug)}`}
        demoId={invitation.id}
        initialContent={effective}
        initialRobots={stored?.robots ?? "index,follow"}
        isOverridden={Boolean(stored)}
        relatedCandidates={relatedCandidates}
        blogCandidates={blogPosts}
        previewImage={templatePreviewUrl(template.landscape)}
      />
    </div>
  );
}
