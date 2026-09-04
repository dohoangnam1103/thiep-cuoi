import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type { NextRequest } from "next/server";

import {
  isSlideshowTemplateId,
  slideshowTemplateById,
} from "@/components/slideshow/templates/catalog";
import { getAccountSessionUserId } from "@/lib/auth/anonymous-account";
import {
  parseBoundedFormData,
  RequestBodyTooLargeError,
} from "@/lib/bounded-form-data";
import {
  extensionForVideo,
  GUEST_VIDEO_TYPES,
  isSupportedVideo,
} from "@/lib/guest-media";
import {
  ImageOutputTooLargeError,
  processUploadedImageToWebp,
} from "@/lib/process-uploaded-image";
import { prisma } from "@/lib/prisma";
import { canEditSlideshow } from "@/lib/slideshow/project";
import {
  MAX_SLIDESHOW_ASSETS,
  MAX_SLIDESHOW_ASSET_BYTES_PER_PROJECT,
  MAX_SLIDESHOW_IMAGE_BYTES,
  MAX_SLIDESHOW_UPLOAD_REQUEST_BYTES,
  MAX_SLIDESHOW_VIDEO_BYTES,
  slideshowMediaPath,
  slideshowMediaPublicUrl,
  slideshowMediaRoot,
} from "@/lib/slideshow/storage";
import {
  EDITOR_UPLOAD_IMAGE_FORMATS,
  isAcceptedImageUpload,
} from "@/lib/upload-image-formats";
import { MAX_IMAGE_UPLOAD_OUTPUT_BYTES } from "@/lib/upload-image-limits";

export const runtime = "nodejs";

class SlideshowAssetQuotaError extends Error {}
class SlideshowAssetTrialExpiredError extends Error {}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAccountSessionUserId();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const project = await prisma.slideshowProject.findFirst({
    where: { id, userId },
  });
  if (!project) return Response.json({ error: "notFound" }, { status: 404 });
  if (!canEditSlideshow(project)) {
    return Response.json({ error: "trialExpired" }, { status: 403 });
  }
  const templateLimit = isSlideshowTemplateId(project.templateId)
    ? slideshowTemplateById[project.templateId].capabilities.maxPhotos
    : MAX_SLIDESHOW_ASSETS;
  const assetLimit = Math.min(MAX_SLIDESHOW_ASSETS, templateLimit);
  if (project.assetCount >= assetLimit || project.assetBytes >= MAX_SLIDESHOW_ASSET_BYTES_PER_PROJECT) {
    return Response.json({ error: "assetLimit" }, { status: 409 });
  }

  let formData: FormData;
  try {
    formData = await parseBoundedFormData(request, MAX_SLIDESHOW_UPLOAD_REQUEST_BYTES);
  } catch (error) {
    return Response.json(
      { error: error instanceof RequestBodyTooLargeError ? "sourceTooLarge" : "invalidUpload" },
      { status: error instanceof RequestBodyTooLargeError ? 413 : 400 },
    );
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return Response.json({ error: "missingFile" }, { status: 400 });
  }

  const source = Buffer.from(await file.arrayBuffer());
  let output: Buffer;
  let extension: "webp" | "mp4" | "mov" | "webm";
  let mimeType: string;
  let kind: "image" | "video";

  if (isAcceptedImageUpload(file, EDITOR_UPLOAD_IMAGE_FORMATS)) {
    if (file.size > MAX_SLIDESHOW_IMAGE_BYTES) {
      return Response.json({ error: "sourceTooLarge" }, { status: 413 });
    }
    try {
      output = await processUploadedImageToWebp({
        bytes: source,
        allowedFormats: EDITOR_UPLOAD_IMAGE_FORMATS,
        maxWidth: 2400,
        maxHeight: 2400,
        quality: 84,
        maxOutputBytes: MAX_IMAGE_UPLOAD_OUTPUT_BYTES,
      });
    } catch (error) {
      return Response.json(
        { error: error instanceof ImageOutputTooLargeError ? "outputTooLarge" : "invalidImage" },
        { status: error instanceof ImageOutputTooLargeError ? 422 : 400 },
      );
    }
    extension = "webp";
    mimeType = "image/webp";
    kind = "image";
  } else if (GUEST_VIDEO_TYPES.has(file.type)) {
    if (file.size > MAX_SLIDESHOW_VIDEO_BYTES) {
      return Response.json({ error: "sourceTooLarge" }, { status: 413 });
    }
    const videoExtension = extensionForVideo(file.type);
    if (!videoExtension || !isSupportedVideo(source, file.type)) {
      return Response.json({ error: "invalidVideo" }, { status: 400 });
    }
    output = source;
    extension = videoExtension;
    mimeType = file.type;
    kind = "video";
  } else {
    return Response.json({ error: "unsupportedType" }, { status: 415 });
  }

  await mkdir(slideshowMediaRoot(), { recursive: true });
  const storageKey = `${randomUUID()}.${extension}`;
  const target = slideshowMediaPath(storageKey);
  if (!target) return Response.json({ error: "invalidStorageKey" }, { status: 500 });
  await writeFile(target, output, { flag: "wx" });

  try {
    const asset = await prisma.$transaction(async (db) => {
      // Body parsing, image conversion and filesystem I/O can cross the exact
      // 72-hour boundary. Re-read entitlement and template limits at commit
      // time so a request opened before expiry cannot reserve quota afterward.
      const current = await db.slideshowProject.findFirst({
        where: { id: project.id, userId },
        select: {
          paid: true,
          complimentary: true,
          trialStartedAt: true,
          templateId: true,
        },
      });
      if (!current || !canEditSlideshow(current, new Date())) {
        throw new SlideshowAssetTrialExpiredError();
      }
      if (!isSlideshowTemplateId(current.templateId)) {
        throw new SlideshowAssetQuotaError();
      }
      const currentAssetLimit = Math.min(
        MAX_SLIDESHOW_ASSETS,
        slideshowTemplateById[current.templateId].capabilities.maxPhotos,
      );
      const reserved = await db.slideshowProject.updateMany({
        where: {
          id: project.id,
          userId,
          templateId: current.templateId,
          paid: current.paid,
          complimentary: current.complimentary,
          trialStartedAt: current.trialStartedAt,
          assetCount: { lt: currentAssetLimit },
          assetBytes: { lte: MAX_SLIDESHOW_ASSET_BYTES_PER_PROJECT - output.byteLength },
        },
        data: {
          assetCount: { increment: 1 },
          assetBytes: { increment: output.byteLength },
        },
      });
      if (reserved.count !== 1) throw new SlideshowAssetQuotaError();
      return db.slideshowAsset.create({
        data: {
          projectId: project.id,
          storageKey,
          originalName: path.basename(file.name).slice(0, 255) || `media.${extension}`,
          mimeType,
          kind,
          size: output.byteLength,
        },
        select: { id: true, kind: true, originalName: true },
      });
    });
    return Response.json({
      id: asset.id,
      kind: asset.kind,
      alt: asset.originalName,
      url: slideshowMediaPublicUrl(asset.id, project.shareToken),
    });
  } catch (error) {
    await unlink(target).catch(() => undefined);
    if (error instanceof SlideshowAssetTrialExpiredError) {
      return Response.json({ error: "trialExpired" }, { status: 403 });
    }
    if (error instanceof SlideshowAssetQuotaError) {
      return Response.json({ error: "assetLimit" }, { status: 409 });
    }
    throw error;
  }
}
