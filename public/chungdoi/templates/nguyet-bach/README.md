# Nguyệt Bạch Ivory — image asset kit

Quiet-luxury wedding stationery built around warm ivory cotton paper, charcoal typography, restrained champagne foil, mother-of-pearl and white phalaenopsis orchids.

## Delivery

- Use `.webp` in the invitation UI. These retain transparency and reduce the full production set from about 42 MB to about 6.2 MB.
- The `.png` masters stay on the generating machine only; git tracks the `.webp` delivery set (see `.gitignore`). Regenerate a master from the prompt set below if an edit is needed.
- Read `asset-manifest.json` for stable public URLs, dimensions and alpha requirements.
- Rejected generations with baked checkerboard backgrounds are intentionally excluded from this public delivery folder.

## Section coverage

- `cover/`: mobile and desktop opening compositions plus independent lunar halo and pearl-glint layers.
- `materials/`: interior paper background, cotton-paper tile and envelope-liner pattern.
- `frames/`: hero portrait, calendar, RSVP, gallery, map and guestbook frames with transparent content openings.
- `ornaments/`: orchids, blank monogram medallion, date halo, dividers, side watermark and footer artwork.
- `gift/`: closed and open envelope states for the gift interaction.
- `icons/`: calendar, gift, map pin and four timeline moments.

All artwork intentionally contains no names, dates or body copy. Dynamic invitation text should remain live HTML for editing, localization and accessibility.

## Prompt set

The production images were generated with a shared art-direction prompt and task-specific composition clauses:

> Premium Vietnamese digital wedding invitation asset in the “Nguyệt Bạch Ivory” quiet-luxury direction: warm ivory cotton paper, subtle blind embossing, very restrained champagne foil, mother-of-pearl details, white phalaenopsis orchid accents, elegant editorial restraint, realistic fine material texture, no people, no text, no letters, no names, no numbers, no logos, no watermark.

Transparent overlays, frames, ornaments and icons additionally required a clean alpha channel and no checkerboard. Cover and material backgrounds intentionally remain opaque. Frame centers are transparent so photos, maps, calendar UI and forms can remain dynamic.
