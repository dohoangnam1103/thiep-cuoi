import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".claude/worktrees/**",
    ".capture/**",
    ".playwright-mcp/**",
    ".deploy-worktree/**",
    ".deploy-cache/**",
    ".deploy-release-state/**",
    ".assembled-image-cache/**",
    ".production-archives/**",
    ".worktrees/**",
    "public/proto/**",
    "test-results/**",
    "tests/e2e/.report/**",
    // Second-app and package build artifacts (their sources stay linted).
    "apps/**/.next/**",
    "apps/**/.e2e/**",
    "apps/**/src/generated/**",
    "packages/**/.next/**",
    // Scratch dirs: not source, but their warnings bloat every lint run.
    "tmp/**",
    "temp/**",
    "src/generated/**",
  ]),
  {
    // Invitation templates position raw <img> deliberately (art layouts,
    // user-uploaded photos, canvas compositing). 259 unfixable warnings here
    // were drowning out real lint output — scope the rule off instead.
    files: [
      "src/components/chungdoi-tpl-*.tsx",
      "packages/invitation-core/src/signature/*.tsx",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
