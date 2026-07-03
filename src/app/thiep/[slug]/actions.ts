"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const wishSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(120),
  text: z.string().trim().min(1, "Vui lòng nhập lời chúc").max(1000),
});

const rsvpSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(120),
  attending: z.enum(["yes", "no"]),
  guests: z.coerce.number().int().min(0).max(50).default(1),
  side: z.string().trim().max(60).optional().default(""),
  message: z.string().trim().max(1000).optional().default(""),
  shuttle: z.enum(["yes"]).optional(),
  dietary: z.string().trim().max(200).optional().default(""),
  songRequest: z.string().trim().max(200).optional().default(""),
  guestId: z.string().trim().max(60).optional().default(""),
});

export type PublicState = { error?: string; ok?: boolean } | undefined;

async function findPublished(slug: string) {
  return prisma.invitation.findFirst({
    where: { slug, status: "published" },
    select: { id: true },
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
      select: { id: true, invitationId: true },
    });
    if (guest && guest.invitationId === invitation.id) {
      guestId = guest.id;
    }
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
    },
  });

  revalidatePath(`/thiep/${slug}`);
  return { ok: true };
}
