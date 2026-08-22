import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["vi"],
  defaultLocale: "vi",
  localePrefix: "as-needed",
  alternateLinks: false,
  pathnames: {
    "/": "/",
    "/templates": "/mau-thiep",
    "/templates/[slug]": "/mau-thiep/[slug]",
    "/templates/[slug]/demo": "/mau-thiep/[slug]/demo",
    "/templates/style/[slug]": "/mau-thiep/phong-cach/[slug]",
    "/templates/color/[slug]": "/mau-thiep/mau-sac/[slug]",
    "/pricing": "/bang-gia",
    "/create-wedding-invitation-online": "/tao-thiep-cuoi-online",
    "/tools": "/cong-cu",
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
    "/help": "/help",
    "/privacy-policy": "/chinh-sach-bao-mat",
    "/terms-of-service": "/dieu-khoan-su-dung",
    "/refund-policy": "/chinh-sach-hoan-tien",
  },
});

export type Locale = (typeof routing.locales)[number];

export const indexableLocales: readonly Locale[] = ["vi"];
