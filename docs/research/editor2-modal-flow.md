# Editor2 information dialogs and publication

## Scope and owners

- `/editor2/[id]`, `src/components/editor2/workspace.tsx`: initial names/date
  dialog, section fields, publication completion, autosave and focus management.
- `src/app/editor2/editor2.css`: main/nested calendar overlays and motion.
- `src/lib/editor2-publication.ts`, `src/app/editor2/actions.ts`: shared
  publication validation in the client and server.
- Catalog: `editor2.samples.venueName` and `editor2.samples.address` are sample
  content, not a completed location. Existing editor/error messages are reused.

The requested behavior is to blur the editor behind the initial information
modal, animate information modals on entry/exit and request a real venue before
publishing. No assets, schema, public URLs or authentication flows change.

## Presentation and interaction contract

All viewport widths use the existing centered responsive dialog dimensions,
colors, typography, scrolling and controls. The overlay blurs underlying content
by 6px; it and the popup fade in over 240ms. The popup also moves up 12px from a
0.97 scale. Exit reverses those properties over 180ms. Base UI owns mounting and
focus; rendered fields/title/width remain stable until exit finishes. Reduced
motion removes transitions and translation/scaling. Nested calendars share the
same animation and blur rules.

Publication checks trimmed, case-insensitive sample location values as missing
on both sides of the server boundary. Autosaving a sample does not make it valid.
The next required field receives focus; the final completed step publishes
without an extra click. Dismissal cancels automatic publication, preserving edits.

## Phase reports

PHASE: inspect
STATUS: complete
CHANGED: none
VERIFIED: defaults, publication validation, Base UI transition data attributes, initial and section dialog ownership
UNVERIFIED: browser behavior after implementation
RISKS: removing fields before popup unmount would collapse its exit animation
NEXT: retain rendered panel and add transitions/shared validation

PHASE: implement
STATUS: complete
CHANGED: workspace, editor2 CSS, publication helper/action and targeted unit/E2E coverage
VERIFIED: lint, application/test typechecks and sample/partial venue unit cases
UNVERIFIED: final browser suite and deployment
RISKS: none identified beyond pending verification
NEXT: browser and deployment verification

PHASE: verify
STATUS: complete
CHANGED: prefixed CSS declaration ordering and delayed opening focus target
VERIFIED: Chromium main modal entry/exit, preserved exit content/height, blurred backdrop, reduced-motion main/nested calendar, Escape dismissal at 1440/320px; default-sample venue wizard at 1440/390px
UNVERIFIED: browsers other than Chromium; production deployment
RISKS: none identified in tested flows
NEXT: deploy and verify production

## Evidence

- `src/lib/editor2-publication.test.ts` verifies missing, partial, sample,
  case-normalized, whitespace and completed venue states.
- Focused E2E: all final cases passed. The initial modal screenshots at
  `/tmp/editor2-evidence/basics-backdrop-1440.png` and `basics-backdrop-320.png`
  were inspected visually. Exit frames preserve the title and full height while
  opacity/transform transitions run; reduced motion removes transitions.
- Sequential publication verifies default venue samples remain a draft until
  both actual venue fields are completed, then publication happens automatically.
- Full unit suite: 1,104 passed and one existing skip. Lint: zero errors.
