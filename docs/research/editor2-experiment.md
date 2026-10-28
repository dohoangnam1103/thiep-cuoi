# Editor2 — visual invitation editing experiment

Date: 2026-10-28. Scope: `/editor2`, `/editor2/[id]`, the legacy private canvas redirect and the explicitly requested renderer fixes recorded below. Existing `/editor` and dashboard entry flows remain intact; legacy forms preserve the new optional venue name.

Reference: local `/Users/namdo/Documents/learning/thiep 2/site-1/src/components/editor/visual-invitation-editor.tsx`, `hidden-section-suggestions.tsx`, and its private preview client. User screenshot documents the long existing form; the reference interaction is section selection on the rendered invitation, contextual editing, and suggestions for hidden sections. This is an editor experiment, not a new template clone.

## Ownership and contracts

- `/editor2` starts publicly. Successful creation reuses a valid account/guest session or creates a cookie-owned anonymous draft; GET requests never create user rows. Workspace, canvas and saving require the signed session plus `ownInvitation`. Publication alone requires a real account. Template/font defaults remain those of the original create action.
- Existing `contentSchema`, `prepareInvitationDraft`, `writeInvitationDraft`, upload API and publication action retain their validation and ownership checks. The separate venue-name follow-up adds one backwards-compatible `venueName` column (migration `20261028060000_add_venue_name`); existing `address` and `mapAddress` retain their meaning and values.
- Renderer: `ChungDoiDemo` in preview mode as a direct component in the editor on desktop and mobile, no live forms, no auto-scroll. Same invitation art/fonts and shared gift/album behavior as existing previews. The former private canvas URL now checks ownership and redirects to the workspace; there is no iframe transport or scroll bridge.
- All content fields and ordered ceremonies, schedule, gallery are round-tripped, including fields outside the initial three inputs. Optional content hides through the existing empty-data contract. Hiding is an explicit contextual action; undo restores data during the session.
- Family names, family addresses, honorifics, venue and time now start as real editable defaults in editor2 (see latest follow-up). Deletions remain empty in preview and storage. Only the editing hero photo is projected. No sample account numbers or QR details. Publication uses existing required-data validation.

## UI and section inventory

| id | Fields | Interaction / empty state |
| --- | --- | --- |
| couple | full/short names, order, birth order, zodiac, opening message | Click name/message, contextual panel; three required initial fields |
| family | parents, titles, family addresses | Actual editable defaults; title first; bride/groom columns on desktop, stacked on mobile; deleted parents disappear and surviving names compact |
| event | date, time, banquet time | Click date/time/calendar; real time required by existing publication action |
| venue | venueName, address, mapAddress | Separate venue modal; click the venue text, reception heading, directions or map; optional Maps URL keeps the current override behavior |
| ceremonies | ordered title/date/time | Select native ceremony, add up to existing 20 limit, remove rows |
| photos | hero images, showHeroImage | Click photo; existing upload endpoint and limits |
| album | URLs, album layout | Click photo; upload, reorder, remove one/all, undo; suggest when empty |
| schedule | ordered time/label | Click timeline; add/remove; suggest when empty |
| gift | bank/account/name per person | Song Hy shows its native envelope while editing even without an account; click to configure. Guest/public envelope still requires valid real account data |
| appearance | template, color, font, music, dress colors | Toolbar panel; existing values preserved |

Guestbook/RSVP are renderer-owned and have no editable visibility fields in the current schema; no new persistence flags invented. Cover art, footer, wishes and maps retain existing renderer behavior. Public URLs remain the existing `/thiep/[slug]`.

## Presentation and assets

Use existing app fonts, warm neutral surfaces, muted text and primary red tokens, thin borders, 12–20px radii, restrained warm shadow. Toolbar controls at least 40–44px. No new illustrations or template assets. Existing template artwork stays owned and positioned by each renderer, with its original provenance/dimensions/crop; editor thumbnails use the existing listing assets without altering them.

Desktop: centered wide preview, tools above, contextual modal centered horizontally and vertically. Tablet 768px: flexible canvas and centered bounded modal. Mobile 390/320px: compact wrapping toolbar, full-width canvas and centered modal with screen-edge spacing and scrollable fields. Explicit phone preview at 390px, never scaled by CSS transforms. Loading skeleton, announced save status, retry on error, focus restoration through Base UI dialog. Reduced motion respected.

## Acceptance and evidence

Planned checks: lint, typecheck, unit tests for round-trip/projection/section logic, targeted headless E2E for creation, click editing, ownership, autosave/reload, add/hide/restore sections, uploads, guest preview and publication validation; desktop/tablet/390/320 screenshots. Existing editor route regression checked separately.

Verification status: implemented and verified as recorded below. The later guest-first publication update supersedes the original account-at-creation behavior. No claim of exhaustive template visual parity.

## Initial implementation verification

- `npm run lint`: passed with 403 warnings at the first full run (existing repository warnings plus two new navigation warnings subsequently fixed). Targeted ESLint on every new source/test and `next.config.ts`: passed without warnings.
- `npm run typecheck` and `npm run typecheck:tests`: passed.
- Targeted schema/display/publication/i18n regression unit set: 37 passed; after the additional partial-gift regression, editor2's own unit set: 4 passed.
- `npx playwright test tests/e2e/editor2.spec.ts --project=chromium`: **6 passed**, final run 26.1s including isolated database preparation and production build/start. No changes to the original editor entry points. The E2E test also opens the original editor and verifies the name saved by editor2 is present.
- Covered: real-account gate, non-owner 404 on workspace and canvas, exactly three creation inputs, click family/name editing, automatic saving, reload, no persisted sample family/venue/time, guest preview without samples or editor bindings, two native ceremonies with distinct title/date/time and no post-template block, real gift envelope selection, image upload, hide/undo album, persisted ordered relations, required-time publication error and successful publication.
- Keyboard: contextual panels close with Escape; all canvas bindings gain focusable button semantics and Enter/Space handling; dialogs use Base UI focus management. Exact keyboard return targets across every renderer have not been exhaustively audited.
- Responsive: screenshot/overflow assertions at 1440×1000, 768×900, 390×900, 320×900; long bride name, contextual panel, template switch. Art renderer (`lien-hoa-pink`) exercised at tablet size; Song Hy Red/Green exercised across the other sizes. No shared template artwork or CSS was changed.
- Reviewed screenshots: `/tmp/editor2-evidence/start-desktop.png`, `workspace-desktop.png`, `context-768.png`, `workspace-768.png`, `context-390.png`, `workspace-390.png`, `context-320.png`, `workspace-320.png`. These are local runtime evidence, not committed assets.
- Corrections caught during verification: intrinsic thumbnail width collapsing the onboarding illustration; bundled sample hero URLs being intentionally filtered by the existing dedicated-photo helper (the private projection now uses a same-origin absolute URL); decorative plus text affecting accessible suggestion names; implicit labels on bank selects. Final E2E rerun passed after correction.
- CSP adds only `'self'` to `frame-src` so the authenticated editor can embed its own private canvas. Existing allowed external frames remain intact.

### Assets used by editor chrome

No generated or downloaded art. Start illustration uses the selected template's existing `listing` asset (`public/chungdoi/images/template-previews/en/listing/song_hy_red.webp` for the default), 768×7517 WebP, cropped at top within a 370px maximum-width rectangular thumbnail with small, uniform corner radii. The default demo hero photo is `public/chungdoi/images/gallery/song-hy-red/photo-1.jpg` (1366×2048 JPEG), cropped only by the existing renderer’s photo frame. The editable canvas uses the original renderer and its artwork unchanged. Empty hero slots in editing mode may project that template's existing demo photo; this is marked as sample/editable, is never stored, and disappears in guest preview. Ownership, license and provenance remain those of the existing asset inventory, without any new claim about reuse rights.

### Remaining limits

This is deliberately a separate experiment: no dashboard CTA is redirected to editor2. Use `/editor2` to create or replace `/editor/` with `/editor2/` for an invitation owned by the current signed account/guest session. There is no deployment in this task.

Section selection uses private canvas data markers plus rendered text/photo binding, with the content menu as an accessible fallback. Every template is available through the existing catalog, but click placement on every bespoke renderer has **not** been individually audited; artwork fidelity and custom cover interactions across the entire catalog are not claimed. Guest preview starts with the card open, matching the existing preview contract. RSVP/guestbook switches were not added because the current schema has no persisted visibility flags for them. Save/network failure UI is implemented, but offline recovery was not exercised in the browser. Undo history is session-only; there is no new browser-storage copy of bank data.

## Phase report

PHASE: inspect
STATUS: complete
CHANGED: none
VERIFIED: existing routes, ownership, persistence, schema, renderer and local reference editor inspected
UNVERIFIED: exhaustive reference visual parity not applicable to this editor experiment
RISKS: preserve real values separately from sample projections
NEXT: implement separate experimental routes

PHASE: plan
STATUS: complete
CHANGED: this inventory and acceptance note
VERIFIED: existing schema can support requested sections without migration
UNVERIFIED: runtime behavior before implementation
RISKS: bespoke templates need fallback navigation
NEXT: implementation

