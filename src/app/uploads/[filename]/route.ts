import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import {
  editorUploadPath,
  legacyEditorUploadPath,
} from "@/lib/editor-uploads";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ filename: string }> };

function streamBody(filePath: string): BodyInit {
  return Readable.toWeb(
    createReadStream(/* turbopackIgnore: true */ filePath),
  ) as ReadableStream;
}

async function findUpload(filename: string) {
  const candidates = [
    editorUploadPath(filename),
    legacyEditorUploadPath(filename),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const filePath of candidates) {
    try {
      const fileStats = await stat(/* turbopackIgnore: true */ filePath);
      if (fileStats.isFile()) return { filePath, size: fileStats.size };
    } catch {
      // Thử vị trí legacy để các URL ảnh cũ vẫn hoạt động sau nâng cấp.
    }
  }
  return null;
}

function responseHeaders(size: number): Headers {
  return new Headers({
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Length": String(size),
    "Content-Type": "image/webp",
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { filename } = await context.params;
  const upload = await findUpload(filename);
  if (!upload) return new Response(null, { status: 404 });

  return new Response(streamBody(upload.filePath), {
    status: 200,
    headers: responseHeaders(upload.size),
  });
}

export async function HEAD(_request: Request, context: RouteContext) {
  const { filename } = await context.params;
  const upload = await findUpload(filename);
  if (!upload) return new Response(null, { status: 404 });

  return new Response(null, {
    status: 200,
    headers: responseHeaders(upload.size),
  });
}
