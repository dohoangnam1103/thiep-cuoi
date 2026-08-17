import type { NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * Client-side render failures previously left no trace: the app had no error
 * boundary, so Next.js swapped in its built-in "This page couldn't load" screen
 * and the reason stayed inside the visitor's browser. This endpoint is the only
 * way we learn why a page died for someone we cannot reach, so it accepts
 * unauthenticated reports — anyone hitting the crash is by definition unable to
 * complete a normal request flow.
 */

const MAX_BODY_BYTES = 8 * 1024;
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 1000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    // Sweep expired buckets so an unauthenticated endpoint cannot grow the map
    // without bound from rotating IPs.
    if (hits.size > 5000) {
      for (const [candidate, value] of hits) {
        if (now > value.resetAt) hits.delete(candidate);
      }
    }
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

const reportSchema = z.object({
  scope: z.enum(["global", "segment"]),
  message: z.string().trim().max(500).optional(),
  digest: z.string().trim().max(120).optional(),
  name: z.string().trim().max(120).optional(),
  stack: z.string().trim().max(4000).optional(),
  url: z.string().trim().max(500).optional(),
  userAgent: z.string().trim().max(400).optional(),
  viewport: z.string().trim().max(40).optional(),
  devicePixelRatio: z.number().finite().min(0).max(10).optional(),
  deviceMemory: z.number().finite().min(0).max(1024).optional(),
  buildId: z.string().trim().max(120).optional(),
});

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }

  const clientIp =
    request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
  if (rateLimited(clientIp)) return new Response(null, { status: 429 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const parsed = reportSchema.safeParse(json);
  if (!parsed.success) return new Response(null, { status: 400 });

  const report = parsed.data;
  // Single-line so `docker logs thiepmungonline-web | grep CLIENT_ERROR` is
  // enough to pull every crash without a log aggregator.
  console.error(
    "CLIENT_ERROR",
    JSON.stringify({
      at: new Date().toISOString(),
      ip: clientIp,
      ...report,
    }),
  );

  return new Response(null, { status: 204 });
}
