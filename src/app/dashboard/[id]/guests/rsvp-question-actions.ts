"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ownInvitation, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { capitalizeVietnameseSentences } from "@/lib/text-case";

const questionSchema = z.object({
  label: z.string().trim().min(1).max(180).transform(capitalizeVietnameseSentences),
  type: z.enum(["text", "boolean", "select"]),
  required: z.boolean().default(false),
  options: z.array(
    z.string().trim().min(1).max(100).transform(capitalizeVietnameseSentences),
  ).max(12).default([]),
}).superRefine((data, context) => {
  if (data.type === "select" && data.options.length < 2) {
    context.addIssue({ code: "custom", path: ["options"], message: "invalidOptions" });
  }
});

export type QuestionInput = z.input<typeof questionSchema>;
export type QuestionActionResult = {
  ok?: boolean;
  error?: "notFound" | "invalidData" | "invalidOptions" | "limitReached";
};

async function getOwnedInvitation(invitationId: string) {
  const { userId } = await verifySession();
  return ownInvitation(invitationId, userId);
}

function refresh(invitationId: string, slug: string | null) {
  revalidatePath(`/dashboard/${invitationId}/guests`);
  revalidatePath(`/dashboard/${invitationId}/rsvp`);
  if (slug) revalidatePath(`/thiep/${slug}`);
}

export async function saveRsvpQuestion(
  invitationId: string,
  questionId: string | null,
  input: QuestionInput,
): Promise<QuestionActionResult> {
  const invitation = await getOwnedInvitation(invitationId);
  if (!invitation) return { error: "notFound" };

  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) {
    const optionsIssue = parsed.error.issues.some((issue) => issue.path[0] === "options");
    return { error: optionsIssue ? "invalidOptions" : "invalidData" };
  }

  const options = parsed.data.type === "select" ? JSON.stringify(parsed.data.options) : null;

  if (questionId) {
    const result = await prisma.rsvpQuestion.updateMany({
      where: { id: questionId, invitationId },
      data: {
        label: parsed.data.label,
        type: parsed.data.type,
        required: parsed.data.required,
        options,
      },
    });
    if (result.count === 0) return { error: "notFound" };
  } else {
    const count = await prisma.rsvpQuestion.count({ where: { invitationId } });
    if (count >= 10) return { error: "limitReached" };
    await prisma.rsvpQuestion.create({
      data: {
        invitationId,
        label: parsed.data.label,
        type: parsed.data.type,
        required: parsed.data.required,
        options,
        sortOrder: count,
      },
    });
  }

  refresh(invitationId, invitation.slug);
  return { ok: true };
}

export async function deleteRsvpQuestion(
  invitationId: string,
  questionId: string,
): Promise<QuestionActionResult> {
  const invitation = await getOwnedInvitation(invitationId);
  if (!invitation) return { error: "notFound" };

  await prisma.rsvpQuestion.deleteMany({ where: { id: questionId, invitationId } });
  refresh(invitationId, invitation.slug);
  return { ok: true };
}
