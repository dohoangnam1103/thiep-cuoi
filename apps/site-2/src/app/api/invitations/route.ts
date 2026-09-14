import { NextResponse } from "next/server";

import { createInvitation, listUserInvitations } from "../../../lib/dal";
import { getSite2Session } from "../../../lib/session";

export async function GET() {
  const session = await getSite2Session();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const invitations = await listUserInvitations(session.userId);
  return NextResponse.json({ invitations });
}

export async function POST(request: Request) {
  const session = await getSite2Session();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const templateSlug =
    typeof body === "object" && body !== null
      ? String((body as Record<string, unknown>).templateSlug ?? "")
      : "";
  if (!templateSlug) {
    return NextResponse.json({ error: "templateSlug is required" }, { status: 400 });
  }
  try {
    const invitation = await createInvitation(session.userId, templateSlug);
    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "create failed";
    const status = message.includes("not available") ? 422 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
