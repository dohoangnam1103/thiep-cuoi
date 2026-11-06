# Album 3D: Kiều Tiên – Minh Quốc

Inspected 2026-11-06 (Asia/Ho_Chi_Minh).
Reference: https://thiepmungonline.com/thiep/kieu-tien-minh-quoc

## Scope and section contract

- Public route: `src/app/thiep/[slug]/page.tsx` → selected `song-hy-red` renderer → `AlbumGallery` in `src/components/chungdoi-tpl-shared.tsx` → `src/components/album-coverflow.tsx`.
- Data: `ChungDoiDemoContent.gallery` (ordered original image URLs), `albumLayout="coverflow"`, palette accent, existing lightbox callback. No schema, API, storage, publication or editor workflow changes.
- Album follows the ceremony and precedes the reception. Other invitation sections, cover, guestbook and gift behavior are outside this change.
- Assets: existing gallery uploads supplied by the invitation; no replacement artwork or derived/resized files. Production has 25 gallery WebPs at 4672×7008 / 5304×7952 and landscape equivalents; hero is a separate image.
- Existing containing block: Song Hỷ's centered `max-w-lg` album wrapper with responsive padding. Stage remains 340px high below `md`, 520px from `md`; portrait cards retain 2:3 aspect, 92% stage height, object-cover, 16px radius, shadow, perspective 1000px and the existing transform steps. Palette and typography inherit from the renderer.
- Protected interactions: ordered dots for every original image, previous/next, wraparound, horizontal swipe, vertical page scrolling, lightbox open/navigation/close. A single photo has no navigation; an empty album hides through the existing parent.
- Intentional changes: no autoplay outside the viewport, in a hidden document, during continuous scrolling or with reduced motion. Distant cards beyond ±4 no longer pile up at the same transform. The visible 3D arrangement is retained; accumulated back-face opacity at the far edges can differ for albums larger than nine images.
- Loading: reserve stage height; mount the image window when within 600px of the viewport; use asynchronous image decoding. Original URLs and dimensions are retained. Image error behavior remains the existing browser fallback.
- Messages: existing `invitationTemplate.lightboxPrevious`, `lightboxNext`, `lightboxPhotoAlt`; new catalog keys `coverflowOpen`, `coverflowSelect`, `coverflowGoTo` preserve the existing labels.

## Findings before the change

- All 25 gallery originals were mounted eagerly, including cards completely covered by other cards. Together with the hero, uploaded images transferred about 25.06 MiB in the inspected browser session.
- All 26 uploaded images represent about 3607 MiB of uncompressed RGBA pixels. This is a theoretical pixel-buffer sum, **not measured browser/GPU memory**; actual decoding and caching are browser-dependent.
- Every four seconds the gallery changed active index, even when outside the viewport. Cards used `transition-all`, including discrete z-index changes, for 1100ms.
- Initial Chrome DevTools mobile emulation (390×844, DPR3, CPU 4×, three five-second warm scrolls) recorded maximum frame intervals 274.7 / 157.8 / 174.2ms, with 3 / 2 / 1 intervals over 50ms. Page scrolls used `behavior: "instant"` to avoid repeatedly resetting the page's smooth-scroll animation. These are lab observations, not field Core Web Vitals.

## Implementation

- Bound image-bearing 3D cards to the circular ±4 window (at most 9), preserving original gallery indices for navigation and lightbox.
- Observe proximity and viewport visibility separately; initial offscreen albums no longer eagerly fetch the whole gallery.
- Restart the autoplay delay on passive scroll events without React state updates per scroll; clean up timers/observers/listeners on unmount.
- Animate only transform and opacity; honor live reduced-motion and document-visibility changes.
- Leave upload compression and source pixel dimensions unchanged. Existing full-resolution WebP conversion tests pass.

## Verification

- `npm run lint` and `npm run typecheck`: passed for application changes.
- `npm run typecheck:tests`: passed; targeted lint also passed for the new browser spec.
- `pnpm exec tsx --test src/lib/process-uploaded-image.test.ts`: 6 passed, including full-resolution WebP output and rejection instead of silently shrinking oversized output.
- Production build completed via the isolated Playwright server (`E2E_NEXT_DIST_DIR=.next-album-perf`, `E2E_PORT=3128`).
- `tests/e2e/album-coverflow.spec.ts`: 7 cases passed (six main cases plus the targeted swipe case). Covers 1440/768/390/320px, deferred requests, maximum nine mounted images, original 3600×2400 dimensions, all 25 navigation dots, distant index selection, keyboard, lightbox wraparound/close, reduced-motion/autoplay/scroll behavior, empty/single albums and pointer gestures/cancellation.
- Deferred-request assertions deliberately put the album below the preload margin with a test-only spacer, avoiding dependence on cover-animation and font timing.
- Same-photo comparison: production reference versus local production build, identical original WebP bytes replayed at local upload URLs (to respect the existing same-origin CSP). Headless Chromium, 390×844, DPR3, CPU 4×, three five-second warm scrolls. Autoplay is left at each version's actual behavior. This comparison is a lab observation, not a controlled field/phone result or a claim that all application-version differences were isolated.

| Measurement | Before | After |
| --- | --- | --- |
| Mounted gallery images | 25 | 9 |
| Maximum frame interval, run 1 | 199.6ms | 10.2ms |
| Maximum frame interval, run 2 | 192.2ms | 10.4ms |
| Maximum frame interval, run 3 | 33.8ms | 10.4ms |
| Frame intervals over 50ms, runs 1/2/3 | 2 / 3 / 0 | 0 / 0 / 0 |
| RGBA pixel sum of mounted images (not measured memory) | 3482.4 MiB | 1304.1 MiB |

