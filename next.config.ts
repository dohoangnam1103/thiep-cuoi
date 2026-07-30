import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

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
