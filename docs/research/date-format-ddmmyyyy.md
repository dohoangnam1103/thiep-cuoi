# DD/MM/YYYY across the app

## Scope and contract

The user explicitly requested DD/MM/YYYY throughout the app, including public
invitations and administration. Full displayed calendar dates use two-digit day
and month and a four-digit year. Weekday labels, calendar grids and decorative
day/month figures remain supplemental; their full date captions use the same
numeric convention. Timestamp displays retain their time and Vietnam timezone.

Stored calendar dates, action payloads, filter query parameters, calendar links,
datetime attributes and database values remain ISO. Existing free-text slideshow
captions and OG dates recognize legacy numeric separators without guessing US
month/day ordering. Calendar arithmetic and lunar conversion are unchanged.

## Owners and implementation

- `packages/invitation-data/src/calendar-date.ts`: strict calendar-date parsing,
  formatting and normalization, re-exported from `src/lib/calendar-date.ts`.
- `src/components/ui/date-input.tsx`: DD/MM/YYYY text entry, native calendar
  shortcut, range/real-date validation, hidden ISO submission and form reset.
- `src/components/editor2/date-field.tsx`: the existing nested Vietnamese
  calendar, combined with the shared date input. Creation, basics, event and
  ceremony modals all use it.
- Legacy/support/demo editor and admin filters, withdrawals and vouchers use
  the same input. Message scopes include the new `dateInput` namespace.
- `src/lib/datetime.ts`: padded numeric dates for real timestamps; Vietnam
  timezone is preserved. Blog, slideshow and payment date displays follow it.
- Invitation renderers in both `src/components/` and the portable
  `packages/invitation-core/` use complete numeric date captions. Art-family
  ceremony cards now include the year; their type size fits the longer caption.
- OG previews, slideshow source captions and lunar supplemental lines include
  the complete numeric date. Existing assets/fonts are reused without edits.

## Acceptance and verification

- Manual entry, calendar selection, reload, undo/restore, publication, form
  submission, date filters and form reset preserve the intended ISO calendar day.
- Reject impossible dates, incomplete dates and ambiguous alternate input
  conventions. Check leap years and dates with day/month both below 13.
- Render every registered invitation's native ceremonies with independent dates
  and assert complete DD/MM/YYYY output. Retain missing/partial-data tests.
- Browser checks cover desktop, tablet and narrow mobile; verify date captions
  fit their containing blocks and both nested and native date controls work.
- Run lint/typechecks, calendar/timestamp/OG/lunar tests, the catalog regression,
  focused E2E and a production build. Record results below when completed.

## Phase reports

PHASE: inspect
STATUS: complete
CHANGED: none
VERIFIED: date entry points, timestamp helpers, renderer registry, portable renderers, OG and slideshow captions
UNVERIFIED: browser acceptance after implementation
RISKS: longer date captions may overflow narrow styled blocks
NEXT: implement shared formatting and verify layouts

PHASE: implement
STATUS: complete
CHANGED: shared date utilities/inputs, message scopes, app and portable renderers, date displays and regression tests
VERIFIED: initial lint/typecheck and strict calendar-date unit cases
UNVERIFIED: final complete test run and browser layouts
RISKS: browser acceptance and date-caption width checks pending
NEXT: verification

## Evidence

- `npm run check`: passed lint, both typechecks, full unit suite and local
  production build. Final subsequent unit run: 1,104 passed, one existing skip
  (1,105 cases). Lint has zero errors and 402 existing warnings.
- Portable package tests: 15 passed. Shared renderer regression covers every
  registered invitation and each ceremony's independent full date.
- Chromium: manual entry at 1440/320px, invalid/creation dates, native admin
  filters, voucher reset and nested custom calendar passed. ISO persistence
  survived save/reload and locale-independent day/month entry.
- All 70 completed templates passed full date caption presence, single-line fit
  and viewport bounds at 1440, 768 and 320px. Conan's paginated ceremony date was
  verified in the editor; its SSR renderer has the documented existing skip.
- Screenshots: `/tmp/editor2-evidence/date-input-320.png` and
  `/tmp/editor2-evidence/date-caption-{template}-{width}-{ceremony|reception}.png`.
  Narrow mobile date entry and representative caption layouts were visually
  inspected. Supplemental calendar labels and decorative day/month figures
  remain paired with full numeric captions.
- Only Chromium was exercised in this browser run. No claim is made of an
  exhaustive screenshot comparison of every browser or of new assets.
- Production deployment is recorded separately after its health/smoke checks.

PHASE: verify
STATUS: complete
CHANGED: caption width fixes and date control regression coverage
VERIFIED: full repository check, portable tests, all-template renderer regression, date input/admin/creation/calendar E2E and 70-template layouts at three widths
UNVERIFIED: browsers other than Chromium
RISKS: none identified in the tested date flows
NEXT: deploy and verify production
