import assert from "node:assert/strict";
import test from "node:test";

import { invitationCeremonies, invitationCeremonyMessage } from "./invitation-display";
import { toDemoContent, type InvitationWithRelations } from "./to-demo-content";

type ContentFields = NonNullable<InvitationWithRelations["content"]>;
type CeremonyRow = InvitationWithRelations["ceremonies"][number];

function contentRow(overrides: Partial<ContentFields> = {}): ContentFields {
  return {
    id: "content-1",
    invitationId: "demo-thanh-duong-anh-sang",
    primaryColor: "#c8102e",
    fontFamily: null,
    assetFolder: null,
    music: null,
    brideFullName: "Trần An Nhiên",
    groomFullName: "Nguyễn Minh Khôi",
    brideShortName: "An Nhiên",
    groomShortName: "Minh Khôi",
    brideBirthOrder: "Út Nữ",
    groomBirthOrder: "Trưởng Nam",
    brideZodiac: "",
    groomZodiac: "",
    brideFirst: false,
    date: "2026-12-12",
    time: "18:00",
    ceremonyDate: "2026-12-12",
    ceremonyTime: "09:00",
    ceremonyHeader: "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA",
    ceremonyType: "thanh-hon",
    openingMessage: "",
    heroImage: "",
    heroImage2: "",
    showHeroImage: true,
    dressCodeColors: "",
    albumLayout: "grid",
    brideFather: "Trần Văn Thành",
    brideMother: "Lê Thị Thu Hà",
    brideAddress: "Thành phố Huế, Việt Nam",
    groomFather: "Nguyễn Văn Hưng",
    groomMother: "Phạm Thị Minh Anh",
    groomAddress: "Thành phố Hồ Chí Minh, Việt Nam",
    brideParentTitle: "Ông Bà",
    groomParentTitle: "Ông Bà",
    address: "Trung tâm Hội nghị Riverside Palace",
    mapAddress: "Riverside Palace, Quận 4, Hồ Chí Minh",
    banquetTime: "18:00",
    brideBankName: "Vietcombank",
    brideAccountNumber: "1026888899",
    brideAccountName: "Trần An Nhiên",
    groomBankName: "Techcombank",
    groomAccountNumber: "1903888899",
    groomAccountName: "Nguyễn Minh Khôi",
    ...overrides,
  };
}

function invitationRow(ceremonies: CeremonyRow[]): InvitationWithRelations {
  return {
    id: "demo-thanh-duong-anh-sang",
    userId: "system",
    slug: null,
    templateId: "thanh-duong-anh-sang",
    status: "draft",
    paid: false,
    isDemo: true,
    guestManagerToken: null,
    publishedAt: null,
    reminderSentAt: null,
    createdAt: new Date("2026-08-08T00:00:00.000Z"),
    updatedAt: new Date("2026-08-08T00:00:00.000Z"),
    content: contentRow(),
    ceremonies,
    schedule: [],
    gallery: [],
    wishes: [],
  };
}

function ceremonyRow(overrides: Partial<CeremonyRow> & Pick<CeremonyRow, "title">): CeremonyRow {
  return {
    id: "ceremony-1",
    invitationId: "demo-thanh-duong-anh-sang",
    date: "2026-08-28",
    time: "09:00",
    sortOrder: 0,
    ...overrides,
  };
}

test("an invitation with no CeremonyItem row keeps the ceremony from its content columns", () => {
  const content = toDemoContent(invitationRow([]));

  assert.equal(content.couple.ceremonyDate, "2026-12-12");
  assert.equal(content.couple.ceremonyTime, "09:00");
  assert.equal(content.couple.ceremonyHeader, "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA");
});

/**
 * An empty ceremonies array is truthy, so leaving it in place silently emptied
 * the ceremony card for every seeded demo invitation.
 */
test("no CeremonyItem row leaves the ceremony list unset so the legacy fallback runs", () => {
  const content = toDemoContent(invitationRow([]));

  assert.equal(content.ceremonies, undefined);
  assert.equal(
    invitationCeremonyMessage(content),
    "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA",
  );
  assert.deepEqual(invitationCeremonies(content), [
    {
      title: "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA",
      date: "2026-12-12",
      time: "09:00",
    },
  ]);
});

test("stored CeremonyItem rows win over the legacy columns and keep their order", () => {
  const content = toDemoContent(
    invitationRow([
      ceremonyRow({ id: "ceremony-2", title: "Lễ thành hôn", date: "2026-08-29", time: "10:30", sortOrder: 1 }),
      ceremonyRow({ id: "ceremony-1", title: "Lễ vu quy", date: "2026-08-28", time: "09:00", sortOrder: 0 }),
    ]),
  );

  assert.deepEqual(content.ceremonies, [
    { title: "Lễ vu quy", date: "2026-08-28", time: "09:00" },
    { title: "Lễ thành hôn", date: "2026-08-29", time: "10:30" },
  ]);
  assert.equal(content.couple.ceremonyDate, "2026-08-28");
  assert.equal(content.couple.ceremonyTime, "09:00");
  assert.equal(invitationCeremonyMessage(content), "Lễ vu quy");
});
