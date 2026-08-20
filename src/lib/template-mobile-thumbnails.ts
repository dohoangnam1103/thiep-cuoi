import { cache } from "react";

import { isEditorUploadPublicUrl } from "@/lib/editor-uploads";
import { prisma } from "@/lib/prisma";

/** Template source slug -> an optional mobile-only thumbnail URL. */
export type TemplateMobileThumbnailMap = Record<string, string>;

/**
 * Reads all valid mobile-thumbnail overrides. The URL validation is repeated
 * here so an accidentally hand-edited database row can never make a public
 * page render an arbitrary source.
 */
export const getTemplateMobileThumbnailOverrides = cache(
  async (): Promise<TemplateMobileThumbnailMap> => {
    const rows = await prisma.templateMobileThumbnail.findMany({
      select: { slug: true, imageUrl: true },
    });

    return Object.fromEntries(
      rows
        .filter((row) => isEditorUploadPublicUrl(row.imageUrl))
        .map((row) => [row.slug, row.imageUrl]),
    );
  },
);

/**
 * The public marketing pages may be rendered while a Docker image is built,
 * before its runtime database exists. Mirror template-label behavior by
 * gracefully using built-in thumbnails until the next revalidation.
 */
export const getPublicTemplateMobileThumbnailOverrides = cache(
  async (): Promise<TemplateMobileThumbnailMap> => {
    try {
      return await getTemplateMobileThumbnailOverrides();
    } catch {
      return {};
    }
  },
);
