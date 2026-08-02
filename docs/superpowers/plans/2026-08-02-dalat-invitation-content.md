# Đà Lạt Invitation Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the private Đà Lạt journey pilot into a content-backed wedding invitation whose five stops reveal the couple, date, album, schedule/calendar, map, wishes, and wedding-gift envelope using the app’s existing invitation data contract and UI modules.

**Architecture:** Keep the authored 2.5D journey shell and its 500 ms scene-only pause. Pass a `ChungDoiDemoContent` object into the client shell, derive a typed five-stop invitation model from it, and render one accessible DOM panel above the WebGL/fallback scene. Each stop owns one invitation concern: cover/couple, album, date/schedule, map, and wishes/gift. The route uses the Da Lat venue demo as a safe fallback and can accept a published invitation slug through query data without changing the journey controller.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, React Three Fiber/Drei, CSS Modules, next-intl, existing Chung Đôi shared invitation components, Playwright, `tsx --test`.

---

### Task 1: Lock the invitation checkpoint contract

**Files:**
- Create: `src/components/dalat-journey/dalat-invitation-contract.ts`
- Test: `src/components/dalat-journey/dalat-invitation-contract.test.ts`

- [ ] **Step 1: Write the failing contract tests**

  Add tests that build the contract from a complete `ChungDoiDemoContent` fixture and assert the five ordered roles are exactly `cover`, `album`, `schedule`, `map`, and `wishes-gift`; assert the cover carries both couple names and the reception date; assert map and gift data are omitted when their source data is empty.

- [ ] **Step 2: Run the focused test and verify it fails**

  Run: `npx tsx --test src/components/dalat-journey/dalat-invitation-contract.test.ts`

  Expected: FAIL because the adapter and role mapping do not exist yet.

- [ ] **Step 3: Implement the minimal typed adapter**

  Export `DALAT_INVITATION_STOP_ROLES`, `DalatInvitationStopRole`, and `buildDalatInvitationContract(content)`. Use the existing `formatDate`, `buildCalendar`, `googleCalendarUrl`, and `ChungDoiDemoContent` types; do not copy or mutate the source content. Keep map query resolution as `content.venue.mapAddress || content.venue.address` and create gift-bank rows through `orderByBrideFirst`.

- [ ] **Step 4: Run the focused test and verify it passes**

  Run the same command. Expected: PASS.

### Task 2: Make the route provide real invitation content

**Files:**
- Modify: `src/app/[locale]/lab/dalat-journey/page.tsx`
- Modify: `src/components/dalat-journey/dalat-journey-lab.tsx`
- Modify: `src/components/dalat-journey/dalat-journey.module.css`
- Modify: `messages/vi.json`, `messages/en.json`, `messages/ja.json`, `messages/ko.json`, `messages/zh.json`

- [ ] **Step 1: Add a route-level content selection test/fixture**

  Extend the route-facing Playwright fixture so the default lab renders the complete Da Lat venue demo (`qasr-green`) and an optional `?invitation=<published-slug>` path is accepted only when the slug resolves; an invalid value falls back to the safe demo rather than throwing.

- [ ] **Step 2: Implement content plumbing**

  Import `chungdoiDemoContent` and pass `chungdoiDemoContent["qasr-green"]` to `DalatJourneyLab` by default. Add an optional `content` prop to the client shell, preserve its existing localized loading/status copy, and expose `data-invitation-template` and `data-invitation-id` on the stage for QA. Keep the existing controller and 2.5D renderer unchanged.

- [ ] **Step 3: Add localized structural labels**

  Add a small `invitation` object under `dalatJourneyLab` with labels for `cover`, `album`, `schedule`, `map`, `directions`, `wishes`, `gift`, `calendar`, `addToCalendar`, `openGift`, `wishPlaceholder`, and `wishSubmit` in all five catalogs. Keep key paths identical across locales and run the existing locale-parity unit test.

- [ ] **Step 4: Run typecheck and catalog tests**

  Run: `npm run typecheck && npx tsx --test src/data/dalat-journey.test.ts`

  Expected: PASS.

