import {
  getSourceTemplateSlug,
  getVietnameseTemplateSlug,
} from "../data/template-route-slugs";
import { findTemplateSeoFacet } from "../data/template-seo-facet-definitions";

type CanonicalRedirect = {
  source: string;
  destination: string;
  permanent: true;
  has: Array<
    | { type: "host"; value: string }
    | { type: "header"; key: string; value: string }
  >;
};

export function canonicalTemplatePath(pathname: string): string | null {
  const facetMatch = pathname.match(
    /^\/(?:vi\/|(?:en|ko|ja|zh)\/)?templates\/(style|color)\/([^/]+)\/?$/,
  );
  if (facetMatch) {
    const kind = facetMatch[1] as "style" | "color";
    const facet = findTemplateSeoFacet(kind, facetMatch[2]);
    if (!facet) return null;

    const publicSegment = facet.kind === "style" ? "phong-cach" : "mau-sac";
    return `/mau-thiep/${publicSegment}/${facet.slug}`;
  }

  const vietnameseMatch = pathname.match(/^\/mau-thiep\/([^/]+)(?:\/demo)?\/?$/);
  const internalVietnameseMatch = pathname.match(
    /^\/(?:vi\/)?templates\/([^/]+)(?:\/demo)?\/?$/,
  );
  const localizedMatch = pathname.match(
    /^\/(en|ko|ja|zh)\/templates\/([^/]+)(?:\/demo)?\/?$/,
  );

  const locale = vietnameseMatch || internalVietnameseMatch
    ? "vi"
    : localizedMatch?.[1];
  const routeSlug = vietnameseMatch?.[1]
    ?? internalVietnameseMatch?.[1]
    ?? localizedMatch?.[2];
  if (!locale || !routeSlug) return null;

  const sourceSlug = getSourceTemplateSlug(routeSlug);
  if (!sourceSlug) return null;

  const canonicalSlug = getVietnameseTemplateSlug(sourceSlug);
  const basePath = "/mau-thiep";
  const canonicalPath = `${basePath}/${canonicalSlug}/demo`;

  return pathname === canonicalPath ? null : canonicalPath;
}

export function canonicalHostRedirects(siteUrl: string | undefined): CanonicalRedirect[] {
  if (!siteUrl) return [];

  let canonicalUrl: URL;
  try {
    canonicalUrl = new URL(siteUrl);
  } catch {
    return [];
  }

  if (
    canonicalUrl.protocol !== "https:" ||
    canonicalUrl.hostname !== "thiepmungonline.com"
  ) {
    return [];
  }

  const destination = `${canonicalUrl.origin}/:path*`;
  return [
    {
      source: "/:path*",
      destination,
      permanent: true,
      has: [{ type: "host", value: `www.${canonicalUrl.hostname}` }],
    },
    {
      source: "/:path*",
      destination,
      permanent: true,
      has: [{ type: "header", key: "x-forwarded-proto", value: "http" }],
    },
  ];
}
