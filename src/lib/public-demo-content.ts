import "server-only";

import { unstable_cache } from "next/cache";

import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { prisma } from "@/lib/prisma";
import { toDemoContent } from "@/lib/to-demo-content";

export const PUBLIC_DEMO_CONTENT_CACHE_TAG = "public-demo-content";

/**
 * Demo content only changes through the admin demo editor. Cache the fully
 * materialized, serializable view model instead of repeating a six-relation
 * SQLite query for every anonymous demo view.
 */
export const getCachedPublicDemoContent = unstable_cache(
  async (templateSlug: string): Promise<ChungDoiDemoContent | null> => {
    const invitation = await prisma.invitation.findFirst({
      where: { isDemo: true, templateId: templateSlug },
      include: {
        content: true,
        ceremonies: true,
        schedule: true,
        gallery: true,
        wishes: true,
      },
    });

    return invitation ? toDemoContent(invitation) : null;
  },
  ["public-demo-content-v1"],
  {
    revalidate: 300,
    tags: [PUBLIC_DEMO_CONTENT_CACHE_TAG],
  },
);
