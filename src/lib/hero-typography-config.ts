import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { HeroTypographyMap } from "@/lib/hero-typography";

export const HERO_TYPOGRAPHY_TAG = "template-hero-typography";
export const getHeroTypography = unstable_cache(async (): Promise<HeroTypographyMap> => {
  const rows = await prisma.templateHeroTypography.findMany();
  return Object.fromEntries(rows.map(row => [row.slug, { fontFamily: row.fontFamily, bold: row.bold, italic: row.italic }]));
}, [HERO_TYPOGRAPHY_TAG], { tags: [HERO_TYPOGRAPHY_TAG], revalidate: 300 });
