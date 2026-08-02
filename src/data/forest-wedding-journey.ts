import { chungdoiDemoContent } from "@/data/chungdoi-demo-content";
import { googleCalendarUrl } from "@/lib/google-calendar-url";

export const FOREST_JOURNEY_SCENE_TYPES = [
  "cover-gate",
  "families",
  "opening-message",
  "calendar",
  "schedule",
  "gallery-photo",
  "dress-code",
  "venue",
  "map",
  "rsvp",
  "wishes",
  "gift",
  "finale",
] as const;

export type ForestJourneySceneType = (typeof FOREST_JOURNEY_SCENE_TYPES)[number];
export type ForestJourneyVector3 = readonly [number, number, number];
export type ForestFamilySide = "bride" | "groom";

export type ForestJourneyPhoto = {
  readonly id: string;
  readonly src: string;
};

export type ForestJourneyGiftAccount = {
  readonly accountName: string;
  readonly accountNumber: string;
  readonly bankName: string;
  readonly side: "bride" | "groom";
};

export type ForestJourneyWishEntry = {
  readonly id: string;
  readonly message: string;
  readonly name: string;
};

export type ForestJourneyContent = {
  readonly brideFirst: boolean;
  readonly brideName: string;
  readonly calendarUrl: string;
  readonly ceremonyDate: string;
  readonly ceremonyHeader: string;
  readonly ceremonyTime: string;
  readonly dressCodeColors: readonly string[];
  readonly families: {
    readonly brideAddress: string;
    readonly brideFather: string;
    readonly brideMother: string;
    readonly brideParentTitle: string;
    readonly groomAddress: string;
    readonly groomFather: string;
    readonly groomMother: string;
    readonly groomParentTitle: string;
  };
  readonly gallery: readonly ForestJourneyPhoto[];
  readonly giftAccounts: readonly ForestJourneyGiftAccount[];
  readonly groomName: string;
  readonly mapQuery: string;
  readonly openingMessage: string;
  readonly receptionDate: string;
  readonly receptionTime: string;
  readonly schedule: readonly { readonly label: string; readonly time: string }[];
  readonly venueAddress: string;
  readonly wishes: readonly ForestJourneyWishEntry[];
};

export type ForestCalendarEvent = {
  readonly date: string;
  readonly formattedDate: string;
  readonly label: string;
  readonly time: string;
};

export type ForestCalendarEventLabels = {
  readonly ceremony: string;
  readonly formattedCeremonyDate: string;
  readonly formattedReceptionDate: string;
  readonly reception: string;
};

export type ForestJourneyFeatures = {
  readonly gift: boolean;
  readonly map: boolean;
  readonly rsvp: boolean;
  readonly wishes: boolean;
};

export function orderForestFamilySides(
  brideFirst: boolean,
): readonly ForestFamilySide[] {
  return brideFirst ? ["bride", "groom"] : ["groom", "bride"];
}

export type ForestJourneyScene = {
  readonly cameraPosition: ForestJourneyVector3;
  readonly id: string;
  readonly lookTarget: ForestJourneyVector3;
  readonly ordinal: number;
  readonly photo: ForestJourneyPhoto | null;
  readonly travelDurationMs: number;
  readonly travelMidpointToNext: ForestJourneyVector3 | null;
  readonly type: ForestJourneySceneType;
};

export const forestWeddingJourneyDefinition = {
  camera: { far: 160, fovDegrees: 50, near: 0.1 },
  look: { pitchDegrees: 8, yawDegrees: 20 },
  reducedDurationMs: 180,
} as const;

export const forestWeddingJourneyFeatures = {
  gift: true,
  map: true,
  rsvp: true,
  wishes: true,
} as const;

