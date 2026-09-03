import { z } from "zod";
import { FONT_OPTIONS } from "@/data/editor-options";

export const HERO_FONT_OPTIONS = [
  ...FONT_OPTIONS.filter(option => option.value),
  ...["The Nautigal", "Beau Rivage", "Alex Brush", "Lora", "Times New Roman", "UNI Chu truyen thong", "Viaoda Libre", "EB Garamond", "Cormorant Garamond", "Uchen", "SVN-HC Carosello", "1FTV VIP Signora", "DFVN New Eddy", "Carattere", "Whisper", "Ms Madi"].map(value => ({ value, label: value })),
];
export const heroTypographySchema = z.object({
  fontFamily: z.string().refine(value => value === "" || HERO_FONT_OPTIONS.some(font => font.value === value)),
  bold: z.boolean().nullable(),
  italic: z.boolean().nullable(),
}).strict();
export type HeroTypography = z.infer<typeof heroTypographySchema>;
export type HeroTypographyMap = Record<string, HeroTypography>;
export const ORIGINAL_HERO_TYPOGRAPHY: HeroTypography = { fontFamily: "", bold: null, italic: null };

/** A user's existing font selection takes precedence over the template family. */
export function resolveHeroTypography(defaults: HeroTypography | undefined, userFont?: string | null): HeroTypography {
  return { ...ORIGINAL_HERO_TYPOGRAPHY, ...defaults, fontFamily: userFont?.trim() || defaults?.fontFamily || "" };
}
