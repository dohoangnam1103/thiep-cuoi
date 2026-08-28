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
// bổ sung vuonkinh-hong 2026-08-21 và hoang-kim-ii-xanh 2026-08-28): các
// template trong tập này để decor bìa vượt khỏi khung thiệp. Mẫu không xác định
// vẫn phải clip để không vô tình làm lộ decor ngoài khung khi chưa được audit.
// Giữ Royal V2 ngoài glassGardenTemplateSlugs vì mẫu này không dùng lớp kính mờ.
export const overflowingEnvelopeDecorTemplateSlugs = new Set<string>([
  ...glassGardenTemplateSlugs,
  "royal-v2-green",
]);

export function envelopeDecorOverflowForTemplate(
  slug: string,
): EnvelopeDecorOverflow {
  return overflowingEnvelopeDecorTemplateSlugs.has(slug) ? "visible" : "clip";
}
