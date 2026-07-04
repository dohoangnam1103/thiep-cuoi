"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createAdminSession, destroyAdminSession } from "@/lib/admin-session";

const credentialsSchema = z.object({
  email: z
    .string()
    .email("Email không hợp lệ")
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export type AdminAuthState = { error?: string } | undefined;

export async function adminLogin(_prev: AdminAuthState, formData: FormData): Promise<AdminAuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { email, password } = parsed.data;
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    return { error: "Email hoặc mật khẩu không đúng" };
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    return { error: "Email hoặc mật khẩu không đúng" };
  }

  await createAdminSession(admin.id);
  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}
