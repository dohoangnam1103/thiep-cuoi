import "server-only";

import { after } from "next/server";

import { getPreparedOgImage } from "@/lib/prepared-og-image";
import { prisma } from "@/lib/prisma";

// Read committed data, rather than a submitted form or a React request cache.
export function loadPublishedOgInvitation(where: { id: string } | { slug: string }) {
  return prisma.invitation.findFirst({
    where: { ...where, status: "published" },
    select: { templateId: true, content: true },
  });
}

export async function prepareInvitationOgImage(id: string): Promise<void> {
  try {
    const invitation = await loadPublishedOgInvitation({ id });
    if (invitation?.content) {
      await getPreparedOgImage({ ...invitation, content: invitation.content });
    }
  } catch (error) {
    // Saving/publishing still succeeds; a cache miss can retry on the image request.
    console.error("Unable to prepare invitation thumbnail", { id, error });
  }
}

export function scheduleInvitationOgImage(id: string): void {
  // Register the work without starting/awaiting it in the publication response.
  after(() => prepareInvitationOgImage(id));
}
