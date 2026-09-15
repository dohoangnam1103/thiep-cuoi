export const SITE2_EDITABLE_ROOTS = [
  "apps/site-2/",
  "tests/e2e/site-2-",
  "tests/site-2-",
  "docs/deploy-site-2.md",
  "docs/releases/site-2-",
  "docs/research/site-2-",
  "docs/superpowers/plans/2026-09-14-site-2-",
  "docs/superpowers/specs/2026-09-14-site-2-",
  "infra/compose/site-2.yaml",
  "infra/systemd/site-2/",
] as const;

export function assertSite2Path(pathname: string): void {
  if (!SITE2_EDITABLE_ROOTS.some((root) => pathname.startsWith(root))) {
    throw new Error(`Path is outside site 2 scope: ${pathname}`);
  }
}
