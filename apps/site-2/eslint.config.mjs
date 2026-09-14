import { defineConfig, globalIgnores } from "eslint/config";

import rootConfig from "../../eslint.config.mjs";

export default defineConfig([
  ...(Array.isArray(rootConfig) ? rootConfig : [rootConfig]),
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "src/generated/**",
    ".e2e/**",
    "tailwind-sources/**",
    "next-env.d.ts",
  ]),
]);
