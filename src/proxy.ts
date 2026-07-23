import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { routing } from "./i18n/routing";
import { canonicalTemplatePath } from "./lib/seo-redirects";

const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const destination = canonicalTemplatePath(request.nextUrl.pathname);
  if (destination) {
    const url = request.nextUrl.clone();
    url.pathname = destination;
    return NextResponse.redirect(url, 308);
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals, API routes, non-i18n app routes, and files with extensions
    "/((?!api|_next|_vercel|thiep|login|signup|dashboard|editor|admin|auth|uploads|.*\\..*).*)",
  ],
};
