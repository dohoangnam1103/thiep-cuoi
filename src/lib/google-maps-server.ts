import "server-only";

import {
  coordinatesFromGoogleMapsUrl,
  isGoogleMapsShortUrl,
  isGoogleMapsUrl,
} from "@/lib/google-maps";

const MAX_MAP_VALUE_LENGTH = 1_200;
const expandedUrlCache = new Map<string, string>();

function cacheExpandedUrl(source: string, result: string): string {
  if (expandedUrlCache.size >= 100) {
    const firstKey = expandedUrlCache.keys().next().value;
    if (typeof firstKey === "string") expandedUrlCache.delete(firstKey);
  }
  expandedUrlCache.set(source, result);
  return result;
}

export async function expandGoogleMapsShortUrl(value: string): Promise<string> {
  const source = value.trim();
  if (!isGoogleMapsShortUrl(source)) return source;

  const cached = expandedUrlCache.get(source);
  if (cached) return cached;

  try {
    const response = await fetch(source, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
      headers: { "user-agent": "Mozilla/5.0" },
    });
    const location = response.headers.get("location");
    if (!location) return source;

    const expanded = new URL(location, source).toString();
    if (!isGoogleMapsUrl(expanded)) return source;
    if (expanded.length <= MAX_MAP_VALUE_LENGTH) return cacheExpandedUrl(source, expanded);

    return cacheExpandedUrl(
      source,
      coordinatesFromGoogleMapsUrl(expanded) ?? source,
    );
  } catch {
    return source;
  }
}
