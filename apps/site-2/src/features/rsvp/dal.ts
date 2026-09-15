import { prisma } from "../../lib/prisma";
import vi from "@messages/vi.json";
import type {
  GuestPrefill,
  PublicRsvpInput,
  PublicWishInput,
  RsvpSummary,
} from "./types";

type Ok<T> = { ok: true } & T;
type Fail = { ok: false; error: string };

/* Published invitation lookup for public responses. Drafts and unknown slugs
 * share one rejection so strangers cannot probe for them. */
async function findPublished(slug: string) {
  return prisma.invitation.findFirst({
    where: { slug, status: "published" },
    select: {
      id: true,
      rsvpQuestions: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          label: true,
          type: true,
          required: true,
          options: true,
        },
      },
    },
  });
}

function parseOptions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((o) => typeof o === "string")) {
      return parsed as string[];
    }
  } catch {
    /* Misconfigured question: fall through to no valid options. */
  }
  return [];
}

/* Guest token prefill for the public invitation. Scoped to the invitation so
 * a token from another thiệp resolves to nothing, and only guest-safe fields
 * leave the database. */
export async function resolveGuestPrefill(
  invitationId: string,
  token: string,
): Promise<GuestPrefill> {
  const guest = await prisma.guest.findUnique({
    where: { token },
    select: {
      invitationId: true,
      name: true,
      side: true,
      role: true,
      greeting: true,
      maxGuests: true,
    },
  });
  if (!guest || guest.invitationId !== invitationId) return null;
  return {
    token,
    name: guest.name,
    side: guest.side,
    role: guest.role,
    greeting: guest.greeting,
    maxGuests: guest.maxGuests,
  };
}

export async function getPublishedRsvpContext(slug: string): Promise<{
  invitationId: string;
  questions: {
    id: string;
    label: string;
    type: "text" | "boolean" | "select";
    required: boolean;
    options: string[];
  }[];
} | null> {
  const invitation = await findPublished(slug);
  if (!invitation) return null;
  return {
    invitationId: invitation.id,
    questions: invitation.rsvpQuestions.map((question) => ({
      id: question.id,
      label: question.label,
      type:
        question.type === "boolean" || question.type === "select"
          ? question.type
          : "text",
      required: question.required,
      options: parseOptions(question.options),
    })),
  };
}

