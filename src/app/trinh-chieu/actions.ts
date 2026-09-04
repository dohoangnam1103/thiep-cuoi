"use server";

import { unlink } from "node:fs/promises";

import { revalidatePath } from "next/cache";

import { slideshowTemplateById } from "@/components/slideshow/templates/catalog";
import { getAccountSessionUserId } from "@/lib/auth/anonymous-account";
import { prisma } from "@/lib/prisma";
import {
  canEditSlideshow,
  parseSlideshowProjectDraft,
  parseStoredSlideshowProject,
  projectTitle,
  serializeSlideshowProjectDraft,
  type SlideshowProjectDraft,
} from "@/lib/slideshow/project";
import {
  parseSlideshowMediaPublicUrl,
  slideshowMediaPath,
} from "@/lib/slideshow/storage";

export type SaveSlideshowResult =
  | { ok: true; savedAt: string; revision: number }
  | {
      ok: false;
      error: "unauthorized" | "notFound" | "expired" | "invalid" | "conflict";
      revision?: number;
    };

function isBuiltInImage(value: string): boolean {
  if (!value.startsWith("/chungdoi/images/") || value.includes("\\")) return false;
  let url: URL;
  try {
    url = new URL(value, "https://slideshow.local");
  } catch {
    return false;
  }
  if (url.origin !== "https://slideshow.local" || url.search || url.hash) return false;
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return false;
  }
  const segments = pathname.split("/");
  return pathname.startsWith("/chungdoi/images/")
    && !segments.some((segment) => segment === "." || segment === "..");
}

function sourceAssetRequests(
  project: { shareToken: string },
  media: SlideshowProjectDraft["source"]["photos"],
  requireMatchingId: boolean,
): Map<string, "image" | "video"> | null {
  const requested = new Map<string, "image" | "video">();
  for (const item of media) {
    if (isBuiltInImage(item.url)) {
      if (item.kind !== "image") return null;
      continue;
    }
    const parsed = parseSlideshowMediaPublicUrl(item.url);
    if (
      !parsed
      || parsed.shareToken !== project.shareToken
      || (requireMatchingId && item.id !== parsed.assetId)
    ) {
      return null;
    }
    const existingKind = requested.get(parsed.assetId);
    if (existingKind && existingKind !== item.kind) return null;
    requested.set(parsed.assetId, item.kind);
  }
  return requested;
}

