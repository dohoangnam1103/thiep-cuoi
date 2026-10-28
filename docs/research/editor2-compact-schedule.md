# Compact schedule modal

Scope: `/editor2/[id]`, the shared `schedule` panel in
`src/components/editor2/section-fields.tsx`. The attached user screenshot showed
each activity as two vertically stacked fields and a full-width delete button.
The requested presentation is one row per activity.

The row uses the existing `Editor2Draft.schedule` time/label fields and the
existing add/delete callbacks. A single translated header labels the time and
activity columns. Every input retains its own accessible translated label; the
delete icon retains the existing numbered accessible label and gains the same
text as a tooltip. Adding, removing, undoing, hiding, saving and publication retain
their existing data contracts. No schema, API, validation or asset changes.

Desktop/tablet: a 620px bounded modal, 116px time column, flexible single-line
activity input and 44px delete target. Mobile at 390/320px: the existing full-width
modal with edge gutters, a 112px time column, flexible activity input and 44px
delete target. Long input values scroll within the input; rows never wrap. The
modal body keeps its existing overflow behavior for longer schedules.

All existing warm neutral colors, typefaces, focus treatments, dialog header and
footer remain in use. Rows are 44px tall with about 10px between them. The add
button uses a quiet dashed border. No new imagery or animation. Empty/loading/
disabled/error states use the existing editor behavior and copy.

Changes: the shared section component, schedule-only CSS, the workspace's modal
width class and four Playwright cases in `editor2-bindings.edge.audit.ts`.

PHASE: inspect
STATUS: complete
CHANGED: none
VERIFIED: user screenshot, shared schedule form, modal CSS, save/undo callbacks and existing message keys
UNVERIFIED: final responsive rendering before implementation
RISKS: native time inputs need enough width for the clock affordance
NEXT: align time, activity and delete controls in one row

PHASE: plan
STATUS: complete
CHANGED: none
VERIFIED: no new fields, copy, assets or workflows required; existing palette and keyboard semantics retained
UNVERIFIED: 320px native time input appearance
RISKS: long labels use the native input's horizontal scrolling on narrow screens
NEXT: implement scoped row styles and verify real modal geometry

PHASE: implement
STATUS: complete
CHANGED: section-fields.tsx, workspace.tsx, editor2.css, editor2-bindings.edge.audit.ts
VERIFIED: lint and application/test typechecks passed; first four production-browser cases passed
UNVERIFIED: final screenshots after the narrow-screen time-column adjustment
RISKS: physical browser rendering beyond the tested Chromium viewports
NEXT: verify screenshots and rerun the four responsive cases

PHASE: verify
STATUS: complete
CHANGED: mobile time column increased to 112px after visual review found the native clock affordance crowding the final digit
VERIFIED: final four Chromium cases passed at 1440×900, 768×900, 390×900 and 320×900; six rows stay aligned and 44px tall; long text, keyboard focus, add, delete-middle, server persistence and reload all passed
UNVERIFIED: physical phones and other browser engines
RISKS: narrow activity inputs show a portion of long values; normal input scrolling preserves access to the entire value
NEXT: none within the requested presentation change

PHASE: regression
STATUS: complete
CHANGED: no additional product behavior
VERIFIED: full lint (0 errors, 401 existing warnings), focused lint, application/test typechecks, production build and four responsive browser cases (32.7s, no retries)
UNVERIFIED: other editor sections were not rerun for this scoped layout change
RISKS: no unresolved failure in the exercised behavior
NEXT: none; no deployment performed

Screenshots are attached in `tests/e2e/.report/editor2-3118/index.html` and saved
as `schedule-modal-{1440,768,390,320}.png` in the corresponding case directories
under `tests/e2e/.artifacts/editor2-3118/`. Desktop, tablet, 390px and 320px images
were inspected for the single-row layout and dialog bounds. No new visual assets
were used.
