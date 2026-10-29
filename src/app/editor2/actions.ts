"use server";

import { getTranslations } from "next-intl/server";
import { editor2DefaultFields } from "@/lib/editor2-defaults";
import { editor2StarterSections } from "@/lib/editor2-starter";
import { redirect } from "next/navigation";
import { z } from "zod";
import { completedTemplates } from "@/data/chungdoi";
import { ownInvitation } from "@/lib/dal";
import { getAccountSessionUserId } from "@/lib/auth/anonymous-account";
import { loginReasonHref } from "@/lib/auth-redirects";
import { createSession, getSession } from "@/lib/session";
import { publish } from "@/app/editor/[id]/actions";
import { getDemoFontFamily } from "@/lib/demo-font-default";
import { DEFAULT_INVITATION_MUSIC, DEFAULT_INVITATION_MUSIC_ARTIST, DEFAULT_INVITATION_MUSIC_TITLE } from "@/lib/invitation-music";
import { prepareInvitationDraft, writeInvitationDraft } from "@/lib/invitation-editor-store";
import { prisma } from "@/lib/prisma";
import { scheduleInvitationOgImage } from "@/lib/prepare-invitation-og";
import { shortNameFromFullName } from "@/lib/short-name";
import { isGoogleMapsUrl } from "@/lib/google-maps";
import { expandGoogleMapsShortUrl } from "@/lib/google-maps-server";
import { zodiacTemplatePrimaryColor } from "@/lib/zodiac";
import { contentSchema, type EditorState } from "@/app/editor/[id]/content-schema";
import { editor2PublicationIssue } from "@/lib/editor2-publication";

const creationSchema = z.object({
  brideFullName: z.string().trim().min(1).max(120),
  groomFullName: z.string().trim().min(1).max(120),
  date: z.iso.date(),
  templateId: z.string().refine(value => completedTemplates.some(template => template.slug === value)),
});

export async function createVisualInvitation(_previous: EditorState, formData: FormData): Promise<EditorState> {
  const parsed = creationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errorCode: "invalidData" };
  const { templateId, ...names } = parsed.data;
  const sample = await getTranslations("editor2.samples");
  const defaults = editor2DefaultFields(key => sample(key));
  const t = await getTranslations("editor2");
  const starter = editor2StarterSections(templateId, names.date, defaults.time, t("newCeremony"), [
    { time: "17:30", label: t("starterSchedule.welcome") },
    { time: "18:00", label: t("starterSchedule.ceremony") },
    { time: "18:30", label: t("starterSchedule.reception") },
    { time: "20:30", label: t("starterSchedule.photos") },
  ]);
  const fontFamily = await getDemoFontFamily(prisma, templateId);
  const primaryColor = zodiacTemplatePrimaryColor(templateId);
  const session = await getSession();
  const existingUser = session ? await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } }) : null;
  // Only a successful creation mints a guest session. GET /editor2 creates no
  // database rows. A real or guest session is reused for subsequent drafts.
  const invitation = await prisma.$transaction(async db => {
    const userId = existingUser?.id ?? (await db.user.create({ data: {} })).id;
    return db.invitation.create({ data: {
      userId, templateId, status: "draft", content: { create: {
        ...defaults, ...names, fontFamily,
        brideShortName: shortNameFromFullName(names.brideFullName),
        groomShortName: shortNameFromFullName(names.groomFullName),
        albumLayout: starter.albumLayout,
        music: DEFAULT_INVITATION_MUSIC,
        musicTitle: DEFAULT_INVITATION_MUSIC_TITLE,
        musicArtist: DEFAULT_INVITATION_MUSIC_ARTIST,
        ceremonyHeader: starter.ceremony.title,
        ceremonyDate: starter.ceremony.date,
        ceremonyTime: starter.ceremony.time,
        ...(primaryColor ? { primaryColor } : {}),
      } },
      gallery: { create: starter.gallery.map((url, sortOrder) => ({ url, sortOrder })) },
      ceremonies: { create: { ...starter.ceremony, sortOrder: 0 } },
      schedule: { create: starter.schedule.map((item, sortOrder) => ({ ...item, sortOrder })) },
    } });
  });
  if (!existingUser) await createSession(invitation.userId);
  redirect(`/editor2/${invitation.id}`);
}

export async function saveVisualInvitation(id: string, formData: FormData): Promise<EditorState> {
  const session = await getSession();
  if (!session || !await ownInvitation(id, session.userId)) return { errorCode: "invitationNotFound" };
  const prepared = await prepareInvitationDraft(formData);
  if ("errorCode" in prepared) return prepared;
  await prisma.$transaction(db => writeInvitationDraft(db, id, prepared.data));
  scheduleInvitationOgImage(id);
  return { ok: true, persisted: true };
}

/** Map lookup belongs to the editable guest draft, before the account-only publish gate. */
export async function resolveVisualGoogleMapsLink(id: string, value: string): Promise<{ url: string; valid: boolean; resolved: boolean }> {
  const session = await getSession();
  if (!session || !await ownInvitation(id, session.userId)) return { url: "", valid: false, resolved: false };
  const source = value.trim();
  if (source.length > 1_200 || !isGoogleMapsUrl(source)) return { url: source, valid: false, resolved: false };
  const url = await expandGoogleMapsShortUrl(source);
  return { url, valid: true, resolved: url !== source };
}

export type VisualPublicationAccess =
  | { ok: true }
  | { loginUrl: string }
  | { errorCode: "invitationNotFound" };

/** A guest can own a draft, but publishing always requires a real account. */
export async function requestVisualPublication(id: string): Promise<VisualPublicationAccess> {
  const session = await getSession();
  if (!session || !await ownInvitation(id, session.userId)) return { errorCode: "invitationNotFound" };
  if (await getAccountSessionUserId()) return { ok: true };
  return { loginUrl: loginReasonHref("publish", `/editor2/${id}?publish=1`) };
}

/** Guard the mutation too; a forged client must not publish with a guest cookie. */
export async function publishVisualInvitation(id: string, formData: FormData): Promise<EditorState | { loginUrl: string }> {
  const access = await requestVisualPublication(id);
  if ("errorCode" in access) return access;
  if ("loginUrl" in access) {
    const saved = await saveVisualInvitation(id, formData);
    return saved?.ok ? access : saved;
  }
  const parsed = contentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errorCode: "invalidData" };
  const issue = editor2PublicationIssue(parsed.data);
  if (issue) {
    const saved = await saveVisualInvitation(id, formData);
    return saved?.ok ? { errorCode: issue.errorCode, focusField: issue.focusField, persisted: true } : saved;
  }
  return publish(id, undefined, formData);
}
