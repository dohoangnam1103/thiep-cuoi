"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ownInvitation, verifySession } from "@/lib/dal";
import type { GuestImportRow } from "@/lib/guest-manager";
import { prisma } from "@/lib/prisma";
import {
  capitalizeVietnameseSentences,
  titleCaseVietnameseName,
} from "@/lib/text-case";

const optionalText = (max: number) => z.string().trim().max(max).optional().default("")
  .transform(capitalizeVietnameseSentences);

const guestSchema = z.object({
  name: z.string().trim().min(1).max(120).transform(titleCaseVietnameseName),
  side: optionalText(60),
  role: optionalText(60),
  groupName: optionalText(100),
  tableName: optionalText(60),
  greeting: optionalText(160),
});

const importedGuestSchema = guestSchema.extend({
  phone: optionalText(30),
  email: z.union([z.literal(""), z.email().max(160)]).optional().default(""),
  maxGuests: z.number().int().min(1).max(20).default(1),
  giftAmount: z.number().int().min(0).max(1_000_000_000).nullable().default(null),
  note: optionalText(500),
});

export type GuestActionError =
  | "notFound"
  | "invalidData"
  | "invalidEmail"
  | "emptyImport"
  | "tooManyGuests";

export type GuestState = {
  error?: GuestActionError;
  ok?: boolean;
  imported?: number;
} | undefined;

function newToken() {
  return randomBytes(9).toString("base64url");
}

function nullable(value: string) {
  return value || null;
}

function guestDataFromForm(formData: FormData) {
  return {
    name: formData.get("name"),
    side: formData.get("side"),
    role: formData.get("role"),
    groupName: formData.get("groupName"),
    tableName: formData.get("tableName"),
    greeting: formData.get("greeting"),
  };
}

function errorForIssues(issues: z.core.$ZodIssue[]): GuestActionError {
  return issues.some((issue) => issue.path[0] === "email") ? "invalidEmail" : "invalidData";
}

function revalidateGuestPages(invitationId: string, slug: string | null) {
  revalidatePath(`/dashboard/${invitationId}/guests`);
  revalidatePath(`/dashboard/${invitationId}/rsvp`);
  if (slug) revalidatePath(`/thiep/${slug}`);
}

async function getAccessibleInvitation(invitationId: string, accessToken: string | null) {
  if (accessToken) {
    return prisma.invitation.findFirst({
      where: { id: invitationId, guestManagerToken: accessToken, status: "published" },
    });
  }
  const { userId } = await verifySession();
  return ownInvitation(invitationId, userId);
}

export async function addGuest(
  invitationId: string,
  accessToken: string | null,
  _prev: GuestState,
  formData: FormData,
): Promise<GuestState> {
  const invitation = await getAccessibleInvitation(invitationId, accessToken);
  if (!invitation) return { error: "notFound" };

  const parsed = guestSchema.safeParse(guestDataFromForm(formData));
  if (!parsed.success) return { error: errorForIssues(parsed.error.issues) };

  await prisma.guest.createMany({
    data: [{
      invitationId,
      token: newToken(),
      name: parsed.data.name,
      side: nullable(parsed.data.side),
      role: nullable(parsed.data.role),
      groupName: nullable(parsed.data.groupName),
      tableName: nullable(parsed.data.tableName),
      greeting: nullable(parsed.data.greeting),
    }],
  });

  revalidateGuestPages(invitationId, invitation.slug);
  return { ok: true };
}

export async function updateGuest(
  invitationId: string,
  accessToken: string | null,
  guestId: string,
  _prev: GuestState,
  formData: FormData,
): Promise<GuestState> {
  const invitation = await getAccessibleInvitation(invitationId, accessToken);
  if (!invitation) return { error: "notFound" };

  const parsed = guestSchema.safeParse(guestDataFromForm(formData));
  if (!parsed.success) return { error: errorForIssues(parsed.error.issues) };

  const result = await prisma.guest.updateMany({
    where: { id: guestId, invitationId },
    data: {
      name: parsed.data.name,
      side: nullable(parsed.data.side),
      role: nullable(parsed.data.role),
      groupName: nullable(parsed.data.groupName),
      tableName: nullable(parsed.data.tableName),
      greeting: nullable(parsed.data.greeting),
    },
  });

  if (result.count === 0) return { error: "notFound" };
  revalidateGuestPages(invitationId, invitation.slug);
  return { ok: true };
}

export async function importGuests(
  invitationId: string,
  accessToken: string | null,
  rows: GuestImportRow[],
): Promise<GuestState> {
  const invitation = await getAccessibleInvitation(invitationId, accessToken);
  if (!invitation) return { error: "notFound" };
  if (rows.length === 0) return { error: "emptyImport" };
  if (rows.length > 500) return { error: "tooManyGuests" };

  const parsed = z.array(importedGuestSchema).safeParse(rows);
  if (!parsed.success) return { error: errorForIssues(parsed.error.issues) };

  await prisma.guest.createMany({
    data: parsed.data.map((guest) => ({
      invitationId,
      token: newToken(),
      name: guest.name,
      side: nullable(guest.side),
      role: nullable(guest.role),
      groupName: nullable(guest.groupName),
      tableName: nullable(guest.tableName),
      phone: nullable(guest.phone),
      email: nullable(guest.email),
      greeting: nullable(guest.greeting),
      maxGuests: guest.maxGuests,
      giftAmount: guest.giftAmount,
      note: nullable(guest.note),
    })),
  });

  revalidateGuestPages(invitationId, invitation.slug);
  return { ok: true, imported: parsed.data.length };
}

export async function deleteGuests(
  invitationId: string,
  accessToken: string | null,
  guestIds: string[],
): Promise<GuestState> {
  const invitation = await getAccessibleInvitation(invitationId, accessToken);
  if (!invitation) return { error: "notFound" };

  const parsed = z.array(z.string().min(1)).min(1).max(500).safeParse(guestIds);
  if (!parsed.success) return { error: "invalidData" };

  await prisma.guest.deleteMany({
    where: { invitationId, id: { in: parsed.data } },
  });
  revalidateGuestPages(invitationId, invitation.slug);
  return { ok: true };
}

export async function deleteGuest(invitationId: string, guestId: string): Promise<void> {
  await deleteGuests(invitationId, null, [guestId]);
}
