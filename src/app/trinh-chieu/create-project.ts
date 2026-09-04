"use server";

import { randomBytes } from "node:crypto";

import { redirect } from "next/navigation";

import { demoWeddingSlideshowSource } from "@/components/slideshow/core/source";
import {
  isSlideshowTemplateId,
  slideshowTemplateById,
} from "@/components/slideshow/templates/catalog";
import { verifyAccountSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  MAX_SLIDESHOW_PROJECTS_PER_ACCOUNT,
  MAX_UNPAID_SLIDESHOW_PROJECTS_PER_ACCOUNT,
} from "@/lib/slideshow/storage";

const CREATION_KEY_PATTERN = /^[A-Za-z0-9_-]{32}$/;

function shareToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function createSlideshowProject(formData: FormData): Promise<void> {
  const rawTemplate = String(formData.get("templateId") ?? "");
  const creationKey = String(formData.get("creationKey") ?? "");
  const returnTemplateId = isSlideshowTemplateId(rawTemplate) ? rawTemplate : "cinematic";
  const returnTo = `/trinh-chieu/bat-dau?template=${encodeURIComponent(returnTemplateId)}`;
  const { userId } = await verifyAccountSession(returnTo, "slideshow");
  if (!isSlideshowTemplateId(rawTemplate)) redirect(`${returnTo}&error=invalid`);
  if (!CREATION_KEY_PATTERN.test(creationKey)) redirect(`${returnTo}&error=invalid`);
  const templateId = rawTemplate;

  const previous = await prisma.slideshowProject.findUnique({
    where: { creationKey },
    select: { id: true, userId: true },
  });
  if (previous?.userId === userId) redirect(`/trinh-chieu/${previous.id}`);
  if (previous) redirect(`${returnTo}&error=invalid`);

  let project: { id: string };
  try {
    project = await prisma.$transaction(async (db) => {
      const [total, unpaid] = await Promise.all([
        db.slideshowProject.count({ where: { userId } }),
        db.slideshowProject.count({
          where: { userId, paid: false, complimentary: false },
        }),
      ]);
      if (total >= MAX_SLIDESHOW_PROJECTS_PER_ACCOUNT) throw new Error("PROJECT_LIMIT");
      if (unpaid >= MAX_UNPAID_SLIDESHOW_PROJECTS_PER_ACCOUNT) throw new Error("UNPAID_LIMIT");
      return db.slideshowProject.create({
        data: {
          userId,
          creationKey,
          shareToken: shareToken(),
          templateId,
          templateVersion: slideshowTemplateById[templateId].version,
          title: `${demoWeddingSlideshowSource.couple.brideName} & ${demoWeddingSlideshowSource.couple.groomName}`,
          sourceJson: JSON.stringify(demoWeddingSlideshowSource),
          sceneOverridesJson: "{}",
        },
        select: { id: true },
      });
    });
  } catch (error) {
    const existing = await prisma.slideshowProject.findUnique({
      where: { creationKey },
      select: { id: true, userId: true },
    });
    if (existing?.userId === userId) redirect(`/trinh-chieu/${existing.id}`);
    const reason = error instanceof Error && error.message === "UNPAID_LIMIT"
      ? "unpaid-limit"
      : error instanceof Error && error.message === "PROJECT_LIMIT"
        ? "project-limit"
        : "failed";
    redirect(`${returnTo}&error=${reason}`);
  }

  redirect(`/trinh-chieu/${project.id}`);
}
