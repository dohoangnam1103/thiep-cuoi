import "server-only";

import { DEFAULT_COVER_3D_ENABLED } from "@/lib/cover-3d";
import { prisma } from "@/lib/prisma";

const APP_CONFIG_ID = "default";

export async function getCover3dEnabled(): Promise<boolean> {
  const config = await prisma.appConfig.findUnique({
    where: { id: APP_CONFIG_ID },
    select: { cover3dEnabled: true },
  });
  return config?.cover3dEnabled ?? DEFAULT_COVER_3D_ENABLED;
}

export async function updateCover3dEnabled(enabled: boolean): Promise<void> {
  await prisma.appConfig.upsert({
    where: { id: APP_CONFIG_ID },
    create: { id: APP_CONFIG_ID, cover3dEnabled: enabled },
    update: { cover3dEnabled: enabled },
  });
}
