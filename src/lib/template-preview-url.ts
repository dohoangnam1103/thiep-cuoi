import { templatePreviewVersion } from "@/data/template-preview-version";

export function templatePreviewUrl(source: string): string {
  const separator = source.includes("?") ? "&" : "?";
  return `${source}${separator}v=${templatePreviewVersion}`;
}

/**
 * Preview screenshots are full-page captures — up to 768x16339. Handing one to a
 * plain <img> makes the browser decode the whole thing (~48MB of RGBA bitmap)
 * even though it is only ever painted a few hundred CSS pixels wide, which is
 * enough to get a tab killed on a memory-constrained machine. Route those
 * through the Next.js image optimizer so only a downscaled variant is decoded.
 */
export function templatePreviewOptimizedUrl(source: string, width: number, quality = 75): string {
  const params = new URLSearchParams({
    url: templatePreviewUrl(source),
    w: String(width),
    q: String(quality),
  });
  return `/_next/image?${params.toString()}`;
}
