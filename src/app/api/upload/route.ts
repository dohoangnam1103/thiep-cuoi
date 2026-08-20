import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { NextRequest } from "next/server";

import { getAdminSession } from "@/lib/admin-session";
import {
  parseBoundedFormData,
  RequestBodyTooLargeError,
} from "@/lib/bounded-form-data";
import { editorUploadPublicUrl, editorUploadRoot } from "@/lib/editor-uploads";
import {
  ImageOutputTooLargeError,
  processUploadedImageToWebp,
} from "@/lib/process-uploaded-image";
import { getSession } from "@/lib/session";
import {
  MAX_IMAGE_UPLOAD_OUTPUT_BYTES,
  MAX_IMAGE_UPLOAD_REQUEST_BYTES,
  MAX_IMAGE_UPLOAD_SOURCE_BYTES,
} from "@/lib/upload-image-limits";
import {
  EDITOR_UPLOAD_IMAGE_FORMATS,
  isAcceptedImageUpload,
} from "@/lib/upload-image-formats";

export async function POST(request: NextRequest) {
  const [session, adminSession] = await Promise.all([getSession(), getAdminSession()]);
  if (!session && !adminSession) {
    return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await parseBoundedFormData(request, MAX_IMAGE_UPLOAD_REQUEST_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: "sourceTooLarge" }, { status: 413 });
    }
    return Response.json({ error: "Dữ liệu upload không hợp lệ" }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Thiếu tệp" }, { status: 400 });
  }

  if (!isAcceptedImageUpload(file, EDITOR_UPLOAD_IMAGE_FORMATS)) {
    return Response.json({ error: "Định dạng ảnh không hỗ trợ" }, { status: 415 });
  }
  if (file.size > MAX_IMAGE_UPLOAD_SOURCE_BYTES) {
    return Response.json({ error: "sourceTooLarge" }, { status: 413 });
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
      maxOutputBytes: MAX_IMAGE_UPLOAD_OUTPUT_BYTES,
    });
  } catch (error) {
    if (error instanceof ImageOutputTooLargeError) {
      return Response.json({ error: "outputTooLarge" }, { status: 422 });
    }
    return Response.json({ error: "Định dạng ảnh không hợp lệ" }, { status: 400 });
  }

  const uploadDir = editorUploadRoot();
  await mkdir(uploadDir, { recursive: true });

  const filename = `${randomUUID()}.webp`;
  await writeFile(path.join(uploadDir, filename), output);

  return Response.json({ url: editorUploadPublicUrl(filename) });
}
