import { EARTHLY_BRANCHES } from "./vietnamese-lunar-date";

export const ZODIAC_TEMPLATE_SLUG = "thap-nhi-chi-do";
export const DEFAULT_ZODIAC_ART_COLOR = "#d4a24a";
export const ZODIAC_BRANCHES = EARTHLY_BRANCHES;

const ZODIAC_ASSET_ROOT = `/chungdoi/images/themes/_decor/${ZODIAC_TEMPLATE_SLUG}`;

export const ZODIAC = [
  { id: "chuot", branch: ZODIAC_BRANCHES[0], animal: "Chuột" },
  { id: "trau", branch: ZODIAC_BRANCHES[1], animal: "Trâu" },
  { id: "ho", branch: ZODIAC_BRANCHES[2], animal: "Hổ" },
  { id: "meo", branch: ZODIAC_BRANCHES[3], animal: "Mèo" },
  { id: "rong", branch: ZODIAC_BRANCHES[4], animal: "Rồng" },
  { id: "tran", branch: ZODIAC_BRANCHES[5], animal: "Trăn" },
  { id: "ngua", branch: ZODIAC_BRANCHES[6], animal: "Ngựa" },
  { id: "de", branch: ZODIAC_BRANCHES[7], animal: "Dê" },
  { id: "khi", branch: ZODIAC_BRANCHES[8], animal: "Khỉ" },
  { id: "ga", branch: ZODIAC_BRANCHES[9], animal: "Gà" },
  { id: "cho", branch: ZODIAC_BRANCHES[10], animal: "Chó" },
  { id: "lon", branch: ZODIAC_BRANCHES[11], animal: "Lợn" },
] as const;

export type ZodiacId = (typeof ZODIAC)[number]["id"];

export const ZODIAC_IDS = ZODIAC.map((item) => item.id) as [
  ZodiacId,
  ...ZodiacId[],
];

export type ZodiacArtworkId = ZodiacId | "phuong";
export type ZodiacArtworkVariant = "filled" | "line";

const ZODIAC_ID_SET: ReadonlySet<string> = new Set(ZODIAC_IDS);
const ZODIAC_ARTWORK_ID_SET: ReadonlySet<string> = new Set([
  ...ZODIAC_IDS,
  "phuong",
]);

export function isZodiacId(value: string | null | undefined): value is ZodiacId {
  return typeof value === "string" && ZODIAC_ID_SET.has(value);
}

export function zodiacArtworkPath(
  id: ZodiacArtworkId,
  variant: ZodiacArtworkVariant = "filled",
): string {
  const suffix = variant === "line" ? "-line" : "";
  return `${ZODIAC_ASSET_ROOT}/zodiac-${id}${suffix}.webp`;
}

export function isZodiacArtworkPath(value: string): boolean {
  const prefix = `${ZODIAC_ASSET_ROOT}/zodiac-`;
  if (!value.startsWith(prefix) || !value.endsWith(".webp")) return false;
  const fileName = value.slice(prefix.length, -".webp".length);
  const id = fileName.endsWith("-line") ? fileName.slice(0, -"-line".length) : fileName;
  return ZODIAC_ARTWORK_ID_SET.has(id);
}

export function zodiacTemplatePrimaryColor(templateId: string): string | undefined {
  return templateId === ZODIAC_TEMPLATE_SLUG ? DEFAULT_ZODIAC_ART_COLOR : undefined;
}
