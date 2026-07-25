"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  capitalizeVietnameseSentences,
  titleCaseVietnameseName,
} from "@/lib/text-case";

const wishSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(120).transform(titleCaseVietnameseName),
  text: z.string().trim().min(1, "Vui lòng nhập lời chúc").max(1000).transform(capitalizeVietnameseSentences),
});

const rsvpSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(120).transform(titleCaseVietnameseName),
  attending: z.enum(["yes", "no"]),
  guests: z.coerce.number().int().min(0).max(50).default(1),
  side: z.string().trim().max(60).optional().default(""),
  message: z.string().trim().max(1000).optional().default("").transform(capitalizeVietnameseSentences),
  shuttle: z.enum(["yes"]).optional(),
  dietary: z.string().trim().max(200).optional().default("").transform(capitalizeVietnameseSentences),
  songRequest: z.string().trim().max(200).optional().default("").transform(capitalizeVietnameseSentences),
  guestId: z.string().trim().max(60).optional().default(""),
});

export type PublicState = { error?: string; ok?: boolean } | undefined;

async function findPublished(slug: string) {
  return prisma.invitation.findFirst({
    where: { slug, status: "published" },
    select: {
      id: true,
      rsvpQuestions: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, type: true, required: true, options: true },
      },
    },
  });
}

export async function submitWish(slug: string, _prev: PublicState, formData: FormData): Promise<PublicState> {
  const invitation = await findPublished(slug);
  if (!invitation) return { error: "Không tìm thấy thiệp" };

  const parsed = wishSchema.safeParse({
    name: formData.get("name"),
    text: formData.get("text"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  await prisma.wish.create({
    data: { invitationId: invitation.id, name: parsed.data.name, text: parsed.data.text },
  });

  revalidatePath(`/thiep/${slug}`);
  return { ok: true };
}

export async function submitRsvp(slug: string, _prev: PublicState, formData: FormData): Promise<PublicState> {
  const invitation = await findPublished(slug);
  if (!invitation) return { error: "Không tìm thấy thiệp" };

  const parsed = rsvpSchema.safeParse({
    name: formData.get("name"),
    attending: formData.get("attending"),
    guests: formData.get("guests") ?? undefined,
    side: formData.get("side") ?? undefined,
    message: formData.get("message") ?? undefined,
    shuttle: formData.get("shuttle") ?? undefined,
    dietary: formData.get("dietary") ?? undefined,
    songRequest: formData.get("songRequest") ?? undefined,
    guestId: formData.get("guestId") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  let guestId: string | null = null;
  if (parsed.data.guestId) {
    const guest = await prisma.guest.findUnique({
      where: { token: parsed.data.guestId },
      select: { id: true, invitationId: true, maxGuests: true },
    });
    if (guest && guest.invitationId === invitation.id) {
      if (parsed.data.guests > guest.maxGuests) {
        return { error: `Lời mời này cho phép tối đa ${guest.maxGuests} người tham dự` };
      }
      guestId = guest.id;
    }
  }

  const answers: Array<{ questionId: string; value: string }> = [];
  for (const question of invitation.rsvpQuestions) {
    const rawValue = formData.get(`question:${question.id}`);
    const value = typeof rawValue === "string" ? rawValue.trim() : "";
    if (question.required && !value) return { error: "Vui lòng trả lời đầy đủ các câu hỏi bắt buộc" };
    if (!value) continue;
    if (value.length > 500) return { error: "Câu trả lời quá dài" };
    if (question.type === "boolean" && value !== "yes" && value !== "no") {
      return { error: "Câu trả lời chưa hợp lệ" };
    }
    if (question.type === "select") {
      let options: string[] = [];
      try {
        const parsedOptions: unknown = question.options ? JSON.parse(question.options) : [];
        if (Array.isArray(parsedOptions) && parsedOptions.every((option) => typeof option === "string")) {
          options = parsedOptions;
        }
      } catch {
        options = [];
      }
      if (!options.includes(value)) return { error: "Phương án đã chọn chưa hợp lệ" };
    }
    answers.push({
      questionId: question.id,
      value: question.type === "text" ? capitalizeVietnameseSentences(value) : value,
    });
  }

  await prisma.rsvp.create({
    data: {
      invitationId: invitation.id,
      guestId,
      name: parsed.data.name,
      attending: parsed.data.attending === "yes",
      guests: parsed.data.guests,
      side: parsed.data.side || null,
      message: parsed.data.message || null,
      shuttle: parsed.data.shuttle === "yes",
      dietary: parsed.data.dietary || null,
      songRequest: parsed.data.songRequest || null,
      answers: answers.length > 0 ? { create: answers } : undefined,
    },
  });

  revalidatePath(`/thiep/${slug}`);
  return { ok: true };
}
