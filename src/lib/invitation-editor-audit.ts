import type { z } from "zod";

import { contentSchema } from "@/app/editor/[id]/content-schema";
import { defaultCeremonyMessage } from "@/lib/invitation-display";

export type EditorAuditGroup =
  | "appearance"
  | "couple"
  | "event"
  | "family"
  | "venue"
  | "gift"
  | "media";

export type EditorAuditField =
  | keyof z.infer<typeof contentSchema>
  | "ceremonies"
  | "schedule"
  | "gallery";

export type InvitationEditorAuditDiff = {
  changedGroups: EditorAuditGroup[];
  changedFields: EditorAuditField[];
};

type StoredRelation<T> = T & { id?: string; invitationId?: string; sortOrder: number };

export type InvitationEditorAuditInput =
  | {
      source: "prisma";
      templateId: string;
      content: Partial<Record<keyof z.infer<typeof contentSchema>, unknown>> | null;
      ceremonies: StoredRelation<{ title: string; date: string; time: string }>[];
      schedule: StoredRelation<{ time: string; label: string }>[];
      gallery: StoredRelation<{ url: string }>[];
    }
  | {
      source: "submitted";
      persistedData: z.infer<typeof contentSchema>;
      ceremonies: { title: string; date: string; time: string }[];
      schedule: { time: string; label: string }[];
      gallery: string[];
    };

type CanonicalContent = z.infer<typeof contentSchema>;
type CanonicalCeremony = { title: string; date: string; time: string };
type CanonicalSchedule = { time: string; label: string };

type CanonicalInvitation = {
  content: CanonicalContent;
  ceremonies: CanonicalCeremony[];
  schedule: CanonicalSchedule[];
  gallery: string[];
};

const EDITOR_AUDIT_FIELDS = [
  "templateId",
  "primaryColor",
  "fontFamily",
  "music",
  "dressCodeColors",
  "albumLayout",
  "brideFullName",
  "groomFullName",
  "brideShortName",
  "groomShortName",
  "groomBirthOrder",
  "brideBirthOrder",
  "brideZodiac",
  "groomZodiac",
  "brideFirst",
  "date",
  "time",
  "ceremonyDate",
  "ceremonyTime",
  "ceremonyHeader",
  "ceremonyType",
  "openingMessage",
  "ceremonies",
  "heroImage",
  "heroImage2",
  "showHeroImage",
  "brideFather",
  "brideMother",
  "brideAddress",
  "groomFather",
  "groomMother",
  "groomAddress",
  "brideParentTitle",
  "groomParentTitle",
  "address",
  "mapAddress",
  "banquetTime",
  "schedule",
  "brideBankName",
  "brideAccountNumber",
  "brideAccountName",
  "groomBankName",
  "groomAccountNumber",
  "groomAccountName",
  "gallery",
] as const satisfies readonly EditorAuditField[];

const EDITOR_AUDIT_FIELD_GROUPS: Record<EditorAuditField, EditorAuditGroup> = {
  templateId: "appearance",
  primaryColor: "appearance",
  fontFamily: "appearance",
  music: "appearance",
  dressCodeColors: "appearance",
  albumLayout: "appearance",
  brideFullName: "couple",
  groomFullName: "couple",
  brideShortName: "couple",
  groomShortName: "couple",
  groomBirthOrder: "couple",
  brideBirthOrder: "couple",
  brideZodiac: "couple",
  groomZodiac: "couple",
  brideFirst: "couple",
  date: "event",
  time: "event",
  ceremonyDate: "event",
  ceremonyTime: "event",
  ceremonyHeader: "event",
  ceremonyType: "event",
  openingMessage: "event",
  ceremonies: "event",
  heroImage: "media",
  heroImage2: "media",
  showHeroImage: "media",
  gallery: "media",
  brideFather: "family",
  brideMother: "family",
  brideAddress: "family",
  groomFather: "family",
  groomMother: "family",
  groomAddress: "family",
  brideParentTitle: "family",
  groomParentTitle: "family",
  address: "venue",
  mapAddress: "venue",
  banquetTime: "venue",
  schedule: "venue",
  brideBankName: "gift",
  brideAccountNumber: "gift",
  brideAccountName: "gift",
  groomBankName: "gift",
  groomAccountNumber: "gift",
  groomAccountName: "gift",
};

