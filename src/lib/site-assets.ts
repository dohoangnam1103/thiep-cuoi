// Plain asset constants, safe to import from client components.
//
// These used to live in `site-url.ts`, which evaluates `resolveSiteUrl()` at
// module scope. Importing that module from a client component ships the guard
// to the browser, where only `NEXT_PUBLIC_*` env vars are inlined — so
// `ALLOW_INSECURE_SITE_URL` reads as unset, the HTTPS check throws, and the
// whole page falls over to the error boundary. Keep this file side-effect free.

export const SITE_LOGO_PATH = "/thiepmungonline/logo-thiep-mung-online-transparent.png";
export const SITE_SOCIAL_IMAGE_PATH = "/images/og-thiep-cuoi-online.jpg";
export const SITE_SOCIAL_IMAGE_WIDTH = 1200;
export const SITE_SOCIAL_IMAGE_HEIGHT = 630;
