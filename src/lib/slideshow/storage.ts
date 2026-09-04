import path from "node:path";

const STORAGE_KEY_PATTERN = /^[0-9a-f-]{36}\.(?:webp|mp4|mov|webm)$/;
const ASSET_PATH_PATTERN = /^\/api\/slideshows\/media\/([^/]+)$/;
const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;

export const MAX_SLIDESHOW_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_SLIDESHOW_VIDEO_BYTES = 80 * 1024 * 1024;
export const MAX_SLIDESHOW_UPLOAD_REQUEST_BYTES = 82 * 1024 * 1024;
export const MAX_SLIDESHOW_ASSETS = 80;
export const MAX_SLIDESHOW_ASSET_BYTES_PER_PROJECT = 1024 * 1024 * 1024;
export const MAX_SLIDESHOW_PROJECTS_PER_ACCOUNT = 20;
export const MAX_UNPAID_SLIDESHOW_PROJECTS_PER_ACCOUNT = 3;

export function slideshowMediaRoot(): string {
  return process.env.SLIDESHOW_MEDIA_ROOT
    ?? path.join(/* turbopackIgnore: true */ process.cwd(), "data", "slideshow-media");
}

export function slideshowMediaPath(storageKey: string): string | null {
  if (!STORAGE_KEY_PATTERN.test(storageKey)) return null;
  return path.join(/* turbopackIgnore: true */ slideshowMediaRoot(), storageKey);
}

export function slideshowMediaPublicUrl(assetId: string, shareToken: string): string {
  return `/api/slideshows/media/${encodeURIComponent(assetId)}?token=${encodeURIComponent(shareToken)}`;
}

export function parseSlideshowMediaPublicUrl(value: string): {
  assetId: string;
  shareToken: string;
} | null {
  let url: URL;
  try {
    url = new URL(value, "https://slideshow.local");
  } catch {
    return null;
  }
  if (url.origin !== "https://slideshow.local" || url.hash) return null;
  const match = url.pathname.match(ASSET_PATH_PATTERN);
  if (!match || [...url.searchParams.keys()].some((key) => key !== "token")) return null;
  const shareToken = url.searchParams.get("token") ?? "";
  if (!SHARE_TOKEN_PATTERN.test(shareToken)) return null;
  const assetId = match[1];
  try {
    return { assetId: decodeURIComponent(assetId), shareToken };
  } catch {
    return null;
  }
}