async function removeStoredMedia(projectId: string, storageKeys: string[]): Promise<void> {
  await Promise.all(storageKeys.map(async (storageKey) => {
    const target = slideshowMediaPath(storageKey);
    if (!target) {
      console.error("slideshow_asset_invalid_storage_key", { projectId, storageKey });
      return;
    }
    try {
      await unlink(target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("slideshow_asset_unlink_failed", {
          projectId,
          storageKey,
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    }
  }));
}

export async function saveSlideshowProject(
  projectId: string,
  expectedRevision: number,
  input: SlideshowProjectDraft,
): Promise<SaveSlideshowResult> {
  const userId = await getAccountSessionUserId();
  if (!userId) return { ok: false, error: "unauthorized" };
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
    return { ok: false, error: "invalid" };
  }

  let draft: SlideshowProjectDraft;
  try {
    draft = parseSlideshowProjectDraft(input);
  } catch {
    return { ok: false, error: "invalid" };
  }
  const template = slideshowTemplateById[draft.templateId];
  if (
    draft.source.photos.length < template.capabilities.minPhotos
    || draft.source.photos.length > template.capabilities.maxPhotos
  ) {
    return { ok: false, error: "invalid" };
  }
  const serialized = serializeSlideshowProjectDraft(draft);
  const title = projectTitle(draft.source);

  const outcome = await prisma.$transaction(async (db): Promise<{
    result: SaveSlideshowResult;
    storageKeys: readonly string[];
  }> => {
    const project = await db.slideshowProject.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      return { result: { ok: false, error: "notFound" }, storageKeys: [] } as const;
    }
    if (!canEditSlideshow(project)) {
      return { result: { ok: false, error: "expired" }, storageKeys: [] } as const;
    }
    const matchesCurrent = project.templateId === serialized.templateId
      && project.templateVersion === serialized.templateVersion
      && project.sourceJson === serialized.sourceJson
      && project.sceneOverridesJson === serialized.sceneOverridesJson
      && project.musicUrl === serialized.musicUrl
      && project.title === title;
    if (project.revision !== expectedRevision) {
      // Idempotent replay: request trước đã commit nhưng client mất response.
      // Chỉ coi là thành công khi canonical snapshot hiện tại khớp tuyệt đối.
      return matchesCurrent
        ? {
            result: {
              ok: true,
              savedAt: new Date().toISOString(),
              revision: project.revision,
            },
            storageKeys: [],
          } as const
        : {
            result: { ok: false, error: "conflict", revision: project.revision },
            storageKeys: [],
          } as const;
    }
    if (matchesCurrent) {
      return {
        result: {
          ok: true,
          savedAt: new Date().toISOString(),
          revision: project.revision,
        },
        storageKeys: [],
      } as const;
    }

    const requested = sourceAssetRequests(project, draft.source.photos, true);
    if (!requested) {
      return { result: { ok: false, error: "invalid" }, storageKeys: [] } as const;
    }
    if (requested.size) {
      const assets = await db.slideshowAsset.findMany({
        where: { projectId: project.id, id: { in: [...requested.keys()] } },
        select: { id: true, kind: true },
      });
      if (
        assets.length !== requested.size
        || !assets.every((asset) => requested.get(asset.id) === asset.kind)
      ) {
        return { result: { ok: false, error: "invalid" }, storageKeys: [] } as const;
      }
    }
    if (draft.musicUrl) {
      const track = await db.track.findFirst({
        where: { url: draft.musicUrl, status: "ready" },
        select: { id: true },
      });
      if (!track) {
        return { result: { ok: false, error: "invalid" }, storageKeys: [] } as const;
      }
    }

    let previousDraft: SlideshowProjectDraft;
    try {
      previousDraft = parseStoredSlideshowProject(project);
    } catch {
      return { result: { ok: false, error: "invalid" }, storageKeys: [] } as const;
    }
    const previous = sourceAssetRequests(project, previousDraft.source.photos, false);
    if (!previous) {
      return { result: { ok: false, error: "invalid" }, storageKeys: [] } as const;
    }
    const removedIds = [...previous.keys()].filter((assetId) => !requested.has(assetId));
    const removedAssets = removedIds.length
      ? await db.slideshowAsset.findMany({
          where: { projectId: project.id, id: { in: removedIds } },
          select: { id: true, size: true, storageKey: true },
        })
      : [];
    const removedBytes = removedAssets.reduce((total, asset) => total + asset.size, 0);
    const updated = await db.slideshowProject.updateMany({
      where: {
        id: project.id,
        userId,
        revision: expectedRevision,
        assetCount: { gte: removedAssets.length },
        assetBytes: { gte: removedBytes },
      },
      data: {
        ...serialized,
        title,
        revision: { increment: 1 },
        assetCount: { decrement: removedAssets.length },
        assetBytes: { decrement: removedBytes },
      },
    });
    if (updated.count !== 1) {
      const latest = await db.slideshowProject.findFirst({
        where: { id: project.id, userId },
        select: { revision: true },
      });
      return {
        result: latest?.revision !== expectedRevision
          ? { ok: false, error: "conflict", revision: latest?.revision }
          : { ok: false, error: "invalid" },
        storageKeys: [],
      } as const;
    }
    if (removedAssets.length) {
      const deleted = await db.slideshowAsset.deleteMany({
        where: { projectId: project.id, id: { in: removedAssets.map((asset) => asset.id) } },
      });
      if (deleted.count !== removedAssets.length) {
        throw new Error("Không thể xóa đầy đủ asset slideshow trong transaction");
      }
    }
    return {
      result: {
        ok: true,
        savedAt: new Date().toISOString(),
        revision: expectedRevision + 1,
      },
      storageKeys: removedAssets.map((asset) => asset.storageKey),
    } as const;
  });

  if (!outcome.result.ok) return outcome.result;
  await removeStoredMedia(projectId, [...outcome.storageKeys]);
  revalidatePath(`/trinh-chieu/${projectId}`);
  revalidatePath("/trinh-chieu");
  revalidatePath("/trinh-chieu/du-an");
  const project = await prisma.slideshowProject.findUnique({
    where: { id: projectId },
    select: { shareToken: true },
  });
  if (project) revalidatePath(`/trinh-chieu/xem/${project.shareToken}`);
  return outcome.result;
}
