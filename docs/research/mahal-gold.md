# Mahal Vàng

Reference: https://chungdoi.com/vi/mau-thiep/mahal-vang/demo

Implemented 2026-09-03. Template ID `mahal-gold`; Vietnamese route `mahal-vang`. Artwork and album photos below were downloaded from the public reference at the user’s request. Local assets are served independently of the reference host. Fonts reuse the app’s The Nautigal, Alex Brush and serif styles.

Names, families, event dates, venue, album, dress code, schedule and gift accounts use editable invitation content. Wishes and RSVP reuse existing live form bindings (RSVP is supplied by the shared invitation shell). Demo music follows the app-wide default.

## Assets

| Local file | Source |
| --- | --- |
| `public/chungdoi/images/themes/mahal-gold/arch-frame.webp` | https://chungdoi.com/images/themes/mahal-gold/arch-frame.webp |
| `public/chungdoi/images/themes/mahal-gold/bells.webp` | https://chungdoi.com/images/themes/mahal-gold/bells.webp |
| `public/chungdoi/images/themes/mahal-gold/calendar-frame.webp` | https://chungdoi.com/images/themes/mahal-gold/calendar-frame.webp |
| `public/chungdoi/images/themes/mahal-gold/castle.webp` | https://chungdoi.com/images/themes/mahal-gold/castle.webp |
| `public/chungdoi/images/themes/mahal-gold/castle2.webp` | https://chungdoi.com/images/themes/mahal-gold/castle2.webp |
| `public/chungdoi/images/themes/mahal-gold/fence.webp` | https://chungdoi.com/images/themes/mahal-gold/fence.webp |
| `public/chungdoi/images/themes/mahal-gold/flower1.webp` | https://chungdoi.com/images/themes/mahal-gold/flower1.webp |
| `public/chungdoi/images/themes/mahal-gold/flower2.webp` | https://chungdoi.com/images/themes/mahal-gold/flower2.webp |
| `public/chungdoi/images/themes/mahal-gold/flower3-decoration.webp` | https://chungdoi.com/images/themes/mahal-gold/flower3-decoration.webp |
| `public/chungdoi/images/themes/mahal-gold/ganesha.webp` | https://chungdoi.com/images/themes/mahal-gold/ganesha.webp |
| `public/chungdoi/images/themes/mahal-gold/gold-line.webp` | https://chungdoi.com/images/themes/mahal-gold/gold-line.webp |
| `public/chungdoi/images/themes/mahal-gold/medallion-cake.webp` | https://chungdoi.com/images/themes/mahal-gold/medallion-cake.webp |
| `public/chungdoi/images/themes/mahal-gold/medallion-coming.webp` | https://chungdoi.com/images/themes/mahal-gold/medallion-coming.webp |
| `public/chungdoi/images/themes/mahal-gold/medallion-gift.webp` | https://chungdoi.com/images/themes/mahal-gold/medallion-gift.webp |
| `public/chungdoi/images/themes/mahal-gold/paper.webp` | https://chungdoi.com/images/themes/mahal-gold/paper.webp |
| `public/chungdoi/images/themes/mahal-gold/pattern.webp` | https://chungdoi.com/images/themes/mahal-gold/pattern.webp |
| `public/chungdoi/images/themes/mahal-gold/sandstone-flower.webp` | https://chungdoi.com/images/themes/mahal-gold/sandstone-flower.webp |
| `public/chungdoi/images/themes/mahal-gold/sandstone.webp` | https://chungdoi.com/images/themes/mahal-gold/sandstone.webp |
| `public/chungdoi/images/gallery/mahal-gold/photo-1.webp` | https://cdn.chungdoi.com/uploads/66d3bfff-67ab-47d9-bf35-53e51d6c97e6.webp |
| `public/chungdoi/images/gallery/mahal-gold/photo-2.webp` | https://cdn.chungdoi.com/uploads/2ebc6959-3d9d-4bed-9a2e-aad548d8defc.webp |
| `public/chungdoi/images/gallery/mahal-gold/photo-3.webp` | https://cdn.chungdoi.com/uploads/0f024b47-4c65-4499-9586-d723d90f83b7.webp |
| `public/chungdoi/images/gallery/mahal-gold/photo-4.webp` | https://cdn.chungdoi.com/uploads/37b0aa90-7146-488f-a6c5-22ee48fbb2d7.webp |
| `public/chungdoi/images/gallery/mahal-gold/photo-5.webp` | https://cdn.chungdoi.com/uploads/db37eb91-60ca-40df-9ef7-6261f49d57d4.webp |
| `public/chungdoi/images/gallery/mahal-gold/photo-6.webp` | https://cdn.chungdoi.com/uploads/0eee7577-40f4-43a5-ba1c-94587a785aae.webp |
| `public/chungdoi/images/gallery/mahal-gold/photo-7.webp` | https://cdn.chungdoi.com/uploads/51cc781a-cdbd-4a76-9d46-e9b9c63edf87.webp |
| `public/chungdoi/images/gallery/mahal-gold/photo-8.webp` | https://cdn.chungdoi.com/uploads/88ff5bc6-fd40-4679-ac93-1cf946881015.webp |
| `public/chungdoi/images/gallery/mahal-gold/photo-9.webp` | https://cdn.chungdoi.com/uploads/041cb94e-35fc-423a-a3ef-055e594ae4f6.webp |
| `public/chungdoi/music/mahal-gold.mp3` | https://cdn.chungdoi.com/music/le-duong.mp3 |

## Preview and validation

The three preview variants currently use the locally rendered palace hero. Full-page preview capture is deferred because the shared Google Maps fallback is blocked by Chrome on localhost; no broken-map screenshot was published. Recapture using the existing pipeline once this template is deployed with the site’s own Maps configuration. No reference-site API key is used.

Local seed: `npm run seed:demos -- --missing --only=mahal-gold`.
Typecheck passed; six template manifest tests passed. Repository lint remains blocked by the pre-existing set-state-in-effect error in `chungdoi-tpl-shared.tsx`; the new template files pass targeted lint.

Gift envelope: `public/chungdoi/images/envelope/mahal_gold.webp` downloaded from https://chungdoi.com/images/envelope/mahal_gold.webp. Uses the shared source layered envelope animation and existing QR modal.
