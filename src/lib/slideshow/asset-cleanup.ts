import { unlink } from "node:fs/promises";

import { prisma } from "@/lib/prisma";
import { parseStoredSlideshowProject } from "@/lib/slideshow/project";
import {
  parseSlideshowMediaPublicUrl,
  slideshowMediaPath,
} from "@/lib/slideshow/storage";

const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1_000;

export type SlideshowAssetCleanupSummary = {
  scannedProjects: number;
  removedAssets: number;
  removedBytes: number;
  failed: number;
};

function referencedAssetIds(project: {
  shareToken: string;
  templateId: string;
  templateVersion: number;
  sourceJson: string;
  sceneOverridesJson: string;
  musicUrl: string | null;
}): Set<string> | null {
  let draft: ReturnType<typeof parseStoredSlideshowProject>;
  try {
    draft = parseStoredSlideshowProject(project);
  } catch {
    return null;
  }

  const referenced = new Set<string>();
  for (const media of draft.source.photos) {
    if (media.url.startsWith("/chungdoi/images/")) continue;
    const parsed = parseSlideshowMediaPublicUrl(media.url);
    if (!parsed || parsed.shareToken !== project.shareToken) return null;
    referenced.add(parsed.assetId);
  }
  return referenced;
}

async function unlinkRemovedAssets(
  projectId: string,
  storageKeys: string[],
): Promise<number> {
  let failed = 0;
  for (const storageKey of storageKeys) {
    const target = slideshowMediaPath(storageKey);
    if (!target) {
      failed += 1;
      console.error("slideshow_orphan_invalid_storage_key", { projectId, storageKey });
      continue;
    }
    try {
      await unlink(target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        failed += 1;
        console.error("slideshow_orphan_unlink_failed", {
          projectId,
          storageKey,
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    }
  }
  return failed;
}

/**
 * Thu gom upload chưa từng được lưu vào draft (ví dụ đóng tab ngay sau upload).
 * Chỉ xét project không đổi trong 24 giờ. Transaction tăng revision cùng lúc
 * xóa row/quota, nên một autosave cạnh tranh sẽ thua CAS thay vì lưu URL mồ côi.
 *
 * `cleanupLimit` giới hạn số project thực sự bị mutate, không giới hạn số
 * project được scan. Project cũ nhưng sạch vì vậy không thể giữ chỗ và làm
 * orphan ở phía sau starvation.
 */
export async function cleanupStaleSlideshowAssets(
  cleanupLimit = 20,
): Promise<SlideshowAssetCleanupSummary> {
  const cutoff = new Date(Date.now() - ORPHAN_GRACE_MS);
  const candidates = await prisma.slideshowProject.findMany({
    where: {
      updatedAt: { lte: cutoff },
      assets: { some: { createdAt: { lte: cutoff } } },
    },
    orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      shareToken: true,
      templateId: true,
      templateVersion: true,
      sourceJson: true,
      sceneOverridesJson: true,
      musicUrl: true,
      assets: {
        where: { createdAt: { lte: cutoff } },
        select: { id: true },
      },
    },
  });
  const summary: SlideshowAssetCleanupSummary = {
    scannedProjects: 0,
    removedAssets: 0,
    removedBytes: 0,
    failed: 0,
  };
  let cleanedProjects = 0;

  for (const candidate of candidates) {
    if (cleanedProjects >= cleanupLimit) break;
    summary.scannedProjects += 1;
    const candidateReferences = referencedAssetIds(candidate);
    if (!candidateReferences) {
      summary.failed += 1;
      console.error("slideshow_orphan_cleanup_invalid_draft", { projectId: candidate.id });
      continue;
    }
    if (candidate.assets.every((asset) => candidateReferences.has(asset.id))) continue;

    try {
      const removed = await prisma.$transaction(async (db) => {
        const project = await db.slideshowProject.findUnique({
          where: { id: candidate.id },
        });
        if (!project || project.updatedAt > cutoff) return null;
        const referenced = referencedAssetIds(project);
        if (!referenced) {
          throw new Error("Draft slideshow không hợp lệ; bỏ qua thu gom an toàn");
        }
        const staleAssets = (await db.slideshowAsset.findMany({
          where: { projectId: project.id, createdAt: { lte: cutoff } },
          orderBy: { createdAt: "asc" },
          select: { id: true, size: true, storageKey: true },
        })).filter((asset) => !referenced.has(asset.id));
        if (!staleAssets.length) return null;

        const bytes = staleAssets.reduce((total, asset) => total + asset.size, 0);
        const claimed = await db.slideshowProject.updateMany({
          where: {
            id: project.id,
            revision: project.revision,
            updatedAt: project.updatedAt,
            assetCount: { gte: staleAssets.length },
            assetBytes: { gte: bytes },
          },
          data: {
            revision: { increment: 1 },
            assetCount: { decrement: staleAssets.length },
            assetBytes: { decrement: bytes },
          },
        });
        if (claimed.count !== 1) return null;
        const deleted = await db.slideshowAsset.deleteMany({
          where: {
            projectId: project.id,
            id: { in: staleAssets.map((asset) => asset.id) },
          },
        });
        if (deleted.count !== staleAssets.length) {
          throw new Error("Không thể xóa đầy đủ orphan asset slideshow");
        }
        return {
          projectId: project.id,
          bytes,
          storageKeys: staleAssets.map((asset) => asset.storageKey),
        };
      });
      if (!removed) continue;
      cleanedProjects += 1;
      summary.removedAssets += removed.storageKeys.length;
      summary.removedBytes += removed.bytes;
      summary.failed += await unlinkRemovedAssets(removed.projectId, removed.storageKeys);
    } catch (error) {
      summary.failed += 1;
      console.error("slideshow_orphan_cleanup_failed", {
        projectId: candidate.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  return summary;
}
