import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { NextRequest } from "next/server";

import { editorUploadPublicUrl, editorUploadRoot } from "@/lib/editor-uploads";
import { processUploadedImageToWebp } from "@/lib/process-uploaded-image";
import { getSession } from "@/lib/session";
import {
  EDITOR_UPLOAD_IMAGE_FORMATS,
  isAcceptedImageUpload,
} from "@/lib/upload-image-formats";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Thiếu tệp" }, { status: 400 });
  }

  if (!isAcceptedImageUpload(file, EDITOR_UPLOAD_IMAGE_FORMATS)) {
    return Response.json({ error: "Định dạng ảnh không hỗ trợ" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Ảnh vượt quá 5MB" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  let output: Buffer;
  try {
    // Animated GIFs flatten to the first frame when re-encoded as static WebP — acceptable for invites.
    output = await processUploadedImageToWebp({
      bytes,
      allowedFormats: EDITOR_UPLOAD_IMAGE_FORMATS,
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 82,
    });
  } catch {
    return Response.json({ error: "Định dạng ảnh không hợp lệ" }, { status: 400 });
  }

  const uploadDir = editorUploadRoot();
  await mkdir(uploadDir, { recursive: true });

  const filename = `${randomUUID()}.webp`;
  await writeFile(path.join(uploadDir, filename), output);

  return Response.json({ url: editorUploadPublicUrl(filename) });
}
