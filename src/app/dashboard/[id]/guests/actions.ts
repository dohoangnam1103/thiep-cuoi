"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { verifySession, ownInvitation } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const guestSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(120),
  side: z.string().trim().max(60).optional().default(""),
  role: z.string().trim().max(60).optional().default(""),
  note: z.string().trim().max(300).optional().default(""),
});

export type GuestState = { error?: string; ok?: boolean } | undefined;

function newToken() {
  return randomBytes(9).toString("base64url");
}

export async function addGuest(
  invitationId: string,
  _prev: GuestState,
  formData: FormData,
): Promise<GuestState> {
  const { userId } = await verifySession();
  const invitation = await ownInvitation(invitationId, userId);
  if (!invitation) return { error: "Không tìm thấy thiệp" };

  const parsed = guestSchema.safeParse({
    name: formData.get("name"),
    side: formData.get("side"),
    role: formData.get("role"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  await prisma.guest.create({
    data: {
      invitationId,
      token: newToken(),
      name: parsed.data.name,
      side: parsed.data.side || null,
      role: parsed.data.role || null,
      note: parsed.data.note || null,
    },
  });

  revalidatePath(`/dashboard/${invitationId}/guests`);
  return { ok: true };
}

export async function deleteGuest(invitationId: string, guestId: string): Promise<void> {
  const { userId } = await verifySession();
  const invitation = await ownInvitation(invitationId, userId);
  if (!invitation) return;

  await prisma.guest.deleteMany({ where: { id: guestId, invitationId } });
  revalidatePath(`/dashboard/${invitationId}/guests`);
}
