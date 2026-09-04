import { cache } from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";

export const getCurrentAdmin = cache(async () => {
  const session = await getAdminSession();
  if (!session) return null;
  return prisma.admin.findUnique({ where: { id: session.adminId } });
});

export async function verifyAdmin(): Promise<{
  adminId: string;
  adminEmail: string;
}> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }
  return { adminId: admin.id, adminEmail: admin.email };
}

export async function verifySuperAdmin(): Promise<{
  adminId: string;
  adminEmail: string;
}> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }
  if (!admin.isSuperAdmin) {
    redirect("/admin");
  }
  return { adminId: admin.id, adminEmail: admin.email };
}
