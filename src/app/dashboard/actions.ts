"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { templates } from "@/data/chungdoi";
import { getOrCreateUserId } from "@/lib/dal";
import { zodiacTemplatePrimaryColor } from "@/lib/zodiac";

const DEFAULT_TEMPLATE_ID = "song-hy-red";

function readName(value: FormDataEntryValue | null | undefined): string {
  return typeof value === "string" ? value.trim().slice(0, 24) : "";
}

export async function createInvitation(formData?: FormData): Promise<void> {
  const userId = await getOrCreateUserId();

  const requested = formData?.get("templateId");
  const templateId =
    typeof requested === "string" && templates.some((t) => t.slug === requested)
      ? requested
      : DEFAULT_TEMPLATE_ID;

  const groomShortName = readName(formData?.get("groomShortName"));
  const brideShortName = readName(formData?.get("brideShortName"));
  const primaryColor = zodiacTemplatePrimaryColor(templateId);

  const invitation = await prisma.invitation.create({
    data: {
      userId,
      templateId,
      status: "draft",
      content: {
        create: {
          groomShortName,
          brideShortName,
          ...(primaryColor ? { primaryColor } : {}),
        },
      },
    },
  });
  redirect(`/editor/${invitation.id}`);
}
