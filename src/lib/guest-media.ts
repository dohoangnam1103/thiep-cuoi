import path from "node:path";

export const MAX_GUEST_MEDIA_FILES = 6;
export const MAX_GUEST_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_GUEST_VIDEO_BYTES = 80 * 1024 * 1024;
export const MAX_GUEST_MEDIA_REQUEST_BYTES = 90 * 1024 * 1024;
export const MAX_GUEST_MEDIA_ITEMS_PER_INVITATION = 500;
export const MAX_GUEST_MEDIA_BYTES_PER_INVITATION = 5 * 1024 * 1024 * 1024;

export const GUEST_VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

const STORAGE_KEY_PATTERN = /^[0-9a-f-]{36}\.(?:webp|mp4|mov|webm)$/;

export type GuestMediaKind = "image" | "video";

export function guestMediaRoot(): string {
  return process.env.GUEST_MEDIA_ROOT ?? path.join(/* turbopackIgnore: true */ process.cwd(), "data", "guest-media");
}

export function guestMediaPath(storageKey: string): string | null {
  if (!STORAGE_KEY_PATTERN.test(storageKey)) return null;
  return path.join(/* turbopackIgnore: true */ guestMediaRoot(), storageKey);
}

export function guestMediaPublicUrl(slug: string, id: string): string {
  return `/api/invitations/${encodeURIComponent(slug)}/contributions/${encodeURIComponent(id)}/file`;
}

export function isSupportedVideo(bytes: Buffer, mimeType: string): boolean {
  if (mimeType === "video/webm") {
    return bytes.length >= 4 && bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  }

  if (mimeType === "video/mp4" || mimeType === "video/quicktime") {
    return bytes.length >= 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp";
  }

  return false;
}

export function extensionForVideo(mimeType: string): "mp4" | "mov" | "webm" | null {
  if (mimeType === "video/mp4") return "mp4";
  if (mimeType === "video/quicktime") return "mov";
  if (mimeType === "video/webm") return "webm";
  return null;
}

export function safeDownloadName(value: string): string {
  const cleaned = value.replace(/[\r\n"\\/]/g, "_").replace(/[^\x20-\x7e]/g, "_").trim();
  return cleaned || "wedding-memory";
}
