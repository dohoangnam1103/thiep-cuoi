import { randomUUID } from "node:crypto";

import { prisma } from "../../lib/prisma";
import vi from "@messages/vi.json";
import type {
  GuestAttendance,
  GuestInput,
  GuestListItem,
} from "./types";

/* Every query below carries the invitation owner. A missing invitation or a
 * guest outside it surfaces as not-found, never as another account's data. */
async function requireOwnedInvitation(userId: string, invitationId: string) {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId },
    select: { id: true, slug: true },
  });
  if (!invitation) {
    throw new Error("Invitation not found");
  }
  return invitation;
}

export function validateGuestInput(
  input: GuestInput,
): { ok: true } | { ok: false; fieldErrors: Record<string, string> } {
  if (!input.name.trim()) {
    return { ok: false, fieldErrors: { name: vi.guests.nameRequired } };
  }
  return { ok: true };
}

function site2Origin(): string {
  /* Personal links must point at the canonical site origin in every runtime,
   * including http test servers. The strict HTTPS/loopback gate in
   * resolveSite2Url applies to production deployment checks, not to link
   * generation, so parse the configured URL directly here. */
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!value) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required for site 2");
  }
  return new URL(value).origin;
}

function personalUrl(slug: string | null, token: string): string {
  if (!slug) return "";
  return `${site2Origin()}/thiep/${slug}?guest=${token}`;
}

function toListItem(
  guest: {
    id: string;
    name: string;
    groupName: string | null;
    phone: string | null;
    token: string;
    rsvps: { attending: boolean }[];
  },
  slug: string | null,
): GuestListItem {
  const latest = guest.rsvps[0];
  const attendance: GuestAttendance = !latest
    ? "unknown"
    : latest.attending
      ? "attending"
      : "declined";
  return {
    id: guest.id,
    name: guest.name,
    group: guest.groupName,
    phone: guest.phone,
    attendance,
    personalUrl: personalUrl(slug, guest.token),
  };
}

export async function listGuests(
  userId: string,
  invitationId: string,
): Promise<GuestListItem[]> {
  const invitation = await requireOwnedInvitation(userId, invitationId);
  const guests = await prisma.guest.findMany({
    where: { invitationId: invitation.id },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      groupName: true,
      phone: true,
      token: true,
      rsvps: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { attending: true },
      },
    },
  });
  return guests.map((guest) => toListItem(guest, invitation.slug));
}

export async function createGuest(
  userId: string,
  invitationId: string,
  input: GuestInput,
): Promise<{ id: string }> {
  const invitation = await requireOwnedInvitation(userId, invitationId);
  const valid = validateGuestInput(input);
  if (!valid.ok) {
    throw new Error("Invalid guest input");
  }
  const guest = await prisma.guest.create({
    data: {
      invitationId: invitation.id,
      token: randomUUID(),
      name: input.name.trim(),
      groupName: input.group?.trim() || null,
      phone: input.phone?.trim() || null,
    },
    select: { id: true },
  });
  return guest;
}

export async function updateGuest(
  userId: string,
  invitationId: string,
  guestId: string,
  input: GuestInput,
): Promise<void> {
  const invitation = await requireOwnedInvitation(userId, invitationId);
  const valid = validateGuestInput(input);
  if (!valid.ok) {
    throw new Error("Invalid guest input");
  }
  const result = await prisma.guest.updateMany({
    where: { id: guestId, invitationId: invitation.id },
    data: {
      name: input.name.trim(),
      groupName: input.group?.trim() || null,
      phone: input.phone?.trim() || null,
    },
  });
  if (result.count === 0) {
    throw new Error("Guest not found");
  }
}

export async function deleteGuest(
  userId: string,
  invitationId: string,
  guestId: string,
): Promise<void> {
  const invitation = await requireOwnedInvitation(userId, invitationId);
  const result = await prisma.guest.deleteMany({
    where: { id: guestId, invitationId: invitation.id },
  });
  if (result.count === 0) {
    throw new Error("Guest not found");
  }
}
