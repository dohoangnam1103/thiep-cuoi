import { NextResponse } from "next/server";

/**
 * Site-2 edge entrypoint (MVP passthrough).
 *
 * Exists so the site-2 build owns its middleware file and never inherits
 * the master `src/proxy.ts` (locale redirects, canonical hosts). Host
 * guards and canonical redirects arrive with the real domain (Task 8/9).
 */
export default function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
