import "server-only";

import { prisma } from "@/lib/prisma";
import { MAX_SLIDESHOW_PROJECTS_PER_ACCOUNT } from "@/lib/slideshow/storage";

export async function listOwnSlideshowProjects(userId: string) {
  return prisma.slideshowProject.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: MAX_SLIDESHOW_PROJECTS_PER_ACCOUNT,
    select: {
      id: true,
      title: true,
      shareToken: true,
      templateId: true,
      templateVersion: true,
      paid: true,
      complimentary: true,
      trialStartedAt: true,
      assetCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function ownSlideshowProject(projectId: string, userId: string) {
  return prisma.slideshowProject.findFirst({
    where: { id: projectId, userId },
  });
}

export async function ownSlideshowPayment(code: string, userId: string) {
  return prisma.slideshowPayment.findFirst({
    where: {
      code,
      project: { userId },
    },
  });
}