### Task 3: Render the real five-stop invitation panels

**Files:**
- Create: `src/components/dalat-journey/dalat-invitation-content.tsx`
- Modify: `src/components/dalat-journey/diegetic-content.tsx`
- Modify: `src/components/dalat-journey/dalat-journey-lab.tsx`
- Modify: `src/components/dalat-journey/dalat-journey.module.css`

- [ ] **Step 1: Write failing DOM assertions**

  Extend `tests/e2e/dalat-journey-lab.spec.ts` to assert: the threshold contains the couple names and formatted reception date; after entering, the memory stop exposes the shared album surface and real gallery image URLs; the glasshouse stop exposes calendar/schedule data and an add-to-calendar link; the lake stop exposes an iframe map and a directions link; the final stop exposes the guestbook and `gift-envelope` trigger.

- [ ] **Step 2: Implement the shared DOM panel**

  Replace neutral checkpoint body text with `DalatInvitationContent`, keeping `data-diegetic-surface`, existing surface IDs, `aria-hidden`, keyboard tab stops, and the `hidden → scenic-pause → visible` reveal state. Render only the active stop as interactive, but retain five semantic articles so the journey remains testable and the live region remains stable.

- [ ] **Step 3: Implement each stop using existing shared modules**

  - `mistGate`: couple names, reception date/time, invitation opening message, and family names.
  - `memoryPines`: `AlbumGallery` with the real `content.gallery` and the invitation’s album layout.
  - `timeGlasshouse`: ceremony/reception date/time, `buildCalendar`, schedule list, and `googleCalendarUrl`.
  - `lakePavilion`: venue address, `InvitationMap`, and `MapDirectionsButton`.
  - `wishValley`: existing wishes, the shared wish form binding when live data exists, and `GiftEnvelope` backed by ordered bank rows. Do not invent fake account data when both bank rows are empty.

- [ ] **Step 4: Tune glass/mist layout for real content**

  Keep one screen-space panel, allow internal scrolling for the map/album/wishes stops, reserve the bottom safe-area for navigation, and use the existing glass/mist tokens. Ensure the 500 ms scenic pause has no panel surface, shadow, or pointer target.

- [ ] **Step 5: Run the focused browser tests**

  Run: `npx playwright test tests/e2e/dalat-journey-lab.spec.ts --project=chromium --workers=1`

  Expected: all Dalat journey tests PASS, including the new content assertions.

### Task 4: Verify responsive and reduced-motion behavior

**Files:**
- Modify: `tests/e2e/dalat-journey-lab.spec.ts`
- Modify: `src/components/dalat-journey/dalat-journey.module.css` only if a test exposes a layout defect

- [ ] **Step 1: Add mobile content checks**

  At `390 × 844`, traverse all five stops and assert no horizontal overflow, the panel remains readable, map controls remain reachable, and the gift trigger is keyboard/focus accessible.

- [ ] **Step 2: Add reduced-motion content checks**

  Assert reduced motion still keeps the 500 ms scene-only pause, changes the panel with opacity-only motion, and leaves all invitation features available.

- [ ] **Step 3: Run the full verification suite**

  Run: `npm run test:unit && npm run typecheck && npm run typecheck:tests && npm run lint && ALLOW_INSECURE_SITE_URL=1 npm run build && git diff --check`

  Expected: unit tests, typechecks, build, and diff check pass; lint may report the repository’s pre-existing warnings but no new errors.

### Task 5: Visual handoff QA

- [ ] **Step 1: Capture the route in the Browser/IAB at desktop and mobile sizes**

  Inspect the threshold, the 500 ms scene-only interval, album, map, wishes, and gift modal. Confirm the 2.5D depth layers remain visible behind the content and that no panel obscures the first-frame artwork.

- [ ] **Step 2: Compare against the supplied reference**

  Check the first viewport’s hierarchy (scene → names/date → action), glass surface readability, control safe-area, and transition timing. Remove any temporary screenshot or QA artifacts before handoff.