PHASE: implement
STATUS: complete
CHANGED: src/app/editor2/**, src/components/editor2/**, src/lib/editor2-draft.ts, messages/vi.json, next.config.ts
VERIFIED: lint, typechecking, schema projection/round-trip units
UNVERIFIED: none in the implemented three-field/section editor contract
RISKS: per-template binding coverage remains experimental
NEXT: browser verification

PHASE: verify
STATUS: complete
CHANGED: src/lib/editor2-draft.test.ts, tests/e2e/editor2.spec.ts and UI fixes described above
VERIFIED: six final headless E2E tests and reviewed desktop/tablet/mobile screenshots
UNVERIFIED: full template catalog and offline recovery
RISKS: see remaining limits
NEXT: regression gate

PHASE: regression
STATUS: complete
CHANGED: this verification record
VERIFIED: lint, both typechecks, targeted unit suites, production build, six E2E tests, original-editor compatibility, git diff whitespace check
UNVERIFIED: full unrelated E2E suite was not run
RISKS: explicit experimental limits above
NEXT: user can review locally at /editor2; production deployment remains separate


## Guest-first publication update (2026-10-28)

User-authorized change: move login from before creation to the first click on Publish, within the experimental editor2 flow. Legacy creation and `/editor` retain their account requirement.

- Public start form still requires only the three wedding fields. Invalid submissions do not create a guest session. Valid creation atomically creates/reuses an owner and invitation, then sets the existing signed, HttpOnly, seven-day session cookie. Anonymous draft IDs alone grant no access.
- Guests can edit, autosave, preview and upload photos through the same existing data/upload contracts. Account and guest ownership checks remain required on workspace/canvas reads and all editor2 mutations.
- The first Publish click flushes the save queue before requesting publication access. Guests are sent to `/login?reason=publish&next=...` with the invitation ID, publication intent and selected slug. Draft text, bank details and media lists stay in the database, not in URL parameters.
- Google completion reuses the existing `findOrCreateOAuthUser` behavior: upgrade the guest row for a new email, or transfer its invitations to an existing account. The invitation ID and related photo rows do not change. After login, the same editor opens its publication panel. GET callbacks do not publish automatically; the account confirms publication through the existing validated action.
- The actual editor2 publication mutation independently checks account access; hiding the login UI cannot allow anonymous publication. Original publication/payment account gates remain intact.
- Login displays catalog-backed publication copy and a return-to-draft link. Failed Google completion retains the safe return path. An account already signed in follows that safe return URL instead of being sent to the dashboard.
- Guest editor navigation offers the homepage and keeps the legacy account-only editor link for real accounts. No shared invitation artwork, schema, payment behavior or dashboard CTA changed.

Changed owners: `src/app/editor2/{page.tsx,actions.ts,[id]/page.tsx,[id]/canvas/page.tsx}`, `src/components/editor2/{start.tsx,workspace.tsx}`, login page/form, Google completion route, auth reason type/messages. `src/lib/auth/anonymous-account.ts` and `src/lib/dal.ts` only receive comments describing this explicit exception.

Verification:

- Full lint: 0 errors / 401 repository warnings. Targeted lint for all touched source and tests: no warnings.
- Application and test typechecks passed.
- Auth-return, editor2 draft and publication-validation units: 9 passed.
- Editor2 browser suite: 9 passed (56.0s, including isolated database setup and production build). Covers public GET without new user rows, anonymous creation, owner protection, editing/autosave/reload/upload, save flush immediately before login, return-to-draft without login, Google completion for both new/existing accounts, preservation of photos/content, draft remaining unpublished after login, account publication, failed-completion recovery, and the previous desktop/mobile editor regression cases.
- OAuth tests inject an already-verified Auth.js session and exercise the real app completion/adoption/cookie/redirect path. They do not contact Google's live authorization/consent service.
- Additional regression for an already-signed-in account following `next` and retaining a custom publication slug: passed (one targeted test, 18.1s including build/start). Ten browser cases passed across these two runs.

PHASE: inspect/plan
STATUS: complete
CHANGED: none before implementation
VERIFIED: anonymous ownership transfer, signed sessions, existing upload and Google completion contracts
UNVERIFIED: live Google provider consent screens (not needed for local application testing)
RISKS: flush pending saves before redirect; require a real account on publication mutations
NEXT: implementation

PHASE: implement
STATUS: complete
CHANGED: editor2 session/publication entry points and login continuation described above
VERIFIED: lint, both typechecks, nine unit tests
UNVERIFIED: none in local implementation
RISKS: guest drafts remain tied to their signed cookie until adopted by an account
NEXT: browser verification

PHASE: verify
STATUS: complete
CHANGED: editor2 E2E guest/account regression cases
VERIFIED: nine browser cases including real application ownership adoption under mocked provider session
UNVERIFIED: live Google consent service
RISKS: no production deployment in this task
NEXT: final safe-return regression and diff check


PHASE: regression
STATUS: complete
CHANGED: verification note
VERIFIED: ten browser cases across the nine-case suite and additional safe-return test, nine units, lint, both typechecks, production build and whitespace check
UNVERIFIED: live Google authorization/consent service
RISKS: no production deployment
NEXT: review locally at /editor2


Thumbnail follow-up: removed the CSS arch from both `.e2-start-art` and its image at the user’s request. The rectangular frame keeps 12px corners and the image 4.8px corners. Local headless visual evidence: `/tmp/editor2-evidence/start-rectangle.png`. No template artwork changed.

Caption alignment follow-up: replaced `.e2-art-caption`'s negative left offset with equal `1.1rem` left/right insets, and prevented the pointer icon from shrinking. Headless measurements at 1440px and 768px found equal 17.59375px side gaps and no horizontal page overflow. Reviewed desktop evidence: `/tmp/editor2-evidence/caption-centered-1440.png`; tablet capture: `/tmp/editor2-evidence/caption-centered-768.png`.

Final thumbnail follow-up: user requested removing the caption entirely. Removed the caption box, pointer icon/import, unused CSS and `editor2.clickHint` catalog entry. Local headless check confirms both the caption element and its exact text are absent; targeted ESLint passed. Evidence: `/tmp/editor2-evidence/thumbnail-no-caption.png`. This supersedes the caption-centering change above.

Couple-field ordering follow-up: grouped the contextual couple editor by person, with bride full name/short name/birth order (and zodiac when supported) before the corresponding groom fields. Opening message and shared display-order control follow both groups. No persistence fields or invitation display-order behavior changed. Targeted ESLint, application typecheck and existing 390px editor E2E passed; reviewed `/tmp/editor2-evidence/context-390.png` confirms the bride fields precede the groom fields. The zodiac variant’s visual layout was not separately captured in this small ordering change.

Modal placement follow-up: centered the editor dialog horizontally and vertically instead of using a right-side panel on desktop and a bottom sheet on mobile. Height limits retain scrolling inside the fields and mobile keeps a 0.75rem gap from the screen edges. Existing responsive E2E cases at 768px, 390px and 320px passed (3 tests, 17.1s including production build); reviewed `/tmp/editor2-evidence/context-768.png` and `context-390.png`. Earlier right-side/bottom-sheet screenshots are superseded by these captures.

## Remembered names and wedding date (2026-10-28)

User-authorized scope: remember only bride full name, groom full name and wedding date between template choices/refreshes, and update remembered values when these fields change.

- `src/lib/editor2-basics-storage.ts` owns a versioned cross-template default and per-invitation unsaved-basic entries. Serializers explicitly select three strings, so other invitation fields and bank details cannot enter this storage.
- `src/components/editor2/start.tsx` restores those defaults after client hydration and writes each input change, including intentional clearing. A template query change or page refresh retains the values.
- `src/components/editor2/workspace.tsx` mirrors basic field changes synchronously after React commits, including undo/redo and edits made through contextual fields. The per-invitation cache can recover unsaved basics before server autosave; derived short names follow a recovered full name, while custom short names and unrelated server fields remain intact.
- Shared defaults never overwrite an existing invitation. Pending entries carry their known server baseline; if the server basic fields have changed independently, that server state wins. A successful save updates the baseline/clears acknowledged entries without changing global defaults back to an older queued snapshot.
- `src/components/editor2/client-ready.tsx` follows the existing editor's hydration pattern so browser-only initialization cannot cause SSR hydration mismatches or overwrite restored values with initial empty state. Corrupt/blocked/unavailable storage falls back to the normal usable form and server saving.
- Storage writes happen when basic values change, rather than unconditionally when leaving an old tab. No changes to `/editor`, session ownership, publication, data schema or invitation artwork.

Verification:

- Targeted ESLint on changed source/tests passed; application and test typechecks passed.
- Eight storage/draft unit tests passed: allowlisted serialization, explicit blanks, same-invitation recovery, custom short-name preservation, stale baseline rejection, save rebasing, canonical name acknowledgement, corrupt/versioned/blocked storage handling, and existing draft contracts.
- Full editor2 E2E suite: **12 passed** (31.1s including isolated database preparation and production build). New cases cover refresh before creation, clearing a field, changing template, creation using remembered values, editor changes, undo/redo, recovery with server save requests blocked, opening a different existing invitation without overwriting it, clearing a pending entry after saving, and prefilling the next template with the latest edits.
- After tightening the write timing to a client layout effect, both storage-specific browser cases passed again (2 tests, 16.0s including build). Whitespace check passed. No production deployment.

PHASE: inspect/plan
STATUS: complete
CHANGED: none before implementation
VERIFIED: existing three-field form, editor history/autosave and legacy local draft conventions inspected
UNVERIFIED: none for requested storage contract
RISKS: preserve blank edits; never apply global defaults to an existing invitation
NEXT: implementation

PHASE: implement
STATUS: complete
CHANGED: basics storage module, client hydration boundary, start form and editor synchronization
VERIFIED: targeted lint, typechecks and eight unit tests
UNVERIFIED: browser interactions before E2E run
RISKS: browser storage may be unavailable; existing server flow remains usable
NEXT: browser verification

PHASE: verify/regression
STATUS: complete
CHANGED: storage unit tests and two editor2 browser regression cases
VERIFIED: twelve E2E cases plus two final focused reruns, production build and whitespace check
UNVERIFIED: live Google provider and exhaustive template catalog remain outside this storage change
RISKS: no production deployment
NEXT: review locally at /editor2

Label follow-up: removed the visible “Editor 2 · Thử nghiệm” line from both the start page and workspace header, along with its unused message key and eyebrow style. Targeted ESLint and whitespace check passed.

Responsive couple-modal follow-up: the bride and groom groups now share a two-column grid at viewport widths of 768px and above, with a 760px maximum dialog width for couple/basic-information dialogs only. Smaller screens stack the bride group before the groom group in one column. The invitation message and shared display-order control remain below both groups. The initial missing-basics modal follows the same responsive name-column arrangement. Targeted lint and application typecheck passed; existing 768/390/320px editor E2E cases passed (3 tests, 20.1s including production build). Reviewed `/tmp/editor2-evidence/context-768.png` (two columns) and `context-390.png` (one column).

Modal-copy follow-up: removed the generic “Thay đổi hiện ngay trên thiệp và được lưu tự động.” description and its unused catalog key. The publication-specific description remains scoped to the publication modal. Targeted ESLint and whitespace check passed.

Birth-order controls follow-up: replaced generic text inputs for bride/groom birth order with native dropdowns using the existing `BRIDE_BIRTH_ORDER_OPTIONS` and `GROOM_BIRTH_ORDER_OPTIONS`. Empty selection hides the optional information; “Khác…” allows custom text and preserves existing non-preset values. Labels/placeholder/custom copy come from the editor2 catalog. Persistence still uses the existing fields and autosave. Targeted lint, application/test typechecks, production build and four browser cases passed (23.2s): 768/390/320px layouts plus preset selection, save/reload, clearing and custom-value preservation. Reviewed the updated context screenshots at 768px and 390px.

Opening-message field follow-up: removed the “Lời mở đầu” control from the couple-settings modal and stopped the canvas from routing opening-message text clicks into that modal. Stored opening-message content still round-trips through the existing draft/preview contracts and is not cleared. Targeted ESLint and whitespace check passed.

Display-order control follow-up: removed the “Hiển thị nhà gái trước” checkbox from the couple modal and its unused editor2 message key. The saved `brideFirst` value and invitation ordering still round-trip unchanged. Targeted ESLint passed; no persistence contract was changed.

## Single page scrolling (2026-10-28)

User-authorized change: remove the independently scrollable invitation frame so editor2 has one page scrollbar.

- `src/components/editor2/scroll-bridge.ts` connects the authenticated same-origin canvas to the enclosing page. The preview remains viewport-sized, preserving existing `vh` artwork layouts, fixed invitation controls and native gift/lightbox dialogs. A sticky frame sits inside a track measured to the full invitation content height; parent scrolling drives the frame position.
- `src/components/editor2/workspace.tsx` adds the track and page bridge. `src/components/editor2/canvas.tsx` installs content measurement, scroll synchronization and native wheel/keyboard handling. All messages require the actual parent/frame and the same origin; dimensions/offsets are checked before use.
- Native wheel and touch scrolling over the invitation chain to the page. The frame's own scrollbar is disabled; its smooth-wheel listener cannot establish a separate scroll position. Horizontal gestures and gallery touch handlers retain their native behavior. PageDown/PageUp/arrows/Home/End route to the same page position when the canvas has focus.
- Resize/content/font/image changes update the measured track, including phone-width mode and added/hidden sections. Canvas focus/anchor seeks move the parent page as well. Native guest gift/lightbox overlays lock and release parent scrolling and stay within the visible iframe viewport. Parent editor dialogs keep their existing independent modal scrolling.
- Styles remain scoped to editor2; no shared template renderer, public invitation or legacy editor behavior was changed. The dynamic CSS custom property carries measured content height only.
- Browser verification exposed a pre-existing editor status defect when adding then hiding a section returned exactly to the saved baseline: manual saving returned early without changing “Chưa lưu”. The equal-baseline branch now reports “Đã lưu” without an unnecessary write.

Verification:

- Targeted lint and application/test typechecks passed. Production builds for the browser checks passed. Whitespace check passed.
- The original editor2 suite passed: **13 browser cases** (34.1s including build/setup), covering creation, ownership, saving, guest/account adoption, media, birth-order controls and 768/390/320px layouts.
- New focused scroll checks passed: desktop wheel-to-page synchronization, keyboard navigation, native mobile swipes, content-height growth/shrink after adding/hiding ceremonies, phone-frame sizing, and actual guest gift/lightbox opening/closing with scroll lock. Two gesture/resize cases passed in the last three-case run; the gift/lightbox case passed separately after correcting its fixture to Song Hy Green, whose native album is clickable. Song Hy Red uses a carousel, so the test does not invent a lightbox interaction for it.
- Subpixel scroll-position reconciliation in modal checks allows under 3px rounding; a 500px wheel action must not move the parent page behind the overlay.
- Reviewed evidence: `/tmp/editor2-evidence/single-scroll-desktop.png`, `single-scroll-mobile.png`, `single-scroll-gift.png`. Full catalog scroll/gesture coverage and Safari/iOS device testing were not performed. No production deployment.

PHASE: inspect/plan
STATUS: complete
CHANGED: none before implementation
VERIFIED: private iframe geometry, template viewport sizing, smooth-scroll behavior and native modal contracts
UNVERIFIED: exhaustive custom renderer coverage
RISKS: preserve viewport-based artwork and dialog positions while moving scroll ownership to the page
NEXT: implement page/canvas bridge

PHASE: implement
STATUS: complete
CHANGED: private scroll bridge, workspace/canvas wiring, editor2 CSS, focused browser checks
VERIFIED: lint, typechecks, production build and thirteen existing editor2 E2E cases
UNVERIFIED: native gesture/dialog checks before targeted run
RISKS: modal locking and asynchronous content height updates
NEXT: focused browser checks

PHASE: verify/regression
STATUS: complete
CHANGED: fixture/locator corrections and equal-baseline saved-status fix
VERIFIED: three new scroll/gesture/native-overlay cases, desktop/mobile screenshots, whitespace check
UNVERIFIED: full template catalog and Safari/iOS devices
RISKS: experimental coverage limits remain; no production deployment
NEXT: local review of the single-scroll editor2 page


## Follow-up: editable defaults, family columns and the initial Song Hy gift envelope

Scope: editor2 creation/default initialization and its family/event panels; Song Hy and the shared family primitive, with blank-name cleanup in the vertical art renderer. Original creation/editor entry points, ownership, publication login, URLs, and schema remain unchanged. No new artwork: the editing envelope uses the existing `TemplateGiftArtwork` and Song Hy native section, dimensions, palette and position before the footer.

- `editor2-defaults.ts` obtains initial text from `editor2.samples` in the message catalog. New editor2 invitations store family names/addresses, `Ông Bà` honorifics, venue and `18:00` at creation. Names/date still come from the user. Modals and canvas read the same draft. The generic preview helper now rejects text sample fallbacks, so a deleted name cannot return as a suggestion. Bank fields remain empty until supplied by the user.
- Fully untouched old drafts receive these values once in the client and autosave normally. Partial families preserve missing parent names; unset honorifics match the renderer default. Existing legacy banquet time is copied into the time input, including on published invitations, without inventing a replacement time. Editing time also synchronizes the legacy banquet field. Published invitations do not receive example text.
- A small per-invitation localStorage marker records whether initial family/event defaults are pending or saved. Pending initialization can retry after a refresh before autosave. Saved empty groups stay empty in the same browser, including a no-op save after clearing the whole initialized group. No bank details enter this marker. Without a schema metadata field, an entirely empty old draft in a fresh browser is indistinguishable from an untouched draft and may receive defaults again; partial single-parent data remains preserved regardless of the browser. Blocked storage cannot retain this marker. Existing three-field local storage behavior is unchanged.
- Family panel: bride left, groom right at >=768px; all bride information then all groom information below 768px. Each column is honorific, father, mother, address. Modal remains centered with its existing bounded body scroll and footer. Default values are actual input values. The obsolete sample-only help is replaced with specific deletion guidance; no missing `editor2.fieldHelp` key is rendered.
- Song Hy and shared side-by-side family columns filter absent names and move the surviving name to the first parent row. Invisible, accessibility-hidden typography spacers preserve two parent rows; addresses explicitly occupy row four of the shared grid. Both addresses align even if one family has one or zero parents. Shared vertical/art layouts omit absent parent text without rendering a dangling honorific. Existing full-family spacing/artwork remain intact.
- `InvitationEditingContext` is false outside the private canvas. It enables the native Song Hy envelope without fabricating account/QR data. Clicking it uses the existing canvas binding to open the gift panel. Guest preview/public invitations continue to hide the envelope until at least one valid account exists. Other templates retain their existing gift behavior and add-content suggestions.
- An accessibility defect exposed by real textarea defaults was corrected: input/textarea controls now have explicit translated accessible names, so their values cannot become part of their label.

Verification:

- Targeted ESLint on changed source/tests passed; application and test typechecks passed. Twelve editor2 unit tests passed, covering default initialization, pre-autosave retry, saved deletions, partial/published data, legacy time, round-tripping, sample rejection and basic local-storage recovery.
- Full editor2 browser suite passed: **23 tests**, 42.3s including isolated database setup and production build. This includes all sixteen prior ownership/auth/storage/scroll/upload/publication checks and seven new default/family/envelope cases. The final pure preview guard and published legacy-time normalization are additionally covered by unit tests; no template visual behavior changed in those guards.
- Geometry checks passed for Song Hy Red at 1440, 768, 390 and 320px, plus the shared Boho Floral Green renderer at 1440/390px. They verify modal centering, two/one columns, title-first order, actual default values, father/mother deletion, address row alignment/position, save/reload and guest preview. New-guest coverage verifies default event date/time/address, saved changed time, default envelope click, and no public empty-bank envelope.
- Reviewed screenshots: `/tmp/editor2-evidence/family-modal-song-hy-red-1440.png`, `family-modal-song-hy-red-768.png`, `family-modal-song-hy-red-320.png`, `family-single-song-hy-red-390.png`, and `family-single-boho-floral-green-390.png`. Corresponding screenshots exist for all six family viewport/template combinations.
- Limits: bespoke family renderers outside the shared primitive/Song Hy/art family components were not individually audited. No full catalog visual claim, physical iOS/Safari testing, or production deployment.

PHASE: verify/regression
STATUS: complete
CHANGED: editor2 defaults/creation/panels/canvas/preview, family renderers, private editing context, catalog, unit/E2E tests and this note
VERIFIED: lint, typechecks, twelve unit tests, twenty-three browser cases, production build and desktop/tablet/mobile screenshots
UNVERIFIED: bespoke template catalog and physical Safari/iOS devices
RISKS: browser-local legacy initialization marker cannot distinguish all-empty old drafts in a different browser
NEXT: local review of the updated editor2 flow

## Follow-up: two-column gift panel

The editor2 gift panel now uses the same 768px responsive grid and 760px desktop modal width as the couple/family panels. Bride bank, account number and account holder occupy the left column; groom fields occupy the right. Below 768px the complete bride group precedes the groom group in one column. Help text spans both columns; the existing centered dialog, body scrolling, footer, field values, bank options and save behavior are preserved. Only `section-fields.tsx` and the workspace's wide-modal condition changed. No template artwork or public gift behavior changed.

Verified: targeted ESLint and application typecheck passed. Two existing gift E2E cases passed (21.4s including isolated production build), exercising configuration, save, preview, publication validation and guest setup. The existing browser case also captures the dialog at 1440×1000 and 390×900; both screenshots were visually reviewed: `/tmp/editor2-evidence/gift-modal-desktop.png`, `/tmp/editor2-evidence/gift-modal-mobile.png`. No new behavior tests were added for this layout adjustment. Physical Safari/iOS devices remain unverified.

PHASE: inspect/plan/implement/verify
STATUS: complete
CHANGED: gift panel grouping, desktop modal width condition, existing E2E screenshot capture, this note
VERIFIED: desktop two columns, mobile one column, lint, typecheck, production build and two existing gift browser cases
UNVERIFIED: physical Safari/iOS devices
RISKS: none identified for this layout-only change
NEXT: local review

## Follow-up: bank dropdown arrow inset

The two editor2 bank dropdowns retain native select behavior, options, accessible labels and keyboard handling. A non-interactive Lucide chevron replaces the browser-drawn arrow and sits `.8rem` (12.8px at the default root size) from the right edge; `2.5rem` of right padding reserves text space. The wrapper and styles are scoped to bank selectors only. Changed `section-fields.tsx` and `editor2.css`; no template or financial-data behavior changes.

PHASE: inspect/implement/verify
STATUS: complete
CHANGED: bank selector wrapper/icon and scoped CSS
VERIFIED: targeted ESLint, application typecheck, production build and two existing gift E2E cases passed (19.2s); reviewed updated desktop/mobile captures at `/tmp/editor2-evidence/gift-modal-desktop.png` and `gift-modal-mobile.png`
UNVERIFIED: physical Safari/iOS devices
RISKS: none identified
NEXT: local review

## Follow-up: illustrated album layout choices

The editor2 album dropdown is replaced by three directly selectable cards: Lưới ảnh, Ghép ảnh and Ảnh trượt. The picker reuses `AlbumLayoutPreview`, extending it with optional gallery photos and a larger size; its default compact diagrams remain unchanged for the original editor. With photos, up to the first six gallery URLs fill the structural thumbnails; without photos, the existing decorative diagrams remain available. No stock images, generated artwork, or new persistent data are introduced.

The three cards fit the existing modal at desktop/tablet and 390/320px mobile widths. Each is a native radio label, so clicking the entire card or using arrow keys updates the same `albumLayout` draft field. Selected options have a border, checkmark and native checked state; keyboard focus is visibly outlined. Decorative previews are hidden from accessible names and use empty image alt text. Uploading, order controls, deletion, hide/undo and save logic remain intact. Native template-specific gallery variations are preserved; these thumbnails illustrate the shared layout structures, rather than reproducing every template's artwork or mobile mosaic variation.

Source/asset mapping: `section-fields.tsx` owns the editor2 control and draft binding; `album-layout-preview.tsx` owns the reused diagrams/photo thumbnails; `editor2.css` owns the three-column cards and selected/focus/disabled states. Photos come from the invitation's existing uploaded gallery and keep their original URLs, cropped only within the schematic tiles. Browser evidence uses six pre-existing Song Hy Red gallery photos (`public/chungdoi/images/gallery/song-hy-red/photo-1.jpg` through `photo-6.jpg`) in the isolated test database, without changing local invitation data or asset provenance.

Verification: targeted ESLint, application/test typechecks and whitespace checks passed. Three targeted browser cases passed, 26.4s including production build: existing creation/autosave/original-editor regression, album upload/hide/undo/publication validation, and the illustrated picker interaction. The new interaction case exercises actual gallery image loading, click selection, native keyboard arrow selection, saved value/reload and the resulting guest coverflow. No horizontal overflow at 1440, 768, 390 or 320px. Reviewed screenshots: `/tmp/editor2-evidence/album-layout-1440.png`, `album-layout-320.png`, and `album-layout-empty.png`; 768/390 captures are available alongside them. Physical Safari/iOS devices and every custom template variant were not individually verified. No deployment.

PHASE: inspect/plan/implement/verify
STATUS: complete
CHANGED: reusable album thumbnail component, editor2 album picker/CSS, E2E interaction/evidence and this note
VERIFIED: lint, typechecks, production build, three browser cases, loaded thumbnails, keyboard selection, persistence and desktop/mobile screenshots
UNVERIFIED: physical Safari/iOS devices and full template catalog
RISKS: miniature layouts are structural illustrations; native template layout variations remain as before
NEXT: local review of the visual album picker

## Follow-up: hold the album modal open during upload

The workspace dialog now explicitly cancels close requests while busy, using Base UI's `eventDetails.cancel()` and the synchronous operation lock. `disablePointerDismissal` prevents outside-press dismissal during uploads. X/Done remain disabled; the footer displays the existing translated uploading status instead of offering Hide or showing a stale saved state. The direct hide action also checks the synchronous lock. Successful completion and handled upload errors release the existing upload lock normally; no new timeout, data fields, navigation interception or upload API changes were added. These guards use the existing shared upload state for both album and photo uploads.

Verification: targeted ESLint, application/test typechecks and whitespace checks passed. Four focused browser cases passed (21.7s including isolated production build): existing album upload/hide/undo/publication and illustrated-choice regressions, plus two delayed-network upload cases. Network gates verify X, Done, Escape and outside presses cannot close the modal during either request of a two-image batch. Completion restores closing, saves both images and survives reload. A held server-error response also unlocks the modal, displays the upload error, allows close/reopen and a successful retry with saved images. Captured/reviewed loading footer and disabled controls at `/tmp/editor2-evidence/album-upload-locked.png`.

PHASE: inspect/implement/verify
STATUS: complete
CHANGED: workspace dialog dismissal/footer/hide guard, focused E2E cases and this note
VERIFIED: explicit dismissal cancellation, disabled closing controls, sequential upload locking, error/retry unlocking, saved images/reload, lint/typechecks/build and four browser cases
UNVERIFIED: physical Safari/iOS devices
RISKS: none identified for normal modal dismissal; existing browser unload protection remains unchanged
NEXT: local review

## Follow-up: new invitations start with album, gift and one ceremony

Scope: new invitations created through editor2, for all 70 completed templates. Existing invitations are not backfilled with album/ceremony rows on reload; user-deleted sections remain deleted. The original creation and editor entry points, database schema, public URLs, account/ownership checks and login-at-publication remain unchanged.

Creation/data contract:

- `editor2-starter.ts` reads each selected template's existing demo gallery, deduplicates it and selects up to six photos. Gallery rows are written in order in the same creation transaction as the invitation. The template's existing normalized album layout is preserved. No photos are downloaded or copied, and no other template's gallery is silently substituted. All 70 completed templates have nonempty local galleries with existing files.
- Exactly one `CeremonyItem` is created with the translated existing `editor2.newCeremony` title and the date entered by the user. A valid HH:mm ceremony time comes from the selected template, otherwise from the editor's existing default time. The legacy ceremony header/date/time content fields are initialized consistently, so original-editor compatibility is retained.
- Sample gallery images and ceremony content are now real editable starter data. Uploads append to the starter album; removal, reordering, hide, undo and manual/autosave retain their previous semantics. Creation is the only seeding point, so hiding album/ceremony sections and reloading cannot restore them.

Gift presentation:

- Native empty-account gift controls are offered in the private editor where the renderer already supports them. The shared `GiftEnvelope` now supports the same editing context as Song Hy; without accounts, its native empty QR dialog cannot open. Public rendering still requires a valid account.
- `gift-placeholder.tsx` provides a private configuration section for templates whose native gift section is gated by account data. It uses the existing shared gift component and `resolveGiftVisual` registry, before an explicit template/art footer where available, otherwise at the end of the renderer. It inherits surrounding text color and constrains the button width for narrow screens. A child-list observer handles lazy renderers and removes the temporary section when a native gift appears, preventing duplicates. The slot is removed in guest preview and once real account data activates the native gift.
- Existing assigned image artwork is reused where the gift registry has it. The existing procedural shared gift is used by registry-default templates (`maroon-love`, `ban-ve-to-am`, `coi-trau-kham-trai`, `cong-la-dua-mien-tay`, `hai-yen-thanh-thu`, `hy-uoc`, `to-hong`, `uyen-uong`) for this unconfigured editor section. This is an explicit editor scaffold, not a claim to reproduce their bespoke native gift artwork; entering a valid account restores the template's own native section.
- Bank/account fields remain empty until supplied by the user; no example account numbers or QR codes are generated. Gift is removed from add-section suggestions because an editable gift is already visible. The content menu remains available to configure it.

Verification and evidence:

- Targeted ESLint, application/test typechecks, whitespace checks and **14 editor2 unit tests** passed. The starter unit iterates all 70 templates, checks gallery availability/file existence/limits, normalized layout and user-date ceremony initialization.
- Full editor2 browser suite: **31 passed**, 1.3m including isolated database preparation and production build. This includes all prior auth/ownership/storage/scroll/family/upload/publication cases; four new creation cases for Song Hy Red, Boho Floral Green, Lien Hoa Pink and Hy Uoc; plus an all-70-template gift configuration pass. The latter checks a single gift control, loaded gift image assets, opening the correct parent modal, and empty account fields for every template.
- New creation cases check actual gallery/ceremony database rows, one native rendered ceremony, editable dates/times, initial album rows, reload persistence and explicit album/ceremony removal surviving another save/reload. No page errors occurred in these creation cases. Existing guest auth/upload expectations include the initial six photos plus the uploaded photo.
- An initial regression run had one stale family-preview count after refresh/edit. Workspace frame messages now read committed draft/editing refs rather than captured snapshots, and the latest draft ref is committed in a layout effect. This also hardens immediate manual saves and late iframe load/ready events. The final complete suite passed with an added database assertion for that deletion.
- Reviewed screenshots: `/tmp/editor2-evidence/starter-boho-floral-green-390.png`, `starter-hy-uoc-1440.png`, `starter-lien-hoa-pink-320.png`, `starter-song-hy-red-1440.png`. All four creation variants have 1440/390/320 captures. Existing asset provenance and dimensions remain unchanged; gallery crops are still owned by each renderer, and gift image proportions remain managed by the shared artwork component.
- Limits: the all-template pass verifies gift presence, image loading and configuration, not complete visual fidelity for all invitation sections. The unconfigured shared gift scaffold can differ from a template's bespoke native envelope. Physical Safari/iOS devices were not tested. No production deployment.

PHASE: inspect/plan/implement/verify/regression
STATUS: complete
CHANGED: editor2 starter/creation, private gift scaffold/context handling, frame synchronization, unit/E2E coverage and this note
VERIFIED: starter assets for 70 templates, one ceremony/new album, all-70 gift editing, deletion persistence, lint/typechecks, fourteen unit tests, production build and thirty-one browser cases
UNVERIFIED: full visual catalog fidelity and physical Safari/iOS devices
RISKS: native bespoke gift styling is only shown after real account configuration where the renderer gates that section
NEXT: local review of newly created editor2 invitations

## Follow-up: honor explicit short names in invitation headers

Root cause in Song Hy Red/Green: the header called `givenName(person.fullName)` and never read the explicit bride/groom short-name fields. The editor and saved data could therefore contain `Quỳnh Anh 2` while the header rendered `Anh 1`. Three other active local hero renderers (Spring Garden Green, Minimalism Red and Chibi Red) also compacted an already-custom short name, dropping words beyond the last two.

`displayShortName(fullName, shortName)` now returns a trimmed explicit short name intact, with derivation from the full name only when the override is empty/whitespace. These four renderer files use it for their five template variants, keyed by bride/groom side so both display orders remain correct. Full names in the invitation body, field limits, persistence, automatic default-name editing, fonts, colors, artwork, dimensions and layout classes remain unchanged. No new asset or message key is needed. The unused legacy source-matched module was not refactored, and the entire catalog is not claimed audited for this issue.

Verification: targeted ESLint, application/test typechecks and whitespace checks passed. Thirty-six targeted short-name/draft/display unit tests passed, including the exact `Nguyễn Quỳnh Anh 1` / `Quỳnh Anh 2` scenario, multiword overrides, changed full names and empty override fallback. Five browser cases cover Song Hy Red, Song Hy Green, Spring Garden Green, Minimalism Red and Chibi Red at desktop/mobile widths, both name orders, immediate rendering, manual save, reload, guest preview and reverting to an automatic name. Together with the existing creation/autosave/original-editor case, these passed twice: **12 passed**, 33.4s including production build/setup. Initial empty-field automation was susceptible to focus restoration when reopening the modal; the final case clicks/focuses the input and uses Select All/Backspace to exercise real keyboard clearing, then asserts both the input and saved database value before checking the header.

Reviewed screenshots: `/tmp/editor2-evidence/custom-short-name-song-hy-red-1440.png` and `custom-short-name-song-hy-green-390.png`; the other three affected variants also have captured evidence in that directory. No template artwork was changed. Physical Safari/iOS devices remain unverified. No deployment.

PHASE: inspect/implement/verify/regression
STATUS: complete
CHANGED: shared short-name resolver, four affected hero renderer files, unit/E2E regression cases and this note
VERIFIED: explicit overrides preserved, empty fallback, both person orders, desktop/mobile screenshots, save/reload/guest view, lint/typechecks, thirty-six unit tests and twelve browser runs
UNVERIFIED: full catalog audit and physical Safari/iOS devices
RISKS: none identified in the five tested template variants
NEXT: local review

## 2026-10-28 — separate time/venue editing, calendar selection and album actions

Authorized follow-up: separate the time and venue modals, add independently editable venue name/address with the existing Google Maps override, make the whole calendar selectable, remove the Song Hỷ Đỏ grid/carousel mismatch, and offer an album-wide removal action.

Implementation and data contract:

- `src/lib/editor2-draft.ts` now distinguishes `event` (date/time) and `venue` (venueName/address/mapAddress). Section navigation and canvas bindings open the matching modal. Both use the existing centered responsive dialog, autosave/manual save, undo/redo, session ownership and publication validation.
- `src/components/editor2/canvas-bindings.ts` binds calendar containers (explicit markers and existing seven-column weekday rows), including blank space/day cells and Enter/Space activation. Song Hỷ exposes `data-invitation-calendar`. Venue text, map sections and directions links select `venue`. Guest/public mode removes these editor bindings.
- New optional venue name: `prisma/schema.prisma`, `src/app/editor/[id]/content-schema.ts`, migration `20261028060000_add_venue_name/migration.sql`. Applied locally with `prisma migrate deploy`; client regenerated and migration status confirmed current. Existing addresses are not guessed or split. The new column defaults to an empty string for existing rows.
- `src/lib/venue-address.ts`, `src/lib/to-demo-content.ts` and `editor2Preview` combine the name and address with a newline for all existing renderers; the Maps override is retained. Clearing either field preserves the other. New editor2 drafts have real editable venue-name/address defaults from `messages/vi.json`.
- Existing owner/admin/demo forms preserve `venueName` via a hidden input in `src/app/editor/[id]/EditorForm.tsx`; their preview uses the same combined venue text. Their visible form layout is unchanged. `src/lib/invitation-editor-audit.ts` classifies venue-name edits in the venue group without logging values.
- `src/components/editor2/section-fields.tsx` adds “Xóa toàn bộ ảnh” above the photo list while the album has images. It removes all album references in one undoable change, keeps the modal open and permits uploading a replacement album. The button inherits the existing upload/publishing fieldset lock. This does not delete uploaded files from disk.
- `src/components/chungdoi-tpl-song-hy.tsx` no longer forces the red palette's grid selection into `SharedCarousel`. Red and green now use their existing two-column grid for `grid`, retaining the extra-photo count, lightbox and mosaic/coverflow choices.

Presentation: existing editor2 colors, spacing, typography, borders and dialog breakpoints retained. Time has date/time inputs; venue has name/address/Maps inputs in one column, with no unnecessary empty column on desktop. No artwork or font was added/replaced. Album fixtures reuse the existing Song Hỷ gallery assets and native square crop.

Validation:

- `npm run lint -- --quiet`, `npm run typecheck`, `npm run typecheck:tests`: passed.
- Targeted unit tests (`editor2-draft`, `editor2-defaults`, `to-demo-content`, `venue-address`, `invitation-editor-audit`): **16 passed**. Includes serialization and actual public venue projection for separate/legacy addresses and Maps overrides.
- Editor2 Chromium regression: **all 42 distinct tests passed** across the full run and focused reruns. The initial full run passed 41/42; the remaining test still expected the old combined venue sample. Its expectation was updated for the new separate defaults and the focused rerun passed. The two grid/removal cases also passed after improving screenshot synchronization with the existing single-page scroll bridge. Production builds in the E2E server setup passed.
- New interaction checks at 1440, 768, 390 and 320px: day-cell click and keyboard calendar opening, immediate date/time update, separate modal fields, centered dialog/no horizontal overflow, independent venue name/address and Maps persistence after reload, clearing name without losing address, directions selecting venue, and no editor roles in guest preview. No page errors in these cases.
- Album checks for Song Hỷ Đỏ/Xanh: actual two-column geometry; coverflow to grid switch; persistence after reload; guest lightbox; clear all; undo; save/reload empty; replacement upload. The existing upload success/error tests additionally verify that clear-all is disabled during upload.
- Screenshots reviewed in `/tmp/editor2-evidence/`: `time-modal-{1440,768,390,320}.png`, `venue-modal-{1440,768,390,320}.png`, `song-hy-{red,green}-album-grid-{1440,390}.png`. Desktop crops explicitly wait for outer-page/iframe scroll synchronization; initial blank automated crops were replaced. Modal samples are test data, not real customer information.
- Local `/editor2` responds HTTP 200. User-owned dev server on port 3000 was left running. E2E uses an isolated SQLite database and port 3100.

Limits: verified in Chromium. Google Maps URL data/selection is covered; the external Maps service, Safari native date/time widgets and every individual legacy calendar renderer were not re-audited. No deployment was requested or performed.

PHASE: regression
STATUS: complete
CHANGED: editor2 draft/defaults/fields/bindings, Song Hỷ renderer, venue schema/migration/projection, legacy-form value preservation, catalog, audit field map and focused tests listed above.
VERIFIED: lint, application/test typechecks, 16 unit tests, 42 distinct Editor2 E2E cases, production build, centered modals at 1440/768/390/320 and red/green album grids at 1440/390.
UNVERIFIED: external Maps service and other browsers, as stated above.
RISKS: production must apply the additive migration when this work is deployed.
NEXT: none within the requested local editor2 scope.

## 2026-10-28 — preserve circular portrait cropping while editing

User reference: attached Song Long Đỏ screenshot with a square left portrait and a circular right portrait. The renderer (`src/components/chungdoi-tpl-double-dragon.tsx`) already assigns `rounded-full` and `object-cover` to both portraits. The editor-only `.e2-editable` selector in `src/app/editor2/editor2.css` overrode that radius with `3px` when a photo acquired an editing binding. Removed only this radius override; cursor, outline, focus, click targets, original assets and renderer sizing remain intact. The fix also preserves other templates' own clipping shapes.

Verified the actual local Song Long Đỏ editor in an isolated browser context at 1440, 768, 390 and 320px. Both editable portraits retain the native fully rounded radius, loaded images and `object-fit: cover`; keyboard focus retains the crop; clicking the portrait opens the album modal; guest preview keeps the same crop and removes editing bindings. Desktop/mobile screenshots were reviewed inline through Chrome DevTools. At 320px the existing renderer constrains the portraits to 118×120px; that pre-existing sizing is unchanged. The temporary anonymous visual-check draft was removed after closing the isolated tab; the user's draft and tab were not changed.

PHASE: regression
STATUS: complete
CHANGED: `src/app/editor2/editor2.css` (one declaration removed); this research note.
VERIFIED: lint, TypeScript, three existing responsive Editor2 E2E checks at 768/390/320, production build, and manual portrait/focus/click/preview verification at 1440/768/390/320.
UNVERIFIED: other browsers; no full template fidelity audit was needed for the editor-only CSS fix.
RISKS: none identified for the requested clipping fix.
NEXT: none.

## 2026-10-28 — complete starter sections with the wedding schedule

Requested behavior: a newly created experimental invitation already contains an editable wedding album, exactly one ceremony and a wedding timeline. Investigation confirmed that album/ceremony rows were seeded by `createVisualInvitation`, while schedule rows were omitted entirely. Legacy or intentionally cleared drafts are not re-seeded on refresh.

- `src/lib/editor2-starter.ts` now includes a copied schedule from the selected template's existing demo content alongside its own gallery, normalized album layout and single ceremony on the entered date. All 70 completed templates have starter albums and valid ceremony times; 69 have native schedule data. Shared sample objects are copied so editing one invitation cannot modify later invitations.
- Baroque Gold is the sole template with an empty demo schedule. Creation supplies four translated, editable rows: 17:30 Đón khách, 18:00 Làm lễ, 18:30 Khai tiệc, 20:30 Chụp ảnh lưu niệm. Their labels come from `editor2.starterSchedule` in `messages/vi.json`; no artwork or renderer layout was added.
- `src/app/editor2/actions.ts` creates ordered `ScheduleItem` rows in the same database transaction as the invitation, content, starter gallery and one `CeremonyItem`. This is actual persisted content, immediately visible in the existing native timeline and modal. It follows the same autosave/manual save, hide and undo behavior as user-entered rows.
- Creation remains the only seeding point. Existing customized sections, published invitations and intentionally removed albums/ceremonies/schedules are not overwritten or reintroduced. No schema, public route, original editor/create entry flow or authentication change.
- `src/lib/editor2-starter.test.ts` checks every completed template for available image files, valid one-ceremony data and nonempty editable schedule rows, including Baroque's fallback and independent object copies.
- The existing creation E2E coverage now includes Song Hy Red, Double Dragon Red (the user's current template), Boho Floral Green, Lien Hoa Pink, Hy Uoc and Baroque Gold. It checks persisted rows, native timeline visibility, prefilled modal fields, editing/saving/reloading a timeline row, and clearing all three sections without re-seeding after refresh. Existing desktop/mobile rendering and asset crops are reused.

PHASE: regression
STATUS: complete
CHANGED: `src/lib/editor2-starter.ts`, `src/app/editor2/actions.ts`, `messages/vi.json`, starter unit tests, existing creation E2E cases and this note.
VERIFIED: lint; application/test TypeScript checks; ten focused editor2 unit tests (including data/assets for all 70 templates); full Editor2 Chromium suite, 44 passed (1.7m); two focused timeline-visual creation cases passed (20.2s); production build through E2E setup. Reviewed native timeline crops for Double Dragon Red at 1440/390 and Baroque Gold at 1440/320; saved captures also cover 390/320 where applicable: `/tmp/editor2-evidence/starter-timeline-{double-dragon-red,baroque-gold}-{1440,390,320}.png`. Schedule fields, edits, persistence and intentional deletion after refresh passed.
UNVERIFIED: other browser engines and a full visual audit of all 70 native timeline designs. Existing drafts are not retroactively overwritten.
RISKS: none identified for the requested new-invitation defaults.
NEXT: none within the experimental create flow.

## 2026-10-28 — LAN phone testing stuck at the hydration placeholder

User URL: `http://192.168.0.94:3000/editor2`. Reproduced the exact endless “Đang chuẩn bị thiệp…” screen using that origin in a clean browser context. The HTML and JavaScript requests returned 200, but the Next 16.3.4 dev runtime's `/_next/hmr` WebSocket was rejected; localhost loaded normally. The installed Next guide `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/allowedDevOrigins.md` and `block-cross-site-dev.js` confirm that additional dev origins must be explicitly allowed. The browser-side ready/storage guard was not the cause and remains unchanged.

Added only `allowedDevOrigins: ["192.168.0.94"]` to `next.config.ts`. Next's running dev server reloaded its configuration automatically; no process was manually stopped. The exact IP is allowed for dev resources rather than enabling wildcard origins. Production validation and security headers are unchanged.

PHASE: regression
STATUS: complete
CHANGED: `next.config.ts` (dev-origin allowlist) and this note.
VERIFIED: before/after reproduction on the actual LAN URL; the WebSocket now returns 101 Switching Protocols and initializes Turbopack; the start form hydrates with all three inputs at 390×844; creating an anonymous draft over LAN succeeds, the same-origin private canvas renders with editing targets and one ceremony, and refresh retains access/rendering. No browser console errors after the fix. Reviewed the resulting mobile screenshot inline. Lint, application typecheck and whitespace checks passed. The isolated temporary test draft/account were removed and diagnostic tabs closed.
UNVERIFIED: a physical phone and browser engines other than Chromium; no production build/E2E rerun was needed for this dev-only Next configuration option.
RISKS: none identified for the requested LAN address.
NEXT: reload the phone's existing loading page.

## 2026-10-28 — address-first venue map, following thiep 2

Reference inspected: `/Users/namdo/Documents/learning/thiep 2/site-1/src/components/editor/party-map-field.tsx` and `src/components/invitation/party-map.tsx`. The adopted interaction is a 500ms debounced map preview based on the address, an optional disclosure titled “Vị trí trên bản đồ chưa đúng?”, a Maps override input, short-link resolution and a reset to the address. An existing saved override opens the disclosure initially, matching the reference.

Implementation:

- New `src/components/editor2/venue-fields.tsx` renders the existing name/address fields, a live preview and “Mở Google Maps” link, then a native keyboard-accessible details/summary disclosure for the optional Maps URL. Empty address/name shows the existing translated empty state. Existing venue catalog copy is reused; the field label is now “Liên kết Google Maps”. The modal retains its centered shell, scroll body and fixed footer at small viewport sizes.
- `src/lib/venue-address.ts` centralizes the map query: a valid full Maps URL or legacy coordinate/location override wins; otherwise use the street address, then the venue name if no address exists. Invalid external URLs and unresolved short links fall back to the address. New venue-name placeholders are therefore not prepended to real street-address queries. `editor2Preview`, `toDemoContent` and the original form's preview use the same projection. Raw form/DB `mapAddress` remains an optional override and stays empty when users only type an address.
- `src/app/editor2/actions.ts` adds an ownership-checked short-link resolver using the existing Google redirect expander. Guest draft owners can use it before account-only publication. A request counter and current input check prevent a slow result from restoring an override after it has been edited, reset or the modal closed. No new endpoint/schema change.
- The reset control clears only the override and collapses its disclosure, immediately restoring the address query and keeping name/address intact. Canvas directions open the address field when no override exists; an explicit override target opens its disclosure before focusing the URL input.
- Editor styling is limited to the preview/disclosure in `src/app/editor2/editor2.css`. No invitation artwork was added or replaced.
- Local Maps API requests were rejected because the configured production key does not allow localhost/LAN referrers (visible in the user's screenshot). `src/components/chungdoi-tpl-shared.tsx` now uses its existing no-key embed fallback in development, including its existing Facebook-webview handling. Production keeps its configured API key and behavior.

Verification:

- Lint, application/test typechecks, whitespace checks and 13 focused Maps/venue/draft/public-projection unit tests passed.
- The complete Editor2 browser run passed 44 cases; its new guest-map case initially used an ambiguous status locator (resolution text and modal save status). After targeting the resolution status explicitly, all five focused venue-map cases passed (49.9s), covering the four responsive sizes and guest invalid-link/reset/late-response behavior. All 45 distinct Editor2 cases have passed across these runs; production builds in E2E setup passed.
- Extended existing cases at 1440, 768, 390 and 320px check initially collapsed input, address-only preview query, keyboard expansion, explicit-coordinate override, saved/reloaded override, reset back to the address and persistent empty override after refresh. Existing auth, uploads, starter sections, deletion persistence, scroll and gift/name regressions passed.
- Manually checked the actual dev origin `http://192.168.0.94:3000` at 390×844 using an isolated guest draft: typing `7 Công Trường Lam Sơn, Bến Nghé, Quận 1, Thành phố Hồ Chí Minh` produced a real visible Google map/pin at the Opera House without a URL or API-key error. The optional URL disclosure remained collapsed. Reviewed the map screenshot inline; the temporary test draft/account were removed and tab closed.
- Reviewed `/tmp/editor2-evidence/venue-auto-map-{1440,390,320}.png` for desktop/mobile modal geometry and disclosure layout. Captures also exist at 768px and for the expanded state in `venue-modal-{1440,768,390,320}.png`. The E2E server is a production build on loopback, so its Google embeds still show the configured production key's referrer rejection; these captures verify layout/URLs, not live geocoding. Actual geocoding was verified separately in development as above.

PHASE: regression
STATUS: complete
CHANGED: editor2 venue fields/section wiring/bindings/focus handling/server resolver, shared dev embed selection, query projection helper, venue catalog label, focused unit/E2E checks and this note.
VERIFIED: address-to-map preview, optional override/reset, persistence, guest ownership, delayed-response cancellation, desktop/mobile layout, live LAN dev map, lint/typechecks, 13 units, 45 distinct Editor2 E2E cases and production build.
UNVERIFIED: physical iOS/Safari devices, a successful real short-URL redirect, and production-host Maps key authorization. Existing redirect-expansion logic is reused; cancellation/failure and full-coordinate URLs are covered.
RISKS: none identified for the requested local editor interaction.
NEXT: none within the requested scope.


## 2026-10-28 — direct component editing on desktop and mobile

This follow-up supersedes all earlier iframe/scroll-bridge descriptions in this historical log. The user explicitly requested removing the iframe on **both** desktop and mobile after reporting phone scroll lag.

Implementation and impact:

1. **High: two application documents and scroll synchronization removed.** `Editor2Workspace` always renders the memoized `Editor2InvitationPreview` component. Draft/selection flow through props and a stable callback. Removed `canvas.tsx` and `scroll-bridge.ts`, their message listeners, payload validation/transport, measured-height protocol and sticky viewport iframe. Old `/editor2/[id]/canvas` links still verify session ownership before redirecting to `/editor2/[id]`. Maps retain their normal external embed.
2. **High: unnecessary animation work removed from preview mode.** `ChungDoiDemo` skips the continuous Lenis RAF loop, invitation-end scroll tracking, cover body lock and initial window scroll reset in preview mode. Public opened invitations keep their previous effects. `embedded` selects a div rather than nesting a second main landmark inside the editor.
3. **Medium: typing and editing enhancement work isolated.** The preview receives a deferred draft while saving always uses the current draft. Memoization prevents modal/save-status-only renders from rerendering the invitation. Canvas mutation enhancement batches once per animation frame and cancels pending work on cleanup. Binding ignores only template-owned hidden ancestors, so Base UI hiding the editor behind its modal cannot strip edit targets during typing/template changes.
4. **Medium: narrow desktop preview preserved without another document.** A named `editor2-preview` inline-size container owns the canvas width. Tailwind `sm/md/lg/xl/2xl` variants in `globals.css` keep their existing viewport rules outside `[data-editor2-inline]`; utilities within the direct preview use that container width. The 390px phone button changes the existing component's width without remounting it. Tests check Song Hy header padding switches 130px → 100px → 130px while the page viewport stays 1440px. Coarse-pointer/mobile controls omit the redundant desktop phone-frame button.
5. **Modal behavior:** native gift dialogs keep their body lock; body-portaled legacy lightboxes gain an editor-only CSS lock while visible. Closing them restores page scrolling. Parent editor dialogs remain centered, scrollable, accessible and upload-locked.

The custom responsive variants are declared directly in the Tailwind entry. A first imported variant file appeared correctly in the development stylesheet but the production test build still emitted the original viewport-only utilities. Moving the declarations into `globals.css` fixed the production result; the failing narrow-preview assertion then passed. No framework/build configuration was changed for this.

### Performance observations

Tool: Chrome DevTools trace plus same-page RAF/Long Tasks observation using the `web-perf` workflow. Environment: local Next development server, Chromium, 390×844, DPR 1, touch emulation, CPU 4× slowdown, no network throttling. The before/after scroll comparison used an isolated copy of the reported `double-dragon-red` draft with four existing uploaded photos; the source draft was read-only.

| Observation | Before | After |
| --- | --- | --- |
| Editor/invitation application documents | 2 | 1 |
| Same-origin canvas iframe | 1 | 0 |
| DOM elements across application documents | 113 + 309 = 422 | 364 |
| Native page scroll height | about 4425px | 4425px |
| RAF callbacks scheduled during a 2.5s synthetic down/up scroll | editor 579 + canvas 290 (includes the measurement loop) | editor 301, all attributable to 301 measurement frames |
| Observed long tasks during that scroll window | 0 | 0 |
| Observed p95 RAF gap | 9.8ms | 9.1ms |
| Frames with gap over 32ms | 1 | 0 |

The trace did **not** reproduce severe sustained jank on this desktop machine, even before the fix. The robust result is removing a second React/Next document, the bridge, and the continuous preview loop. These synthetic gaps are not physical-phone FPS, and no percentage speedup is claimed.

| Core Web Vital (lab observation) | Value | Interpretation |
| --- | --- | --- |
| LCP before | 1895ms | Good range for the outer editor only; iframe artwork was excluded |
| LCP with direct preview | 2953ms on a fresh starter draft; an earlier direct-preview run was 3123ms | Needs improvement range; now includes the actual large dragon artwork, so not comparable to the outer-editor-only baseline |
| CLS | 0.00 | Good in recorded load/scroll windows |
| INP | Not measured | Synthetic scroll is not a field INP measurement; no real-user sample |

Network follow-up confirmed zero `/canvas` document requests. A direct-preview dev load had 34 script requests and about 13MB decoded JavaScript, including development instrumentation; this is not a production bundle budget. LCP discovery remains delayed by client initialization/dynamic template loading (about 2.7s in the fresh-draft trace). Render-blocking estimated savings were 0ms. Baseline ImageDelivery highlighted about 721kB of potential image savings with 0ms estimated LCP savings; uploaded photos were 1200×1600 WebP. No speculative source-image rewrites, cache-header changes or polyfill changes were included in this behavior fix.

Accessibility snapshot confirms one main landmark and translated keyboard editing controls. Existing nested button-like enhancement semantics remain a broader accessibility audit item; this task does not claim a full WCAG audit. Reviewed actual 390px Song Long circular portraits, desktop Song Hy workspace, mobile scroll screenshot, centered editing modal and guest gift/lightbox states. The phone preview's utility breakpoints follow its container; custom template CSS media queries, JavaScript viewport checks and inline vw sizing are not exhaustively converted or certified pixel-identical to a physical phone.

### Missing starter data in the user-provided draft

Read-only inspection of `cmvrv9ndl002oqz9kwrcqpq87` found **0 GalleryPhoto, 0 ScheduleItem and 1 CeremonyItem**. The missing sections were absent persisted rows, rather than a hidden rendering branch. The current create action seeds these relations transactionally, but that creation-only initializer intentionally does not overwrite an existing invitation or resurrect user-deleted sections on every load.

As explicitly requested for this draft, repaired only its empty album/schedule collections in a guarded transaction: **6 template photos, 5 template schedule rows and the existing 1 ceremony**. Kept all names, dates, family, bank fields, existing ceremony and other invitation settings. No global backfill or new persistence field was introduced. Refresh the existing tab before making further edits so its in-memory draft loads those repaired rows.

Creation regression now reloads each of six representative new invitations *before* editing and verifies persisted starter album, schedule and exactly one ceremony. Factory units cover all 70 available template starter datasets. Deletion/save/reload tests still verify explicit removals stay removed.

### Final verification

- Lint, application typecheck, test typecheck and whitespace checks passed.
- 23 focused editor2/defaults/starter/storage/draft/venue/public-projection/short-name units passed.
- Final production-build browser run: **51 passed (2.5m)**: all 48 Editor2 cases plus 3 existing public-template/listing regressions. No retries or relaxed geometry assertions. Temporary earlier failures (modal ancestor hiding, portaled album scroll locking, font/scroll settling, async save-label race in the test helper, and production phone breakpoint generation) were corrected before the final passing run.
- Coverage includes ownership/legacy canvas redirect, guest login-on-publish, original editor compatibility, autosave/manual save/refresh, defaults, two-column modals, single-parent alignment, short names, independent time/venue/calendar, address Maps/reset/cancellation, gallery grid/clear/undo, upload success/failure dismissal locks, native touch swipes in portrait and landscape, one main/no canvas request on desktop/mobile, and preserving edits while resizing/toggling the phone width. Both 1440px and 390px sweeps exercised editable gifts across **all 70 available templates**.
- Runtime screenshot evidence remains under `/tmp/editor2-evidence/`: `workspace-desktop.png`, `context-390.png`, `workspace-390.png`, `workspace-320.png`, `single-scroll-mobile.png`, `single-scroll-gift-{1440,390}.png`, starter timeline/album captures and venue-modal captures.

PHASE: regression
STATUS: complete
VERIFIED: direct rendering and native scrolling on desktop/mobile, persisted starter creation/refresh, targeted missing-data repair, lint/typechecks, focused units, production build and 51 browser checks.
UNVERIFIED: physical iOS/Android responsiveness, field INP and exhaustive per-template phone-frame pixel parity. Local development profiling is not a production performance guarantee.
RISKS: no remaining failure in the exercised flows; large decoded photos and development instrumentation can still affect low-memory phones.
NEXT: none within the authorized editor2 fixes; no deployment performed.


## 2026-10-28 — upload modals show user photos, while the card keeps its defaults

User contract: opening an upload modal must not present template sample images as user uploads. Without an upload, the card continues showing its initial sample photos. Once an image is uploaded, the relevant slot/album uses that user's image.

- `editor2UploadedPhoto(s)` in `src/lib/editor2-draft.ts` reuses the existing bundled-image rule and recognizes the 21 exact legacy sample assets under `/chungdoi/uploads/double-dragon-{red,green}/`. The small asset list lives in `src/data/editor2-sample-photos.ts`; it does not classify the whole legacy uploads directory as sample data. Genuine legacy uploads, current `/uploads/` files and external user image URLs remain user photos. Catalog-wide unit assertions cover every bundled gallery and dedicated sample photo across all 70 available templates.
- `editor2Seed` leaves an all-sample album available to the card, clears bundled defaults from dedicated upload slots, and prefers real user images over a legacy mixture of samples and uploads. No existing gallery is cleared merely by opening/closing an upload modal.
- The album modal lists only user photos; layout diagrams use user photos if present and schematic tiles otherwise. The first successful album upload replaces the sample set instead of appending to it. Subsequent uploads append to the existing user album, subject to the same 30-image limit. Reorder/delete use user-photo indices. The explicit clear-all/hide/undo controls retain their previous deletion behavior; hiding still removes the optional section rather than resurrecting samples.
- The opening-photo modal shows only a dedicated user upload for each slot. Existing renderer album fallback stays intact, so a blank dedicated slot still uses the card's default album photos. Uploading fills that slot and enables its image as before. Upload locks, error handling, ownership, saving/publication and the original editor flow are unchanged. No new UI copy or assets.

Verification: lint, application/test typechecks and whitespace checks passed. The focused draft/starter/default/storage unit run passed 15 cases, including all 70 template default datasets, mixed legacy albums, real legacy upload paths and uploaded-image priority. The complete Editor2 run passed 49 of 50 cases against the first build and exposed the Song Long legacy sample-path exception; after adding exact asset recognition, all 7 focused upload/default/grid cases passed (40.8s), including that case and desktop/mobile modal tests. Thus all 50 distinct Editor2 scenarios passed across these runs, with the final production build passing. No retries or relaxed assertions.

New browser checks at 1440px and 390px assert zero images in initially empty upload modals, unchanged sample rows and card images after closing/refreshing without uploading, real opening-photo upload priority/persistence, first album upload replacing six sample rows with one user row, and the user's image still selected after refresh. Existing upload success/error dismissal-lock cases and clear-all/undo regressions also passed. Reviewed `empty-upload-modal-{1440,390}.png` and `user-upload-modal-{1440,390}.png` under `/tmp/editor2-evidence/`; sample card artwork remains visible behind the empty modal, and only user images appear after upload.

PHASE: regression
STATUS: complete
VERIFIED: requested sample/upload distinction, both modal types, desktop/mobile layout, save/reload, catalog classification, upload locks, gallery clear/undo and production build.
UNVERIFIED: physical phones and other browser engines; no deployment performed.
NEXT: none within the requested change.

## 2026-10-28 — opening-photo modals follow each template's actual capacity

User contract: some invitations have no opening photo, others have one, and others have two. Editor2 must expose precisely those upload slots, independently of the album, while preserving uploaded images when switching templates.

- Reused `heroImageCount` from the existing template capability catalog. Of the 70 available templates, 40 consume no dedicated opening photo, 18 consume one and 12 consume two. Removed the modal's `|| 1` fallback. Zero-photo templates no longer offer the photo content item or suggestion, and selection handlers reject unsupported photo sections. One-photo templates have one upload slot. Two-photo templates have separate bride/groom slots in two desktop columns, stacked on mobile.
- The schema's existing person contract remains intact: `heroImage` belongs to the bride and `heroImage2` to the groom. Uploading or removing one never changes the other or the album. Switching to a one-photo/no-photo template retains both stored URLs for switching back. No database/schema changes or template capability changes were needed.
- Modal thumbnails show user uploads only. Without an upload, the invitation keeps its sample/album fallback. Empty-album previews now project two distinct sample sources rather than accidentally using the first photo twice in groom-first samples. These projections are never stored as user uploads. Hoa Tinh's artwork fixes the bride/groom frames to their sides; the preview and click resolver honor that exception even when the groom's family is displayed first.
- Clicking an opening image opens its own upload slot rather than the album. Image matching decodes Next optimized-image URLs and observes source updates. Album buttons keep their album action even if they reuse a hero source. Base UI's `initialFocus` selects the requested file input after opening, including the second mobile slot. Template-owned hidden decorative images are excluded from editing targets. Decorative `aria-hidden` frames and veils pass pointer events through within Editor2, so their artwork cannot intercept clicks on the photo beneath. Native artwork, masks and crop geometry are unchanged.
- Each file input has a distinct accessible translated label. Single-photo help describes one image per slot rather than the album's 30-image limit. Existing upload/close locks, save queue, undo, ownership and original editor behavior remain in place. Manual saving now announces the saving state synchronously before queueing persistence, avoiding a stale saved label while a request starts.

Acceptance checks and evidence:

- Lint, application/test typechecks and 18 focused capability/editor2 units passed. Units include all 70 starter/sample datasets, distinct two-photo defaults, uploaded-photo classification and unsupported-photo suggestions.
- An earlier complete production-build Editor2 run passed 54 cases (3.2m). Expanding the suite added two fixed-side frame cases and real pointer interactions to the two existing catalog sweeps. The next full run passed the other 54 of 56 cases and exposed an automation assumption: a continuously floating portrait never satisfies Playwright's stable-position click check. The audit now waits for the closing modal to unmount, locates an exposed point with browser pointer hit-testing, and performs an actual mouse click there. It neither forces clicks nor disables artwork/motion. This also caught genuine pointer interception by Hoa Tinh's frame images and Ban Ve To Am's decorative veil; the scoped pointer pass-through fixes both.
- Final production-build focused run: **10 passed (1.2m)**. Both 1440px and 390px sweeps switch through all 70 templates, compare actual consumed dedicated sources to the 0/1/2 capability, verify exact modal controls, and click every supported slot to verify the matching focused input. The other cases cover two independent real uploads, save/reload, 2→1→0→2 template switches, gallery preservation, fixed-side album/empty-album fallbacks, user-only upload thumbnails, and guest gift/album dialogs with released page scrolling. Thus all 56 distinct Editor2 scenarios passed across the full and final focused runs. No remaining failed assertion; no retries.
- Desktop/mobile screenshots: `/tmp/editor2-evidence/opening-photos-1440.png` and `opening-photos-390.png`. Reviewed centered modal placement, two-column versus stacked slots, user-only thumbnails, per-slot help and fixed footer. No physical phone or pixel-by-pixel artwork comparison is claimed for this editor behavior change.

PHASE: regression
STATUS: complete
VERIFIED: all 70 template capabilities and actual opening-photo clicks on desktop/mobile dimensions, exact upload slots, independent images and persistence, native frame fallback behavior, 18 units, lint/typechecks, production build and modal screenshots.
UNVERIFIED: physical iOS/Android devices, other browser engines and exhaustive artwork pixel parity. No deployment performed.
NEXT: none within the requested opening-photo change.

## 2026-10-28 — empty albums show template sample photos until the user uploads

User contract: a wedding album should already contain sample photos, so the user only has to upload their own. Empty albums, including legacy drafts created outside Editor2, must not open with a blank album and three schematic tiles.

- `editor2SampleAlbumPhotos` deduplicates and caps the selected template's existing demo gallery, mirroring creation-time starter seeding. The workspace passes both hero and album samples per template; `editor2Preview` projects the album only while editing, only with `showAlbum` enabled and only when the draft has no photos of its own. Projected URLs are never written to the form or database. Uploading replaces the projected samples exactly as creation-seeded samples are replaced.
- `InvitationContent.showAlbum` (default `true`) mirrors the existing `showHeroImage` contract, so hiding the album remains explicit and survives reload/reopen. Restoring it is available as a checkbox in the album modal, and the "add album" suggestion returns while it is off. New photos re-enable it automatically.
- The album layout cards now use the projected sample photos when the draft has no uploads, making the three layouts previewable before uploading. Schematic tiles remain when a template has no sample gallery. The album photo list still shows user photos only; "Xóa toàn bộ ảnh" is offered only when user photos exist.
- No public renderer change: samples stay an editor projection and never ship in a guest preview or a published invitation.

Verification: lint (no errors), application and test typechecks, and the editor2/starter/defaults/storage/draft unit set passed. A direct browser check of the reported `double-dragon-blue` draft rendered the "Album Ảnh Cưới" block with four sample photos, the album modal showed 13 sample thumbnails, `showAlbum` was checked and no template sample URL was persisted. The repository-wide unit run had one pre-existing failure in `chungdoi-tpl-song-hy.test.ts`, caused by unrelated uncommitted gift-section changes in that template.

PHASE: implemented
STATUS: complete
VERIFIED: reported draft now renders sample album photos, modal layout previews, persistence stays user-only, hide/restore flag, lint and both typechecks, focused units.
UNVERIFIED: full Editor2 production-build browser suite was not run after this change; updated E2E expectations cover the sample thumbnails in the album modal.
NEXT: run the focused Editor2 E2E suite when a production build window is available.

## 2026-10-28 — mobile sticky footer gives both actions full width

The mobile publication bar now uses two equal columns, so "Lưu ngay" and "Xuất bản" each fill half of the sticky footer (179px each at 390px, 144px at 320px). The save status is visually hidden in the footer but kept as a live region for assistive technology; the 5.5rem shell padding keeps the 66px bar from covering content. Verified in a 390×844 and 320×844 touch viewport: no horizontal overflow, footer pinned to the viewport bottom, both buttons 44px tall. No behavior, copy, ownership or persistence changes.

## 2026-10-28 — Editor2 background-music suggestion and configuration modal

User contract: the suggestion block must offer "Nhạc nền"; opening it shows a music configuration modal similar to the site-1 editor.

- `EDITOR2_SECTIONS` gains a `music` section, and `editor2MissingSections` suggests it until a track is chosen. The section is also listed in "Nội dung" and can be hidden like the other optional sections; hiding clears the track and returns the suggestion.
- `InvitationContent` gains `musicEnabled` (default true), `musicStartAt` (default 0), `musicTitle` and `musicArtist`, with migration `20261028150000_add_invitation_music_config`. The existing `music` URL column is unchanged.
- The modal (`src/components/editor2/music-fields.tsx`) contains the autoplay toggle, selected-track card with preview and "Đổi bài", a draggable start-position control over a stable per-track waveform, ±5 second nudges, start/duration labels and the existing "Xong" footer. "Đổi bài" reveals an inline search over the existing `/api/tracks` catalog; each row supports preview and selection, so no nested dialog is used. Selected title/artist are stored with the URL; legacy URLs without metadata fall back to a filename-derived title.
- The invitation renderer honors `musicEnabled` for automatic playback only: guests can still use the native music button. `musicStartAt` is applied once, after metadata is available, for both the opening autoplay and the first manual play; loop/resume behavior is unchanged. In Editor2 the invitation's music button selects the music section instead of toggling playback.
- The waveform is decorative and deterministic per track; real duration always comes from the loaded audio metadata. No new audio files or artwork were added.

Verification: lint (no errors), application/test typechecks and the unit suite passed (1092 passed, 0 failed). A focused production-build browser test creates a track, opens "Thêm Nhạc nền", selects it, nudges the start to 30 seconds, turns off autoplay, saves and reloads; it verifies the stored URL/title/enabled/start values and the hidden suggestion. A manual 390×844 check confirmed the empty, list and selected states with a 3:47 track and an enabled slider. Existing creation, ceremony/album/gift and upload-modal Editor2 cases still pass.

PHASE: implemented
STATUS: complete
VERIFIED: suggestion → config modal → track search → preview → start offset → persistence/reload; renderer autoplay gate; lint, both typechecks, unit suite and focused browser cases.
UNVERIFIED: the full Editor2 browser suite and physical-device audio autoplay policies were not rerun after this change.
NEXT: run the full Editor2 E2E suite when a longer production-build window is available.

## 2026-10-28 — "Thế giới của anh" is the default invitation song

- Copied `the-gioi-cua-anh.mp3` (the same file used by site-1, 4:23) into `public/chungdoi/music/`. `invitation-music.ts` now exposes the default URL, title and artist; `DEFAULT_INVITATION_MUSIC` points at this track, so the renderer's existing null-music fallback also plays it.
- Both Editor2 creation actions (`createVisualInvitation` and the dashboard/classic create chokepoint) and the admin-created invitation path persist `music`, `musicTitle: "Thế giới của anh"`, `musicArtist` and the default enabled/start values.
- Opening the music panel for an invitation that still has no track applies the default immediately, so the modal always opens with "Thế giới của anh", its 04:23 duration and an enabled start slider. The "Đổi bài" list prepends the bundled default (diacritic-insensitive search) so users can return to it after choosing another catalog track.
- No new schema changes beyond the music columns added earlier; no public copy or renderer structure changed.

Verification: lint (no errors), application/test typechecks and 1,093 passing units. Focused production-build browser cases passed: creation stores the default in all six representative templates, the music modal starts on the default, selecting a catalog track replaces it, and save/reload preserves the choice. A manual 390×844 check matched the reference modal: "Thế giới của anh", "Nhạc nền thiệp cưới", 04:23 and the selected default in the track list.

PHASE: implemented
STATUS: complete
VERIFIED: bundled asset, all creation paths, modal default, picker return path, persistence, lint/typechecks, units and focused browser cases.
UNVERIFIED: full Editor2 browser suite and physical-device audio behavior were not rerun.
NEXT: run the complete Editor2 suite when a longer build window is available.
