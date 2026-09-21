import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  transpilePackages: [
    "@chungdoi/site-config",
    "@chungdoi/invitation-data",
    "@chungdoi/invitation-core",
  ],
  images: {
    qualities: [75, 84, 88, 90, 92],
    localPatterns: [
      {
        pathname: "/**",
        search: "",
      },
      {
        pathname: "/chungdoi/images/template-previews/**",
      },
    ],
    minimumCacheTTL: 2592000,
  },
  turbopack: {
    // Monorepo: hoisted workspace node_modules live at the repo root, one
    // level above this app. Widen Turbopack's filesystem root so module
    // resolution reaches them (Docker builder included).
    root: path.resolve(import.meta.dirname, "..", ".."),
  },
};

export default nextConfig;
