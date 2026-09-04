import { retiredTemplateRouteSlugs } from "@/data/retired-template-slugs";

const TEMPLATE_ROUTE_SLUG_MAX_LENGTH = 80;
const RESERVED_TEMPLATE_ROUTE_SLUGS = new Set<string>([
  "mau-sac",
  "phong-cach",
  ...retiredTemplateRouteSlugs,
]);

/** Turns an admin-provided Vietnamese template name into its public URL slug. */
export function slugifyTemplateRoute(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, TEMPLATE_ROUTE_SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}

export function isReservedTemplateRouteSlug(routeSlug: string): boolean {
  return RESERVED_TEMPLATE_ROUTE_SLUGS.has(routeSlug);
}
