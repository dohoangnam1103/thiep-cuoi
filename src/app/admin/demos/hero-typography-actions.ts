"use server";

import { updateTag, revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/admin-dal";
import { prisma } from "@/lib/prisma";
import { heroTypographySchema } from "@/lib/hero-typography";
import { HERO_TYPOGRAPHY_TAG } from "@/lib/hero-typography-config";
import { retiredTemplateSlugs } from "@/data/chungdoi";

export async function saveHeroTypography(id: string, slug: string, input: unknown) {
  await verifyAdmin();
  const value = heroTypographySchema.safeParse(input);
  if (!value.success) return { error: "invalid" as const };
  const demo = await prisma.invitation.findFirst({ where: { id, isDemo: true, templateId: { notIn: [...retiredTemplateSlugs] } }, select: { templateId: true } });
  if (!demo || demo.templateId !== slug) return { error: "templateChanged" as const };
  await prisma.templateHeroTypography.upsert({ where: { slug }, create: { slug, ...value.data }, update: value.data });
  updateTag(HERO_TYPOGRAPHY_TAG);
  revalidatePath("/", "layout");
  return { ok: true as const };
}