export function buildForestCalendarEvents(
  content: Pick<
    ForestJourneyContent,
    "ceremonyDate" | "ceremonyTime" | "receptionDate" | "receptionTime"
  >,
  labels: ForestCalendarEventLabels,
): readonly ForestCalendarEvent[] {
  return [
    {
      date: content.ceremonyDate,
      formattedDate: labels.formattedCeremonyDate,
      label: labels.ceremony,
      time: content.ceremonyTime,
    },
    {
      date: content.receptionDate,
      formattedDate: labels.formattedReceptionDate,
      label: labels.reception,
      time: content.receptionTime,
    },
  ].filter(({ date, time }) => date.trim().length > 0 || time.trim().length > 0);
}

const qasrGreenContent = chungdoiDemoContent["qasr-green"];

const qasrGreenGallery = qasrGreenContent.gallery
  .filter((src) => src.trim().length > 0)
  .slice(0, 3)
  .map((src, index) => ({
    id: `memory-${String(index + 1).padStart(2, "0")}`,
    src,
  }));

const qasrGreenWishes: readonly ForestJourneyWishEntry[] = qasrGreenContent.wishes
  .slice(0, 2)
  .map((wish, index) => ({
    id: `demo-wish-${String(index + 1).padStart(2, "0")}`,
    message: wish.text.trim(),
    name: wish.name.trim(),
  }));

// The source account holders are unrelated to this couple, so this private lab uses
// explicitly synthetic accounts solely to exercise the gift scene safely.
const forestJourneyLabOnlyGiftAccounts: readonly ForestJourneyGiftAccount[] = [
  {
    accountName: qasrGreenContent.couple.brideFullName.trim(),
    accountNumber: "000000000",
    bankName: "Forest Journey Demo Bank",
    side: "bride",
  },
  {
    accountName: qasrGreenContent.couple.groomFullName.trim(),
    accountNumber: "111111111",
    bankName: "Forest Journey Demo Bank",
    side: "groom",
  },
];

export const forestWeddingJourneyDemoContent: ForestJourneyContent = {
  brideFirst: qasrGreenContent.couple.brideFirst,
  brideName: qasrGreenContent.couple.brideFullName.trim(),
  calendarUrl: googleCalendarUrl(qasrGreenContent),
  ceremonyDate: qasrGreenContent.couple.ceremonyDate.trim(),
  ceremonyHeader: qasrGreenContent.couple.ceremonyHeader.trim(),
  ceremonyTime: qasrGreenContent.couple.ceremonyTime.trim(),
  dressCodeColors: (qasrGreenContent.dressCodeColors ?? "")
    .split(",")
    .map((color) => color.trim())
    .filter(Boolean),
  families: {
    brideAddress: qasrGreenContent.families.brideAddress.trim(),
    brideFather: qasrGreenContent.families.brideFather.trim(),
    brideMother: qasrGreenContent.families.brideMother.trim(),
    brideParentTitle: qasrGreenContent.families.brideParentTitle.trim(),
    groomAddress: qasrGreenContent.families.groomAddress.trim(),
    groomFather: qasrGreenContent.families.groomFather.trim(),
    groomMother: qasrGreenContent.families.groomMother.trim(),
    groomParentTitle: qasrGreenContent.families.groomParentTitle.trim(),
  },
  gallery: qasrGreenGallery,
  giftAccounts: forestJourneyLabOnlyGiftAccounts,
  groomName: qasrGreenContent.couple.groomFullName.trim(),
  mapQuery: qasrGreenContent.venue.mapAddress.trim() || qasrGreenContent.venue.address.trim(),
  openingMessage: qasrGreenContent.couple.openingMessage?.trim() ?? "",
  receptionDate: qasrGreenContent.couple.date.trim(),
  receptionTime: (qasrGreenContent.venue.banquetTime || qasrGreenContent.couple.time).trim(),
  schedule: qasrGreenContent.schedule.map(({ label, time }) => ({ label: label.trim(), time: time.trim() })),
  venueAddress: qasrGreenContent.venue.address.trim(),
  wishes: qasrGreenWishes,
};

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function sanitizePhoto(photo: ForestJourneyPhoto): ForestJourneyPhoto | null {
  const id = photo.id.trim();
  const src = photo.src.trim();
  return id && src ? { id, src } : null;
}

