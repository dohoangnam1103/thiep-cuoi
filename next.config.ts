import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": ["node_modules/better-sqlite3/build/Release/*.node"],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
