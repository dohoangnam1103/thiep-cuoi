# Full-artwork hero for art invitation templates

## Goal

Replace the shallow artwork strip at the top of the shared art invitation renderer with a tall, immersive hero. The artwork must surround the wedding date and couple names so the detailed portrait assets are visible instead of being cropped into a 180–260px strip.

## Scope

- Apply the change to all 18 templates rendered by `ArtInvitation`.
- Change only the opened invitation. Do not change the envelope or cover shown before opening.
- Keep the existing content order, one-column layout, portrait uploads, parallax background, and all invitation sections.
- Do not change template assets, manifest data, public copy, or editor capabilities.

## Chosen visual direction

Use the approved “full artwork” direction:

- The artwork fills a tall hero close to one viewport high.
- The wedding date, invitation label, and both couple names sit inside the artwork area.
- The image fades toward the theme's existing hero background near the lower portion. This protects text contrast for both light and dark themes without adding a fixed black overlay.
- The opening message remains directly below the names within the lower, quiet part of the hero.
- Couple portraits follow the hero unchanged and remain the primary personal imagery in the full invitation experience.

## Component design

The change belongs in `ArtworkHero` inside `src/components/chungdoi-tpl-art-invitation.tsx` so every art template receives the same structure and responsive behavior.

The current artwork strip and separate name block will become one positioned hero stage with `min-height: clamp(760px, 100svh, 1080px)`:

1. The theme's `heroClass` supplies the background color.
2. The artwork image fills the stage with `object-cover` and a centered focal point.
3. A reusable CSS mask keeps the artwork opaque through 42% of the stage, then fades it to transparency at 88%, before the lower text padding.
4. The date and `HeroNames` render above the image in the lower portion of the stage.
5. The opening message renders below the names, still inside the hero stage.
6. `HeroPortraits` remains after the stage with its existing sizing, ordering, and upload behavior.

No new component dependency or configuration property is required. Existing theme colors, image treatment, typography, and radius classes remain authoritative.

## Responsive behavior

- Mobile: the `760px` minimum leaves enough vertical space for the date, label, two names, separator, and opening message on short screens. Keep horizontal padding and balanced wrapping so long names do not overflow.
- Desktop: `100svh` provides the immersive target and the `1080px` maximum prevents an excessively long hero. The outer invitation column remains `900px` wide.
- The artwork uses `object-cover`; the mask ensures the name area remains readable even when the source image has strong detail near its center.
- The page must satisfy `document.documentElement.scrollWidth <= innerWidth` at a 390px viewport.

## Accessibility and motion

- Keep the decorative artwork `aria-hidden` with empty alt text.
- Preserve semantic heading levels and the existing readable DOM order.
- Preserve reduced-motion behavior for the existing hero and parallax animation.
- The CSS mask is decorative progressive enhancement. The base image uses reduced opacity for readable fallback; browsers that support masking restore full image opacity and apply the fade.

## Testing and verification

Automated checks:

- Add or update the shared renderer invariant test so the hero cannot regress to the shallow fixed-height strip.
- Run the template manifest unit tests, TypeScript checks, lint, production build, and `git diff --check`.

Visual checks:

- Verify at least one light theme and one dark theme on desktop and 390×844 mobile.
- Specifically verify `tho-cam-highland`, because it exposed the original crop problem.
- Confirm names remain legible, artwork does not cut through text, portrait uploads are unchanged, and there is no horizontal overflow.
- Scroll beyond the hero to confirm the existing fixed parallax artwork remains visible and moves independently from foreground content.
- Regenerate listing, portrait, and landscape previews for every affected template using `--no-sync-production`.

## Success criteria

- All 18 art templates show a tall artwork hero that visually surrounds the couple names.
- Substantially more of each portrait artwork asset is visible than in the previous 180–260px strip.
- Names and opening copy remain readable across light and dark themes.
- The envelope, portrait uploads, invitation sections, and editor behavior are unchanged.
- Desktop and mobile visual gates pass with no horizontal overflow or text collision.
