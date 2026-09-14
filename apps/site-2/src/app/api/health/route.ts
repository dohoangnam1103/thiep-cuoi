import { NextResponse } from "next/server";

import { getSite2BuildInfo } from "../../../lib/build-info";

export async function GET() {
  const info = getSite2BuildInfo();
  return NextResponse.json({ app: info.appId, status: "ok", origin: info.origin });
}
