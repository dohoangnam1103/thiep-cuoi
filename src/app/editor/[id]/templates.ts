export const VALID_TEMPLATE_IDS = [
  "double-phoenix-red",
  "double-phoenix-green",
  "song-hy-red",
  "song-hy-green",
  "nhat-binh-red",
  "co-ba-red",
  "dragon-phoenix-red",
  "double-dragon-red",
  "double-dragon-blue",
  "double-dragon-green",
] as const;

export type ValidTemplateId = (typeof VALID_TEMPLATE_IDS)[number];
