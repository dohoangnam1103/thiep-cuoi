export type EnvelopeDecorOverflow = "clip" | "visible";

// Audit trực tiếp 39 trang demo còn tồn tại trên chungdoi.com (2026-07-28):
// chỉ Vườn Kính Xanh để hoa vượt khỏi khung thiệp. Tất cả mẫu còn lại đặt
// cardImages trong một lớp overflow-hidden. Mẫu không xác định cũng phải clip
// để không vô tình làm lộ decor ngoài khung khi chưa được audit.
export const overflowingEnvelopeDecorTemplateSlugs = new Set<string>([
  "glass-garden-green",
]);

export function envelopeDecorOverflowForTemplate(
  slug: string,
): EnvelopeDecorOverflow {
  return overflowingEnvelopeDecorTemplateSlugs.has(slug) ? "visible" : "clip";
}
