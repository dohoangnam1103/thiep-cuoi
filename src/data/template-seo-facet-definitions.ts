export type TemplateSeoFacetKind = "style" | "color";

type TemplateSeoFacetDefinition = {
  id: string;
  kind: TemplateSeoFacetKind;
  slug: string;
  filterKey: "category" | "color";
  filterValue: string;
};

// Keep the public SEO taxonomy independent from the template catalog so the
// canonical redirect middleware does not need to bundle all template data.
export const templateSeoFacets = [
  {
    id: "style-traditional",
    kind: "style",
    slug: "truyen-thong",
    filterKey: "category",
    filterValue: "Traditional",
  },
  {
    id: "style-floral",
    kind: "style",
    slug: "hoa-la",
    filterKey: "category",
    filterValue: "Floral",
  },
  {
    id: "style-modern",
    kind: "style",
    slug: "hien-dai",
    filterKey: "category",
    filterValue: "Modern",
  },
  // style-vietnamese-heritage (di-san-viet) đã rút khỏi taxonomy: toàn bộ 11
  // mẫu "Vietnamese Heritage" đang bị ẩn nên facet này rỗng, để index tiếp là
  // tạo ra một trang thin collection. URL cũ được 301 về /mau-thiep trong
  // next.config.ts.
  {
    id: "style-royal",
    kind: "style",
    slug: "hoang-gia",
    filterKey: "category",
    filterValue: "Royal",
  },
  {
    id: "color-red",
    kind: "color",
    slug: "do",
    filterKey: "color",
    filterValue: "Red",
  },
  {
    id: "color-green",
    kind: "color",
    slug: "xanh-la",
    filterKey: "color",
    filterValue: "Green",
  },
  {
    id: "color-blue",
    kind: "color",
    slug: "xanh-duong",
    filterKey: "color",
    filterValue: "Blue",
  },
] as const satisfies readonly TemplateSeoFacetDefinition[];

export type TemplateSeoFacet = (typeof templateSeoFacets)[number];

export const styleTemplateSeoFacets = templateSeoFacets.filter(
  (facet) => facet.kind === "style",
);

export const colorTemplateSeoFacets = templateSeoFacets.filter(
  (facet) => facet.kind === "color",
);

export function findTemplateSeoFacet(
  kind: TemplateSeoFacetKind,
  slug: string,
): TemplateSeoFacet | undefined {
  return templateSeoFacets.find(
    (facet) => facet.kind === kind && facet.slug === slug,
  );
}
