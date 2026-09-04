# Cơi Trầu Khảm Trai — visual verification

## Art direction

- Original contemporary Vietnamese lacquer betel caddy; no copied reference template.
- Palette: lacquer plum `#32151F`, betel green `#315A42`, warm ivory `#F1E8D8`, shell pearl `#D8E3DF`, aged silver `#929B98`, restrained coral `#B85B52`.
- Five first-party SVG assets were hand-authored with Codex CLI and validated with `xmllint`.
- Opening cover is a CSS-3D physical caddy; the full invitation is a bespoke DOM renderer.

## Verified states and viewports

Verified locally on the public demo route `/mau-thiep/coi-trau-kham-trai/demo`:

- Mobile `390 × 844`: closed front, closed back, opening transition, opened hero, no horizontal overflow.
- Capture viewport `480 × 844` at DPR 2: complete invitation; measured page height `9,941` CSS px and generated listing height `15,906` px.
- Desktop `1440 × 900`: closed front cover and control placement.
- Reduced-motion capture: renderer settled without animation-dependent content.
- Sections visible in the full-page output: hero, family invitation, two ceremonies, reception, countdown, calendar, album, timeline, map/directions, dress code, guestbook, gift QR, footer.
- Physical-cover controls verified: rotate/front-back, front-only open guard, opening handoff, replay, keyboard focus affordance, and reduced-motion duration.

Generated preview evidence:

- `public/chungdoi/images/template-previews/en/png/coi_trau_kham_trai.png`
- `public/chungdoi/images/template-previews/en/listing/coi_trau_kham_trai.webp`
- `public/chungdoi/images/template-previews/en/portrait/coi_trau_kham_trai.webp`
- `public/chungdoi/images/template-previews/en/landscape/coi_trau_kham_trai.webp`
- Four content-addressed listing thumbnails at widths 320, 480, 640, and 768.

## Refinements made after comparison

- Changed cover-medallion runtime copy from ivory-on-ivory to plum/green/coral for readable contrast.
- Kept the handoff card unmounted while closed so it cannot peek through during back-face rotation.
- Reduced mobile section padding from 96px to 80px while retaining 128px desktop spacing; this improved reading density and kept the full WebP below its format height limit.
- Hid the physical shadow's back face and confirmed zero horizontal overflow at 390px.

## Validation

- `npm run templates:register` — pass, 50 manifests.
- Scoped ESLint for all new/integration files — pass with only three pre-existing `<img>` warnings in `chungdoi-demo.tsx`.
- `npm run typecheck` — pass.
- `npm run typecheck:tests` — pass.
- `npm run test:unit` — pass, 871/871.
- `xmllint --noout` for all five SVG assets — pass.
- Preview capture and responsive listing-thumbnail generation — pass.
- `npm run build:local` — Next production compilation passes, then repository-wide Next type checking is blocked by the unrelated existing error at `src/app/trinh-chieu/actions.ts:231` (`SaveSlideshowResult` inference). No slideshow code was changed for this template task.

## Known visual limitation

The optional 180° bottom-face view remains deliberately low-contrast under Chromium 3D compositing. It is legible as a secondary discovery state, does not expose the handoff card, and does not affect the primary front/opening/invitation flow. No reference fidelity claims apply because this is an original design.
