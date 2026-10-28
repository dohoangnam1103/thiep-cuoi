import { join } from "node:path";

import { resolveOgImageVersion } from "@/lib/og-image";
import { createOgImageCache } from "@/lib/og-image-cache";
import { renderOgImage, type OgImageInvitation } from "@/lib/og-image-renderer";

// The existing .next/cache volume persists across production deployments.
const cache = createOgImageCache(join(process.cwd(), ".next", "cache", "invitation-og"));

export async function getPreparedOgImage(
  invitation: OgImageInvitation & { content: NonNullable<OgImageInvitation["content"]> },
): Promise<Buffer> {
  const version = resolveOgImageVersion(invitation.templateId, invitation.content);
  return cache.getOrCreate(version, async () => {
    const response = await renderOgImage(invitation, "");
    // ImageResponse renders lazily: fully consume it before persisting or reporting ready.
    return Buffer.from(await response.arrayBuffer());
  });
}
