# All-template ceremony regression implementation plan

> **For agentic workers:** Use focused parallel renderer tasks, with one coordinator owning registry, tests and integration.

**Goal:** Every registered invitation renderer displays every saved ceremony in its native ceremony section, before its footer; future regressions fail automated checks.

**Architecture:** Upgrade remaining single-ceremony renderers without changing their visual assets or data contracts. Discover every renderer from the actual registry for real SSR regression tests; validate public pages at desktop/mobile with isolated database fixtures. Keep native designs; do not replace them with a generic appended ceremony card.

**Tech Stack:** Next.js 16, React 19, next-intl, tsx/node:test, Playwright.

**Spec:** User request to prevent this issue across all invitations; docs/wedding-invitation-agent-rules.md and docs/template-clone-quality.md.

## Constraints and review focus

- Preserve schemas, APIs, editor/save/publish/share/auth and public routes. No deployment requested.
- All 112 registered templates are in scope, including historical templates that may remain on published invitations. Route retirement stays intact.
- Preserve each template's artwork, fonts, colors and section location; repeat only the ceremony unit.
- Test at least three distinct title/date/time values, explicit empty lists, legacy single ceremonies and absent legacy fields.
- Registry flags alone cannot prove renderer behavior: tests must render actual components and verify each ceremony's own values.
- New catalog entries must enter the tests automatically; no curated passing-template allowlist.
- Existing workspace changes and previous Nhật Bình/Hoa Mộc fixes must remain intact.

## Tasks

- [ ] 1. Add a failing catalog-wide SSR regression using actual registry discovery and realistic distinct ceremonies. Record failing templates before fixes.
- [ ] 2. Upgrade independent groups of legacy renderers using invitationCeremonies(content), native region/item markers, and existing layouts. Each group runs relevant rendering checks; coordinator owns registry/manifest changes.
- [ ] 3. Change corresponding registry/manifest contracts to inline-all, regenerate generated files with the existing registrar, and make non-native registrations fail the automatic regression gate.
- [ ] 4. Strengthen the existing browser audit so it checks independent dates/times, one native region, no post-template fallback and placement before footer on desktop/mobile. Use historical published fixtures when retired demo routes are unavailable; preserve route access rules.
- [ ] 5. Run lint, typechecks, complete unit suite and browser audit. Reuse the known local Webpack/localhost/Chrome path if production build remains blocked by unrelated environment issues. Review changes independently and record exact coverage, screenshots and remaining blockers.

## Execution

Proceed in this session within the user's authorized bugfix scope. No blanket commits, checkout resets, dependency upgrades or deployments. Report current-source guarantees separately from production deployment state.
