import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import type { NextRequest } from "next/server";

import { guestMediaPath, safeDownloadName } from "@/lib/guest-media";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string; mediaId: string }> };

function streamBody(filePath: string, start?: number, end?: number): BodyInit {
  return Readable.toWeb(createReadStream(/* turbopackIgnore: true */ filePath, start === undefined ? undefined : { start, end })) as ReadableStream;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug, mediaId } = await context.params;
  const media = await prisma.guestMedia.findFirst({
    where: {
      id: mediaId,
      invitation: { slug, status: "published" },
    },
  });
  if (!media) return new Response(null, { status: 404 });

  const filePath = guestMediaPath(media.storageKey);
  if (!filePath) return new Response(null, { status: 404 });

  let fileStats;
  try {
    fileStats = await stat(/* turbopackIgnore: true */ filePath);
  } catch {
    return new Response(null, { status: 404 });
  }

  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": media.mimeType,
  });

  if (request.nextUrl.searchParams.get("download") === "1") {
    const fallback = safeDownloadName(media.originalName);
    headers.set("Content-Disposition", `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(media.originalName)}`);
  }

  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) return new Response(null, { status: 416 });
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), fileStats.size - 1) : fileStats.size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= fileStats.size) {
      headers.set("Content-Range", `bytes */${fileStats.size}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set("Content-Length", String(end - start + 1));
    headers.set("Content-Range", `bytes ${start}-${end}/${fileStats.size}`);
    return new Response(streamBody(filePath, start, end), { status: 206, headers });
  }

  headers.set("Content-Length", String(fileStats.size));
  return new Response(streamBody(filePath), { status: 200, headers });
}
