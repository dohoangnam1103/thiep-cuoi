# Editor2: catalog-wide regression contract

## Purpose and scope

Protect the private `/editor2/[id]` click-to-edit experience across every entry
in `completedTemplates`. The catalog currently contains 70 templates. The matrix
generates one independent Playwright test for each template at 1440×1000 and
390×1000; adding a completed template automatically adds two tests. One failure
does not prevent the remaining templates from running. No retries or skips mask
catalog failures.

This change adds tests, isolated test configuration, CI and documentation, and
fixes a demonstrated canvas selection bug: a ceremony time identical to the
reception time selected reception editing. Ceremony containing blocks now take
precedence over text-value matches (including their calendars). A second fix
keeps explicit schedule label matches ahead of the exclusion for already-bound
date groups: some templates repeat a compact schedule inside the reception date
layout, and clicking its label otherwise opened the event modal. Bản Vẽ Tổ Ấm
and Cơi Trầu Khảm Trai, together with the shared art renderer, explicitly mark
reception cards which share a ceremony grid, so the nearest ceremony/reception
block determines the selection. The art
renderer marks each composite honorific/parent-name line with its actual schema
field so clicking it focuses the name, including when only one parent remains.
Tơ Hồng and Uyên Ương mark their translated time lines so the reception's
`Vào lúc …` phrase remains selectable independently of surrounding date text.
Existing template artwork, routes, schema, persistence and publication contracts are the
reference. It does not create or redesign any invitation UI.

## Test contract

| Surface | Required behavior on every completed template |
| --- | --- |
| Couple | Each person's rendered name opens the couple modal. Changing full/short names changes the card and preserves the other person's data. |
| Family | All four rendered parent names open family editing, focus the correct field and update independently. A deliberately cleared father stays absent after reload while the mother remains. |
| Reception | The rendered reception time opens event editing, with the correct wedding date and time and no venue fields. Date/time changes update the preview and persist. Enter opens the same modal; Escape dismisses it. |
| Venue | The rendered venue text, the reception heading and the embedded map open venue editing with separate name/address fields and no wedding-date field. Updated address renders on the card and persists. |
| Ceremonies | The native rendered ceremony title opens its collection editor. The changed title renders and persists without changing its independent date/time. |
| Schedule | The rendered activity opens schedule editing. The changed label renders and persists without changing its time. |
| Album | An actual album image opens album editing rather than the guest lightbox. Changing the layout persists without deleting/reordering the stored gallery. |
| Opening photos | Zero-photo templates show neither dedicated source nor a photo menu item. One/two-photo templates expose the real sources, the exact number of controls and focus the clicked person's upload slot. |
| Gift | Exactly one rendered gift control opens gift configuration. Partial account-holder input persists without inventing bank/account numbers. |
| Guest preview | Editor bindings, missing-section suggestions and the private gift placeholder disappear. Saved content stays rendered. Returning to editing restores working canvas clicks. |
| Layout/runtime | Each visited modal stays within the viewport; closing releases the body scroll lock. The final invitation has no horizontal overflow, JavaScript/hydration errors or accidental navigation. |

The text/photo locators start from actual fixture content and image URLs inside
the template renderer, independently of `data-e2-section`/`data-e2-field`. Merely
having markers cannot satisfy these tests. Hit-testing verifies a real exposed
point before a pointer click, including animated photos. Forced clicks and
synthetic activation events are not used.

Native presentation is respected: couple-name targets accept the expected full
or short name, family targets accept the fixture honorific followed by the exact
name, and reception-time targets accept a date/middle-dot prefix on Hoa Mai's
combined line. These are explicit text formats, not optional tests or fallback
editor-menu clicks. The modal, focus, mutation and persistence assertions remain
required in each case.

An empty or missing section cannot silently become `if (elementExists) { test }`.
Every section in the table is required by today's completed catalog. Any future
template exception must have an explicit reviewed contract; it must not be inferred
from the absence of a binding. Opening-photo capacity is the sole catalog-defined
0/1/2 variation and is checked against consumed image sources as well as controls.

## Data and isolation

Each test creates its own owner and invitation in a dedicated isolated E2E
SQLite database. The test fixtures use distinct names, reception/ceremony dates
and times, collection labels and bride/groom image sources. Mobile uses the
opposite family display order. Real account or guest data is never used.

