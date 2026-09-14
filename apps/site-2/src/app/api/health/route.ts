import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ app: "site-2", status: "ok" });
}
