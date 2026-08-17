import assert from "node:assert/strict";
import test from "node:test";

import type { z } from "zod";

import type { contentSchema } from "@/app/editor/[id]/content-schema";
import {
  diffInvitationEditorAudit,
  type InvitationEditorAuditInput,
} from "./invitation-editor-audit";

type Content = z.infer<typeof contentSchema>;

const DEFAULT_TEMPLATE_ID = "song-hy-red";

function defaultSubmittedContent(overrides: Partial<Content> = {}): Content {
  return {
    templateId: DEFAULT_TEMPLATE_ID,
    primaryColor: "",
    fontFamily: "",
    music: "",
    dressCodeColors: "",
    albumLayout: "grid",
    brideFullName: "",
    groomFullName: "",
    brideShortName: "",
    groomShortName: "",
    groomBirthOrder: "",
    brideBirthOrder: "",
    brideZodiac: "",
    groomZodiac: "",
    brideFirst: true,
    date: "",
    time: "",
    ceremonyDate: "",
    ceremonyTime: "",
    ceremonyHeader: "",
    ceremonyType: "thanh-hon",
    openingMessage: "",
    heroImage: "",
    heroImage2: "",
    showHeroImage: true,
    brideFather: "",
    brideMother: "",
    brideAddress: "",
    groomFather: "",
    groomMother: "",
    groomAddress: "",
    brideParentTitle: "",
    groomParentTitle: "",
    address: "",
    mapAddress: "",
    banquetTime: "",
    brideBankName: "",
    brideAccountNumber: "",
    brideAccountName: "",
    groomBankName: "",
    groomAccountNumber: "",
    groomAccountName: "",
    ...overrides,
  };
}

type PrismaSnapshotInput = Partial<
  Extract<InvitationEditorAuditInput, { source: "prisma" }>
>;

function prismaSnapshot(input: PrismaSnapshotInput): InvitationEditorAuditInput {
  return {
    source: "prisma",
    templateId: input.templateId ?? DEFAULT_TEMPLATE_ID,
    content: input.content ?? {},
    ceremonies: input.ceremonies ?? [],
    schedule: input.schedule ?? [],
    gallery: input.gallery ?? [],
  };
}

type SubmittedSnapshotInput = {
  persistedData?: Partial<Content>;
  ceremonies?: Extract<InvitationEditorAuditInput, { source: "submitted" }>["ceremonies"];
  schedule?: Extract<InvitationEditorAuditInput, { source: "submitted" }>["schedule"];
  gallery?: Extract<InvitationEditorAuditInput, { source: "submitted" }>["gallery"];
};

function submittedSnapshot(input: SubmittedSnapshotInput): InvitationEditorAuditInput {
  return {
    source: "submitted",
    persistedData: defaultSubmittedContent(input.persistedData),
    ceremonies: input.ceremonies ?? [],
    schedule: input.schedule ?? [],
    gallery: input.gallery ?? [],
  };
}

test("raw Prisma data and logically identical submitted data normalize equally", () => {
  const diff = diffInvitationEditorAudit(
    prismaSnapshot({
      content: { brideFullName: null, ceremonyType: "thanh-hon", ceremonyHeader: null },
      ceremonies: [],
      schedule: [
        { id: "s2", invitationId: "i1", time: "18:00", label: "Đón khách", sortOrder: 1 },
        { id: "s1", invitationId: "i1", time: "17:00", label: "Khai tiệc", sortOrder: 0 },
      ],
    }),
    submittedSnapshot({
      persistedData: {
        brideFullName: "",
        ceremonyType: "thanh-hon",
        ceremonyHeader: "LỄ THÀNH HÔN SẼ ĐƯỢC CỬ HÀNH TẠI TƯ GIA",
        ceremonyDate: "",
        ceremonyTime: "",
      },
      ceremonies: [{
        title: "LỄ THÀNH HÔN SẼ ĐƯỢC CỬ HÀNH TẠI TƯ GIA",
        date: "",
        time: "",
      }],
      schedule: [
        { time: "17:00", label: "Khai tiệc" },
        { time: "18:00", label: "Đón khách" },
      ],
      gallery: [],
    }),
  );
  assert.deepEqual(diff, { changedGroups: [], changedFields: [] });
});

test("real scalar and ordered relation changes return deterministic names", () => {
  const diff = diffInvitationEditorAudit(
    prismaSnapshot({
      content: { brideFullName: "Mai", address: "Địa chỉ cũ" },
      ceremonies: [{ title: "Lễ cũ", date: "2026-12-20", time: "09:00", sortOrder: 0 }],
    }),
    submittedSnapshot({
      persistedData: { brideFullName: "Lan", address: "Địa chỉ mới" },
      ceremonies: [{ title: "Lễ mới", date: "2026-12-20", time: "09:00" }],
    }),
  );
  assert.deepEqual(diff, {
    changedGroups: ["couple", "event", "venue"],
    changedFields: ["brideFullName", "ceremonies", "address"],
  });
});

test("bank changes expose the field name but never the account value", () => {
  const secret = "012345678901";
  const diff = diffInvitationEditorAudit(
    prismaSnapshot({ content: { brideAccountNumber: "old" } }),
    submittedSnapshot({ persistedData: { brideAccountNumber: secret } }),
  );
  assert.deepEqual(diff, {
    changedGroups: ["gift"],
    changedFields: ["brideAccountNumber"],
  });
  assert.doesNotMatch(JSON.stringify(diff), new RegExp(secret));
});
