import { prisma } from "@/lib/prisma";
import { parseTrackQuery, toTrackDto } from "@/lib/tracks";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { where, take, skip } = parseTrackQuery(searchParams);
  const [tracks, total] = await Promise.all([
    prisma.track.findMany({
      where,
      select: {
        id: true,
        title: true,
        artist: true,
        duration: true,
        url: true,
        tags: true,
        market: true,
      },
      orderBy: [{ addedAt: "desc" }, { id: "asc" }],
      take,
      skip,
    }),
    prisma.track.count({ where }),
  ]);

  return Response.json({ tracks: tracks.map(toTrackDto), total });
}
