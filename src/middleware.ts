import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Skip Next.js internals, API routes, non-i18n app routes, and files with extensions
    "/((?!api|_next|_vercel|thiep|login|signup|dashboard|editor|uploads|.*\\..*).*)",
  ],
};
