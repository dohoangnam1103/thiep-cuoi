import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { routing } from "./i18n/routing";
import { canonicalTemplatePath } from "./lib/seo-redirects";

const handleI18nRouting = createMiddleware(routing);
const foreignLocalePrefix = /^\/(?:en|ko|ja|zh)(?=\/|$)/;
const localizedForestLabPath = /^\/(?:en|ko|ja|zh)\/lab\/forest-wedding-journey\/?$/;
const vietnamesePaths: Record<string, string> = {
  "/templates": "/mau-thiep",
  "/pricing": "/bang-gia",
  "/create-wedding-invitation-online": "/tao-thiep-cuoi-online",
  "/tools": "/cong-cu",
  "/privacy-policy": "/chinh-sach-bao-mat",
  "/terms-of-service": "/dieu-khoan-su-dung",
  "/refund-policy": "/chinh-sach-hoan-tien",
};

export default function proxy(request: NextRequest) {
  const destination = canonicalTemplatePath(request.nextUrl.pathname);
  if (destination) {
    const url = request.nextUrl.clone();
    url.pathname = destination;
    return NextResponse.redirect(url, 308);
  }

  if (localizedForestLabPath.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (foreignLocalePrefix.test(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    const unprefixedPath = request.nextUrl.pathname.replace(foreignLocalePrefix, "") || "/";
    url.pathname = vietnamesePaths[unprefixedPath] ?? unprefixedPath;
    const response = NextResponse.redirect(url, 307);
    response.cookies.set("NEXT_LOCALE", routing.defaultLocale, { path: "/", sameSite: "lax" });
    return response;
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals, API routes, non-i18n app routes, and files with extensions
    "/((?!api|_next|_vercel|thiep|login|signup|dashboard|editor|admin|auth|uploads|.*\\..*).*)",
  ],
};
