# Site 2 V12 Readable Exhibition Implementation Plan

**Goal:** Rebuild site 2 Home around V12's real invitation exhibition with text physically separated from moving artwork, as approved on 2026-09-17.

**Architecture:** Server-rendered copy/catalog; scoped Home CSS; client leaves for gallery and live preview; GSAP scoped to art containers. Keep the existing marketing shell and application routes.

**Tech stack:** Existing Next.js 16, React 19, TypeScript, GSAP, next-intl message catalog.

**Spec:** `docs/research/site-2-home-redesign-review-2026-09-17.md`, amended by user's explicit preference for a simpler, more readable V12.

## Constraints

- Only site 2 Home, site 2 assets/messages, site 2 tests and research notes.
- Existing uncommitted Home preserved in `/tmp/site2-home-v12-baseline`; current feature branch is already specific to site 2.
- No edits to root app, shared packages, root public assets or production deployment.
- No background artwork behind headings, no opacity animation on body copy, no pinned scroll sequences.
- Real catalog counts and demo links; no invented customer testimonials or unsupported trial/support claims.

## Tasks

- [ ] Update the existing Home unit contract for a catalog-driven hero with real demo links, an empty-catalog fallback, visible server-rendered copy and bounded preview fields. Run the focused test before implementation.
- [ ] Rebuild `home-hero.tsx` with a headline, two CTAs and a separately clipped fan of curated invitation thumbnails. Add a Home-only artwork component and prepared small assets under `apps/site-2/public/home-exhibition/`.
- [ ] Rebuild `home-gallery.tsx` as a native horizontal exhibition with keyboard-accessible previous/next controls, normal demo links, captions outside artwork and a full-catalog link. Preserve the total catalog count independently of curated items.
- [ ] Restyle live preview, three steps, product benefits and finale; add support and FAQ in `home-details.tsx`. Copy resides only in site 2 `messages/vi.json`. Preview data remains explicitly illustrative and local.
- [ ] Replace `home.css` with styles scoped to `.s2-home`; animate fan assembly, small art parallax and card reveals within clipped stages. Reduced motion disables these while preserving content and interactions.
- [ ] Update relevant existing Home browser assertions and add layout tests for text/art separation at 390/768/1440, gallery scroll, preview input and keyboard FAQ. Run site 2 lint, typecheck, unit checks, build, focused browser tests; visually inspect screenshots and record limits.
- [ ] Compare protected file hashes to the pre-edit baseline and provide a local preview. Production deployment remains a separate step.

## Acceptance

Hero heading, description and CTAs have no intersection with the artwork bounding box at rest, during scroll or after resize. No horizontal page overflow. All Home art loads. Dynamic catalog visibility is respected. FAQ and preview work without motion. No edits outside the stated boundary.
