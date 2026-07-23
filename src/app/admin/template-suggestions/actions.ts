"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { verifyAdmin } from "@/lib/admin-dal";
import { prisma } from "@/lib/prisma";

const statusSchema = z.enum(["pending", "in_progress", "completed", "rejected"]);

export async function updateTemplateSuggestionStatus(id: string, status: string): Promise<void> {
  await verifyAdmin();
  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedStatus.success) return;

  await prisma.templateSuggestion.update({
    where: { id },
    data: { status: parsedStatus.data },
  }).catch(() => null);

  revalidatePath("/admin/template-suggestions");
  revalidatePath("/admin");
}
