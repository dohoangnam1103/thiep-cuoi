import { NextResponse } from "next/server";

import { getSite2Session } from "../../../../lib/session";

export async function GET() {
  const session = await getSite2Session();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, userId: session.userId });
}
