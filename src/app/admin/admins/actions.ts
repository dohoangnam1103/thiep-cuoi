"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifySuperAdmin } from "@/lib/admin-dal";

export type AdminFormState = { error?: string; ok?: boolean } | undefined;

const rootSuperAdminEmail = "dohoangnamvn@gmail.com";

const adminSchema = z.object({
  email: z
    .string()
    .email("Email không hợp lệ")
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  isSuperAdmin: z.coerce.boolean().optional().default(false),
});

async function canRemoveSuperAdmin(id: string, currentAdminId: string): Promise<string | null> {
  if (id === currentAdminId) return "Không thể tự hạ quyền hoặc xoá chính mình";

  const admin = await prisma.admin.findUnique({ where: { id }, select: { email: true, isSuperAdmin: true } });
  if (!admin) return "Không tìm thấy admin";
  if (admin.email === rootSuperAdminEmail) return "Không thể xoá hoặc hạ quyền super admin gốc";
  if (!admin.isSuperAdmin) return null;

  const superAdminCount = await prisma.admin.count({ where: { isSuperAdmin: true } });
  return superAdminCount <= 1 ? "Không thể xoá hoặc hạ quyền super admin cuối cùng" : null;
}

export async function createAdmin(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await verifySuperAdmin();

  const parsed = adminSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    isSuperAdmin: formData.get("isSuperAdmin") === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { email, password, isSuperAdmin } = parsed.data;
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) return { error: "Email admin đã tồn tại" };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.admin.create({ data: { email, passwordHash, isSuperAdmin } });

  revalidatePath("/admin/admins");
  return { ok: true };
}

export async function toggleSuperAdmin(id: string): Promise<void> {
  const { adminId } = await verifySuperAdmin();
  const error = await canRemoveSuperAdmin(id, adminId);
  const admin = await prisma.admin.findUnique({ where: { id } });
  if (!admin || (admin.isSuperAdmin && error)) return;

  await prisma.admin.update({ where: { id }, data: { isSuperAdmin: !admin.isSuperAdmin } });
  revalidatePath("/admin/admins");
}

export async function deleteAdmin(id: string): Promise<void> {
  const { adminId } = await verifySuperAdmin();
  const error = await canRemoveSuperAdmin(id, adminId);
  if (error) return;

  await prisma.admin.delete({ where: { id } });
  revalidatePath("/admin/admins");
}
