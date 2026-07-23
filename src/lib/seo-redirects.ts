import {
  getSourceTemplateSlug,
  getVietnameseTemplateSlug,
} from "../data/template-route-slugs";

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
  const vietnameseMatch = pathname.match(/^\/mau-thiep\/([^/]+)(?:\/demo)?\/?$/);
  const localizedMatch = pathname.match(
    /^\/(en|ko|ja|zh)\/templates\/([^/]+)(?:\/demo)?\/?$/,
  );

  const locale = vietnameseMatch ? "vi" : localizedMatch?.[1];
  const routeSlug = vietnameseMatch?.[1] ?? localizedMatch?.[2];
  if (!locale || !routeSlug) return null;

  const sourceSlug = getSourceTemplateSlug(routeSlug);
  if (!sourceSlug) return null;

  const canonicalSlug = locale === "vi"
    ? getVietnameseTemplateSlug(sourceSlug)
    : sourceSlug;
  const basePath = locale === "vi" ? "/mau-thiep" : `/${locale}/templates`;
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
