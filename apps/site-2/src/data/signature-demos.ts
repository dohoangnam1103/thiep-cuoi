import type { InvitationRenderContent } from "@chungdoi/invitation-core/signature";

function baseContent(): Omit<InvitationRenderContent, "slug"> {
  return {
    couple: {
      brideFullName: "Nguyễn Mai Lan",
      groomFullName: "Trần Đức Minh",
      brideShortName: "Mai Lan",
      groomShortName: "Đức Minh",
      brideBirthOrder: "Trưởng nữ",
      groomBirthOrder: "Trưởng nam",
      brideFirst: true,
      date: "2026-11-22",
      time: "10:30",
      ceremonyDate: "2026-11-22",
      ceremonyTime: "09:00",
      ceremonyHeader: "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA",
      openingMessage: "TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI.",
    },
    families: {
      brideFather: "Nguyễn Văn An",
      brideMother: "Phạm Thị Hoa",
      brideAddress: "Hà Nội",
      groomFather: "Trần Văn Bình",
      groomMother: "Lê Thị Cúc",
      groomAddress: "Hồ Chí Minh",
      brideParentTitle: "Ông Bà",
      groomParentTitle: "Ông Bà",
    },
    venue: {
      address: "Trung tâm tiệc cưới, Hà Nội",
      mapAddress: "",
      banquetTime: "11:00",
    },
    schedule: [
      { time: "09:00", label: "Lễ thành hôn" },
      { time: "11:00", label: "Tiệc cưới" },
    ],
    gallery: [],
    wishes: [
      {
        name: "Gia đình",
        time: "2026-09-01T10:00:00",
        text: "Chúc hai con trăm năm hạnh phúc!",
      },
    ],
    bank: {
      brideBankName: "",
      brideAccountNumber: "",
      brideAccountName: "",
      groomBankName: "",
      groomAccountNumber: "",
      groomAccountName: "",
    },
  };
}

export const SIGNATURE_DEMOS: Record<string, InvitationRenderContent> = {
  "jasmine-white": { ...baseContent(), slug: "jasmine-white" },
  "silk-flora-brown": {
    ...baseContent(),
    slug: "silk-flora-brown",
  },
};

export function getSignatureDemo(slug: string) {
  return SIGNATURE_DEMOS[slug];
}
