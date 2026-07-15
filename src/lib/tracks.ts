import type { Prisma } from "@/generated/prisma/client";

type TrackDtoSource = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  tags: string;
  market: string;
};

export function parseTrackQuery(searchParams: URLSearchParams) {
  const locale = searchParams.get("locale") ?? "vi";
  const query = searchParams.get("q")?.trim();
  const requestedLimit = Number.parseInt(searchParams.get("limit") ?? "20", 10);
  const requestedOffset = Number.parseInt(searchParams.get("offset") ?? "0", 10);
  const where: Prisma.TrackWhereInput = {
    status: "ready",
    market: locale === "vi" ? { in: ["vn", "all"] } : "all",
  };

  if (query) {
    where.OR = [
      { title: { contains: query } },
      { artist: { contains: query } },
    ];
  }

  return {
    where,
    take: Number.isNaN(requestedLimit)
      ? 20
      : Math.min(50, Math.max(1, requestedLimit)),
    skip: Number.isNaN(requestedOffset) ? 0 : Math.max(0, requestedOffset),
  };
}

export function toTrackDto<T extends TrackDtoSource>(track: T) {
  let tags: string[] = [];

  try {
    const parsed = JSON.parse(track.tags);
    if (Array.isArray(parsed) && parsed.every((tag) => typeof tag === "string")) {
      tags = parsed;
    }
  } catch {
    tags = [];
  }

  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    duration: track.duration,
    url: track.url,
    tags,
    market: track.market,
  };
}
