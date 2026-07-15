import { z } from "zod";

import { templates } from "@/data/chungdoi";

const ALL_TEMPLATE_SLUGS = new Set(templates.map((t) => t.slug));

export const scheduleItemSchema = z.object({
  time: z.string().max(20),
  label: z.string().max(120),
});

export const contentSchema = z.object({
  templateId: z.string().refine((v) => ALL_TEMPLATE_SLUGS.has(v), {
    message: "Mẫu thiệp không hợp lệ",
  }),
  primaryColor: z.string().max(32).optional().default(""),
  fontFamily: z.string().max(80).optional().default(""),
  music: z.string().max(300).optional().default(""),

  brideFullName: z.string().max(120).optional().default(""),
  groomFullName: z.string().max(120).optional().default(""),
  brideShortName: z.string().max(60).optional().default(""),
  groomShortName: z.string().max(60).optional().default(""),
  groomBirthOrder: z.string().max(40).optional().default(""),
  brideBirthOrder: z.string().max(40).optional().default(""),
  brideFirst: z.coerce.boolean().optional().default(true),
  date: z.string().max(20).optional().default(""),
  time: z.string().max(20).optional().default(""),
  ceremonyDate: z.string().max(20).optional().default(""),
  ceremonyTime: z.string().max(20).optional().default(""),
  ceremonyHeader: z.string().max(200).optional().default(""),

  brideFather: z.string().max(120).optional().default(""),
  brideMother: z.string().max(120).optional().default(""),
  brideAddress: z.string().max(200).optional().default(""),
  groomFather: z.string().max(120).optional().default(""),
  groomMother: z.string().max(120).optional().default(""),
  groomAddress: z.string().max(200).optional().default(""),
  brideParentTitle: z.string().max(60).optional().default(""),
  groomParentTitle: z.string().max(60).optional().default(""),

  address: z.string().max(200).optional().default(""),
  mapAddress: z.string().max(300).optional().default(""),
  banquetTime: z.string().max(60).optional().default(""),

  brideBankName: z.string().max(120).optional().default(""),
  brideAccountNumber: z.string().max(60).optional().default(""),
  brideAccountName: z.string().max(120).optional().default(""),
  groomBankName: z.string().max(120).optional().default(""),
  groomAccountNumber: z.string().max(60).optional().default(""),
  groomAccountName: z.string().max(120).optional().default(""),
});

export type EditorState = { error?: string; ok?: boolean; persisted?: boolean } | undefined;

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

export function parseGallery(formData: FormData) {
  return formData
    .getAll("galleryUrl")
    .map(String)
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 30);
}
