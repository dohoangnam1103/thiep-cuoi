import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getSlideshowEntitlement } from "@/lib/slideshow/project";
import { slideshowMediaPath } from "@/lib/slideshow/storage";

export const runtime = "nodejs";

const mediaHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, noimageindex",
};

function parseRange(value: string | null, size: number): { start: number; end: number } | null {
  const match = value?.match(/^bytes=(\d+)-(\d*)$/);
  if (!match) return null;
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) {
    return null;
  }
  return { start, end: Math.min(end, size - 1) };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const { assetId } = await params;
  const [asset, session] = await Promise.all([
    prisma.slideshowAsset.findUnique({
      where: { id: assetId },
      select: {
        storageKey: true,
        mimeType: true,
        project: {
          select: {
            userId: true,
            shareToken: true,
            paid: true,
            complimentary: true,
            trialStartedAt: true,
          },
        },
      },
    }),
    getSession(),
  ]);
  if (!asset) return new Response("Not found", { status: 404, headers: mediaHeaders });

  const requestToken = new URL(request.url).searchParams.get("token");
  const ownerAccess = session?.userId === asset.project.userId;
  const shareAccess = requestToken === asset.project.shareToken
    && getSlideshowEntitlement(asset.project) !== "expired";
  if (!ownerAccess && !shareAccess) {
    return new Response("Not found", { status: 404, headers: mediaHeaders });
  }

  const filePath = slideshowMediaPath(asset.storageKey);
  if (!filePath) return new Response("Not found", { status: 404, headers: mediaHeaders });
  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    return new Response("Not found", { status: 404, headers: mediaHeaders });
  }

  const isVideo = asset.mimeType.startsWith("video/");
  const range = isVideo ? parseRange(request.headers.get("range"), fileStat.size) : null;
  if (request.headers.has("range") && isVideo && !range) {
    return new Response(null, {
      status: 416,
      headers: { ...mediaHeaders, "Content-Range": `bytes */${fileStat.size}` },
    });
  }

  const nodeStream = range
    ? createReadStream(filePath, { start: range.start, end: range.end })
    : createReadStream(filePath);
  const body = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
  const length = range ? range.end - range.start + 1 : fileStat.size;

  return new Response(body, {
    status: range ? 206 : 200,
    headers: {
      ...mediaHeaders,
      "Accept-Ranges": isVideo ? "bytes" : "none",
      "Content-Length": String(length),
      "Content-Type": asset.mimeType,
      ...(range ? { "Content-Range": `bytes ${range.start}-${range.end}/${fileStat.size}` } : {}),
    },
  });
}
