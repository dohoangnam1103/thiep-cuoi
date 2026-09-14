import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  transpilePackages: [
    "@chungdoi/site-config",
    "@chungdoi/invitation-data",
    "@chungdoi/invitation-core",
  ],
  turbopack: {
    // Monorepo: hoisted workspace node_modules live at the repo root, one
    // level above this app. Widen Turbopack's filesystem root so module
    // resolution reaches them (Docker builder included).
    root: path.resolve(import.meta.dirname, "..", ".."),
  },
};

export default nextConfig;
