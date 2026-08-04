import { chungdoiDemoContent } from "@/data/chungdoi-demo-content";
import { googleCalendarUrl } from "@/lib/google-calendar-url";

export const BEACH_JOURNEY_SCENE_TYPES = [
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

export type BeachJourneySceneType = (typeof BEACH_JOURNEY_SCENE_TYPES)[number];
export type BeachJourneyVector3 = readonly [number, number, number];
export type BeachFamilySide = "bride" | "groom";

export type BeachJourneyPhoto = {
  readonly id: string;
  readonly src: string;
};

export type BeachJourneyGiftAccount = {
  readonly accountName: string;
  readonly accountNumber: string;
  readonly bankName: string;
  readonly side: "bride" | "groom";
};

export type BeachJourneyWishEntry = {
  readonly id: string;
  readonly message: string;
  readonly name: string;
};

export type BeachJourneyContent = {
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
  readonly gallery: readonly BeachJourneyPhoto[];
  readonly giftAccounts: readonly BeachJourneyGiftAccount[];
  readonly groomName: string;
  readonly mapQuery: string;
  readonly openingMessage: string;
  readonly receptionDate: string;
  readonly receptionTime: string;
  readonly schedule: readonly { readonly label: string; readonly time: string }[];
  readonly venueAddress: string;
  readonly wishes: readonly BeachJourneyWishEntry[];
};

export type BeachCalendarEvent = {
  readonly date: string;
  readonly formattedDate: string;
  readonly label: string;
  readonly time: string;
};

export type BeachCalendarEventLabels = {
  readonly ceremony: string;
  readonly formattedCeremonyDate: string;
  readonly formattedReceptionDate: string;
  readonly reception: string;
};

export type BeachJourneyFeatures = {
  readonly gift: boolean;
  readonly map: boolean;
  readonly rsvp: boolean;
  readonly wishes: boolean;
};

export function orderBeachFamilySides(
  brideFirst: boolean,
): readonly BeachFamilySide[] {
  return brideFirst ? ["bride", "groom"] : ["groom", "bride"];
}

export type BeachJourneyScene = {
  readonly cameraPosition: BeachJourneyVector3;
  readonly id: string;
  readonly lookTarget: BeachJourneyVector3;
  readonly ordinal: number;
  readonly photo: BeachJourneyPhoto | null;
  readonly travelDurationMs: number;
  readonly travelMidpointToNext: BeachJourneyVector3 | null;
  readonly type: BeachJourneySceneType;
};

/**
 * How far inland the rail runs from the still waterline, in metres.
 *
 * Waves are deferred, so the sand/water intersection is a hard static line. Kept
 * in the mid-ground the eye reads it as distance haze; brought into the
 * foreground it reads as the rim of an ornamental pond. When wave foam lands this
 * can be reduced, and `beach-shoreline.ts` is where that change belongs.
 */
export const BEACH_SHORE_SETBACK_METRES = 7;

/** Metres of shoreline between consecutive scenes. */
const SCENE_SPACING_METRES = 8.5;

/** How far inland non-terminal scenes step off the setback line, in metres. */
const SCENE_DRIFT_METRES = 0.9;

export const beachWeddingJourneyDefinition = {
  camera: { far: 320, fovDegrees: 50, near: 0.1 },
  look: { pitchDegrees: 8, yawDegrees: 20 },
  reducedDurationMs: 180,
} as const;

export const beachWeddingJourneyFeatures = {
  gift: true,
  map: true,
  rsvp: true,
  wishes: true,
} as const;

export function buildBeachCalendarEvents(
  content: Pick<
    BeachJourneyContent,
    "ceremonyDate" | "ceremonyTime" | "receptionDate" | "receptionTime"
  >,
  labels: BeachCalendarEventLabels,
): readonly BeachCalendarEvent[] {
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

const qasrGreenWishes: readonly BeachJourneyWishEntry[] = qasrGreenContent.wishes
  .slice(0, 2)
  .map((wish, index) => ({
    id: `demo-wish-${String(index + 1).padStart(2, "0")}`,
    message: wish.text.trim(),
    name: wish.name.trim(),
  }));

// The source account holders are unrelated to this couple, so this private lab uses
// explicitly synthetic accounts solely to exercise the gift scene safely.
const beachJourneyLabOnlyGiftAccounts: readonly BeachJourneyGiftAccount[] = [
  {
    accountName: qasrGreenContent.couple.brideFullName.trim(),
    accountNumber: "000000000",
    bankName: "Beach Journey Demo Bank",
    side: "bride",
  },
  {
    accountName: qasrGreenContent.couple.groomFullName.trim(),
    accountNumber: "111111111",
    bankName: "Beach Journey Demo Bank",
    side: "groom",
  },
];

export const beachWeddingJourneyDemoContent: BeachJourneyContent = {
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
  giftAccounts: beachJourneyLabOnlyGiftAccounts,
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

function sanitizePhoto(photo: BeachJourneyPhoto): BeachJourneyPhoto | null {
  const id = photo.id.trim();
  const src = photo.src.trim();
  return id && src ? { id, src } : null;
}

function validGalleryPhotos(content: BeachJourneyContent): readonly BeachJourneyPhoto[] {
  const ids = new Set<string>();
  const photos: BeachJourneyPhoto[] = [];

  for (const sourcePhoto of content.gallery) {
    const photo = sanitizePhoto(sourcePhoto);
    if (photo && !ids.has(photo.id)) {
      ids.add(photo.id);
      photos.push(photo);
    }
  }

  return photos;
}

function hasFamilyDetails(content: BeachJourneyContent): boolean {
  return Object.values(content.families).some(hasText);
}

function hasValidSchedule(content: BeachJourneyContent): boolean {
  return content.schedule.some(({ label, time }) => hasText(label) && hasText(time));
}

export function isValidBeachGiftAccount(
  account: BeachJourneyGiftAccount,
  content: Pick<BeachJourneyContent, "brideName" | "groomName">,
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
  const x = -8 + ordinal * SCENE_SPACING_METRES;
  const isTerminal = ordinal === 0 || ordinal === sceneCount - 1;
  // Terminal scenes sit closest to the water; the rest alternate a small step
  // inland and back so the walk reads as a stroll, never a rail. The drift is
  // measured *inland* from the setback, which is a floor and not a mean — no
  // pose may come closer to the waterline than BEACH_SHORE_SETBACK_METRES.
  const drift = isTerminal ? 0 : ordinal % 2 === 0 ? SCENE_DRIFT_METRES : 0;
  const z = BEACH_SHORE_SETBACK_METRES + drift;

  return {
    cameraPosition: [x, 1.62, z] as BeachJourneyVector3,
    // Look ahead down the beach, angled slightly seaward so sky and water stay
    // in frame without putting the waterline seam under the camera.
    lookTarget: [x + 4.5, 1.35, z - 1.1] as BeachJourneyVector3,
    travelDurationMs: ordinal === 0 ? 1500 : 1350 + (ordinal % 3) * 150,
    travelMidpointToNext:
      ordinal === sceneCount - 1
        ? null
        : ([
            x + SCENE_SPACING_METRES / 2,
            1.72,
            BEACH_SHORE_SETBACK_METRES + SCENE_DRIFT_METRES / 2,
          ] as BeachJourneyVector3),
  };
}

export function buildBeachJourneyScenes(
  content: BeachJourneyContent,
  features: BeachJourneyFeatures,
): readonly BeachJourneyScene[] {
  const descriptors: { id: string; photo: BeachJourneyPhoto | null; type: BeachJourneySceneType }[] = [
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
    content.giftAccounts.every((account) => isValidBeachGiftAccount(account, content))
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
