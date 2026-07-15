# Template Source Parity Design

## Goal

Restore visual and structural parity with the original Chungdoi invitations for all 17 templates currently routed through `SourceMatchedInvitation`, beginning with `boho-floral-pink` (`hoa-moc-hong`). Parity covers the full invitation: composition, typography, decorative assets, section order, and responsive behavior. Existing invitation functionality and customizable data must continue to work.

## Root Cause and Scope

`ChungDoiDemo` currently gives these slugs priority through `SOURCE_MATCHED_TEMPLATE_SLUGS`:

- `boho-floral-green`
- `boho-floral-pink`
- `boho-floral-brown`
- `spring-garden-red`
- `spring-garden-green`
- `spring-garden-blue`
- `elegant-leaf-green`
- `jasmine-white`
- `silk-flora-brown`
- `hoa-tinh-red`
- `minimalism-red`
- `brocade-flower-red`
- `crystal-floral-blue`
- `baroque-gold`
- `glass-garden-green`
- `chibi-red`
- `cherry-blossom-pink`

The shared renderer reduces visually unrelated templates to a small collection of generic heroes and a common floral body. This loses template-specific layers, portrait treatments, typography, section composition, and responsive positioning. Ten templates already have dedicated component files but are bypassed; seven rely only on temporary logic in the generic renderer. Existing tests verify that isolated assets or headings exist, not that the rendered invitation matches the source composition.

## Architecture

### Dedicated renderers

`ChungDoiDemo` will dispatch each of the 17 slugs directly to a dedicated invitation renderer. `SOURCE_MATCHED_TEMPLATE_SLUGS` and `SourceMatchedInvitation` will be removed from the render path.

Each dedicated renderer owns its template's:

- hero and portrait composition;
- section ordering and wrappers;
- typography and color system;
- background and decorative asset layers;
- image crop, opacity, mirroring, and rotation;
- desktop and mobile positioning;
- placement of shared interactive features.

The ten existing dedicated components will be audited against the live source and corrected rather than assumed accurate. Dedicated renderers will be added for the remaining seven templates.

### Shared behavior, not shared visual composition

Reusable interactive and formatting primitives remain in `chungdoi-tpl-shared.tsx`, including:

- lightbox behavior;
- date and calendar formatting;
- Google Calendar links;
- maps;
- family data rendering where structurally appropriate;
- wish form and wish entries;
- gift envelope;
- shared low-level formatting utilities.

A renderer may compose these primitives differently, but a shared visual base must not determine the invitation's overall layout. `chungdoi-tpl-floral-base.tsx` remains available only to templates that genuinely share its composition; it will not render any of the audited 17 templates.

## Data and Image Behavior

The current `ChungDoiDemoContent` remains the sole content contract. No Prisma migration or editor fields are introduced.

For templates with two separate hero portraits:

- `gallery[0]` supplies the first portrait;
- `gallery[1]` supplies the second portrait;
- portrait assignment follows the source template's bride/groom order;
- a missing image hides only its slot while preserving the surrounding composition;
- the album continues to contain the full gallery in source order.

This deliberately couples hero portraits to the first two album images, as selected for this project.

All decorative assets are local files under `public/chungdoi/images/themes`. Each renderer references the exact assets needed by its source design. If an asset visible on the public source is missing locally, the exact public source asset will be downloaded into the corresponding local theme directory. Runtime hotlinking to Chungdoi or its CDN is not allowed.

## Source Inspection and Reconstruction

Each template follows the same reconstruction procedure:

1. Open the original invitation and dismiss/open its envelope state.
2. Inspect the full invitation at desktop `1440×1000` and mobile `390×844`.
3. Record section order, key bounding relationships, typography, backgrounds, and visible asset layers.
4. Map source asset URLs to local files and acquire only missing source assets.
5. Implement or correct the dedicated renderer.
6. Compare the clone against the original at both viewports.
7. Confirm that customized content and shared interactions remain usable.

`boho-floral-pink` is implemented first as the reference workflow. The remaining templates may be inspected in visual families for efficiency, but their renderers remain independent.

## Functional Preservation

The reconstructed templates retain all applicable product features:

- customizable couple and family information;
- ceremony and reception information;
- gallery and lightbox;
- map;
- schedule;
- wish form and wish list;
- gift envelope and bank data;
- calendar integration.

These features are placed according to each source template's section order and visual composition. User data is not discarded merely because a particular source demo has an empty field.

## Missing and Partial Data

Renderers trust the typed internal content contract. Optional user content is handled at its natural boundary:

- missing portrait images omit their image slots;
- an empty gallery omits the album;
- empty map, schedule, wish, or bank data omits the corresponding section according to existing product behavior;
- decorative assets are required static dependencies and must exist before a renderer is considered complete.

No fallback generic invitation is used for an audited slug because it would conceal parity regressions.

## Testing

### Automated coverage

Tests will verify that:

- every audited slug dispatches to its own renderer;
- each renderer exposes one or more unique identifying assets or structural markers;
- source-specific hero portraits render from the first two gallery images where applicable;
- key section ordering matches the source template;
- album/lightbox, map, schedule, wish, and gift features remain present when data exists;
- mobile and desktop builds type-check and compile.

Tests must not claim visual parity merely because a single asset or heading exists. Structural assertions should target distinguishing composition and order.

### Visual comparison

During implementation, each template is compared in a browser with the original at desktop and mobile viewports. Visual inspection guides implementation but is not the final automated delivery gate. Per the project's established preference, the final handoff requires a passing production build, and the user performs final UI approval.

## Completion Criteria

A template is complete when:

- its main composition matches the original;
- typography and color hierarchy are source-appropriate;
- all characteristic decorative layers are present and positioned responsively;
- section ordering matches the original;
- the first two gallery images populate separate hero portraits where required;
- interactive shared features work with customized content;
- no audited slug falls back to a generic renderer;
- relevant tests and the production build pass.

The overall task is complete only after all 17 templates satisfy these criteria.

## Change Safety

The working tree already contains extensive unrelated modifications. Implementation must edit only files required by this work, preserve existing user changes, and avoid reset, restore, or broad staging commands. No commit, push, pull request, or deployment is performed unless explicitly requested.
