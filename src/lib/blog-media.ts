import "server-only";

import { unlink } from "node:fs/promises";
import path from "node:path";

const BLOG_MEDIA_FILENAME = /^[0-9a-f-]{36}\.webp$/;
const BLOG_MEDIA_URL = /\/blog-media\/([0-9a-f-]{36}\.webp)(?=["'\s<]|$)/g;

export function blogMediaRoot(): string {
  return process.env.BLOG_MEDIA_ROOT
    ?? path.join(/* turbopackIgnore: true */ process.cwd(), "data", "blog-media");
}

export function blogMediaPath(filename: string): string | null {
  if (!BLOG_MEDIA_FILENAME.test(filename)) return null;
  return path.join(/* turbopackIgnore: true */ blogMediaRoot(), filename);
}

export function blogMediaPublicUrl(filename: string): string {
  return `/blog-media/${filename}`;
}

export function blogOwnedMediaUrls(...values: Array<string | null | undefined>): Set<string> {
  const urls = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    if (value.startsWith("/blog-media/")) {
      const filename = value.slice("/blog-media/".length);
      if (BLOG_MEDIA_FILENAME.test(filename)) urls.add(blogMediaPublicUrl(filename));
    }
    for (const match of value.matchAll(BLOG_MEDIA_URL)) {
      const filename = match[1];
      if (filename) urls.add(blogMediaPublicUrl(filename));
    }
  }
  return urls;
}

export async function removeBlogMedia(urls: Iterable<string>): Promise<void> {
  await Promise.all(Array.from(urls, async (url) => {
    const filename = url.slice("/blog-media/".length);
    const filePath = blogMediaPath(filename);
    if (!filePath) return;
    try {
      await unlink(/* turbopackIgnore: true */ filePath);
    } catch (error) {
      const code = error instanceof Error && "code" in error
        ? String(error.code)
        : "";
      if (code !== "ENOENT") {
        console.error("Could not remove blog media", { url, error });
      }
    }
  }));
}
