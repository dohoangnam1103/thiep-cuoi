import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";

import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  editorUploadPath,
  editorUploadPublicUrl,
  editorUploadRoot,
} from "@/lib/editor-uploads";
import { prisma } from "@/lib/prisma";
import { processUploadedImageToWebp } from "@/lib/process-uploaded-image";
import { getSession } from "@/lib/session";
import {
  isAcceptedImageUpload,
  TEMPLATE_SUGGESTION_IMAGE_FORMATS,
} from "@/lib/upload-image-formats";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = 6 * 1024 * 1024;

const suggestionSchema = z.object({
  description: z.string().trim().min(1).max(800),
  notifyWhenAvailable: z.boolean(),
});

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return Response.json({ error: "requestTooLarge" }, { status: 413 });
  }

  const session = await getSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true },
  });
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "invalidRequest" }, { status: 400 });
  }

  const parsed = suggestionSchema.safeParse({
    description: formData.get("description"),
    notifyWhenAvailable: formData.get("notifyWhenAvailable") === "true",
  });
  if (!parsed.success) {
    return Response.json({ error: "invalidDescription" }, { status: 400 });
  }

  const imageValue = formData.get("referenceImage");
  const image = imageValue instanceof File && imageValue.size > 0 ? imageValue : null;
  if (image && !isAcceptedImageUpload(image, TEMPLATE_SUGGESTION_IMAGE_FORMATS)) {
    return Response.json({ error: "unsupportedImage" }, { status: 415 });
  }
  if (image && image.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "imageTooLarge" }, { status: 413 });
  }

  let absoluteImagePath: string | null = null;
  let referenceImageUrl: string | null = null;

  try {
    if (image) {
      const bytes = Buffer.from(await image.arrayBuffer());
      let output: Buffer;
      try {
        output = await processUploadedImageToWebp({
          bytes,
          allowedFormats: TEMPLATE_SUGGESTION_IMAGE_FORMATS,
          maxWidth: 1800,
          maxHeight: 1800,
          quality: 84,
        });
      } catch {
        return Response.json({ error: "unsupportedImage" }, { status: 415 });
      }

      const uploadDir = editorUploadRoot();
      await mkdir(/* turbopackIgnore: true */ uploadDir, { recursive: true });
      const filename = `${randomUUID()}.webp`;
      absoluteImagePath = editorUploadPath(filename);
      if (!absoluteImagePath) throw new Error("Unable to create template suggestion image path");
      await writeFile(/* turbopackIgnore: true */ absoluteImagePath, output, { flag: "wx" });
      referenceImageUrl = editorUploadPublicUrl(filename);
    }

    const suggestion = await prisma.templateSuggestion.create({
      data: {
        userId: user.id,
        contactEmail: user.email ?? "",
        description: parsed.data.description,
        referenceImageUrl,
        notifyWhenAvailable: parsed.data.notifyWhenAvailable && Boolean(user.email),
      },
      select: { id: true, status: true, createdAt: true },
    });

    return Response.json(
      {
        suggestion: {
          ...suggestion,
          createdAt: suggestion.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (absoluteImagePath) {
      await unlink(/* turbopackIgnore: true */ absoluteImagePath).catch(() => undefined);
    }
    console.error("Template suggestion submission failed", error);
    return Response.json({ error: "submitFailed" }, { status: 500 });
  }
}
