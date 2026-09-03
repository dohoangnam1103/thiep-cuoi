import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { dedicatedHeroImage } from "@/lib/hero-image-source";

export type DemoContentFields = {
  primaryColor: string;
  fontFamily: string | null;
  assetFolder: string | null;
  music: string | null;

  brideFullName: string;
  groomFullName: string;
  brideShortName: string;
  groomShortName: string;
  brideBirthOrder: string;
  groomBirthOrder: string;
  brideZodiac: string;
  groomZodiac: string;
  brideFirst: boolean;
  date: string;
  time: string;
  ceremonyDate: string;
  ceremonyTime: string;
  ceremonyHeader: string;
  ceremonyType: string;
  openingMessage: string;
  heroImage: string;
  heroImage2: string;
  showHeroImage: boolean;
  dressCodeColors: string;
  albumLayout: string;

  brideFather: string;
  brideMother: string;
  brideAddress: string;
  groomFather: string;
  groomMother: string;
  groomAddress: string;
  brideParentTitle: string;
  groomParentTitle: string;

  address: string;
  mapAddress: string;
  banquetTime: string;

  brideBankName: string;
  brideAccountNumber: string;
  brideAccountName: string;
  groomBankName: string;
  groomAccountNumber: string;
  groomAccountName: string;
};

export type DemoSeed = {
  content: DemoContentFields;
  schedule: { time: string; label: string; sortOrder: number }[];
  gallery: { url: string; sortOrder: number }[];
};

/** Chiều ngược của toDemoContent: ChungDoiDemoContent → field phẳng khớp InvitationContent + schedule/gallery. */
export function fromDemoContent(demo: ChungDoiDemoContent): DemoSeed {
  const { theme, couple, families, venue, bank } = demo;

  return {
    content: {
      primaryColor: theme.primaryColor ?? "",
      fontFamily: theme.fontFamily ?? null,
      assetFolder: theme.assetFolder ?? null,
      music: demo.music ?? null,

      brideFullName: couple.brideFullName ?? "",
      groomFullName: couple.groomFullName ?? "",
      brideShortName: couple.brideShortName ?? "",
      groomShortName: couple.groomShortName ?? "",
      brideBirthOrder: couple.brideBirthOrder ?? "",
      groomBirthOrder: couple.groomBirthOrder ?? "",
      brideZodiac: couple.brideZodiac ?? "",
      groomZodiac: couple.groomZodiac ?? "",
      brideFirst: couple.brideFirst ?? true,
      date: couple.date ?? "",
      time: couple.time ?? "",
      ceremonyDate: couple.ceremonyDate ?? "",
      ceremonyTime: couple.ceremonyTime ?? "",
      ceremonyHeader: couple.ceremonyHeader ?? "",
      ceremonyType: couple.ceremonyType === "vu-quy" ? "vu-quy" : "thanh-hon",
      openingMessage: couple.openingMessage ?? "",
      heroImage: dedicatedHeroImage(demo.heroImage),
      heroImage2: dedicatedHeroImage(demo.heroImage2),
      showHeroImage: demo.showHeroImage ?? true,
      dressCodeColors: demo.dressCodeColors ?? "",
      albumLayout: demo.albumLayout ?? "grid",

      brideFather: families.brideFather ?? "",
      brideMother: families.brideMother ?? "",
      brideAddress: families.brideAddress ?? "",
      groomFather: families.groomFather ?? "",
      groomMother: families.groomMother ?? "",
      groomAddress: families.groomAddress ?? "",
      brideParentTitle: families.brideParentTitle ?? "",
      groomParentTitle: families.groomParentTitle ?? "",

      address: venue.address ?? "",
      mapAddress: venue.mapAddress ?? "",
      banquetTime: venue.banquetTime ?? "",

      brideBankName: bank.brideBankName ?? "",
      brideAccountNumber: bank.brideAccountNumber ?? "",
      brideAccountName: bank.brideAccountName ?? "",
      groomBankName: bank.groomBankName ?? "",
      groomAccountNumber: bank.groomAccountNumber ?? "",
      groomAccountName: bank.groomAccountName ?? "",
    },
    schedule: demo.schedule.map((s, i) => ({ time: s.time, label: s.label, sortOrder: i })),
    gallery: demo.gallery.map((url, i) => ({ url, sortOrder: i })),
  };
}
