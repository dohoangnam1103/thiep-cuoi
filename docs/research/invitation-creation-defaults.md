# Editable invitation defaults — 2026-10-28

## Scope and contract

New invitations should contain editable family information immediately, without requiring the user to add each field. The supplied editor screenshot is context for the creation flow; this task does not change a template's visual design.

- Routes: `/editor2` → `/editor2/[id]`, and dashboard creation → `/editor/[id]`.
- Data: existing `InvitationContent` birth-order, family-name, honorific, address and event fields. No schema or API changes.
- Creation owners: `src/app/editor2/actions.ts` (already consumes shared defaults) and `src/app/dashboard/actions.ts`.
- Default owner: `src/lib/editor2-defaults.ts`; strings: `editor2.samples` in `messages/vi.json`.
- Defaults: `Trưởng Nữ`, `Trưởng Nam`, `Tên Cha Cô Dâu`, `Tên Mẹ Cô Dâu`, `Tên Cha Chú Rể`, `Tên Mẹ Chú Rể`. Existing honorific, family-address and event samples remain editable.
- Birth order is initialized only when creating an invitation. Existing ranks and cleared ranks remain intact on reopening. Existing single-parent handling and saved family deletions retain their current behavior.
- Authentication, ownership, save, preview, publication, sharing, media, optional-section behavior and existing invitation URLs retain their existing implementation. Bank/account fields receive no sample payment details.
- Components, section order, assets, containing blocks, tokens, responsive rules and modal behavior are unchanged. No new assets or design tokens are needed.

## Acceptance and evidence

Unit coverage checks creation defaults through editor parsing and preview projection, valid birth-order choices, legacy custom/cleared ranks, single-parent data, published invitations and saved deletions. Existing draft/starter coverage checks related content and serialization.

Targeted browser coverage in `tests/e2e/editor2.spec.ts` checks actual database values before editing, rendered values, form values, changes, cleared ranks, save/reload and horizontal overflow at 1440, 768 and 390 pixels. Dashboard coverage checks persisted defaults through its real creation action. Existing family-layout cases cover single-parent rendering at 1440, 768, 390 and 320 pixels.

Browser screenshots are written to `/tmp/editor2-evidence/starter-family-{width}.png`. The 1440, 768 and 390 pixel screenshots were visually inspected: default values are readable; desktop/tablet use two family columns and mobile uses the existing scrollable stacked layout.

Verification results:

- `npm run typecheck`: passed.
- `npm run typecheck:tests`: passed.
- Targeted defaults, draft and starter unit tests: 14 passed.
- Targeted Chromium integration tests on a fresh production build at port 3101: 9 passed. Includes all three creation viewports, dashboard creation, click editing/autosave/guest preview and family deletion/alignment at 1440, 768, 390 and 320 pixels.
- `git diff --check`: passed.
- `npm run lint`: completed with 0 errors and 401 warnings across the existing repository (including image-element, accessibility and unused-variable warnings outside this change).

Full-template visual fidelity, other browser engines and unrelated publication/payment flows were not reverified for this data-default change. No unresolved defects were observed in the targeted checks.
