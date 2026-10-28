import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { findOrCreateOAuthUser } from "@/lib/auth/google-user";
import { safeAuthReturnPath } from "@/lib/auth-redirects";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const nextPath = safeAuthReturnPath(request.nextUrl.searchParams.get("next"));
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    const query = new URLSearchParams({ authError: "google", next: nextPath });
    if (nextPath.startsWith("/editor2/")) query.set("reason", "publish");
    redirect(`/login?${query}`);
  }

  const user = await findOrCreateOAuthUser(prisma.user, email);
  await createSession(user.id);
  redirect(nextPath);
}