The persistence step waits for the server's saved acknowledgement, checks actual
content and ordered child rows, clears browser recovery storage and reloads.
Therefore local browser recovery cannot conceal a failed server save. The page
context closes before owner cleanup so delayed autosaves cannot race deletion.
Tests stay serial, following the existing shared SQLite suite policy.

The small edge suite verifies catalog/picker agreement, venue heading/map clicks
and duplicate text context on Song Hy, the generic art renderer and Hoa Tinh.
The existing `editor2.spec.ts`
remains part of the same CI command for creation, guest/account ownership,
publication, uploads/errors, touch scrolling, hiding/undoing, template switching
and the 320/768px responsive cases.

## Commands

```sh
# All catalog cases plus edge cases and existing editor integration tests
npm run test:editor2

# Only the 140 catalog cases
npm run test:editor2:matrix

# One independent failure can be reproduced without rerunning the catalog
npm run test:editor2:matrix -- --grep 'hoa-tinh-red / 390px'

# Safari engine: install once, then run catalog and edge tests in WebKit
npx playwright install webkit
npm run test:editor2:webkit
```

The configuration inherits production build/server settings from
`playwright.config.ts`, but uses its own port (3117 by default), build directory
(`.next-editor2-3117`), DB/media directory (`tests/e2e/.data-editor2-3117`) and
report/output paths. It always starts a fresh server, never reusing another app's
process. `E2E_PORT=3118 npm run test:editor2` selects another complete namespace.
The shared fixture helper defaults remain compatible with the original suite;
the preparation script rejects DB paths outside `tests/e2e/.data[-name]` before
removing any files. Tests require Node 24+ and installed Playwright browsers.

## CI and evidence

`.github/workflows/editor2-regression.yml` runs Chromium on pull requests to master
and pushes to master. Daily at 03:00 Vietnam time, and on manual dispatch, it
also runs WebKit. Each browser has its own runner/database and one serial worker. CI keeps the
HTML/JSON report, success evidence screenshots, failure screenshots/videos and
failure traces for 14 days. This job must be selected as a required status check
in GitHub branch protection to enforce a merge gate; workflow code alone cannot
change branch-protection settings.

Chromium also runs the existing shared integration suite. WebKit runs the entire
new catalog/edge contract; the old integration spec uses Chromium-only CDP touch
gestures, so it is intentionally assigned only to Chromium, without runtime skips.

Local report: `tests/e2e/.report/editor2-3117/index.html`.
Machine-readable results: `tests/e2e/.artifacts/editor2-3117-results.json`.
Per-case attachments: `tests/e2e/.artifacts/editor2-3117/`.
Each passing catalog case attaches the final card viewport and the couple modal.
These screenshots are evidence for review, not approved pixel baselines.

## Limits

The matrix protects interaction and persistence, not pixel-perfect artwork parity
or every optional field on every renderer. Shared form fields and upload/network
failure logic are additionally exercised by the existing unit/integration suite.
The catalog sweep clicks reception time; the existing calendar integration cases
cover clicking actual calendar day cells. Browser viewports/WebKit do not replace
physical iOS/Android checks, screen-reader testing or measured production input
latency. Screenshot attachments alone are not a passing visual-diff assertion.

Local WebKit limitation (macOS 14.1.1): the installed Playwright WebKit 2251
binary exits at browser launch with `Bus error: 10` before any app page loads.
Those launch failures are not counted as product defects or passing Safari
coverage. The Ubuntu CI WebKit job remains enabled and has not been run from
this local task. Chromium is the locally verified engine.

## Verification record

PHASE: inspect
STATUS: complete
CHANGED: none
VERIFIED: catalog, canvas binding mechanism, modal fields, existing E2E fixtures/config and CI reviewed
UNVERIFIED: full catalog interaction sweep before this change
RISKS: string-based binding can misroute repeated text; existing catalog sweeps only cover gifts/photos
NEXT: generate independent template/viewport cases with strict required sections

PHASE: implement
STATUS: complete
CHANGED: matrix/edge specs and helper, isolated build/DB configuration and ignores, npm scripts, CI workflow, ceremony canvas context selection, this note
VERIFIED: 140 matrix tests discovered; application/test types and lint initially passed
UNVERIFIED: final browser results pending below
RISKS: physical-device and pixel-diff coverage remain outside the functional matrix
NEXT: run the complete matrix and shared integration checks, investigate failures without skipping them

### Demonstrated selection regression

