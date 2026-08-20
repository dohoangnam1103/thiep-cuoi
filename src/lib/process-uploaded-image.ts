import sharp, { type Sharp } from "sharp";

import {
  hasHeifSignature,
  type StandardUploadImageFormat,
} from "@/lib/upload-image-formats";

const MAX_UPLOAD_IMAGE_PIXELS = 60_000_000;
const MIN_WEBP_QUALITY = 50;
const OUTPUT_SCALE_FACTORS = [1, 0.75, 0.5, 0.25] as const;

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
  maxOutputBytes?: number;
};

export class ImageOutputTooLargeError extends Error {
  constructor() {
    super("Image could not be compressed to the required output size");
    this.name = "ImageOutputTooLargeError";
  }
}

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

function compressionQualities(quality: number): number[] {
  const minimumQuality = Math.min(quality, MIN_WEBP_QUALITY);
  const reducedQuality = Math.max(minimumQuality, quality - 20);
  return [...new Set([quality, reducedQuality, minimumQuality])];
}

function assertOutputLimit(maxOutputBytes: number | undefined): void {
  if (
    maxOutputBytes !== undefined
    && (!Number.isSafeInteger(maxOutputBytes) || maxOutputBytes <= 0)
  ) {
    throw new Error("Image output size limit must be a positive integer");
  }
}

async function encodeWebp(
  processor: Sharp,
  {
    maxWidth,
    maxHeight,
    quality,
    maxOutputBytes,
  }: Pick<ProcessUploadedImageOptions, "maxWidth" | "maxHeight" | "quality" | "maxOutputBytes">,
): Promise<Buffer> {
  assertOutputLimit(maxOutputBytes);

  const qualities = maxOutputBytes === undefined ? [quality] : compressionQualities(quality);
  const scales = maxOutputBytes === undefined ? [1] : OUTPUT_SCALE_FACTORS;

  for (const scale of scales) {
    for (const candidateQuality of qualities) {
      const image = scale === 1
        ? processor.clone()
        : processor.clone().resize({
          width: Math.max(1, Math.floor(maxWidth * scale)),
          height: Math.max(1, Math.floor(maxHeight * scale)),
          fit: "inside",
          withoutEnlargement: true,
        });
      const output = await image.webp({ quality: candidateQuality }).toBuffer();

      if (maxOutputBytes === undefined || output.byteLength <= maxOutputBytes) {
        return output;
      }
    }
  }

  throw new ImageOutputTooLargeError();
}

export async function processUploadedImageToWebp({
  bytes,
  allowedFormats,
  maxWidth,
  maxHeight,
  quality,
  maxOutputBytes,
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

  const normalized = processor
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });

  return encodeWebp(normalized, {
    maxWidth,
    maxHeight,
    quality,
    maxOutputBytes,
  });
}
