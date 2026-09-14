import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { getDataRoot, resolveMediaPath } from "../../../lib/media-paths";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ filename: string }> };

function candidates(filename: string): string[] {
  const root = getDataRoot();
  const out: string[] = [];
  // Cloned master layout first, then the site-2 native uploads dir.
  for (const relative of [
    `media/editor-uploads/${filename}`,
    `media/uploads/${filename}`,
    `media/guest-media/${filename}`,
  ]) {
    try {
      out.push(resolveMediaPath(root, relative));
    } catch {
      // resolveMediaPath rejects traversal attempts — skip silently.
    }
  }
  return out;
}

export async function GET(_request: Request, context: RouteContext) {
  const { filename } = await context.params;
  if (filename.includes("/") || filename.includes("\\")) {
    return new Response(null, { status: 400 });
  }
  for (const filePath of candidates(filename)) {
    try {
      const fileStats = await stat(filePath);
      if (!fileStats.isFile()) continue;
      const stream = Readable.toWeb(createReadStream(filePath));
      return new Response(stream as ReadableStream, {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Length": String(fileStats.size),
          "Content-Type": "image/webp",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      // Try the next candidate directory.
    }
  }
  return new Response(null, { status: 404 });
}
