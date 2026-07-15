import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Persist Turbopack's production-build cache between Docker builds. The
    // cache directory is mounted by Dockerfile, so warm deploys only rebuild
    // modules affected by the latest source changes.
    turbopackFileSystemCacheForBuild: true,
  },
  outputFileTracingIncludes: {
    "/*": [
      "node_modules/better-sqlite3/build/Release/*.node",
      "node_modules/@img/**/*",
      "node_modules/sharp/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
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
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