function validGalleryPhotos(content: ForestJourneyContent): readonly ForestJourneyPhoto[] {
  const ids = new Set<string>();
  const photos: ForestJourneyPhoto[] = [];

  for (const sourcePhoto of content.gallery) {
    const photo = sanitizePhoto(sourcePhoto);
    if (photo && !ids.has(photo.id)) {
      ids.add(photo.id);
      photos.push(photo);
    }
  }

  return photos;
}

function hasFamilyDetails(content: ForestJourneyContent): boolean {
  return Object.values(content.families).some(hasText);
}

function hasValidSchedule(content: ForestJourneyContent): boolean {
  return content.schedule.some(({ label, time }) => hasText(label) && hasText(time));
}

export function isValidForestGiftAccount(
  account: ForestJourneyGiftAccount,
  content: Pick<ForestJourneyContent, "brideName" | "groomName">,
): boolean {
  const expectedOwner = account.side === "bride" ? content.brideName : content.groomName;
  return (
    hasText(account.accountName) &&
    hasText(account.accountNumber) &&
    hasText(account.bankName) &&
    account.accountName.trim().toLowerCase() === expectedOwner.trim().toLowerCase()
  );
}

function resolveScenePose(ordinal: number, sceneCount: number) {
  const z = 8 - ordinal * 8.5;
  const side = ordinal === 0 || ordinal === sceneCount - 1 ? 0 : ordinal % 2 === 0 ? 1 : -1;
  return {
    cameraPosition: [side * 0.35, 1.62, z] as ForestJourneyVector3,
    lookTarget: [side * 1.1, 1.35, z - 4.5] as ForestJourneyVector3,
    travelDurationMs: ordinal === 0 ? 1500 : 1350 + (ordinal % 3) * 150,
    travelMidpointToNext:
      ordinal === sceneCount - 1 ? null : ([-side * 0.45, 1.72, z - 4.25] as ForestJourneyVector3),
  };
}

export function buildForestJourneyScenes(
  content: ForestJourneyContent,
  features: ForestJourneyFeatures,
): readonly ForestJourneyScene[] {
  const descriptors: { id: string; photo: ForestJourneyPhoto | null; type: ForestJourneySceneType }[] = [
    { id: "cover-gate", photo: null, type: "cover-gate" },
  ];

  if (hasFamilyDetails(content)) descriptors.push({ id: "families", photo: null, type: "families" });
  if (hasText(content.openingMessage) || hasText(content.ceremonyHeader)) {
    descriptors.push({ id: "opening-message", photo: null, type: "opening-message" });
  }
  if (hasText(content.ceremonyDate) || hasText(content.receptionDate)) {
    descriptors.push({ id: "calendar", photo: null, type: "calendar" });
  }
  if (hasValidSchedule(content)) descriptors.push({ id: "schedule", photo: null, type: "schedule" });

  for (const photo of validGalleryPhotos(content)) {
    descriptors.push({ id: `gallery-photo:${photo.id}`, photo, type: "gallery-photo" });
  }

  if (content.dressCodeColors.some(hasText)) {
    descriptors.push({ id: "dress-code", photo: null, type: "dress-code" });
  }
  if (hasText(content.venueAddress)) descriptors.push({ id: "venue", photo: null, type: "venue" });
  if (features.map && (hasText(content.mapQuery) || hasText(content.venueAddress))) {
    descriptors.push({ id: "map", photo: null, type: "map" });
  }
  if (features.rsvp) descriptors.push({ id: "rsvp", photo: null, type: "rsvp" });
  if (features.wishes) descriptors.push({ id: "wishes", photo: null, type: "wishes" });
  if (
    features.gift &&
    content.giftAccounts.length > 0 &&
    content.giftAccounts.every((account) => isValidForestGiftAccount(account, content))
  ) {
    descriptors.push({ id: "gift", photo: null, type: "gift" });
  }

  descriptors.push({ id: "finale", photo: null, type: "finale" });
  return descriptors.map((descriptor, ordinal) => ({
    ...descriptor,
    ...resolveScenePose(ordinal, descriptors.length),
    ordinal,
  }));
}
