# Home Tabletop Asset Inventory

## Runtime Assets Created

| Path | Dimensions | Format | Alpha | Purpose | Crop / containing block |
| --- | ---: | --- | --- | --- | --- |
| `public/chungdoi/images/home-tabletop/surface-paper.webp` | 1586×992 | WebP | No | Seamless tabletop surface | `background-size: cover`; section background |
| `public/chungdoi/images/home-tabletop/prop-clips.webp` | 1402×1122 | WebP | Yes | Decorative brass clips | Contain inside a max 120px box; desktop/tablet only |
| `public/chungdoi/images/home-tabletop/prop-pencil.webp` | 1536×1024 | WebP | Yes | Decorative forest pencil | Contain inside a max 260px box; right edge; desktop only |
| `public/chungdoi/images/home-tabletop/prop-notes.webp` | 1312×1199 | WebP | Yes | Blank note-paper stack | Contain inside a max 300px box; HTML copy overlays it |

These assets were generated with the built-in image generation tool on 2026-09-18 for this project. They contain no product artwork and may be replaced independently of template previews.

## Existing Product Assets Reused

| Path | Dimensions | Role |
| --- | ---: | --- |
| `public/chungdoi/images/template-previews/en/portrait/minimalism_darkred.webp` | 750×1333 | Default selected tabletop card and closing crop |
| `public/chungdoi/images/template-previews/en/landscape/minimalism_darkred.webp` | 2400×1260 | Wide product crop and closing CTA |
| `public/chungdoi/images/template-previews/en/listing/minimalism_darkred.webp` | 768×8502 | Tall live-preview viewport |
| `public/chungdoi/images/themes/_decor/minimalism-dark-red/envelope-background.webp` | 1013×1168 | Creation-step open envelope |
| `public/chungdoi/images/themes/_decor/minimalism-dark-red/envelope-cover.webp` | 1013×668 | Creation-step envelope cover |
| `public/chungdoi/images/themes/_decor/minimalism-dark-red/flower2-decoration.webp` | 811×1938 | Template-owned flower decoration; use only inside product artwork context |
| `public/chungdoi/images/gallery/minimalism-dark-red/hero.webp` | 1200×1799 | Optional close crop for live preview |
| `public/chungdoi/images/rsvp-showcase.png` | 1122×1402 | Guest-management product image |

Supporting tabletop and gallery cards must read their image paths from `templates[].portrait`. Do not duplicate those previews into `home-tabletop/`.

## Concept References

| File | Section | Status |
| --- | --- | --- |
| `docs/research/home-tabletop/concepts/01-hero-tabletop.png` | Hero/tabletop | Composition reference |
| `docs/research/home-tabletop/concepts/02-style-gallery.png` | Style gallery | Composition reference |
| `docs/research/home-tabletop/concepts/03-live-preview.png` | Live preview | Composition reference |
| `docs/research/home-tabletop/concepts/04-how-it-works.png` | Creation steps | Composition reference |
| `docs/research/home-tabletop/concepts/05-rsvp.png` | Guest experience | Composition reference |
| `docs/research/home-tabletop/concepts/06-final-cta.png` | Closing CTA/footer | Composition reference |

Concept images are AI-generated references. They may contain incidental generated names, decorative flowers, or UI copy. Those elements must not be copied into production. The real template previews and `messages/vi.json` are authoritative.

## Asset Assignment Rules

- The selected Home card is always `minimalism-dark-red` until the visitor selects another real catalog template.
- A selected card’s image, label, demo link, and create link must derive from the same template record.
- Generated props are decorative and never receive pointer events.
- Do not place generated flowers over a real preview; the preview already contains its intended artwork.
- Preserve the aspect ratio of all real preview images.
- On mobile, hide the pencil and clips before shrinking the product preview below a readable size.
- No hotlinked assets are allowed.

## Verification Needed During Implementation

- Confirm alpha edges on props against paper and burgundy surfaces.
- Confirm the tabletop texture does not create visible tiling seams at 1440px and 1920px.
- Confirm the selected preview remains recognizable at 390px and 320px.
- Confirm `next/image` does not upscale the 750px portrait preview beyond its useful resolution.
- Confirm the 8502px listing preview is lazy-loaded and clipped in a stable-height viewport.
