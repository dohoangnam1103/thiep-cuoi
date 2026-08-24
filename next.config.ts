import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { retiredTemplateSlugPattern } from "./src/data/retired-template-slugs";
import { canonicalHostRedirects } from "./src/lib/seo-redirects";

const isDevelopment = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  // static.cloudflareinsights.com: beacon Cloudflare Web Analytics tự chèn ở edge.
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://static.cloudflareinsights.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://cloudflareinsights.com",
  "media-src 'self' data: blob: https:",
  "frame-src https://www.google.com https://maps.google.com https://www.youtube.com https://www.youtube-nocookie.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "manifest-src 'self'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["heic-decode", "libheif-js"],
  images: {
    localPatterns: [
      {
        pathname: "/**",
        search: "",
      },
      {
        pathname: "/chungdoi/images/template-previews/**",
      },
    ],
    // Next 16 defaults to 4h, so optimized bytes were re-derived several times a
    // day on a machine that pays real CPU for it. 30 days matches the browser
    // policy set for `/chungdoi/images` in `headers()` below.
    //
    // The optimizer keys its cache on the source URL, not the file contents, so
    // re-exporting an image over the same path serves stale bytes until the TTL
    // lapses. Template previews already dodge this with the `?v=` bump in
    // `templatePreviewUrl()`; anything else replaced in place needs the same.
    minimumCacheTTL: 2592000,
  },
  experimental: {
    // Keep static rendering while adding integrity metadata to built scripts.
    sri: {
      algorithm: "sha384",
    },
    // Persist Turbopack's production-build cache between Docker builds. The
    // cache directory is mounted by Dockerfile, so warm deploys only rebuild
    // modules affected by the latest source changes.
    turbopackFileSystemCacheForBuild: true,
  },
  outputFileTracingIncludes: {
    "/*": [
      "node_modules/better-sqlite3/build/Release/*.node",
      "node_modules/@img/**/*",
      "node_modules/heic-decode/**/*",
      "node_modules/libheif-js/**/*",
      "node_modules/sharp/**/*",
    ],
  },
  async redirects() {
    return [
      ...canonicalHostRedirects(process.env.NEXT_PUBLIC_SITE_URL),
      {
        source: "/:locale(en|ko|ja|zh)",
        destination: "/",
        permanent: true,
      },
      {
        // Facet "di sản Việt" đã rút khỏi taxonomy SEO vì toàn bộ mẫu thuộc
        // nhóm này đang bị ẩn. URL này từng nằm trong sitemap nên trả 301 về
        // trang danh sách thay vì để 404.
        source: "/mau-thiep/phong-cach/di-san-viet",
        destination: "/mau-thiep",
        statusCode: 301,
      },
      // Mẫu đã rút khỏi catalog: 301 cả trang giới thiệu và trang demo về
      // danh sách, thay vì để 404 những URL từng nằm trong sitemap.
      // Dùng statusCode: 301 chứ không phải permanent: true, vì permanent phát
      // ra 308 — Google coi hai mã như nhau nhưng 301 mới là mã được yêu cầu.
      {
        source: `/mau-thiep/:slug(${retiredTemplateSlugPattern})`,
        destination: "/mau-thiep",
        statusCode: 301,
      },
      {
        source: `/mau-thiep/:slug(${retiredTemplateSlugPattern})/demo`,
        destination: "/mau-thiep",
        statusCode: 301,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      // Next only sends `immutable` for `/_next/static`; everything under
      // `public/` goes out with `max-age=0`, so all ~550MB of it was revalidated
      // on every visit. There is no CDN or reverse proxy to make up for that
      // either — Cloudflare Tunnel hands requests straight to the Node server.
      //
      // Two policies below, split by whether an asset can be replaced in place.
      {
        // Fonts, audio and video are only ever added or removed, never rewritten
        // over the same path, so pinning them for a year is safe.
        source: "/chungdoi/:dir(fonts|music|videos)/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Images do get re-exported over the same filename while a template is
        // being tuned, so deliberately no `immutable` here: a month-long
        // max-age still removes the revalidation round-trip, and
        // stale-while-revalidate lets a replacement propagate in the background
        // instead of pinning the old bytes for a year with no way to bust them.
        source: "/chungdoi/:dir(images|templates|labs)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Single-segment match, so this covers the icons sitting directly in
        // /chungdoi (icon-v2.png alone is 1MB and is requested on every page)
        // without also matching the subdirectories handled above.
        source: "/chungdoi/:file",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Logo and OG image from `site-assets.ts`, plus the prototype captures.
        // Small, but referenced from every page and every social preview.
        source: "/:dir(images|thiepmungonline|proto)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // User uploads are supporting assets, never standalone search results.
        // Keeping them out of the index also reduces the chance that a benign
        // screenshot is mistaken for a deceptive page when crawled by itself.
        source: "/uploads/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, nosnippet, noarchive",
          },
        ],
      },
      {
        source: "/blog-media/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, nosnippet, noarchive",
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
