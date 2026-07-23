# Dashboard Template-Themed Invitation Cards

**Date:** 2026-07-23

## Goal

Give every invitation on `/dashboard` a full-width row whose visual identity reflects the template selected by its owner. The treatment should feel spacious and recognizable without reducing readability or turning the dashboard into a collection of miniature invitation pages.

## Scope

- Change the invitation list from a two-column grid to one invitation per row.
- Derive each row's colors and decorations from its `templateId`.
- Preserve all current invitation information and actions.
- Keep the result readable and compact on mobile.
- Preserve the current neutral card as a fallback for templates without visual configuration.

This work does not change invitation data, actions, payment behavior, routing, or the dashboard page background.

## Visual Direction

Use a restrained interpretation of the selected template rather than placing a full preview image behind the content.

Each invitation row has three visual layers:

1. A theme-derived background using the template's configured background or primary color treatment.
2. One or two representative decoration images placed at opposite edges with low opacity and `pointer-events: none`.
3. A translucent readable content surface that separates text and controls from the decorative layer.

The content surface uses the template's configured text and accent colors when they maintain adequate contrast. Status colors retain their semantic green/amber treatment. Decorations remain subordinate to content and become only slightly clearer on desktop hover.

## Layout

### Desktop

- The list is a single column within the existing `max-w-5xl` page container.
- Each invitation is one wide row.
- The information region occupies the left side:
  - couple names or template fallback label;
  - template name when couple names exist;
  - publication status;
  - RSVP and wish counts.
- The action region sits on the right and wraps only when necessary.
- Primary actions such as viewing the published invitation or paying remain visually stronger than supporting actions.

### Mobile

- The row becomes a vertical card.
- Information appears first and actions appear below it.
- Actions wrap into comfortable tap targets.
- Decorations are smaller and more transparent so they do not compete with controls.
- The card remains one invitation per row at every breakpoint.

## Architecture

Create a focused dashboard invitation-card component rather than expanding the server page's map body.

The component receives the invitation data already loaded by the page. It resolves a presentation object from `templateId` using `chungdoiThemeConfig`:

- background;
- card background/content surface;
- text colors;
- accent/button colors;
- up to two suitable decoration image paths.

A small resolver normalizes the theme into safe dashboard styles. It must not reuse decoration positioning classes from invitation templates because those classes are designed for narrow invitation canvases and can contain incompatible transforms or oversized dimensions. The dashboard card supplies its own fixed edge positions and sizing.

The dashboard page remains responsible for authentication, querying Prisma, and rendering the list. The card component remains responsible only for presentation and links.

## Fallback Behavior

If `templateId` has no entry in `chungdoiThemeConfig`, use the existing neutral appearance:

- `bg-card`;
- standard foreground/muted colors;
- no decoration images;
- existing primary and secondary button tokens.

Missing or invalid decoration paths are omitted without affecting the card content.

## Accessibility and Interaction

- Decorative images have empty alt text and `aria-hidden`.
- Decorative layers use `pointer-events-none` and cannot block links.
- Text and controls remain above decorations in the stacking order.
- Focus states remain visible.
- The card does not use continuous animation.
- Hover effects are enhancements only and do not convey required information.
- Contrast is protected by the translucent content surface rather than assuming every template background is readable.

## Verification

Verify the feature with:

1. A dashboard test confirming the invitation list remains one column at desktop width.
2. A themed-template fixture confirming the card exposes the expected theme/background and decorations for its `templateId`.
3. An unknown-template fixture confirming the neutral fallback.
4. Mobile browser verification confirming content and actions do not overlap decorations and tap targets remain usable.
5. Lint, typecheck, and a production build.

## Success Criteria

- Every invitation occupies a separate full-width row.
- A user can visually associate a row with the selected invitation template.
- All labels, counts, states, and actions remain present and usable.
- Decoration never blocks content or interactions.
- Unknown template IDs render safely with the current neutral design.
