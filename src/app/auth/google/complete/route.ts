import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { findOrCreateOAuthUser } from "@/lib/auth/google-user";
import { safeAuthReturnPath } from "@/lib/auth-redirects";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/login?authError=google");
  }

  const user = await findOrCreateOAuthUser(prisma.user, email);
  await createSession(user.id);
  redirect(safeAuthReturnPath(request.nextUrl.searchParams.get("next")));
}
