import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { findOrCreateGoogleUser } from "@/lib/auth/google-user";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/login?authError=google");
  }

  const user = await findOrCreateGoogleUser(prisma.user, email);
  await createSession(user.id);
  redirect("/dashboard");
}
