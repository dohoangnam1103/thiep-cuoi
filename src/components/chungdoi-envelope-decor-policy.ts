export type EnvelopeDecorOverflow = "clip" | "visible";

/**
 * Họ "Vườn Kính": card nền trong suốt nằm thẳng trên nền floral rối, decor hoa
 * tràn ra ngoài mép thiệp. Cả hai biến thể xanh/hồng dùng chung cách xử lý này.
 */
export const glassGardenTemplateSlugs = new Set<string>([
  "glass-garden-green",
  "glass-garden-pink",
]);

// Audit trực tiếp các trang demo còn tồn tại trên chungdoi.com (2026-07-28,
// bổ sung vuonkinh-hong 2026-08-21): chỉ họ Vườn Kính để hoa vượt khỏi khung
// thiệp. Tất cả mẫu còn lại đặt cardImages trong một lớp overflow-hidden. Mẫu
// không xác định cũng phải clip để không vô tình làm lộ decor ngoài khung khi
// chưa được audit.
export const overflowingEnvelopeDecorTemplateSlugs = glassGardenTemplateSlugs;

export function envelopeDecorOverflowForTemplate(
  slug: string,
): EnvelopeDecorOverflow {
  return overflowingEnvelopeDecorTemplateSlugs.has(slug) ? "visible" : "clip";
}
