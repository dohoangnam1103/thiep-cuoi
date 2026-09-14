import type { AlbumLayout } from "./album-layout";

/**
 * Minimal render-content contract for the two shared Signature renderers.
 * Structural subset of master `ChungDoiDemoContent` — only the fields read
 * by `floral-base`, the jasmine/silk heroes and `invitation-display` helpers.
 * Master `ChungDoiDemoContent` remains assignable to this type.
 */
export type InvitationRenderContent = {
  slug: string;
  invitationId: string;
  theme: {
    primaryColor: string;
    userFontFamily?: string | null;
    fontFamily: string | null;
    assetFolder: string | null;
    assets: string[];
  };
  couple: {
    brideFullName: string;
    groomFullName: string;
    brideShortName: string;
    groomShortName: string;
    brideBirthOrder?: string;
    groomBirthOrder?: string;
    brideFirst: boolean;
    date: string;
    time: string;
    ceremonyDate: string;
    ceremonyTime: string;
    ceremonyHeader: string;
    ceremonyType?: "thanh-hon" | "vu-quy";
    openingMessage?: string;
  };
  families: {
    brideFather: string;
    brideMother: string;
    brideAddress: string;
    groomFather: string;
    groomMother: string;
    groomAddress: string;
    brideParentTitle: string;
    groomParentTitle: string;
  };
  venue: {
    address: string;
    mapAddress: string;
    banquetTime: string;
    welcomeTime?: string;
  };
  ceremonies?: { title: string; date: string; time: string }[];
  schedule: { time: string; label: string }[];
  gallery: string[];
  heroImage?: string;
  heroImage2?: string;
  showHeroImage?: boolean;
  portraits?: {
    bride: string;
    groom: string;
  };
  dressCodeColors?: string;
  albumLayout?: AlbumLayout;
  music: string | null;
  wishes: { name: string; time: string; text: string }[];
  bank: {
    brideBankName: string;
    brideAccountNumber: string;
    brideAccountName: string;
    groomBankName: string;
    groomAccountNumber: string;
    groomAccountName: string;
  };
};

/** Compatibility alias so moved master files keep compiling unchanged. */
export type ChungDoiDemoContent = InvitationRenderContent;
