// Một nơi duy nhất quyết định mẫu nào dùng kích thước thiệp chưa mở responsive.
// Giữ file này không phụ thuộc Three.js/DOM để cả client component và unit test
// đều import được.
import { vietnameseTemplateSlugs } from "@/data/template-route-slugs";

export type EnvelopeSizing = "fixed" | "responsive-natural";

// Rollout đã hoàn tất nên danh sách lấy thẳng từ registry, không còn allowlist
// viết tay: thêm mẫu vào registry là tự có sizing chuẩn, không phải sửa hai nơi.
// Exported chỉ để unit test kiểm tra coverage; UI luôn hỏi qua
// envelopeSizingForTemplate().
export const responsiveEnvelopeTemplateSlugs = new Set<string>(
  vietnameseTemplateSlugs.map(([sourceSlug]) => sourceSlug),
);

export function envelopeSizingForTemplate(slug: string): EnvelopeSizing {
  return responsiveEnvelopeTemplateSlugs.has(slug)
    ? "responsive-natural"
    : "fixed";
}
