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

export const TEMPLATE_LABELS: Record<ValidTemplateId, string> = {
  "double-phoenix-red": "Song Phụng Đỏ",
  "double-phoenix-green": "Song Phụng Xanh",
  "song-hy-red": "Song Hỷ Đỏ",
  "song-hy-green": "Song Hỷ Xanh",
  "nhat-binh-red": "Nhật Bình Đỏ",
  "co-ba-red": "Cô Ba Đỏ",
  "dragon-phoenix-red": "Long Phụng Đỏ",
  "double-dragon-red": "Song Long Đỏ",
  "double-dragon-blue": "Song Long Xanh Dương",
  "double-dragon-green": "Song Long Xanh Lá",
};

export function templateLabel(templateId: string): string {
  return TEMPLATE_LABELS[templateId as ValidTemplateId] ?? templateId;
}
