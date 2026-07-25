const DEVELOPMENT_SITE_URL = "http://localhost:3000";

// `next build` always runs with NODE_ENV=production, so local production builds
// and the Playwright suite (which builds then serves on 127.0.0.1) need a way to
// opt out of the HTTPS/localhost guards. Production images never set this.
const INSECURE_SITE_URL_OPT_IN = "1";

export function resolveSiteUrl(
  rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL,
  environment = process.env.NODE_ENV,
  allowInsecure = process.env.ALLOW_INSECURE_SITE_URL === INSECURE_SITE_URL_OPT_IN,
): string {
  if (!rawSiteUrl) {
    if (environment === "production") {
      throw new Error("NEXT_PUBLIC_SITE_URL is required in production.");
    }
    return DEVELOPMENT_SITE_URL;
  }

  let siteUrl: URL;
  try {
    siteUrl = new URL(rawSiteUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL.");
  }

  if (environment === "production" && !allowInsecure) {
    if (siteUrl.protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS in production.");
    }
    const hostname = siteUrl.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      throw new Error("NEXT_PUBLIC_SITE_URL must not use localhost in production.");
    }
  }

  return siteUrl.href.replace(/\/$/, "");
}

export const SITE_URL = resolveSiteUrl();
export const SITE_LOGO_PATH = "/thiepmungonline/logo-thiep-mung-online-transparent.png";
export const SITE_SOCIAL_IMAGE_PATH = "/images/og-thiep-cuoi-online.jpg";
export const SITE_SOCIAL_IMAGE_WIDTH = 1200;
export const SITE_SOCIAL_IMAGE_HEIGHT = 630;

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
