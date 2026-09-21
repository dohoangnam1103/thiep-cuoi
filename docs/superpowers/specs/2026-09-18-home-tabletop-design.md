# Home “Bàn Chọn Thiệp” Design Specification

## Objective

Redesign the public Home page as an exploratory tabletop for choosing a real digital wedding invitation. The page must feel tactile and unconventional while keeping the sales path obvious: browse a real template, open its demo, and start creating.

The featured template is **Minimalism Đỏ Đậm** (`minimalism-dark-red`). No fictional invitation may appear as the selected or purchasable product.

## Protected Product Behavior

- Keep the existing Home route, locale routing, authentication redirect, template preview, editor, publishing, and pricing behavior.
- Keep all user-facing copy in `messages/vi.json` through `next-intl`.
- Keep template route aliases and public URLs unchanged.
- Use `loginHref(TEMPLATE_LIST_PATH)` for signed-out creation CTAs and `TEMPLATE_LIST_PATH` for signed-in users.
- Reuse `TemplatePreviewModal` or the existing demo route; do not create inert preview controls.
- Do not change invitation data contracts, renderer behavior, database fields, RSVP behavior, or gift flows.

## Design Read

An art-directed e-commerce Home page for Vietnamese couples, using a tactile stationery-table metaphor, a warm editorial tone, and a restrained experimental layout.

- Design variance: 8/10
- Motion intensity: 6/10
- Visual density: 4/10
- Concept spine: artifact / collectible
- Signature components: off-grid tabletop, turning card arc, expandable selected specimen, pinned live-preview chapter rail
- Motion language: smooth selection expansion and restrained parallax drift

## Visual System

### Palette

| Role | Value | Use |
| --- | --- | --- |
| Paper | `#F3EBDD` | Primary background and tabletop |
| Cream | `#ECE4D8` | Text and surfaces on burgundy |
| Burgundy | `#511419` | Featured template, strong chapters, footer |
| Deep burgundy | `#380A0E` | High-contrast depth |
| Forest | `#174D3B` | Navigation, selection state, secondary actions |
| Butter | `#F2D37A` | Final conversion CTA only |
| Ink | `#221B18` | Body copy |

### Typography

- Display: reuse the project’s established editorial serif or an existing local face with Vietnamese glyph coverage.
- Body/UI: reuse the existing sans-serif stack.
- Do not add a network font.
- Display headings use 2–3 lines maximum on desktop and 3–4 lines on mobile.

### Shape and Surface

- Cards are portrait invitations with paper texture and modest 2–8 degree rotations.
- UI controls remain flat and readable; they do not imitate scraps of paper.
- Corners stay square or lightly rounded. Do not use pill containers for every control.
- Shadows communicate a card lifting from the table; decorative shadows must not be baked into real template previews.

## Section Inventory

### 1. `tabletop-hero`

**Purpose:** Communicate the product immediately and let visitors select a real invitation.

**Required data:** Featured template record for `minimalism-dark-red`, creation URL, demo URL, first four supporting template records.

**Owner:** `HomeTabletopHero`.

**Assets:**

- `/chungdoi/images/home-tabletop/surface-paper.webp`
- `/chungdoi/images/home-tabletop/prop-clips.webp`
- `/chungdoi/images/home-tabletop/prop-pencil.webp`
- `/chungdoi/images/home-tabletop/prop-notes.webp`
- `/chungdoi/images/template-previews/en/portrait/minimalism_darkred.webp`
- Supporting cards use existing `templates[].portrait` values.

**Desktop:** Overhead tabletop. The selected Minimalism Đỏ Đậm card occupies the visual center. Supporting cards sit around it without covering the headline or selected-card controls.

**Tablet:** Three cards remain visible; decorative props reduce in scale and opacity.

**Mobile:** One selected card plus a horizontal thumbnail row. No overlapping cards outside the viewport.

**Interaction:** Template buttons use `aria-pressed`. Selecting a card updates name, image, demo URL, and create action. Hover only adds lift; all actions work by click and keyboard.

**Reduced motion:** Selection swaps without rotation/parallax; opacity transition only.

**Empty/error:** If a supporting template is missing, omit it. If the featured record is missing, render the first available real template and log no user data.

### 2. `style-gallery`

**Purpose:** Show breadth using real catalog items and move visitors to the full listing.

**Required data:** Four to six template records, category labels, template route overrides.

**Owner:** `HomeStyleGallery`.

**Assets:** Existing `portrait` preview paths only. Minimalism Đỏ Đậm appears first and carries the selected underline.

