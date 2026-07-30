import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { blogMediaPath } from "@/lib/blog-media";

export const runtime = "nodejs";

type BlogMediaRouteContext = {
  params: Promise<{ filename: string }>;
};

function streamBody(filePath: string): BodyInit {
  return Readable.toWeb(
    createReadStream(/* turbopackIgnore: true */ filePath),
  ) as ReadableStream;
}

async function findBlogMedia(filename: string) {
  const filePath = blogMediaPath(filename);
  if (!filePath) return null;
  try {
    const fileStats = await stat(/* turbopackIgnore: true */ filePath);
    return fileStats.isFile() ? { filePath, size: fileStats.size } : null;
  } catch {
    return null;
  }
}

function mediaHeaders(size: number): Headers {
  return new Headers({
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Length": String(size),
    "Content-Type": "image/webp",
    "X-Content-Type-Options": "nosniff",
  });
}

export async function GET(_request: Request, context: BlogMediaRouteContext) {
  const { filename } = await context.params;
  const media = await findBlogMedia(filename);
  if (!media) return new Response(null, { status: 404 });

  return new Response(streamBody(media.filePath), {
    status: 200,
    headers: mediaHeaders(media.size),
  });
}

export async function HEAD(_request: Request, context: BlogMediaRouteContext) {
  const { filename } = await context.params;
  const media = await findBlogMedia(filename);
  if (!media) return new Response(null, { status: 404 });

  return new Response(null, {
    status: 200,
    headers: mediaHeaders(media.size),
  });
}
