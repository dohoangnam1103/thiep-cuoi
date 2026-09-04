import {
  isSlideshowTemplateId,
  type SlideshowTemplateId,
} from "@/components/slideshow/templates/catalog";
import { getAccountSessionUserId } from "@/lib/auth/anonymous-account";
import { prisma } from "@/lib/prisma";

import { SlideshowStudio } from "./slideshow-studio";

export const dynamic = "force-dynamic";

export default async function SlideshowPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const [{ template }, userId] = await Promise.all([
    searchParams,
    getAccountSessionUserId(),
  ]);
  const initialTemplateId: SlideshowTemplateId = template && isSlideshowTemplateId(template)
    ? template
    : "cinematic";
  const projects = userId ? await prisma.slideshowProject.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 4,
    select: { id: true, title: true, updatedAt: true },
  }) : [];

  return (
    <SlideshowStudio
      key={initialTemplateId}
      mode="demo"
      initialTemplateId={initialTemplateId}
      projects={projects.map((project) => ({
        id: project.id,
        title: project.title,
        updatedAt: project.updatedAt.toISOString(),
      }))}
    />
  );
}
