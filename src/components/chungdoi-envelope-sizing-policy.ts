// Một nơi duy nhất quyết định mẫu nào dùng kích thước thiệp chưa mở responsive.
// Giữ file này không phụ thuộc Three.js/DOM để cả client component và unit test
// đều import được.
export type EnvelopeSizing = "fixed" | "responsive-natural";

// Exported chỉ để unit test kiểm tra coverage trong lúc rollout. UI luôn hỏi
// qua envelopeSizingForTemplate(), không đọc trực tiếp set này.
export const responsiveEnvelopeTemplateSlugs = new Set<string>([
  "cherry-blossom-pink",

  // Nhóm A — Song Hỷ / Song Long / Song Phụng
  "song-hy-red",
  "song-hy-green",
  "double-dragon-red",
  "double-dragon-green",
  "double-dragon-blue",
  "double-phoenix-red",
  "double-phoenix-green",
  "dragon-phoenix-red",
  "dragon-phoenix-green",

  // Nhóm B — Long Phụng và mẫu truyền thống/hoàng kim
  "dragon-phoenix-v3-red",
  "dragon-phoenix-v2-red",
  "dragon-phoenix-blue",
  "dragon-phoenix-black",
  "royal-red",
  "royal-blue",
  "royal-green",
  "nhat-binh-red",
  "hoa-tinh-red",
  "co-ba-red",

  // Nhóm C — hoa lá và vườn xuân
  "elegant-leaf-green",
  "boho-floral-green",
  "boho-floral-pink",
  "boho-floral-brown",
  "jasmine-white",
  "silk-flora-brown",
  "brocade-flower-red",
  "crystal-floral-blue",
  "glass-garden-green",
  "spring-garden-green",
  "spring-garden-red",
  "spring-garden-blue",

  // Nhóm D — lâu đài và cung điện
  "chateau-blue",
  "chateau-green",
  "baroque-gold",
  "qasr-green",
  "qasr-gold",
]);

export function envelopeSizingForTemplate(slug: string): EnvelopeSizing {
  return responsiveEnvelopeTemplateSlugs.has(slug)
    ? "responsive-natural"
    : "fixed";
}
