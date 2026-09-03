import "server-only";

import { unstable_cache } from "next/cache";

import { DEFAULT_COVER_3D_ENABLED } from "@/lib/cover-3d";
import { prisma } from "@/lib/prisma";

const APP_CONFIG_ID = "default";
export const COVER_3D_CACHE_TAG = "cover-3d-enabled";

export const getCover3dEnabled = unstable_cache(
  async (): Promise<boolean> => {
    const config = await prisma.appConfig.findUnique({
      where: { id: APP_CONFIG_ID },
      select: { cover3dEnabled: true },
    });
    return config?.cover3dEnabled ?? DEFAULT_COVER_3D_ENABLED;
  },
  ["cover-3d-enabled-v1"],
  { revalidate: 300, tags: [COVER_3D_CACHE_TAG] },
);

export async function updateCover3dEnabled(enabled: boolean): Promise<void> {
  await prisma.appConfig.upsert({
    where: { id: APP_CONFIG_ID },
    create: { id: APP_CONFIG_ID, cover3dEnabled: enabled },
    update: { cover3dEnabled: enabled },
  });
}
