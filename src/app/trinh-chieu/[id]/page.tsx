import { notFound } from "next/navigation";

import { verifyAccountSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  getSlideshowEntitlement,
  parseStoredSlideshowProject,
  slideshowTrialEndsAt,
} from "@/lib/slideshow/project";

import { SlideshowStudio } from "../slideshow-studio";

export const dynamic = "force-dynamic";

export default async function SlideshowEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await verifyAccountSession(`/trinh-chieu/${encodeURIComponent(id)}`, "slideshow");
  const project = await prisma.slideshowProject.findFirst({
    where: { id, userId },
  });
  if (!project) notFound();

  let draft;
  try {
    draft = parseStoredSlideshowProject(project);
  } catch (error) {
    console.error("Dữ liệu slideshow không hợp lệ", {
      projectId: project.id,
      error: error instanceof Error ? error.message : "unknown",
    });
    notFound();
  }

  return (
    <SlideshowStudio
      mode="editor"
      project={{
        id: project.id,
        title: project.title,
        shareToken: project.shareToken,
        draft,
        revision: project.revision,
        entitlement: getSlideshowEntitlement(project),
        trialEndsAt: slideshowTrialEndsAt(project.trialStartedAt).toISOString(),
      }}
    />
  );
}