const EDITOR_AUDIT_GROUP_ORDER: EditorAuditGroup[] = [
  "appearance",
  "couple",
  "event",
  "family",
  "venue",
  "gift",
  "media",
];

// Stored scalars carry null; the editor treats null like an empty input, so
// normalize before parsing so both sources hit the same schema defaults.
function nullsToUndefined(content: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(content)) {
    result[key] = value === null ? undefined : value;
  }
  return result;
}

// sortOrder is the persisted ordering; original index breaks ties stably.
function sortByStoredOrder<T>(items: StoredRelation<T>[]): StoredRelation<T>[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => a.item.sortOrder - b.item.sortOrder || a.index - b.index)
    .map((entry) => entry.item);
}

// An empty ceremony list renders the legacy single ceremony in EditorForm;
// hydrate the same row on both sides so the comparison shares semantics.
function hydrateLegacyCeremony(
  content: CanonicalContent,
  ceremonies: CanonicalCeremony[],
): CanonicalCeremony[] {
  if (ceremonies.length > 0) return ceremonies;
  return [
    {
      title: content.ceremonyHeader || defaultCeremonyMessage(content.ceremonyType),
      date: content.ceremonyDate,
      time: content.ceremonyTime,
    },
  ];
}

// EditorForm's hidden input persists the first ceremony row title into
// ceremonyHeader, and the display falls back to the default message when the
// header is empty — canonicalize to the effective title so a legacy record
// (empty header) and a submitted record (default message) compare as equal.
function effectiveContent(parsed: CanonicalContent): CanonicalContent {
  return {
    ...parsed,
    ceremonyHeader:
      parsed.ceremonyHeader || defaultCeremonyMessage(parsed.ceremonyType),
  };
}

function canonicalize(input: InvitationEditorAuditInput): CanonicalInvitation {
  if (input.source === "prisma") {
    const content = effectiveContent(
      contentSchema.parse({
        templateId: input.templateId,
        ...(input.content ? nullsToUndefined(input.content) : {}),
      }),
    );
    const ceremonies = sortByStoredOrder(input.ceremonies).map(
      ({ title, date, time }) => ({ title, date, time }),
    );
    const schedule = sortByStoredOrder(input.schedule).map(
      ({ time, label }) => ({ time, label }),
    );
    const gallery = sortByStoredOrder(input.gallery).map(({ url }) => url);
    return {
      content,
      ceremonies: hydrateLegacyCeremony(content, ceremonies),
      schedule,
      gallery,
    };
  }

  const content = effectiveContent(contentSchema.parse(input.persistedData));
  return {
    content,
    ceremonies: hydrateLegacyCeremony(
      content,
      input.ceremonies.map(({ title, date, time }) => ({ title, date, time })),
    ),
    schedule: input.schedule.map(({ time, label }) => ({ time, label })),
    gallery: [...input.gallery],
  };
}

function canonicalValue(
  canonical: CanonicalInvitation,
  field: EditorAuditField,
): unknown {
  if (field === "ceremonies") return canonical.ceremonies;
  if (field === "schedule") return canonical.schedule;
  if (field === "gallery") return canonical.gallery;
  return canonical.content[field];
}

// Canonical values are flat scalars or arrays of flat objects with stable key
// order, so a serialized comparison is deterministic.
function deepEqual(before: unknown, after: unknown): boolean {
  return JSON.stringify(before) === JSON.stringify(after);
}

export function diffInvitationEditorAudit(
  before: InvitationEditorAuditInput,
  after: InvitationEditorAuditInput,
): InvitationEditorAuditDiff {
  const canonicalBefore = canonicalize(before);
  const canonicalAfter = canonicalize(after);

  const changedFields: EditorAuditField[] = [];
  for (const field of EDITOR_AUDIT_FIELDS) {
    if (
      !deepEqual(canonicalValue(canonicalBefore, field), canonicalValue(canonicalAfter, field))
    ) {
      changedFields.push(field);
    }
  }

  const changedGroups = EDITOR_AUDIT_GROUP_ORDER.filter((group) =>
    changedFields.some((field) => EDITOR_AUDIT_FIELD_GROUPS[field] === group),
  );

  return { changedGroups, changedFields };
}
