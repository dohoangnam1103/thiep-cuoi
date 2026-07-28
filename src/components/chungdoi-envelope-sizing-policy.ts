// Một nơi duy nhất quyết định mẫu nào dùng kích thước thiệp chưa mở responsive.
// Giữ file này không phụ thuộc Three.js/DOM để cả client component và unit test
// đều import được.
export type EnvelopeSizing = "fixed" | "responsive-natural";

const responsiveEnvelopeTemplateSlugs = new Set<string>([
  "cherry-blossom-pink",
]);

export function envelopeSizingForTemplate(slug: string): EnvelopeSizing {
  return responsiveEnvelopeTemplateSlugs.has(slug)
    ? "responsive-natural"
    : "fixed";
}