Before the containing-block fix, all six identical ceremony/reception time cases
failed: the expected ceremony modal was replaced by reception editing. After the
fix, all six cases pass in the full Chromium run, alongside seven catalog/picker
and venue heading/map checks. Song Hy renders the ceremony time with a `VÀO LÚC`
prefix; that text is included in pointer target discovery rather than expecting
a separate time-only node. Duplicate couple-name checks additionally ensure
the matching names keep independent bride/groom input values.

The broader sweep additionally caught Double Dragon/Double Phoenix's compact
schedule label selecting the event modal. The same label was correctly bound in
the full timeline, but its earlier repetition inside a date group was excluded
by the canvas walker. Matching known field/collection values before skipping
already-bound date descendants preserves the actual clicked content's section.
The matrix deliberately clicks the first visible real occurrence and therefore
covers this duplicated compact layout as well as the full timeline.

### Interrupted shared-environment run

The first catalog sweep passed 83 cases, then encountered a missing Next chunk
and 404s after another Playwright process in the same checkout rebuilt `.next`
and prepared the shared test DB on port 3101. This is not counted as a completed
catalog run or as evidence of template defects. The dedicated build/database/
port/output namespaces above were added before restarting verification. The
Next `distDir` change follows the installed Next 16 guide
`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/distDir.md`;
the normal development/production build directory remains unchanged.

## Final local verification

- Full Chromium run on the final product code: **211 passed, 2 failed**, 16.0m.
  The entire **140-case template matrix** and **13 edge cases passed in that same
  run**. Both failures were the existing Song Hy bulk-delete tests expecting a
  delete button for bundled defaults. Current album behavior deliberately offers
  bulk deletion only for user uploads.
- Updated those two fixtures to upload a real photo, then check bulk deletion,
  undo restoration, empty stored gallery after save/reload and a subsequent
  upload. Final production-build rerun: **2 passed**, 25.4s. No product code changed
  between the full run and this targeted rerun. Across the full and targeted runs,
  **all 213 distinct Chromium scenarios passed**. There are no skipped tests,
  automatic retries or unaddressed product assertions in this verified set.
- Final editor2 unit set: **22 passed**. Application/test typechecks passed.
  Full lint passed with 0 errors and 401 existing warnings; focused lint on the
  new/edited audit files and canvas/template changes passed. Whitespace checks
  and workflow YAML parsing passed. Both final browser runs built the production
  application successfully against the isolated database.
- Local WebKit could not launch, as recorded above. Its failed launches are not
  included in the Chromium counts. GitHub-hosted CI, physical devices and pixel
  baseline comparisons remain unverified; no deployment was performed.

Evidence:

- `tests/e2e/.report/editor2-3117/index.html`: full run, including the two
  superseded album-fixture failures and success screenshots for all templates.
- `tests/e2e/.report/editor2-3118/index.html`: both corrected album cases passing.
- `tests/e2e/.artifacts/editor2-verified-summary.json`: 213 latest passing results,
  with per-case report provenance and the two superseded results retained.
- Desktop/mobile couple-modal screenshots were visually reviewed, including
  `editor2-template-matrix.au-05ded-t-persist-and-guest-preview-chromium/couple-modal.png`
  and `editor2-template-matrix.au-13225-t-persist-and-guest-preview-chromium/couple-modal.png`
  under the 3117 artifact directory. This verifies the reviewed modal layouts,
  without claiming a pixel comparison of every template's artwork.

PHASE: verify
STATUS: complete
CHANGED: 140-case matrix, 13-case edge suite, shared album fixtures, canvas semantic binding, reception/family/time markers in the five affected renderer files
VERIFIED: all 70 available templates at 1440/390, real pointer and keyboard selection, correct modal/focus, live edits, independent server persistence/reload, partial-family clearing, guest preview, 60 shared editor scenarios across full/targeted runs
UNVERIFIED: local WebKit launch, physical devices and exhaustive artwork pixel parity
RISKS: remaining uncertainty outside the stated browser/data/viewport contract; GitHub branch protection must require the new CI check to enforce merges
NEXT: run the configured workflow when these changes are pushed; no deployment requested

PHASE: regression
STATUS: complete
CHANGED: dedicated build/DB/server/output namespace, npm commands, CI workflow, fixture DB guard, generated-output ignores and this record
VERIFIED: production builds, lint, application/test typechecks, 22 editor2 units, 213 distinct Chromium scenarios and evidence/report generation
UNVERIFIED: GitHub-hosted Chromium/WebKit execution
RISKS: scheduled CI remains configuration until pushed; screenshots are evidence rather than approved visual baselines
NEXT: none within local implementation and verification
