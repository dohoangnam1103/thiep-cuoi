"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  adoptAnonymousSession,
  getAnonymousSessionUserId,
} from "@/lib/auth/anonymous-account";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";

const credentialsSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export type AuthState = { error?: string } | undefined;

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email này đã được đăng ký" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // Someone who already started a draft is signing up from an anonymous
  // session: give that row credentials instead of creating a second account,
  // which would strand the draft (and any payment) on the cookie-only row.
  const anonymousUserId = await getAnonymousSessionUserId();
  const user = anonymousUserId
    ? await prisma.user.update({
        where: { id: anonymousUserId },
        data: { email, passwordHash },
      })
    : await prisma.user.create({ data: { email, passwordHash } });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return { error: "Email hoặc mật khẩu không đúng" };
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return { error: "Email hoặc mật khẩu không đúng" };
  }

  await adoptAnonymousSession(user.id);
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