export async function submitPublicRsvp(
  input: PublicRsvpInput,
): Promise<Ok<{ id: string }> | Fail> {
  const invitation = await findPublished(input.slug);
  if (!invitation) return { ok: false, error: vi.rsvp.notFound };

  const name = input.name.trim();
  if (!name || name.length > 120) {
    return { ok: false, error: vi.rsvp.nameRequired };
  }
  const partySize = Number.isInteger(input.partySize) ? input.partySize : 1;
  if (partySize < 0 || partySize > 50) {
    return { ok: false, error: vi.rsvp.invalid };
  }
  const message = (input.message ?? "").trim().slice(0, 1000);
  const side = (input.side ?? "").trim().slice(0, 60);
  const dietary = (input.dietary ?? "").trim().slice(0, 200);
  const songRequest = (input.songRequest ?? "").trim().slice(0, 200);

  let guestId: string | null = null;
  if (input.token) {
    const guest = await prisma.guest.findUnique({
      where: { token: input.token },
      select: { id: true, invitationId: true, maxGuests: true },
    });
    if (!guest || guest.invitationId !== invitation.id) {
      return { ok: false, error: vi.rsvp.tokenInvalid };
    }
    if (partySize > guest.maxGuests) {
      return {
        ok: false,
        error: vi.rsvp.maxGuests.replace("{max}", String(guest.maxGuests)),
      };
    }
    guestId = guest.id;
  }

  const answers: { questionId: string; value: string }[] = [];
  const provided = new Map(
    (input.answers ?? []).map((a) => [a.questionId, a.value.trim()]),
  );
  for (const question of invitation.rsvpQuestions) {
    const value = provided.get(question.id) ?? "";
    if (question.required && !value) {
      return { ok: false, error: vi.rsvp.questionsRequired };
    }
    if (!value) continue;
    if (value.length > 500) {
      return { ok: false, error: vi.rsvp.answerTooLong };
    }
    if (question.type === "boolean" && value !== "yes" && value !== "no") {
      return { ok: false, error: vi.rsvp.answerInvalid };
    }
    if (question.type === "select" && !parseOptions(question.options).includes(value)) {
      return { ok: false, error: vi.rsvp.answerInvalid };
    }
    answers.push({ questionId: question.id, value });
  }

  const row = {
    invitationId: invitation.id,
    guestId,
    name,
    attending: input.attending,
    guests: partySize,
    side: side || null,
    message: message || null,
    shuttle: input.shuttle ?? false,
    dietary: dietary || null,
    songRequest: songRequest || null,
  };
  if (guestId) {
    /* Duplicate submissions from one guest link update their latest response
     * instead of stacking rows. */
    const previous = await prisma.rsvp.findFirst({
      where: { invitationId: invitation.id, guestId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (previous) {
      await prisma.rsvpAnswer.deleteMany({ where: { rsvpId: previous.id } });
      const updated = await prisma.rsvp.update({
        where: { id: previous.id },
        data: {
          ...row,
          answers: answers.length > 0 ? { create: answers } : undefined,
        },
        select: { id: true },
      });
      return { ok: true, id: updated.id };
    }
  }
  const created = await prisma.rsvp.create({
    data: {
      ...row,
      answers: answers.length > 0 ? { create: answers } : undefined,
    },
    select: { id: true },
  });
  return { ok: true, id: created.id };
}

export async function submitPublicWish(
  input: PublicWishInput,
): Promise<Ok<{ id: string }> | Fail> {
  const invitation = await findPublished(input.slug);
  if (!invitation) return { ok: false, error: vi.rsvp.notFound };
  const name = input.name.trim().slice(0, 120);
  const text = input.text.trim().slice(0, 1000);
  if (!name || !text) {
    return { ok: false, error: vi.rsvp.wishInvalid };
  }
  const created = await prisma.wish.create({
    data: { invitationId: invitation.id, name, text },
    select: { id: true },
  });
  return { ok: true, id: created.id };
}

/* Owner overview. Counts are guest-based from each guest's latest response
 * (open link responses without a guest count as their own row); pending
 * counts guests that never responded. */
export async function getRsvpSummary(
  userId: string,
  invitationId: string,
): Promise<RsvpSummary> {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId },
    select: { id: true },
  });
  if (!invitation) {
    throw new Error("Invitation not found");
  }
  const [guests, responses] = await Promise.all([
    prisma.guest.findMany({
      where: { invitationId: invitation.id },
      select: {
        id: true,
        rsvps: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { attending: true },
        },
      },
    }),
    prisma.rsvp.findMany({
      where: { invitationId: invitation.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        attending: true,
        guests: true,
        message: true,
        createdAt: true,
        guestId: true,
        guest: { select: { name: true } },
      },
    }),
  ]);
  let attendingGuests = 0;
  let declinedGuests = 0;
  let pendingGuests = 0;
  for (const guest of guests) {
    const latest = guest.rsvps[0];
    if (!latest) pendingGuests += 1;
    else if (latest.attending) attendingGuests += 1;
    else declinedGuests += 1;
  }
  for (const response of responses) {
    if (response.guestId) continue;
    if (response.attending) attendingGuests += 1;
    else declinedGuests += 1;
  }
  return {
    attendingGuests,
    declinedGuests,
    pendingGuests,
    responses: responses.map((response) => ({
      id: response.id,
      guestName: response.guest?.name ?? response.name,
      attending: response.attending,
      partySize: response.guests,
      message: response.message,
      createdAt: response.createdAt,
    })),
  };
}