- Evidence directory: `/Users/namdo/.codex/visualizations/2026/11/06/01a1af68-a968-7433-9a16-06f8673e67a9/album-performance/`. Includes `measurements.json` and `before-{width}.png` / `after-{width}.png` for 1440, 768, 390 and 320.
- Visually inspected all four before/after pairs at the first image, matching viewport, zoom and album crop. Center crop, card sizes/rotation, controls and dot wrapping match. Far-edge redundant stacked cards are intentionally removed; no artwork, font, container size or main-photo crop was redesigned.

## Limits

- The measurements above were captured before production promotion.
- CPU emulation on desktop does not reproduce a physical phone's GPU, thermal limits or browser memory policy. Physical iOS/Android testing remains unverified.
- Original full-resolution images still have a decoding cost. The lightbox follow-up below limits their display window and uses cached derivatives only for small thumbnails; source uploads remain unchanged.
- This is an album performance verification, not a full-template clone/fidelity acceptance. Cover, calendar, forms, gifts and footer were not reimplemented or exhaustively revalidated.

## Follow-up: lightbox performance

The reported live lag was still present because the earlier coverflow commit had
not yet been deployed. Direct inspection also confirmed an independent lightbox
problem: 25 full-track image nodes plus 25 thumbnail nodes used the original
33–42MP sources. The background coverflow kept advancing behind the overlay,
the page was not scroll-locked in the non-dialog variant, and wrapping from the
last image to the first animated through 24 full-width slots.

### Changes and protected behavior

- `src/components/chungdoi-tpl-shared.tsx`: mount full-size image nodes only for
  the selected index and its immediate neighbours (at most three). Keep the
  original track geometry and swipe/zoom hook. Disable long track transitions
  for wraparound and distant thumbnail jumps; adjacent movement is retained.
- `src/components/lightbox-thumbnails.tsx`: memoize the thumbnail strip so pinch
  and pan state do not rerender it. Use an IntersectionObserver rooted in the
  horizontal strip, with a 32px preload margin. Keep all 25 labelled buttons,
  load only visible thumbnails and bring the selected thumbnail into view.
  Mobile width stays 92vw; desktop width is intentionally capped at 448px to
  bound decoded thumbnail work.
- Same-origin unversioned sources use the existing Next image optimizer at a
  56px display size / quality 75. Its browser-selected responsive derivative is
  only a thumbnail. The full-size lightbox still uses the original URL and pixel
  dimensions, and no original upload bytes are modified. External/versioned
  URLs retain the direct path for compatibility with existing image policies.
- `src/components/album-coverflow.tsx` pauses autoplay while its lightbox is open.
  `src/lib/invitation-lightbox-events.ts` and the existing controller in
  `src/components/chungdoi-demo.tsx` stop independent page auto-scroll on open.
  Body/root scroll locks are restored on close; existing optional modal focus
  handling is retained.
- No schema, route, auth, storage or publishing changes. No new artwork or
  product copy. Zoom, pinch, keyboard, all original indices, image aspect/crop,
  escape/close and optional modal focus behavior remain the contract.

### Verification and evidence

- `tests/e2e/album-coverflow.spec.ts` additionally covers bounded full-size and
  thumbnail nodes at all four viewports, distant navigation without a long
  transition, pinch/zoom, source dimensions, scroll-lock restoration and paused
  background autoplay. A real optimizer integration case verifies a small
  returned thumbnail while the stored full-resolution WebP bytes are unchanged.
- The existing desktop zoom/two-finger pinch case in `tests/e2e/thiep.spec.ts`
  now waits for the existing opening control to be enabled before clicking it;
  its previous immediate click could be ignored while cover assets loaded.
- Same-original-photo evidence directory:
  `/Users/namdo/.codex/visualizations/2026/11/06/01a1af68-a968-7433-9a16-06f8673e67a9/lightbox-performance/`.
  Scenario: 390×844, DPR3, Chromium CPU4×, repeated first/last navigation followed
  by continuous pinch. Original live reference: 409.2ms maximum interval,
  6 intervals over 50ms, 50 image nodes, background advanced from photo 1 to 3.
  Full-size selected source measured 5304×7952.
- Final cached-thumbnail measurements and production verification are recorded
  after the final browser run; physical iOS/Android testing remains unverified.

### Decode-before-switch verification

Further testing showed that limiting nodes alone did not eliminate all stalls
with 42MP sources. The final implementation also calls `HTMLImageElement.decode()`
before committing a navigation, retains only the current/adjacent decoded source
window, and displays the existing photo with a short loading status while the
replacement prepares. A navigation version prevents late image loads from
overriding a newer selection or reopening a closed lightbox. Thumbnail/full-size
files remain separate display concerns; original upload bytes remain untouched.
Reference: https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode

- Final targeted browser run: **12 passed**, including the delayed-decode race,
  full-resolution upload byte preservation, thumbnail optimization, autoplay
  pause, four viewports and the existing desktop/pinch regression.
- Intermediate measurements varied (including a 224–234ms first/last jump after
  thumbnail optimization). They do **not** establish that every physical phone
  is jank-free. Keep the final same-photo result and live verification distinct
  from these intermediate observations.
- Storage prerequisite: with user approval, 36 retired Thiệp Đẹp releases before
  2026-10-31 were archived to Mac, and the complete deterministic compressed
  archive checksum matched a fresh VPS stream before removing only those old
  directories. Eight newer releases, current service and shared data remained.
  VPS available capacity increased to about 8.8GiB. Private archive location:
  `/Users/namdo/Documents/thiepdep-releases-archive-20261106-f04t5ae0/`.
