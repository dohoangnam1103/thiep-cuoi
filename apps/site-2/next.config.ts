import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  transpilePackages: [
    "@chungdoi/site-config",
    "@chungdoi/invitation-data",
    "@chungdoi/invitation-core",
  ],
};

export default nextConfig;
