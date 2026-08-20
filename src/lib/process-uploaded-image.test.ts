import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import sharp from "sharp";

import { processUploadedImageToWebp } from "@/lib/process-uploaded-image";
import {
  EDITOR_UPLOAD_IMAGE_FORMATS,
  hasHeifSignature,
  isAcceptedImageUpload,
  TEMPLATE_SUGGESTION_IMAGE_FORMATS,
} from "@/lib/upload-image-formats";

const HEIC_FIXTURE = path.join(process.cwd(), "tests", "fixtures", "sample.heic");

test("HEIC and HEIF files are accepted by every image-upload preset", () => {
  for (const file of [
    { name: "iphone-photo.HEIC", type: "" },
    { name: "iphone-photo", type: "image/heif" },
  ]) {
    assert.equal(isAcceptedImageUpload(file, EDITOR_UPLOAD_IMAGE_FORMATS), true);
    assert.equal(isAcceptedImageUpload(file, TEMPLATE_SUGGESTION_IMAGE_FORMATS), true);
  }
});

test("a real HEIC image is decoded and normalized to WebP", async () => {
  const bytes = await readFile(HEIC_FIXTURE);
  assert.equal(hasHeifSignature(bytes), true);

  const output = await processUploadedImageToWebp({
    bytes,
    allowedFormats: EDITOR_UPLOAD_IMAGE_FORMATS,
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 82,
  });
  const metadata = await sharp(output).metadata();

  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 48);
  assert.equal(metadata.height, 48);
});

test("a file renamed to HEIC is still rejected when its bytes are not an image", async () => {
  await assert.rejects(
    processUploadedImageToWebp({
      bytes: Buffer.from("not an image"),
      allowedFormats: EDITOR_UPLOAD_IMAGE_FORMATS,
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 82,
    }),
  );
});

test("an output byte limit adaptively compresses a valid image", async () => {
  const width = 1024;
  const height = 1024;
  const maxOutputBytes = 512 * 1024;
  const input = await sharp(randomBytes(width * height * 3), {
    raw: { width, height, channels: 3 },
  }).png({ compressionLevel: 0 }).toBuffer();

  assert.ok(input.byteLength > maxOutputBytes);

  const output = await processUploadedImageToWebp({
    bytes: input,
    allowedFormats: EDITOR_UPLOAD_IMAGE_FORMATS,
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 82,
    maxOutputBytes,
  });

  assert.ok(output.byteLength <= maxOutputBytes);
  assert.equal((await sharp(output).metadata()).format, "webp");
});
