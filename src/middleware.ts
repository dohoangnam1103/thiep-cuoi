import { NextResponse } from "next/server";

// next-intl locale middleware disabled: the app serves localized routes
// directly (/mau-thiep/* for vi, /en/* for en). Re-enable by restoring
// middleware.ts.bak once pages are moved under app/[locale]/.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
