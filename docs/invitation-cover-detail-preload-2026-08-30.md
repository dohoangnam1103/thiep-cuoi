# Cover-first invitation preparation

Implemented locally on 2026-08-30. **Not deployed to either VPS/production host.**

## Behavior

1. Initially only the cover mounts. Existing high-priority cover artwork hints
   stay intact; detail is not rendered into the initial HTML.
2. Wait for the selected cover renderer to be ready, its DOM images to finish
   loading/decoding (or fail), and its actual text fonts/CSS artwork to settle.
   This does not wait for unrelated fonts elsewhere on the page. Two animation
   frames give the visible document a paint opportunity before preparation.
3. Prepare the selected detail renderer under a hidden React Activity. This
   loads its code and eagerly declared images without starting React effects.
   An observer outside that hidden boundary also warms CSS background images
   and text fonts that a display-none subtree would not normally request.
4. Clicking early starts preparation during the existing opening animation; it
   does not wait for a preload promise or add an extra animation delay. Opening
   reveals the same DOM/images and then starts the detail effects. Poor networks
   may still need time for resources that have not finished yet.

React Activity behavior is documented in the
[official React reference](https://react.dev/reference/react/Activity).
The shared map omits its source while detail is hidden, so it cannot start an
embedded third-party document. Music still starts only on user interaction;
native lazy images remain lazy. No guest form is submitted by preparation.

The readiness hook is wired to ordinary 2D/3D envelopes and the gatefold, sleeve
and Doraemon cover readiness signals. Conan's previously eager reader now uses
its own cover-gated Activity boundary. Capture/editor preview stays immediately
visible. No data fetching, published-invitation cache policy, API or database
schema was changed.

## Verification

- 835 unit tests passed, including six new image decode/error/abort/URL tests.
- Production build passed (including TypeScript). Test TypeScript and focused
  lint passed. Existing img warnings remain. The stock TypeScript command still
  reports the previously documented generated dev/prod LayoutRoutes collision;
  no generated development tree was removed to conceal it.
- Seven desktop E2E cases passed against local dev: held cover images prevent
  detail requests; held cover font prevents preparation; failed image does not
  deadlock; early open works; capture bypasses the cover; generated and legacy
  templates reveal successfully.
- Nine E2E cases passed against a final production build and a disposable SQLite
  copy: ordinary 3D image/font gates, capture, two renderer families, and all four
  physical cover CSS fallbacks. No production data/configuration was touched.
- Mobile checks at 390×844, DPR 3 passed separately for 2D (dev) and 3D
  (production build): hero loaded while hidden, successful reveal, no horizontal
  overflow.
- The main ordering test verifies loaded-but-hidden hero pixels, no map/audio
  source before opening, no hidden-page scroll growth, preservation of the same
  hero DOM node on reveal and no additional gallery requests caused by opening.
- Browser accessibility snapshot while preparing contains the cover, not hidden
  detail controls. A warm local development trace observed LCP 189 ms and CLS 0;
  this is only a local sanity check, not an internet/mobile performance claim or
  a before/after production benchmark.

Relevant files: `src/lib/invitation-asset-readiness.ts`,
`src/hooks/use-invitation-cover-ready.ts`,
`src/components/prepared-invitation-detail.tsx`, and
`tests/e2e/invitation-preload.spec.ts`.

Test configuration: `E2E_PORT=3000` for the local dev server; the isolated
production build used port 3109 and a database under
`/tmp/thiepmung-preload-check.ubgA0J`. Physical tests require the explicitly
opted-in disposable `preload-*` published fixtures, enabled with
`PRELOAD_PHYSICAL_FIXTURES=1`. Never point those fixture setup operations at a live
database. Browser tests themselves do not create or alter invitations.
