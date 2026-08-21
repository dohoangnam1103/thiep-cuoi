import { generatedTemplateRouteSlugs } from "./templates/generated-data";

export const vietnameseTemplateSlugs = [
  ["song-hy-red", "song-hy-do"],
  ["song-hy-green", "song-hy-xanh"],
  ["double-dragon-red", "song-long-do"],
  ["double-phoenix-red", "song-phung-do"],
  ["elegant-leaf-green", "thanh-diep-xanh"],
  ["dragon-phoenix-red", "long-phung-do"],
  ["dragon-phoenix-v3-red", "long-phung-v3-do"],
  ["dragon-phoenix-v2-red", "long-phung-v2-do"],
  ["double-dragon-green", "song-long-xanh"],
  ["boho-floral-green", "hoa-moc-xanh"],
  ["boho-floral-pink", "hoa-moc-hong"],
  ["jasmine-white", "mai-lan-trang"],
  ["silk-flora-brown", "hoa-lua-nau"],
  ["chateau-blue", "lau-dai-lam"],
  ["brocade-flower-red", "gam-hoa-do"],
  ["crystal-floral-blue", "hoa-thuy-tinh-lam"],
  ["chateau-green", "lau-dai-xanh"],
  ["baroque-gold", "hoang-gia-vang"],
  ["qasr-green", "thanhcung-xanh"],
  ["qasr-gold", "thanhcung-vang"],
  ["glass-garden-green", "vuonkinh-xanh"],
  ["glass-garden-pink", "vuonkinh-hong"],
  ["royal-red", "hoang-kim-do"],
  ["nhat-binh-red", "nhat-binh-do"],
  ["hoa-tinh-red", "hoa-tinh-do"],
  ["co-ba-red", "co-ba-do"],
  ["royal-blue", "hoang-kim-lam"],
  ["royal-green", "hoang-kim-xanh"],
  ["spring-garden-green", "vuon-xuan-xanh"],
  ["chibi-red", "chibi-red"],
  ["boho-floral-brown", "hoa-moc-nau"],
  ["spring-garden-red", "vuon-xuan-do"],
  ["dragon-phoenix-green", "long-phung-xanh"],
  ["spring-garden-blue", "vuon-xuan-lam"],
  ["minimalism-red", "minimalism-do"],
  ["minimalism-dark-red", "minimalism-do-do"],
  ["cherry-blossom-pink", "anh-dao-hong"],
  ["double-phoenix-green", "song-phung-xanh"],
  ["double-dragon-blue", "song-long-lam"],
  ["dragon-phoenix-blue", "long-phung-lam"],
  ["dragon-phoenix-black", "long-phung-huyen"],
  ["maroon-love", "maroon-love"],
  ...generatedTemplateRouteSlugs,
] as const;

const vietnameseSlugBySourceSlug = new Map<string, string>(vietnameseTemplateSlugs);
const sourceSlugByRouteSlug = new Map<string, string>([
  ...vietnameseTemplateSlugs.map(([sourceSlug]) => [sourceSlug, sourceSlug] as const),
  ...vietnameseTemplateSlugs.map(([sourceSlug, routeSlug]) => [routeSlug, sourceSlug] as const),
]);

export function getVietnameseTemplateSlug(sourceSlug: string) {
  return vietnameseSlugBySourceSlug.get(sourceSlug) ?? sourceSlug;
}

export function getSourceTemplateSlug(routeSlug: string) {
  return sourceSlugByRouteSlug.get(routeSlug);
}

export function getTemplateRouteSlugs() {
  return Array.from(sourceSlugByRouteSlug.keys());
}
