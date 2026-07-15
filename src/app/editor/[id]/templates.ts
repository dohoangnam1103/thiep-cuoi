import { completedTemplates } from "@/data/chungdoi";

const TEMPLATE_LABEL_OVERRIDES: Record<string, string> = {
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

export const TEMPLATE_LABELS: Record<string, string> = Object.fromEntries(
  completedTemplates.map((template) => [
    template.slug,
    TEMPLATE_LABEL_OVERRIDES[template.slug] ?? template.name,
  ]),
);

export function templateLabel(templateId: string): string {
  return TEMPLATE_LABELS[templateId] ?? templateId;
}
