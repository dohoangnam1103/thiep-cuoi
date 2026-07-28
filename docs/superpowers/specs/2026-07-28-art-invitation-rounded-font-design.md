# Rounded cards and themed display fonts for art invitations

## Goal

Soften the 18 shared art invitation templates by replacing harsh square content frames with consistent 24px corners and assigning an intentional display-font treatment to every theme.

## Approved direction

- Use a universal `24px` radius for content cards, event cards, bordered portrait/album frames, maps, wish cards, and QR surfaces.
- Keep control geometry separate: buttons, calendar-day highlights, and small interactive controls retain their existing theme radius so the interface does not become uniformly pill-shaped.
- Use calligraphy as the dominant display language.
- Apply the themed display font only to couple names and meaningful invitation headings. Long messages, addresses, times, form fields, and other body copy keep the existing readable sans-serif treatment.
- Preserve the full-artwork hero, one-column layout, content order, parallax, editor behavior, and all existing sections.

## Radius architecture

`contentRadiusClass` in `src/components/chungdoi-tpl-art-invitation.tsx` becomes the single card/frame radius contract and always returns `rounded-[1.5rem]`.

The shared renderer uses this class for:

- couple portrait frames;
- ceremony and reception event cards;
- calendar, timeline, map, dress-code, wish, and QR containers;
- bordered album tiles rendered by the shared gallery.

`AlbumGallery` and `GiftQrGrid` receive an optional `radiusClass` prop with their current radius as the default. `ArtInvitation` passes `rounded-[1.5rem]`; every older renderer that omits the prop keeps its current appearance.

`config.radiusClass` remains available only for small controls whose shape is part of a theme, including buttons and the highlighted calendar day. This separation prevents the seven currently square themes from reintroducing square cards while preserving meaningful control styling.

## Display-font architecture

Add `displayFontClass` to `ArtInvitationConfig`. Each thin template wrapper provides one explicit class from the existing local font library. A pure `resolveDisplayFontClass(fontFamily, fallbackClass)` helper maps known editor font families to the same global utility classes and otherwise returns the template class. This makes a supported user override authoritative without introducing inline styles.

The shared renderer combines the resolved class with:

- both couple-name headings in `HeroNames`;
- major section headings rendered by `SectionHeading`;
- ceremony and reception labels in `EventCard`;
- family-side and calendar headings that do not pass through `SectionHeading`.

Body paragraphs and form controls do not inherit `displayFontClass`.

Global font utility classes live beside the existing `@font-face` declarations in `src/app/globals.css`. No new font download or third-party dependency is required. Every selected local font has full Vietnamese glyph coverage according to its font charset metadata.

## Approved font mapping

| Template | Display treatment | Manifest font family |
|---|---|---|
| `dong-ho-folk` | UNI traditional lettering | `UNI Chu truyen thong` |
| `tho-cam-highland` | hand-brushed highland lettering | `SVN-HC Haydon Brush` |
| `son-mai-lacquer` | soft lacquer editorial script | `DFVN New Eddy` |
| `bat-trang-blue` | ceramic calligraphic serif | `Fz Qellia` |
| `hang-trong-folk` | rounded Vietnamese display script | `Pattaya` |
| `sen-monoline` | fine monoline script | `1FTV VIP Signora` |
| `truc-chi-minimal` | quiet handmade-paper serif | `Lora` |
| `long-phung-deco` | ornamental Vietnamese calligraphy | `Fz Aghita` |
| `ao-dai-hue` | airy formal script | `The Nautigal` |
| `art-deco-gatsby` | geometric titling exception | `SVN-HC Built Titling` |
| `celestial-map` | light celestial script | `Alex Brush` |
| `coastal-mediterranean` | relaxed coastal script | `SVN-HC Pacifico` |
| `swiss-brutalist` | softened modernist exception | `HelveticaNeue` |
| `riso-duotone` | playful print-display exception | `SVN-HC Marvin Visions` |
| `cinema-credit` | uppercase Lora with cinematic tracking | `Lora` |
| `aurora-glass-dark` | oversized airy Alex Brush | `Alex Brush` |
| `y2k-chrome` | uppercase Marvin chrome treatment | `SVN-HC Marvin Visions` |
| `botanical-lavender` | botanical Signora script | `1FTV VIP Signora` |

Four modern themes intentionally use non-calligraphic or hybrid treatments to preserve their subject: Art Deco, Swiss, Riso, and Y2K. Reused font families receive distinct size, case, and tracking treatments, so all 18 wrappers still have an explicit theme-specific display configuration rather than a generic `font-sans` or `font-serif` fallback.

## Manifest, editor, and social-image consistency

- Update each art-template manifest's `fontFamily` to the approved mapping. This keeps the closed envelope, generated demo content, theme registry, and editor default aligned with the opened invitation.
- Run `npm run templates:register` rather than editing generated registries by hand.
- Extend `FONT_FILE_BY_FAMILY` in `src/lib/og-image.ts` for every selected local family so published social images use the same font instead of silently falling back to Lora.
- Keep the user's editor font override behavior unchanged. The mapped font is the template default; a supported user-selected family is resolved to its font utility and remains authoritative in the opened invitation.

## Responsive and accessibility requirements

- Display fonts must keep Vietnamese diacritics intact and must not clip at mobile widths.
- Couple names remain balanced and fit within the 390px viewport without horizontal scrolling.
- Long headings may wrap to two balanced lines; body copy remains unchanged and readable.
- A 24px radius must not cause borders or artwork to cross text or crop QR codes.
- Decorative artwork retains empty alt text; meaningful images and existing heading semantics remain unchanged.

## Testing and verification

Automated checks:

- Add source invariants asserting that `contentRadiusClass` returns `rounded-[1.5rem]` and no square-card exception remains.
- Assert all 18 wrappers declare a theme display class and no longer use generic `font-sans` or `font-serif` in `coupleClass` or `headingClass`.
- Assert every approved manifest font family resolves to an existing local font file for Open Graph rendering.
- Unit-test `resolveDisplayFontClass` for a template default, a supported editor override, and an unknown-family fallback.
- Run registrar, typechecks, unit tests, lint, production build, and `git diff --check`.

Visual checks:

- Verify `tho-cam-highland` at the event-card section shown in the supplied screenshot.
- Verify one light romantic theme, one heritage theme, and the four modern exceptions on desktop and 390×844 mobile.
- Confirm 24px corners on cards and frames, no clipped text/QR/media, and visually distinct display typography.
- Regenerate listing, portrait, and landscape previews for all 18 templates with `--no-sync-production`.

## Success criteria

- No large card or bordered media frame in the 18 art templates has a square or 2–3px corner.
- All large card/frame corners render at 24px.
- Every template uses its approved display treatment for names and headings while body text remains easy to read.
- Envelope, opened invitation, editor default, and Open Graph font selection agree for each template.
- Desktop/mobile visual gates and all automated checks pass without changing invitation functionality.
