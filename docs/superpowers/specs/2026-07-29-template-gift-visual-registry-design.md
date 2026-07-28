# Template Gift Visual Registry Design

## Goal

Restore the source-specific wedding gift illustration for every cloned Chung Đôi
template that currently falls back to the shared red `囍` envelope. Song Long Xanh
is the confirmed regression: the source uses two crossed green dragon envelopes,
while the clone renders the generic procedural red envelope.

The change must preserve the existing gift QR modal, bank data, accessibility, and
the surrounding invitation sections.

## Scope

- Audit every cloned template that renders `GiftEnvelope` against its Chung Đôi
  source demo.
- Give every audited clone an explicit gift visual configuration. A source clone
  must never rely on the generic fallback implicitly.
- Migrate the existing Chateau Green, Glass Garden Green, and Cherry Blossom Pink
  image variants into the same registry.
- Store source assets locally and document their provenance.
- Preserve the generic procedural red envelope only for templates created locally
  without a source-specific visual.

This work does not change bank accounts, QR generation, gift modal content, wish
forms, or unrelated invitation sections.

## Source Audit

For each cloned template, record the following from the live source demo:

1. Source URL and template slug.
2. Main gift artwork asset URL or URLs.
3. Layer count and order.
4. Relative placement, mirroring, rotation, shadow, and animation.
5. Sparkles or decorative layers.
6. Section-level background artwork when it is part of the gift presentation.

The audit result becomes the evidence for the registry entry. If two source
templates intentionally share an asset, both still receive explicit registry
entries so that sharing is deliberate rather than a fallback side effect.

## Architecture

Create `src/data/chungdoi-gift-visuals.ts` as the single source of truth for cloned
template gift presentations. It exports:

- A discriminated `GiftVisual` union.
- A registry keyed by template slug.
- A resolver that distinguishes an explicit source-clone entry from the generic
  local-template fallback.
- A list or predicate used by tests to require registry coverage for cloned
  templates.

The visual union supports these composition families:

- `layered-image`: one or more locally stored images composed as layers. This
  covers Song Long Xanh's crossed envelopes and similar source artwork.
- `giftbox`: a central gift-box image plus optional orbiting mini decorations.
- `procedural`: the existing CSS-built red `囍` envelope, available only through
  an explicit local-template fallback.

Each image layer declares a public asset path and static class names for layout,
transform, shadow, and animation. Static class names keep the configuration
compatible with Tailwind scanning and avoid new inline styles.

`GiftEnvelope` receives `templateSlug` and resolves the visual through the
registry. It continues to own:

- Open and closed state.
- Body scroll locking.
- The accessible open button.
- The QR modal and close behavior.
- Shared hint and reduced-motion behavior.

The invitation renderer remains responsible for its overall section placement.
Optional section presentation classes from the gift visual configuration may be
applied by `GiftEnvelope` when the source gift block includes a distinctive
background.

## Asset Layout and Provenance

New assets live under:

`public/chungdoi/images/giftbox/<template-slug>/`

Song Long Xanh stores its source envelope artwork as:

`public/chungdoi/images/giftbox/double-dragon-green/double_dragon_green.webp`

Assets are downloaded into the repository rather than hotlinked. Every source is
added to `docs/research/asset-provenance.md` with the source template URL and the
original asset URL.

## Rendering and Failure Behavior

1. A template renderer passes `content.slug` to `GiftEnvelope`.
2. The resolver returns the explicit `GiftVisual` entry for a cloned template.
3. The shared renderer creates the configured image layers and decorations.
4. Clicking the presentation opens the unchanged QR modal.

An optional decorative layer may hide itself if its image fails to load. The main
artwork is not allowed to fail silently: registry and asset-contract tests must
reject missing main assets before production. A cloned template without an
explicit registry entry is a test failure and must not render the red fallback by
accident.

## Song Long Xanh Reference Result

The Song Long Xanh gift button renders two instances of the local
`double_dragon_green.webp` asset:

- Back envelope: mirrored and rotated to the left.
- Front envelope: rotated in the opposite direction and placed above the back
  layer.

The composition retains the source sparkles, shadows, green/linen palette,
bilingual heading and hint, and double-dragon section texture where visible in
the source.

## Testing

Follow red-green-refactor for the implementation.

1. **Registry coverage test**
   - Every audited cloned template has an explicit registry entry.
   - No audited clone resolves to `procedural` through fallback.

2. **Asset contract test**
   - Every configured asset path starts with `/`.
   - Every configured asset exists below `public/`.
   - Every `layered-image` entry has at least one required main layer.

3. **Song Long Xanh regression test**
   - The resolved visual uses the local double-dragon-green artwork.
   - It defines exactly two required envelope layers in the correct order.

4. **Existing custom visual regression tests**
   - Chateau Green and Glass Garden Green retain their gift-box assets.
   - Cherry Blossom Pink retains its photo-envelope composition.

5. **Project verification**
   - Run focused unit tests first.
   - Run typecheck and lint.
   - Run the production build.
   - Inspect every affected template at desktop and mobile widths.
   - Compare Song Long Xanh directly with the source demo.

## Acceptance Criteria

- Song Long Xanh no longer renders the generic red `囍` envelope.
- Its gift illustration matches the two-envelope green source composition.
- Every cloned template in the audit has an explicit visual registry entry.
- Existing source-specific gift illustrations remain intact after migration.
- Missing registry entries or required assets fail automated tests.
- Gift modal behavior and QR data are unchanged.
- Typecheck, lint, build, focused tests, and browser verification pass.
