import { z } from "zod";

export const studioPalettes = ["crimson", "sage", "midnight", "ivory", "terracotta", "lavender"] as const;
export const studioTypography = ["romantic", "editorial", "modern", "heritage"] as const;
export const studioLayouts = ["centered", "split", "editorial"] as const;
export const studioDecorations = ["floral", "line-art", "traditional", "none"] as const;
export const studioHeroStyles = ["portrait", "arch", "minimal"] as const;
export const studioSections = ["hero", "story", "details", "schedule", "gallery", "rsvp"] as const;

export const studioSpecSchema = z.object({
  version: z.literal(1),
  sourceSlug: z.string().trim().min(1).max(100),
  palette: z.enum(studioPalettes),
  typography: z.enum(studioTypography),
  layout: z.enum(studioLayouts),
  decoration: z.enum(studioDecorations),
  heroStyle: z.enum(studioHeroStyles),
  sectionOrder: z
    .array(z.enum(studioSections))
    .min(3)
    .max(studioSections.length)
    .refine((sections) => new Set(sections).size === sections.length),
  copy: z.object({
    eyebrow: z.string().trim().max(80),
    quote: z.string().trim().max(240),
    closing: z.string().trim().max(240),
  }),
});

export type StudioSpec = z.infer<typeof studioSpecSchema>;
export type StudioPalette = StudioSpec["palette"];
export type StudioTypography = StudioSpec["typography"];
export type StudioLayout = StudioSpec["layout"];
export type StudioDecoration = StudioSpec["decoration"];
export type StudioHeroStyle = StudioSpec["heroStyle"];
export type StudioSection = StudioSpec["sectionOrder"][number];

export type StudioSource = {
  slug: string;
  name: string;
  heroImage: string;
  gallery: string[];
  brideName: string;
  groomName: string;
  date: string;
  time: string;
  venue: string;
  schedule: { time: string; label: string }[];
};

export function createInitialStudioSpec(
  sourceSlug: string,
  copy: StudioSpec["copy"],
): StudioSpec {
  return {
    version: 1,
    sourceSlug,
    palette: "crimson",
    typography: "romantic",
    layout: "centered",
    decoration: "floral",
    heroStyle: "portrait",
    sectionOrder: ["hero", "story", "details", "schedule", "gallery", "rsvp"],
    copy: { ...copy },
  };
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function moveSection(sections: StudioSection[], section: StudioSection, target: number): StudioSection[] {
  const remaining = sections.filter((item) => item !== section);
  remaining.splice(Math.max(0, Math.min(target, remaining.length)), 0, section);
  return remaining;
}

export function applyLocalDesignPrompt(prompt: string, current: StudioSpec): StudioSpec {
  const value = prompt.toLocaleLowerCase("vi");
  const next: StudioSpec = {
    ...current,
    sectionOrder: [...current.sectionOrder],
    copy: { ...current.copy },
  };

  if (includesAny(value, ["đỏ", "crimson", "son", "long phụng"])) next.palette = "crimson";
  if (includesAny(value, ["xanh lá", "sage", "thiên nhiên"])) next.palette = "sage";
  if (includesAny(value, ["xanh đêm", "navy", "midnight"])) next.palette = "midnight";
  if (includesAny(value, ["trắng", "kem", "ivory"])) next.palette = "ivory";
  if (includesAny(value, ["đất nung", "terracotta", "boho"])) next.palette = "terracotta";
  if (includesAny(value, ["tím", "lavender"])) next.palette = "lavender";

  if (includesAny(value, ["tối giản", "minimal"])) {
    next.layout = "centered";
    next.heroStyle = "minimal";
    next.decoration = "none";
    next.typography = "modern";
  }
  if (includesAny(value, ["tạp chí", "editorial"])) {
    next.layout = "editorial";
    next.typography = "editorial";
    next.decoration = "line-art";
  }
  if (includesAny(value, ["chia đôi", "split"])) next.layout = "split";
  if (includesAny(value, ["lãng mạn", "romantic"])) next.typography = "romantic";
  if (includesAny(value, ["truyền thống", "heritage", "long phụng"])) {
    next.typography = "heritage";
    next.decoration = "traditional";
  }
  if (includesAny(value, ["khung vòm", "arch"])) next.heroStyle = "arch";
  if (includesAny(value, ["nhiều hoa", "floral", "hoa lá"])) next.decoration = "floral";
  if (includesAny(value, ["line art", "nét mảnh"])) next.decoration = "line-art";

  if (includesAny(value, ["album lên trước", "ảnh lên trước", "gallery lên trước"])) {
    next.sectionOrder = moveSection(next.sectionOrder, "gallery", 1);
  }
  if (includesAny(value, ["ẩn lịch trình", "bỏ lịch trình"])) {
    next.sectionOrder = next.sectionOrder.filter((section) => section !== "schedule");
  }
  if (includesAny(value, ["thêm lịch trình", "hiện lịch trình"]) && !next.sectionOrder.includes("schedule")) {
    next.sectionOrder = moveSection(next.sectionOrder, "schedule", 3);
  }

  return studioSpecSchema.parse(next);
}