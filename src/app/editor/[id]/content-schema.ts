import { z } from "zod";

import { templates } from "@/data/chungdoi";
import {
  capitalizeVietnameseSentences,
  titleCaseVietnameseName,
} from "@/lib/text-case";
import { ZODIAC_IDS } from "@/lib/zodiac";

const ALL_TEMPLATE_SLUGS = new Set(templates.map((t) => t.slug));

const optionalName = (max: number) => z.string().max(max).optional().default("")
  .transform(titleCaseVietnameseName);
const optionalSentence = (max: number) => z.string().max(max).optional().default("")
  .transform(capitalizeVietnameseSentences);

const formBoolean = (defaultValue: boolean) => z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") return defaultValue;
    return value === true || value === "true" || value === "on" || value === 1 || value === "1";
  },
  z.boolean(),
);

export const scheduleItemSchema = z.object({
  time: z.string().max(20),
  label: z.string().max(120).transform(capitalizeVietnameseSentences),
});

export const ceremonyItemSchema = z.object({
  title: z.string().max(300).transform(capitalizeVietnameseSentences),
  date: z.string().max(20),
  time: z.string().max(20),
});

export const contentSchema = z.object({
  templateId: z.string().refine((v) => ALL_TEMPLATE_SLUGS.has(v), {
    message: "Mẫu thiệp không hợp lệ",
  }),
  primaryColor: z.string().max(32).optional().default(""),
  fontFamily: z.string().max(80).optional().default(""),
  music: z.string().max(300).optional().default(""),
  dressCodeColors: z.string().max(200).optional().default(""),
  albumLayout: z.enum(["grid", "mosaic", "coverflow"]).optional().default("grid"),

  brideFullName: optionalName(120),
  groomFullName: optionalName(120),
  brideShortName: optionalName(60),
  groomShortName: optionalName(60),
  groomBirthOrder: optionalSentence(40),
  brideBirthOrder: optionalSentence(40),
  brideZodiac: z.enum(ZODIAC_IDS).or(z.literal("")).optional().default(""),
  groomZodiac: z.enum(ZODIAC_IDS).or(z.literal("")).optional().default(""),
  brideFirst: formBoolean(true),
  date: z.string().max(20).optional().default(""),
  time: z.string().max(20).optional().default(""),
  ceremonyDate: z.string().max(20).optional().default(""),
  ceremonyTime: z.string().max(20).optional().default(""),
  ceremonyHeader: optionalSentence(200),
  ceremonyType: z.enum(["thanh-hon", "vu-quy"]).optional().default("thanh-hon"),
  openingMessage: optionalSentence(300),
  heroImage: z.string().max(300).optional().default(""),
  heroImage2: z.string().max(300).optional().default(""),
  showHeroImage: formBoolean(true),

  brideFather: optionalName(120),
  brideMother: optionalName(120),
  brideAddress: optionalSentence(200),
  groomFather: optionalName(120),
  groomMother: optionalName(120),
  groomAddress: optionalSentence(200),
  brideParentTitle: optionalSentence(60),
  groomParentTitle: optionalSentence(60),

  address: optionalSentence(200),
  mapAddress: z.string().max(1_200).optional().default(""),
  banquetTime: z.string().max(60).optional().default(""),

  brideBankName: z.string().max(120).optional().default(""),
  brideAccountNumber: z.string().max(60).optional().default(""),
  brideAccountName: optionalName(120),
  groomBankName: z.string().max(120).optional().default(""),
  groomAccountNumber: z.string().max(60).optional().default(""),
  groomAccountName: optionalName(120),
});

export type EditorErrorCode =
  | "invalidData"
  | "invitationNotFound"
  | "slugMissing"
  | "slugMalformed"
  | "slugTaken"
  | "coupleRequired"
  | "dateRequired"
  | "timeRequired";

export type EditorState =
  | {
      errorCode?: EditorErrorCode;
      focusField?: string;
      ok?: boolean;
      persisted?: boolean;
      publishedSlug?: string;
      publishedAt?: string;
    }
  | undefined;

export type SlugCheckResult =
  | { available: true }
  | {
      available: false;
      reasonCode: Extract<
        EditorErrorCode,
        "invitationNotFound" | "slugMissing" | "slugMalformed" | "slugTaken"
      >;
    };

export function parseSchedule(formData: FormData) {
  const times = formData.getAll("scheduleTime").map(String);
  const labels = formData.getAll("scheduleLabel").map(String);
  const items: { time: string; label: string }[] = [];
  for (let i = 0; i < Math.max(times.length, labels.length); i++) {
    const time = (times[i] ?? "").trim();
    const label = (labels[i] ?? "").trim();
    if (!time && !label) continue;
    const parsed = scheduleItemSchema.safeParse({ time, label });
    if (parsed.success) items.push(parsed.data);
  }
  return items;
}

export function parseCeremonies(formData: FormData) {
  const titles = formData.getAll("ceremonyItemTitle").map(String);
  const dates = formData.getAll("ceremonyItemDate").map(String);
  const times = formData.getAll("ceremonyItemTime").map(String);
  const items: { title: string; date: string; time: string }[] = [];

  for (let i = 0; i < Math.max(titles.length, dates.length, times.length); i++) {
    const title = (titles[i] ?? "").trim();
    const date = (dates[i] ?? "").trim();
    const time = (times[i] ?? "").trim();
    if (!title && !date && !time) continue;
    const parsed = ceremonyItemSchema.safeParse({ title, date, time });
    if (parsed.success) items.push(parsed.data);
  }

  return items.slice(0, 20);
}

export function parseGallery(formData: FormData) {
  return formData
    .getAll("galleryUrl")
    .map(String)
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 30);
}
