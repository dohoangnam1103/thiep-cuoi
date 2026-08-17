import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import type { FormattedDate } from "@/components/chungdoi-tpl-shared";
import { buildCalendar, formatDate, googleCalendarUrl } from "@/components/chungdoi-tpl-shared";
import { invitationGiftAccounts } from "@/lib/invitation-display";

export const DALAT_INVITATION_STOP_ROLES = [
  "cover",
  "album",
  "schedule",
  "map",
  "wishes-gift",
] as const;

export type DalatInvitationStopRole =
  (typeof DALAT_INVITATION_STOP_ROLES)[number];

export type DalatInvitationGiftBank = {
  side: "bride" | "groom";
  label: string;
  bank: string;
  num: string;
  name: string;
};

export type DalatInvitationLabels = {
  addToCalendar: string;
  album: string;
  albumIntro: string;
  bride: string;
  calendar: string;
  cover: string;
  directions: string;
  gift: string;
  giftIntro: string;
  giftUnavailable: string;
  groom: string;
  map: string;
  mapUnavailable: string;
  openGift: string;
  schedule: string;
  wishes: string;
  wishesIntro: string;
  wishNamePlaceholder: string;
  wishPlaceholder: string;
  wishSubmit: string;
  wishSuccess: string;
};

export type DalatInvitationContract = {
  calendar: ReturnType<typeof buildCalendar>;
  ceremonyDate: FormattedDate | null;
  giftBanks: DalatInvitationGiftBank[];
  mapQuery: string;
  receptionDate: FormattedDate | null;
  roles: readonly DalatInvitationStopRole[];
  calendarUrl: string;
};

function normalizeAccountOwner(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function accountBelongsToPerson(
  accountName: string,
  fullName: string,
  shortName: string,
): boolean {
  const owner = normalizeAccountOwner(accountName);
  const full = normalizeAccountOwner(fullName);
  const short = normalizeAccountOwner(shortName);

  return Boolean(
    owner
    && (
      (full.length >= 4 && (owner.includes(full) || full.includes(owner)))
      || (short.length >= 4 && owner.includes(short))
    )
  );
}

export function buildDalatInvitationContract(
  content: ChungDoiDemoContent,
): DalatInvitationContract {
  const { couple, venue } = content;
  // invitationGiftAccounts already drops accounts that cannot produce a QR.
  // This journey additionally requires the account holder to be recognisably
  // one of the couple, so a stray third-party account is never shown.
  const giftBanks = invitationGiftAccounts(content)
    .filter((account) => Boolean(
      account.name
      && accountBelongsToPerson(account.name, account.fullName, account.shortName),
    ))
    .map((account) => ({
      bank: account.bank,
      label: account.name,
      name: account.name,
      num: account.num,
      side: account.side,
    }));

  return {
    calendar: buildCalendar(couple.date),
    ceremonyDate: formatDate(couple.ceremonyDate),
    giftBanks,
    mapQuery: (venue.mapAddress || venue.address).trim(),
    receptionDate: formatDate(couple.date),
    roles: DALAT_INVITATION_STOP_ROLES,
    calendarUrl: googleCalendarUrl(content),
  };
}
