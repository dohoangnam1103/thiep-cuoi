import { chungdoiThemeConfig } from "@/data/chungdoi-theme-config";
import { resolveZodiacCardImages } from "@/lib/zodiac-decor";

export type DashboardCardTheme = {
  background: string;
  textColor: string;
  mutedTextColor: string;
  decorations: string[];
};

const NEUTRAL_TEXT = "#1f2937";
const NEUTRAL_MUTED = "#4b5563";
const READABLE_LUMINANCE_MAX = 0.6;
const MAX_DECORATIONS = 2;

function parseColorChannels(color: string): [number, number, number, number] | null {
  const value = color.trim();
  const hexMatch = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(value);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((channel) => channel + channel)
        .join("");
    }
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
      1,
    ];
  }
  const rgbMatch =
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/.exec(
      value,
    );
  if (rgbMatch) {
    return [
      Number(rgbMatch[1]),
      Number(rgbMatch[2]),
      Number(rgbMatch[3]),
      rgbMatch[4] === undefined ? 1 : Number(rgbMatch[4]),
    ];
  }
  return null;
}

function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: string): number | null {
  const channels = parseColorChannels(color);
  if (!channels) return null;
  const [r, g, b, alpha] = channels;
  const composite = (channel: number) => alpha * channel + (1 - alpha) * 255;
  return (
    0.2126 * linearize(composite(r)) +
    0.7152 * linearize(composite(g)) +
    0.0722 * linearize(composite(b))
  );
}

export function pickReadableColor(color: string, fallback: string): string {
  const luminance = relativeLuminance(color);
  if (luminance === null) return fallback;
  return luminance <= READABLE_LUMINANCE_MAX ? color : fallback;
}

function uniqueDecorations(images: { src: string }[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const image of images) {
    if (!image.src || seen.has(image.src)) continue;
    seen.add(image.src);
    result.push(image.src);
    if (result.length >= limit) break;
  }
  return result;
}

export function resolveDashboardCardTheme(
  templateId: string,
): DashboardCardTheme | null {
  const config = chungdoiThemeConfig[templateId];
  if (!config) return null;
  const cardImages = resolveZodiacCardImages(config.decorations.cardImages);
  return {
    background: config.theme.background,
    textColor: pickReadableColor(config.theme.textPrimary, NEUTRAL_TEXT),
    mutedTextColor: pickReadableColor(config.theme.textSecondary, NEUTRAL_MUTED),
    decorations: uniqueDecorations(cardImages, MAX_DECORATIONS),
  };
}
