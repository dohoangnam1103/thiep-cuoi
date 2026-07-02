import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["vi", "en", "ko", "ja", "zh"],
  defaultLocale: "vi",
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/templates": {
      vi: "/mau-thiep",
      en: "/templates",
      ko: "/templates",
      ja: "/templates",
      zh: "/templates",
    },
    "/templates/[slug]": {
      vi: "/mau-thiep/[slug]",
      en: "/templates/[slug]",
      ko: "/templates/[slug]",
      ja: "/templates/[slug]",
      zh: "/templates/[slug]",
    },
    "/templates/[slug]/demo": {
      vi: "/mau-thiep/[slug]/demo",
      en: "/templates/[slug]/demo",
      ko: "/templates/[slug]/demo",
      ja: "/templates/[slug]/demo",
      zh: "/templates/[slug]/demo",
    },
    "/pricing": {
      vi: "/bang-gia",
      en: "/pricing",
      ko: "/pricing",
      ja: "/pricing",
      zh: "/pricing",
    },
    "/tools": {
      vi: "/cong-cu",
      en: "/tools",
      ko: "/tools",
      ja: "/tools",
      zh: "/tools",
    },
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
    "/help": "/help",
    "/privacy-policy": {
      vi: "/chinh-sach-bao-mat",
      en: "/privacy-policy",
      ko: "/privacy-policy",
      ja: "/privacy-policy",
      zh: "/privacy-policy",
    },
    "/terms-of-service": {
      vi: "/dieu-khoan-su-dung",
      en: "/terms-of-service",
      ko: "/terms-of-service",
      ja: "/terms-of-service",
      zh: "/terms-of-service",
    },
    "/refund-policy": {
      vi: "/chinh-sach-hoan-tien",
      en: "/refund-policy",
      ko: "/refund-policy",
      ja: "/refund-policy",
      zh: "/refund-policy",
    },
  },
});

export type Locale = (typeof routing.locales)[number];
