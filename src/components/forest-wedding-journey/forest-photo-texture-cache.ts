import type { Texture } from "three";

import { estimateExactRgbaMipBytes } from "./forest-world-data";

const FOREST_PHOTO_CACHE_LIMIT = 3;

type ForestPhotoCacheEntry = {
  disposed: boolean;
  retained: boolean;
  readonly src: string;
  readonly texture: Texture;
  users: number;
};

export type ForestPhotoTextureLease = {
  readonly cached: boolean;
  readonly release: () => void;
  readonly texture: Texture;
};

export type ForestPhotoTextureDiagnostic = {
  readonly decodedRgbaMipBytes: number | null;
  readonly height: number | null;
  readonly leases: number;
  readonly retained: boolean;
  readonly src: string;
  readonly width: number | null;
};

export type ForestPhotoTextureCacheDiagnostics = {
  readonly activeLeases: number;
  readonly decodedRgbaMipBytes: number;
  readonly liveCount: number;
  readonly retainedCount: number;
  readonly textures: readonly ForestPhotoTextureDiagnostic[];
  readonly unmeasuredCount: number;
};

function readPositiveIntegerProperty(
  value: object,
  properties: readonly string[],
): number | null {
  for (const property of properties) {
    const candidate = Reflect.get(value, property);
    if (
      typeof candidate === "number"
      && Number.isInteger(candidate)
      && candidate > 0
    ) return candidate;
  }
  return null;
}

function readTextureDimensions(
  texture: Texture,
): { readonly height: number; readonly width: number } | null {
  const source = texture.source as { readonly data?: unknown };
  const image = source.data;
  if (typeof image !== "object" || image === null) return null;
  const width = readPositiveIntegerProperty(
    image,
    ["naturalWidth", "videoWidth", "width"],
  );
  const height = readPositiveIntegerProperty(
    image,
    ["naturalHeight", "videoHeight", "height"],
  );
  return width !== null && height !== null ? { height, width } : null;
}

export class ForestPhotoTextureCache {
  readonly #entries = new Map<string, ForestPhotoCacheEntry>();
  readonly #limit: number;
  readonly #liveEntries = new Set<ForestPhotoCacheEntry>();
  #onSizeChange: (size: number) => void = () => {};

  constructor(requestedLimit = FOREST_PHOTO_CACHE_LIMIT) {
    this.#limit = Math.max(
      1,
      Math.min(FOREST_PHOTO_CACHE_LIMIT, Math.floor(requestedLimit)),
    );
  }

  get size(): number {
    return this.#entries.size;
  }

  peek(src: string): Texture | null {
    return this.#entries.get(src)?.texture ?? null;
  }

  setSizeReporter(onSizeChange: (size: number) => void): void {
    this.#onSizeChange = onSizeChange;
    this.#onSizeChange(this.#entries.size);
  }

  getDiagnostics(): ForestPhotoTextureCacheDiagnostics {
    const textures = [...this.#liveEntries].map((entry) => {
      const dimensions = readTextureDimensions(entry.texture);
      return {
        decodedRgbaMipBytes: dimensions
          ? estimateExactRgbaMipBytes(dimensions.width, dimensions.height)
          : null,
        height: dimensions?.height ?? null,
        leases: entry.users,
        retained: entry.retained,
        src: entry.src,
        width: dimensions?.width ?? null,
      } satisfies ForestPhotoTextureDiagnostic;
    });
    return {
      activeLeases: textures.reduce((total, texture) => total + texture.leases, 0),
      decodedRgbaMipBytes: textures.reduce(
        (total, texture) => total + (texture.decodedRgbaMipBytes ?? 0),
        0,
      ),
      liveCount: textures.length,
      retainedCount: this.#entries.size,
      textures,
      unmeasuredCount: textures.filter(
        ({ decodedRgbaMipBytes }) => decodedRgbaMipBytes === null,
      ).length,
    };
  }

  acquire(src: string): ForestPhotoTextureLease | null {
    const entry = this.#entries.get(src);
    if (!entry) return null;
    this.#entries.delete(src);
    this.#entries.set(src, entry);
    return this.#createCachedLease(entry);
  }

  storeAndAcquire(src: string, texture: Texture): ForestPhotoTextureLease {
    const existing = this.#entries.get(src);
    if (existing) {
      texture.dispose();
      this.#entries.delete(src);
      this.#entries.set(src, existing);
      return this.#createCachedLease(existing);
    }

    while (this.#entries.size >= this.#limit) {
      const evictable = [...this.#entries].find(([, entry]) => entry.users === 0);
      if (!evictable) return this.#createOwnedLease(src, texture);
      const [evictedSrc, entry] = evictable;
      this.#entries.delete(evictedSrc);
      entry.retained = false;
      this.#disposeEntry(entry);
    }

    const entry: ForestPhotoCacheEntry = {
      disposed: false,
      retained: true,
      src,
      texture,
      users: 0,
    };
    this.#entries.set(src, entry);
    this.#liveEntries.add(entry);
    this.#onSizeChange(this.#entries.size);
    return this.#createCachedLease(entry);
  }

  dispose(): void {
    this.#entries.forEach((entry) => {
      entry.retained = false;
      this.#disposeEntry(entry);
    });
    this.#entries.clear();
    this.#onSizeChange(0);
  }

  #createCachedLease(entry: ForestPhotoCacheEntry): ForestPhotoTextureLease {
    entry.users += 1;
    let released = false;
    return {
      cached: true,
      release: () => {
        if (released) return;
        released = true;
        entry.users = Math.max(0, entry.users - 1);
        if (!entry.retained) this.#disposeEntry(entry);
      },
      texture: entry.texture,
    };
  }

  #createOwnedLease(src: string, texture: Texture): ForestPhotoTextureLease {
    const entry: ForestPhotoCacheEntry = {
      disposed: false,
      retained: false,
      src,
      texture,
      users: 1,
    };
    this.#liveEntries.add(entry);
    let released = false;
    return {
      cached: false,
      release: () => {
        if (released) return;
        released = true;
        entry.users = 0;
        this.#disposeEntry(entry);
      },
      texture,
    };
  }

  #disposeEntry(entry: ForestPhotoCacheEntry): void {
    if (entry.disposed || entry.users > 0) return;
    entry.disposed = true;
    this.#liveEntries.delete(entry);
    entry.texture.dispose();
  }
}
