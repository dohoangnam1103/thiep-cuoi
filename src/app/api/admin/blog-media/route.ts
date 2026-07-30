import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/admin-dal";
import {
  blogMediaPublicUrl,
  blogMediaRoot,
} from "@/lib/blog-media";
import { processUploadedImageToWebp } from "@/lib/process-uploaded-image";
import {
  EDITOR_UPLOAD_IMAGE_FORMATS,
  hasMatchingImageUploadDescriptor,
  isAcceptedImageUpload,
} from "@/lib/upload-image-formats";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_BYTES + 512 * 1024;
const purposeSchema = z.enum(["thumbnail", "content"]);

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ error: "Phiên đăng nhập đã hết hạn" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return Response.json({ error: "Yêu cầu upload vượt quá giới hạn" }, { status: 413 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const purpose = purposeSchema.safeParse(formData.get("purpose"));

  if (!(file instanceof File) || !purpose.success) {
    return Response.json({ error: "Dữ liệu upload không hợp lệ" }, { status: 400 });
  }
  if (
    !isAcceptedImageUpload(file, EDITOR_UPLOAD_IMAGE_FORMATS)
    || !hasMatchingImageUploadDescriptor(file, EDITOR_UPLOAD_IMAGE_FORMATS)
  ) {
    return Response.json({ error: "Định dạng ảnh không được hỗ trợ" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Ảnh vượt quá 8MB" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dimensions = purpose.data === "thumbnail"
    ? { maxWidth: 1600, maxHeight: 900 }
    : { maxWidth: 2000, maxHeight: 2000 };

  let output: Buffer;
  try {
    output = await processUploadedImageToWebp({
      bytes,
      allowedFormats: EDITOR_UPLOAD_IMAGE_FORMATS,
      ...dimensions,
      quality: 84,
    });
  } catch {
    return Response.json({ error: "Tệp không phải là ảnh hợp lệ" }, { status: 400 });
  }

  const uploadRoot = blogMediaRoot();
  await mkdir(/* turbopackIgnore: true */ uploadRoot, { recursive: true });

  const filename = `${randomUUID()}.webp`;
  await writeFile(
    /* turbopackIgnore: true */ path.join(uploadRoot, filename),
    output,
    { flag: "wx" },
  );

  return Response.json({ url: blogMediaPublicUrl(filename) });
}
