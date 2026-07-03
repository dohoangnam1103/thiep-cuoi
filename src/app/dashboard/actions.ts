"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { templates } from "@/data/chungdoi";
import { getOrCreateUserId } from "@/lib/dal";

const DEFAULT_TEMPLATE_ID = "song-hy-red";

export async function createInvitation(formData?: FormData): Promise<void> {
  const userId = await getOrCreateUserId();

  const requested = formData?.get("templateId");
  const templateId =
    typeof requested === "string" && templates.some((t) => t.slug === requested)
      ? requested
      : DEFAULT_TEMPLATE_ID;

  const invitation = await prisma.invitation.create({
    data: {
      userId,
      templateId,
      status: "draft",
      content: { create: {} },
    },
  });
  redirect(`/editor/${invitation.id}`);
}
