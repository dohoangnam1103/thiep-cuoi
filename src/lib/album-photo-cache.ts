import { albumPhotoSource } from "./album-photo-source";

export type PreparedPhoto = { image: HTMLImageElement; ready: boolean; promise: Promise<void> };
export class AlbumPhotoCache {
  private photos = new Map<string, PreparedPhoto>();

  prepare(original: string, width: number): PreparedPhoto {
    return prepareAlbumPhoto(this.photos, original, width);
  }

  retain(sources: Set<string>): void {
    for (const src of this.photos.keys()) if (!sources.has(src)) this.photos.delete(src);
  }

  clear(): void { this.photos.clear(); }
}

export function lightboxPhotoWidth(): number {
  return typeof window === "undefined" ? 1200
    : Math.min(1920, Math.ceil(window.innerWidth * 0.92 * Math.min(window.devicePixelRatio || 1, 3)));
}

function prepareAlbumPhoto(cache: Map<string, PreparedPhoto>, original: string, width: number): PreparedPhoto {
  const src = albumPhotoSource(original, width);
  const existing = cache.get(src);
  if (existing) return existing;
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  const prepared: PreparedPhoto = { image, ready: false, promise: Promise.resolve() };
  prepared.promise = image.decode().catch(async () => {
    if (src !== original) {
      image.src = original;
      await image.decode().catch(() => {});
    }
  }).then(() => { prepared.ready = true; });
  cache.set(src, prepared);
  return prepared;
}
