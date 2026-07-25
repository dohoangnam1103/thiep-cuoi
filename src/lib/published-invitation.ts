import { cache } from "react";

import { prisma } from "@/lib/prisma";

export const loadPublished = cache(async function loadPublished(slug: string) {
  return prisma.invitation.findFirst({
    where: { slug, status: "published" },
    include: {
      content: true,
      ceremonies: true,
      schedule: true,
      gallery: true,
      wishes: { orderBy: { createdAt: "desc" } },
      rsvpQuestions: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });
});

export type PublishedInvitation = NonNullable<Awaited<ReturnType<typeof loadPublished>>>;
