export const VALID_TEMPLATE_IDS = [
  "double-phoenix-red",
  "double-phoenix-green",
  "song-hy-red",
  "song-hy-green",
  "nhat-binh-red",
  "co-ba-red",
  "dragon-phoenix-red",
  "dragon-phoenix-green",
  "dragon-phoenix-blue",
  "dragon-phoenix-black",
  "double-dragon-red",
  "double-dragon-blue",
  "double-dragon-green",
  "royal-red",
  "royal-blue",
  "royal-green",
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
  "dragon-phoenix-green": "Long Phụng Xanh Lá",
  "dragon-phoenix-blue": "Long Phụng Xanh Dương",
  "dragon-phoenix-black": "Long Phụng Đen",
  "double-dragon-red": "Song Long Đỏ",
  "double-dragon-blue": "Song Long Xanh Dương",
  "double-dragon-green": "Song Long Xanh Lá",
  "royal-red": "Hoàng Gia Đỏ",
  "royal-blue": "Hoàng Gia Xanh Dương",
  "royal-green": "Hoàng Gia Xanh Lá",
};

export function templateLabel(templateId: string): string {
  return TEMPLATE_LABELS[templateId as ValidTemplateId] ?? templateId;
}
