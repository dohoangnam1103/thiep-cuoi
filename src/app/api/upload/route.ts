import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { NextRequest } from "next/server";
import sharp from "sharp";

import { getSession } from "@/lib/session";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "gif"]);

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

  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: "Định dạng ảnh không hỗ trợ" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Ảnh vượt quá 5MB" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  let output: Buffer;
  try {
    const img = sharp(bytes, { failOn: "error" });
    const meta = await img.metadata();
    if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
      return Response.json({ error: "Định dạng ảnh không hợp lệ" }, { status: 415 });
    }
    // Animated GIFs flatten to the first frame when re-encoded as static WebP — acceptable for invites.
    output = await img
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return Response.json({ error: "Định dạng ảnh không hợp lệ" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${randomUUID()}.webp`;
  await writeFile(path.join(uploadDir, filename), output);

  return Response.json({ url: `/uploads/${filename}` });
}
