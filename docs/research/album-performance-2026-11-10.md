# Album and lightbox performance — 2026-11-10

Scope: shared invitation album (`AlbumGallery` / `CoverflowGallery`), shared lightbox and editor image uploads. Reported page: https://thiepmungonline.com/thiep/thu-tra-kien-quyet. Reference implementation inspected read-only: `/Users/namdo/Documents/learning/thiep 2/site-1/src/components/album/` and `src/components/lightbox/AlbumLightbox.tsx`.

## Findings

- The reported five-photo carousel displayed original uploads, including 5179 × 7769, 3906 × 5858, 4660 × 7002 and 4672 × 6984 photos, in 209 × 313 CSS-pixel cards on mobile. Five originals totaled 8,263,512 bytes. Their raw RGBA pixel envelope was approximately 508 MiB; this is an estimate of image pixel work, not measured resident browser memory.
- Every lightbox navigation invoked `decode()` again, even after preparing adjacent images, and immediately displayed a loading message. A first warm-cache test with 4× CPU throttling observed 39–234 ms before changing the active image.
- Pointermove updated React state for the whole lightbox. A real mouse-drag regression test also exposed a compatibility click after pointer capture, which closed the backdrop on release.
- `thiep 2` uses display-sized image variants, waits for loaded photos before carousel autoplay, and uses `yet-another-react-lightbox` with neighbor preloading. This fix reuses those principles within the existing controls and data contracts.

## Implementation

- Shared photo source helpers use the existing Next optimizer policy and quality 90. Coverflow variants are capped at 1080px wide and selected using the actual mobile/desktop card widths. External, query-bearing and unsupported image URLs retain the direct path.
- Lightbox display variants are capped at 1920px wide. The selected image upgrades to the original only when zooming, while its already-visible variant stays on screen during the request.
- The shared album prepares five display photos near the viewport and shares the decoded cache with its lightbox. Navigation prepares two neighbors in either direction and retains a bounded decoded window. This does not promise instantaneous navigation to an arbitrary distant, uncached photo on a slow connection; a delayed loading message remains for that case.
- Prepared neighbors commit without another decode. Drag uses an animation-frame CSS transform instead of React state per pointermove. Compatibility clicks after drag/pinch/pan are consumed. Reduced-motion transitions are disabled.
- The generic demo now uses the same lightbox rather than its previous unbounded duplicate. The guest-moments lightbox consumes the updated shared gesture hook.
- Editor upload precompression now limits the longer edge to 4096px, preserves aspect ratio/alpha/orientation, and never enlarges a small photo. Byte-small but dimension-large WebPs are resized too. The server applies the same bound for client failures/unsupported encoders, including HEIC fallback. Existing source/output byte limits remain.

## Production photo operation — completed separately from application code

- Eligibility uses the current application lifecycle: non-demo, published invitations that are paid/complimentary or whose 3-day trial expires no more than 3 days before processing. Drafts, demos and older expired trials are excluded. References shared with an excluded invitation are skipped.
- Read-only inventory found 67 eligible invitations and 607 referenced upload files (141,762,912 bytes); no missing files or out-of-scope shared references.
- Backed up all 607 originals to a private local archive and verified each checksum. Compression ran on the Mac rather than the VPS. All candidates were decoded and checked for format, aspect ratio, alpha and the 4096px bound.
- 82 oversized photos belonging to 8 invitations changed: 80,037,198 → 40,500,482 bytes (49.4% reduction). The other 525 images remained unchanged.
- Originals were retained. New UUID filenames avoid the existing one-year immutable browser/CDN cache and Next optimizer cache. Updated only 82 photo references in a SQLite transaction, with an online DB backup and conditional rollback journal. Eligibility and source checksums were rechecked immediately before applying.
- Verified all 82 public photo responses against candidate checksums/dimensions, all 82 DB references, original checksums, and SQLite `quick_check=ok`. Rollback dry run found all 82 references restorable.
- For the reported invitation, four changed photos went from 7,451,942 → 3,308,598 bytes; the fifth remained unchanged.
- Private backup/operation directory: `backups/production-photos-20261110T1605/` locally; VPS operation directory `/srv/thiepmungonline/ops/photo-compression-20261110T1605/`. These contain operational/user data and are excluded from source control. Retaining originals means this operation does not reclaim their disk space.

## Verification

- Full lint: 0 errors (existing warnings remain). Application and test typechecks passed. Local production build passed.
- Unit suite: 1107 passed, 1 skipped; deploy safety shell checks passed. Includes source-bound and direct-URL fallback regressions.
- Album + upload E2E: 24 passed. After the real-drag and reduced-motion fixes, all 12 album E2E tests passed again. Covers 320/390/768/1440px, bounded image work, offscreen/autoplay pause, wrap navigation, thumbnail jumps, delayed decode cancellation, zoom/pinch, scroll restoration, 4096px upload cases and unsupported encoder fallback.
- Real-image smoke checks: Chromium and WebKit, 390px and 1440px. Drag advances without closing, zoom/reset and Escape work; no page errors. Headless browser emulation is not a physical-device FPS guarantee.
- Browser comparison used the same five real photos in an isolated local test invitation. Mobile 390 × 844, DPR 3, CPU 4×, network 4 Mbps / 80ms latency. Local fixture kept the pre-operation originals, so the application fix does not depend on retroactive compression.
- Carousel delivery widths: production after the data operation 1794–2740px, local variants 640px. Raw carousel pixel envelope approximately 189.3 → 11.7 MiB, excluding the separately bounded lightbox preload window. Responsive `naturalWidth` is density-corrected, so variant metadata was fetched to calculate these figures.
- Five ready-photo navigation changes observed approximately 12–17 ms in local, with zero loading-message insertions. Existing production code after image compression inserted a loading message on all five navigation attempts. These are lab observations, not field INP measurements.
- Screenshots and browser measurements: `/tmp/chungdoi-album-qa/`; test logs `/tmp/chungdoi-album-*.log`. Local screenshots at matching mobile/desktop states were visually inspected. Whole-template visual parity outside the album is not claimed.

Application changes are local and have not been committed, pushed or deployed by this operation. The production photo-reference operation above is already live.

Technical references: [Next image optimization](https://nextjs.org/docs/app/api-reference/components/image), [HTMLImageElement.decode](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode).
