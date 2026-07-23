import sharp, { type Sharp } from "sharp";

import {
  hasHeifSignature,
  type StandardUploadImageFormat,
} from "@/lib/upload-image-formats";

const MAX_UPLOAD_IMAGE_PIXELS = 60_000_000;

type HeifFrame = {
  width: number;
  height: number;
  decode(): Promise<{
    width: number;
    height: number;
    data: Uint8ClampedArray;
  }>;
};

type HeifFrames = HeifFrame[] & {
  dispose(): void;
};

type ProcessUploadedImageOptions = {
  bytes: Buffer;
  allowedFormats: readonly StandardUploadImageFormat[];
  maxWidth: number;
  maxHeight: number;
  quality: number;
};

function assertSafeDimensions(width: number | undefined, height: number | undefined): asserts width is number {
  if (
    !width
    || !height
    || !Number.isSafeInteger(width)
    || !Number.isSafeInteger(height)
    || width * height > MAX_UPLOAD_IMAGE_PIXELS
  ) {
    throw new Error("Image dimensions are invalid or too large");
  }
}

async function heifProcessor(bytes: Buffer): Promise<Sharp> {
  const { default: decode } = await import("heic-decode");
  const frames = await decode.all({ buffer: bytes }) as HeifFrames;

  try {
    const frame = frames[0];
    if (!frame) throw new Error("HEIF image contains no frames");
    assertSafeDimensions(frame.width, frame.height);

    const decoded = await frame.decode();
    assertSafeDimensions(decoded.width, decoded.height);

    return sharp(Buffer.from(decoded.data), {
      failOn: "error",
      limitInputPixels: MAX_UPLOAD_IMAGE_PIXELS,
      raw: {
        width: decoded.width,
        height: decoded.height,
        channels: 4,
      },
    });
  } finally {
    frames.dispose();
  }
}

export async function processUploadedImageToWebp({
  bytes,
  allowedFormats,
  maxWidth,
  maxHeight,
  quality,
}: ProcessUploadedImageOptions): Promise<Buffer> {
  const isHeif = hasHeifSignature(bytes);
  const processor = isHeif
    ? await heifProcessor(bytes)
    : sharp(bytes, { failOn: "error", limitInputPixels: MAX_UPLOAD_IMAGE_PIXELS });

  if (!isHeif) {
    const metadata = await processor.metadata();
    if (!metadata.format || !allowedFormats.includes(metadata.format as StandardUploadImageFormat)) {
      throw new Error("Unsupported image format");
    }
    assertSafeDimensions(metadata.width, metadata.height);
  }

  return processor
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();
}