**Desktop:** Four large staggered specimens with names below.

**Mobile:** Horizontal snap list with one complete card and part of the next card visible.

**Interaction:** Category filters are real buttons. Filtering preserves focus and never produces an empty decorative card.

### 3. `live-preview`

**Purpose:** Prove that the product is a full digital invitation rather than a printed-card storefront.

**Required data:** Minimalism Đỏ Đậm demo route and preview assets.

**Owner:** `HomeLivePreview`.

**Assets:**

- `/chungdoi/images/template-previews/en/listing/minimalism_darkred.webp`
- `/chungdoi/images/template-previews/en/landscape/minimalism_darkred.webp`
- Existing envelope assets from the template renderer.

**Desktop:** Burgundy pinned chapter with a tall preview window and chapter rail: envelope, story, wedding details, RSVP.

**Mobile:** No pinning. Render a compact preview crop followed by the chapter list and demo CTA.

**Interaction:** Demo CTA opens the real demo route. The preview crop may scrub within the listing image, but never simulates working invitation controls.

### 4. `creation-steps`

**Purpose:** Explain the product in three clear actions.

**Required data:** Existing creation URL and three translated steps.

**Owner:** `HomeCreationSteps`.

**Assets:** Real Minimalism Đỏ Đậm envelope and portrait preview. Name-entry slip is HTML, not a generated image.

**Desktop:** Diagonal sequence: enter names → open envelope → finished invitation.

**Mobile:** Vertical sequence with a continuous forest line.

**Interaction:** Only the final CTA navigates. Form fields shown here are illustrative and must not accept input unless connected to editor state.

### 5. `guest-experience`

**Purpose:** Explain personalized guest links and RSVP management.

**Required data:** Existing translated guest-management copy and guests route behavior.

**Owner:** `HomeGuestExperience`.

**Assets:** `/chungdoi/images/rsvp-showcase.png` plus a small existing Minimalism Đỏ Đậm preview crop.

**Desktop:** Pistachio/forest diptych. Product imagery on the left; copy and link on the right.

**Mobile:** Product imagery first, then a forest copy panel.

**Interaction:** CTA links to the existing guest-management explanation or creation flow. No fake RSVP counters are generated.

### 6. `closing-cta`

**Purpose:** Close the sales narrative with a single creation action.

**Required data:** Creation URL and translated trial note.

**Owner:** `HomeClosingCta`.

**Assets:** Minimalism Đỏ Đậm landscape/portrait preview crops only.

**Desktop:** Burgundy field, large cream headline, butter CTA, invitation artwork bleeding from the lower right.

**Mobile:** Headline and CTA first; preview crop below. Footer links remain fully visible.

## Responsive Rules

- Desktop reference viewport: 1440×900.
- Tablet verification: 768×1024.
- Mobile verification: 390×844 and 320×568.
- All section copy stays inside a centered container with at least 24px mobile padding.
- Hero content and the primary CTA must fit inside the initial 100svh at 1440×900 and 390×844.
- Major section rhythm uses `clamp(72px, 10vw, 140px)` unless a pinned section requires a separate measured height.
- Template preview aspect ratios are preserved. Cropping is allowed only inside explicitly sized preview windows with `object-fit: cover`.

## Accessibility and Performance

- Selection controls are buttons with names, selected state, focus rings, and keyboard support.
- Decorative props use empty alt text and `aria-hidden`.
- Real invitation previews use template names as alt text.
- Respect `prefers-reduced-motion` and disable parallax, rotation animation, and pinned scrubbing.
- Load the hero’s selected preview eagerly; lazy-load lower-section media.
- Provide intrinsic dimensions or `fill` containers with stable aspect ratios to prevent CLS.
- Decorative props must be hidden below 768px when they crowd tap targets.

## Acceptance Criteria

- Minimalism Đỏ Đậm is the default selected template and its real artwork is visibly recognizable.
- No fictional template, couple, price, metric, or testimonial is presented as product data.
- Every visible action navigates or changes a real state.
- Desktop users can select supporting cards without losing CTA context.
- Mobile users can reach the selected card, demo CTA, and create CTA without overlapping content.
- Existing authentication redirects and template routes still work.
- Lint, typecheck, targeted component tests, targeted E2E, and local build pass.
- Visual captures exist for desktop, tablet, 390px, and 320px with reduced-motion state checked.

## Reference Images

The six concept files under `docs/research/home-tabletop/concepts/` define composition only. Generated copy and incidental decoration inside them are not source-of-truth content. Runtime implementation must use real catalog data and the assets listed above.
