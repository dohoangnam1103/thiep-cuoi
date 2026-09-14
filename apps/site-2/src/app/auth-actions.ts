"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";
import {
  createSite2Session,
  destroySite2Session,
} from "../lib/session";
import vi from "@messages/vi.json";

export type Site2AuthState = { error?: string } | undefined;

function parseCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: vi.auth.invalidEmail };
  }
  if (password.length < 6) {
    return { error: vi.auth.shortPassword };
  }
  return { email, password };
}

export async function site2Signup(
  _prev: Site2AuthState,
  formData: FormData,
): Promise<Site2AuthState> {
  const parsed = parseCredentials(formData);
  if ("error" in parsed) return { error: parsed.error };

  const existing = await prisma.user.findUnique({
    where: { email: parsed.email },
  });
  if (existing?.passwordHash) {
    return { error: vi.auth.duplicateEmail };
  }

  const passwordHash = await bcrypt.hash(parsed.password, 10);
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash },
      })
    : await prisma.user.create({
        data: { email: parsed.email, passwordHash },
      });
  await createSite2Session(user.id);
  redirect("/dashboard");
}

export async function site2Login(
  _prev: Site2AuthState,
  formData: FormData,
): Promise<Site2AuthState> {
  const parsed = parseCredentials(formData);
  if ("error" in parsed) return { error: parsed.error };

  const user = await prisma.user.findUnique({
    where: { email: parsed.email },
  });
  if (!user?.passwordHash) {
    return { error: vi.auth.badCredentials };
  }
  const ok = await bcrypt.compare(parsed.password, user.passwordHash);
  if (!ok) {
    return { error: vi.auth.badCredentials };
  }
  await createSite2Session(user.id);
  redirect("/dashboard");
}

export async function site2Logout(): Promise<void> {
  await destroySite2Session();
  redirect("/");
}
