import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";

import type { NextRequest } from "next/server";

import {
  extensionForVideo,
  guestMediaPath,
  guestMediaPublicUrl,
  guestMediaRoot,
  GUEST_VIDEO_TYPES,
  isSupportedVideo,
  MAX_GUEST_IMAGE_BYTES,
  MAX_GUEST_MEDIA_BYTES_PER_INVITATION,
  MAX_GUEST_MEDIA_FILES,
  MAX_GUEST_MEDIA_ITEMS_PER_INVITATION,
  MAX_GUEST_MEDIA_REQUEST_BYTES,
  MAX_GUEST_VIDEO_BYTES,
  type GuestMediaKind,
} from "@/lib/guest-media";
import { prisma } from "@/lib/prisma";
import { processUploadedImageToWebp } from "@/lib/process-uploaded-image";
import {
  EDITOR_UPLOAD_IMAGE_FORMATS,
  isAcceptedImageUpload,
} from "@/lib/upload-image-formats";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string }> };

type StoredUpload = {
  storageKey: string;
  absolutePath: string;
  contributorName: string;
  originalName: string;
  mimeType: string;
  kind: GuestMediaKind;
  size: number;
};

function serializeMedia(slug: string, media: {
  id: string;
  contributorName: string;
  originalName: string;
  mimeType: string;
  kind: string;
  size: number;
  createdAt: Date;
}) {
  return {
    id: media.id,
    contributorName: media.contributorName,
    originalName: media.originalName,
    mimeType: media.mimeType,
    kind: media.kind === "video" ? "video" as const : "image" as const,
    size: media.size,
    createdAt: media.createdAt.toISOString(),
    url: guestMediaPublicUrl(slug, media.id),
  };
}

async function removeStoredFiles(uploads: StoredUpload[]) {
  await Promise.all(uploads.map((upload) => unlink(/* turbopackIgnore: true */ upload.absolutePath).catch(() => undefined)));
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const invitation = await prisma.invitation.findFirst({
    where: { slug, status: "published" },
    select: { id: true },
  });
  if (!invitation) return Response.json({ error: "notFound" }, { status: 404 });

  const media = await prisma.guestMedia.findMany({
    where: { invitationId: invitation.id },
    orderBy: { createdAt: "desc" },
    take: MAX_GUEST_MEDIA_ITEMS_PER_INVITATION,
  });

  return Response.json({ media: media.map((item) => serializeMedia(slug, item)) });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_GUEST_MEDIA_REQUEST_BYTES) {
    return Response.json({ error: "requestTooLarge" }, { status: 413 });
  }

  const { slug } = await context.params;
  const invitation = await prisma.invitation.findFirst({
    where: { slug, status: "published" },
    select: { id: true },
  });
  if (!invitation) return Response.json({ error: "notFound" }, { status: 404 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "invalidRequest" }, { status: 400 });
  }

  const contributorValue = formData.get("contributorName");
  const contributorName = typeof contributorValue === "string" ? contributorValue.trim() : "";
  if (!contributorName || contributorName.length > 80) {
    return Response.json({ error: "invalidName" }, { status: 400 });
  }

  const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length === 0) return Response.json({ error: "missingFiles" }, { status: 400 });
  if (files.length > MAX_GUEST_MEDIA_FILES) {
    return Response.json({ error: "tooManyFiles" }, { status: 400 });
  }
  if (files.reduce((total, file) => total + file.size, 0) > MAX_GUEST_MEDIA_REQUEST_BYTES) {
    return Response.json({ error: "requestTooLarge" }, { status: 413 });
  }

  const currentUsage = await prisma.guestMedia.aggregate({
    where: { invitationId: invitation.id },
    _count: { _all: true },
    _sum: { size: true },
  });
  if (currentUsage._count._all + files.length > MAX_GUEST_MEDIA_ITEMS_PER_INVITATION) {
    return Response.json({ error: "galleryFull" }, { status: 409 });
  }

  const uploadRoot = guestMediaRoot();
  await mkdir(/* turbopackIgnore: true */ uploadRoot, { recursive: true });
  const storedUploads: StoredUpload[] = [];

  try {
    for (const file of files) {
      const originalName = file.name.slice(0, 240) || "wedding-memory";
      const bytes = Buffer.from(await file.arrayBuffer());

      if (isAcceptedImageUpload(file, EDITOR_UPLOAD_IMAGE_FORMATS)) {
        if (file.size > MAX_GUEST_IMAGE_BYTES) {
          await removeStoredFiles(storedUploads);
          return Response.json({ error: "imageTooLarge" }, { status: 413 });
        }

        let output: Buffer;
        try {
          output = await processUploadedImageToWebp({
            bytes,
            allowedFormats: EDITOR_UPLOAD_IMAGE_FORMATS,
            maxWidth: 2400,
            maxHeight: 2400,
            quality: 84,
          });
        } catch {
          await removeStoredFiles(storedUploads);
          return Response.json({ error: "invalidFile" }, { status: 415 });
        }

        const storageKey = `${randomUUID()}.webp`;
        const absolutePath = guestMediaPath(storageKey);
        if (!absolutePath) throw new Error("Unable to create media path");
        await writeFile(/* turbopackIgnore: true */ absolutePath, output, { flag: "wx" });
        storedUploads.push({
          storageKey,
          absolutePath,
          contributorName,
          originalName,
          mimeType: "image/webp",
          kind: "image",
          size: output.length,
        });
        continue;
      }

      if (GUEST_VIDEO_TYPES.has(file.type)) {
        if (file.size > MAX_GUEST_VIDEO_BYTES) {
          await removeStoredFiles(storedUploads);
          return Response.json({ error: "videoTooLarge" }, { status: 413 });
        }
        const extension = extensionForVideo(file.type);
        if (!extension || !isSupportedVideo(bytes, file.type)) {
          await removeStoredFiles(storedUploads);
          return Response.json({ error: "invalidFile" }, { status: 415 });
        }

        const storageKey = `${randomUUID()}.${extension}`;
        const absolutePath = guestMediaPath(storageKey);
        if (!absolutePath) throw new Error("Unable to create media path");
        await writeFile(/* turbopackIgnore: true */ absolutePath, bytes, { flag: "wx" });
        storedUploads.push({
          storageKey,
          absolutePath,
          contributorName,
          originalName,
          mimeType: file.type,
          kind: "video",
          size: bytes.length,
        });
        continue;
      }

      await removeStoredFiles(storedUploads);
      return Response.json({ error: "unsupportedType" }, { status: 415 });
    }

    const newBytes = storedUploads.reduce((total, upload) => total + upload.size, 0);
    if ((currentUsage._sum.size ?? 0) + newBytes > MAX_GUEST_MEDIA_BYTES_PER_INVITATION) {
      await removeStoredFiles(storedUploads);
      return Response.json({ error: "galleryFull" }, { status: 409 });
    }

    await prisma.guestMedia.createMany({
      data: storedUploads.map((upload) => ({
        invitationId: invitation.id,
        contributorName: upload.contributorName,
        storageKey: upload.storageKey,
        originalName: upload.originalName,
        mimeType: upload.mimeType,
        kind: upload.kind,
        size: upload.size,
      })),
    });

    const created = await prisma.guestMedia.findMany({
      where: { storageKey: { in: storedUploads.map((upload) => upload.storageKey) } },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ media: created.map((item) => serializeMedia(slug, item)) }, { status: 201 });
  } catch (error) {
    await removeStoredFiles(storedUploads);
    console.error("Guest media upload failed", error);
    return Response.json({ error: "uploadFailed" }, { status: 500 });
  }
}
