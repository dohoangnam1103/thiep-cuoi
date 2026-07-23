export type StandardUploadImageFormat = "jpeg" | "png" | "webp" | "gif";

type UploadFileDescriptor = {
  name: string;
  type: string;
};

const HEIF_MIME_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const HEIF_EXTENSIONS = new Set(["heic", "heif"]);
const HEIF_BRANDS = new Set(["mif1", "msf1", "heic", "heix", "hevc", "hevx"]);

const STANDARD_MIME_TYPES: Record<StandardUploadImageFormat, readonly string[]> = {
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  gif: ["image/gif"],
};

const STANDARD_EXTENSIONS: Record<StandardUploadImageFormat, readonly string[]> = {
  jpeg: ["jpg", "jpeg"],
  png: ["png"],
  webp: ["webp"],
  gif: ["gif"],
};

export const EDITOR_UPLOAD_IMAGE_FORMATS = ["jpeg", "png", "webp", "gif"] as const;
export const TEMPLATE_SUGGESTION_IMAGE_FORMATS = ["jpeg", "png", "webp"] as const;

function extensionOf(fileName: string): string {
  return fileName.split(".").pop()?.trim().toLowerCase() ?? "";
}

function acceptValue(formats: readonly StandardUploadImageFormat[]): string {
  return [
    ...formats.flatMap((format) => STANDARD_MIME_TYPES[format]),
    ...HEIF_MIME_TYPES,
    ".heic",
    ".heif",
  ].join(",");
}

export const EDITOR_IMAGE_ACCEPT = acceptValue(EDITOR_UPLOAD_IMAGE_FORMATS);
export const GUEST_IMAGE_ACCEPT = EDITOR_IMAGE_ACCEPT;
export const TEMPLATE_SUGGESTION_IMAGE_ACCEPT = acceptValue(TEMPLATE_SUGGESTION_IMAGE_FORMATS);

export function isHeifUpload(file: UploadFileDescriptor): boolean {
  return HEIF_MIME_TYPES.has(file.type.trim().toLowerCase()) || HEIF_EXTENSIONS.has(extensionOf(file.name));
}

export function isAcceptedImageUpload(
  file: UploadFileDescriptor,
  allowedFormats: readonly StandardUploadImageFormat[],
): boolean {
  if (isHeifUpload(file)) return true;

  const mimeType = file.type.trim().toLowerCase();
  const extension = extensionOf(file.name);
  return allowedFormats.some(
    (format) =>
      STANDARD_MIME_TYPES[format].includes(mimeType)
      || STANDARD_EXTENSIONS[format].includes(extension),
  );
}

function ascii(bytes: Uint8Array, start: number): string {
  return String.fromCharCode(bytes[start], bytes[start + 1], bytes[start + 2], bytes[start + 3]);
}

export function hasHeifSignature(bytes: Uint8Array): boolean {
  return bytes.length >= 12
    && ascii(bytes, 4) === "ftyp"
    && HEIF_BRANDS.has(ascii(bytes, 8));
}
