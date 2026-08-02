# Forest Wedding Journey Lab Design

## Status and purpose

- Date: 2026-08-02.
- Status: experience direction, visual language, dynamic scene model, interaction model, content surfaces, delivery boundary, and quality strategy approved in conversation.
- New private lab route: `/lab/forest-wedding-journey` under the localized App Router.
- Existing `/lab/dalat-journey`, `/lab/flow-demo`, published templates, editor behavior, and database flows remain unchanged during the lab phase.
- Goal: prove a reusable three-dimensional wedding-invitation journey set in a quiet outdoor forest ceremony before connecting the experience to real invitation data and writes.
- Delivery is deliberately split into two phases:
  1. a complete lab with representative local demo content and local-only interactions;
  2. editor, published-invitation, RSVP, wishes, map, and gift integration only after the lab is visually and technically approved.

The lab is not a continuation of the Hội An, Đà Nẵng, Huế, or Đà Lạt art directions. It is an independent bright forest-wedding world that may reuse the proven journey runtime contract without inheriting the Đà Lạt scene.

## Reference and originality

The user-provided image at `/Users/namdo/Documents/723137482_1882634189078434_5633222113408269822_n.jpeg` is a visual-direction reference only. It establishes:

- a dense, dark-green tree backdrop;
- soft daytime light under a canopy;
- white, ivory, cream, and pale-green wedding materials;
- understated tables, lamps, flowers, fabric, and grass;
- white petals moving gently through the foreground;
- an elegant outdoor wedding rather than fantasy, fog, or nocturnal magic.

The reference contains a visible studio mark and must not be copied, bundled, traced, texture-sampled, or shipped. All production geometry, textures, fallback images, animations, and visual compositions must be original or properly licensed, with provenance recorded when required.

## Product decisions

The experience is a guided first-person walk through one continuous forest preparing for a wedding.

- The camera represents the viewer's eyes. There is no avatar, joystick, weapon, game HUD, pointer lock, or free roaming.
- The viewer advances with vertical swipe, mouse wheel, keyboard, or persistent Previous/Next buttons.
- Every accepted navigation action triggers one finite authored camera travel, then stops automatically at the next scene.
- At rest, the viewer may look horizontally up to `±20°` and vertically up to `±8°`.
- The horizon remains level. There is no head bob, camera roll, or inertial drift.
- Content belongs to physical objects in the world. Unexplained floating cards are prohibited.
- Each enabled invitation feature owns a distinct semantic scene.
- The scene count is data-driven rather than fixed. Missing or disabled features create no empty scenes.
- Each selected journey photograph becomes its own gallery-photo checkpoint on a large wooden easel placed directly on grass.
- The forest remains in soft daytime throughout. It does not evolve into fog, night, or fantasy lighting.
- White rabbits and doves are restrained narrative actors. They guide attention and mark transitions without becoming continuous visual noise.
- White petals remain sparse during rest and briefly become denser during authored arrival or departure cues.

## Experience opening

The required opening scene is a floral gate in a forest clearing.

- The camera begins about `4–5m` in front of the gate.
- The gate is slender, airy, and slightly asymmetrical, using white and ivory flowers, pale greenery, and visible natural structure.
- A translucent ivory voile hangs in the center and carries the couple's names, an ampersand, the reception date, and a native `Bước vào` button.
- The voile has physical thickness and subtle transmission. It moves very slightly at rest but remains readable.
- Two doves perch above the gate. A pair of white rabbits rests near the edge of the grass.
- Activating `Bước vào` draws the voile gently toward the top of the gate, moves leaves and flowers through a short wind cue, launches the two doves, and releases a modest foreground petal gust.
- The camera travels through the opened gate and settles at the first enabled content scene.
- One rabbit may make a short authored move toward the next patch of grass to suggest a guide. It does not loop continuously.
- Entry is the only explicit start action. The gate cannot become an autoplay splash that advances without consent.

## Dynamic scene model

### Semantic scene types

The lab supports this ordered scene vocabulary:

1. `cover-gate` — required names, date, and entry threshold.
2. `families` — both families' parent names, titles, and addresses in one balanced clearing.
3. `opening-message` — the formal invitation or ceremony wording.
4. `calendar` — wedding date, time, ceremony date when distinct, and add-to-calendar affordance.
5. `schedule` — ordered wedding-day events.
6. `gallery-photo` — one scene per selected journey photograph.
7. `dress-code` — enabled only when dress-code colors exist.
8. `venue` — venue name or address and banquet time.
9. `map` — map or directions as an independent interactive scene.
10. `rsvp` — attendance confirmation form.
11. `wishes` — existing wishes and a guestbook input.
12. `gift` — optional bride/groom gift or bank details.
13. `finale` — required completed ceremony clearing and thank-you state.

Music is a global invitation control, not a forest scene. Audio lifecycle and editor integration are out of scope for the first lab.

### Scene generation rules

A pure scene builder converts invitation-shaped content and feature flags into an immutable ordered scene definition.

- `cover-gate` and `finale` always exist.
- Optional scenes exist only when the feature is enabled and enough valid data is present.
- `families` is one scene even though it contains two family sides.
- `venue` and `map` remain separate because they represent different tasks: reading the address and initiating navigation.
- Every selected curated gallery image creates one stable `gallery-photo:<media-id>` scene.
- The initial lab uses a bounded representative photo set. Future editor integration must make journey-photo selection explicit rather than automatically turning an unbounded album of up to 30 images into a 30-stop walk.
- Scene IDs remain stable when unrelated optional features are toggled.
- Removing a scene reconnects the authored path between its previous and next surviving neighbors; it never leaves a blank stop.
- Bride/groom presentation follows the invitation's `brideFirst` setting consistently in family and gift content.
- The builder returns semantic scene data, camera anchors, world-placement slots, asset groups, and fallback metadata. It contains no React components.

### Spatial continuity

The generated scene list is arranged along one gently curving grass path.

- Vegetation and bends hide upcoming areas so the forest feels continuous rather than like adjacent display booths.
- Scenes alternate their dominant object between the left and right side of the path while keeping required content within the free-look range.
- Camera rails and scene anchors come from reusable placement recipes, then are resolved for the generated scene count.
- No teleport, dissolve-to-unrelated-location, or panoramic cut occurs in normal motion.
- Returning with Previous follows the corresponding authored reverse path and restores the correct scene state.

## Scene art direction and content surfaces

### Families

- Two white-clothed tables sit symmetrically on opposite sides of a clearing.
- Parent titles, names, and addresses appear on ivory paper pieces or cloth fronts attached to the tables.
- The scene reads as two families preparing one event, not two competing cards.

### Opening message

- A large opened invitation envelope rests on a flower table.
- The invitation wording is printed on physical paper with short line lengths.
- Longer localized copy may scroll inside the paper surface without moving the camera.

### Calendar and schedule

- The calendar is a large paper sheet on a wooden easel with a small physical-looking add-to-calendar control.
- The schedule uses individual place cards arranged along a long table, preserving order and time labels.
- Ceremony and reception dates remain distinguishable when both exist.

### Gallery-photo path

- Each selected image is printed at approximately `70 × 100cm` on a large light-oak easel set directly on grass.
- The print has a thin ivory edge, physical thickness, and a material response that remains readable under soft light.
- No table supports the photograph and no paragraph overlays it.
- A low wildflower cluster and a few settled petals may sit near the easel feet.
- Easels alternate sides and vary distance, vegetation, and composition so repeated photo scenes do not feel cloned.
- The camera settles roughly `2–3m` from each print at an authored viewing angle.

### Dress code

- Realistic fabric swatches, ribbons, or voile strips hang from a slender wooden rack.
- Colors come directly from invitation data and include a textual label for accessibility.

### Venue and map

- Venue information appears on a wooden venue sign and an ivory address card.
- The map is laid flat or gently tilted on a separate large table.
- `Chỉ đường` is a native interactive control visually attached to that table.
- Map failure leaves the full textual address and external directions action available.

### RSVP

- The form is presented as a reception ledger or clipboard on a white-clothed welcome table.
- Name, attendance, party size, food notes, and private notes are included only when supported by the eventual integration contract.
- In the lab, submission is local and demonstrative. It performs no database write.
- Touching or typing in the form cannot trigger camera navigation.

### Wishes

- An open guestbook provides name and message inputs.
- Existing sample wishes appear as separate paper notes around the book, not as floating speech bubbles.
- In the lab, submission is local and demonstrative. Typed content survives a recoverable submission simulation error.

### Gift

- Bride and groom gift details use separate physical envelopes while respecting `brideFirst` ordering.
- Details remain closed until explicitly requested.
- Invalid, empty, or owner-mismatched bank data produces no gift scene.
- QR and account data must remain legible and selectable in the future integrated phase.

### Finale

- The final clearing shows the outdoor ceremony setup completed: restrained seating, flowers, voile, and a central wedding focal point.
- Doves may perform one final authored departure and petals may briefly increase.
- The final state remains settled and explorable. It does not auto-exit, reload, or return to the gate.

## Three-dimensional environment

The main experience must not be a flat panorama with UI layered over it.

### Near field: `0–8m`

- Sculpted terrain with subtle height variation, grass path edges, soil, moss, and roots.
- Separately transformed three-dimensional grass clumps.
- Wildflower assemblies with distinct stems, leaves, and flower heads at hero locations.
- Individual tree trunks, branches, canopy clusters, shrubs, rocks, and exposed roots near the path.
- Full wedding props, easels, fabric, tables, lamps, animals, and petals.
- Baked ambient occlusion and localized blob/contact shadows establish ground contact.

### Mid field: `8–20m`

- Lower-detail but still volumetric tree, bush, and flower clusters.
- Repeated assets use instancing with varied scale, rotation, color, wind phase, and placement.
- Clustering must avoid visible grids, mirrored repetition, and a uniform green wall.

### Far field: beyond `20m`

- At least three staggered depth bands of simplified canopy and trunks preserve parallax.
- A single full-screen forest panorama cannot represent the entire normal WebGL world.
- Flat foliage cards are permitted only as minor distant components within a layered volumetric composition.

### Wind and parallax

- Grass, flowers, voile, shrubs, and canopy move at different restrained phases and amplitudes.
- Near objects cross the view faster than mid and far objects during travel.
- Ambient motion never moves names, body copy, QR codes, or form controls enough to impair use.
- There is no physics simulation. All motion is authored and deterministic.

## Petals and animals

### Petals

- Petals are instanced lightweight meshes with independent position, scale, rotation, phase, and depth.
- Resting scenes contain sparse intermittent petals rather than constant snowfall.
- Entry, selected arrivals, and the finale may trigger one bounded gust.
- Foreground petals may use texture softness and scale for a camera-near impression without a multipass depth-of-field effect.
- Petals never obscure an active input for a sustained interval.

### Rabbits

- The opening contains a pair of white rabbits at the grass edge.
- A rabbit may perform a short hop, head turn, ear movement, or guided reposition at selected cues.
- Rabbits never cross beneath the moving camera, clip through props, or loop a route continuously.

### Doves

- Two doves begin on the floral gate and depart once on entry.
- A small authored group may appear at the finale.
- Doves do not orbit the camera or repeatedly fly through content.

Animal animation is optional visual enrichment. If an animal asset or animation fails, navigation and semantic content remain intact.

## Interaction model

The journey controller exposes semantic actions: `enter`, `next`, `previous`, `look`, and interactive-scene focus actions.

- Vertical swipe or wheel down requests Next.
- Vertical reverse swipe or wheel up requests Previous.
- Arrow Right/Down requests Next; Arrow Left/Up requests Previous.
- Persistent native Previous/Next buttons remain visible after entry.
- Horizontal pointer or touch drag adjusts yaw up to `±20°`; small vertical drag adjusts pitch up to `±8°`.
- Touch direction locks after a small threshold so looking cannot accidentally advance.
- While travelling, additional navigation input is ignored and cannot queue multiple scenes.
- Travel begins from the actually rendered pose, blends free look back to authored framing, then follows the rail.
- Normal inter-scene travel targets roughly `1.2–1.8s`, with shorter authored travel permitted between adjacent gallery-photo scenes only when it remains readable and does not feel like a cut.
- Camera and scene cues finish before the destination becomes interactive.
- Forms, maps, gift reveals, and scrollable paper surfaces own their gestures while active and never advance the camera.
- Boundary controls are disabled at the gate and finale as appropriate.

## Rendering architecture

The runtime separates behavior, generated journey data, and forest art direction.

### Pure scene builder

Inputs:

- invitation-shaped content;
- feature flags;
- curated journey-photo selection;
- locale-independent identifiers.

Outputs:

- ordered stable scene IDs and types;
- semantic content bindings;
- placement-recipe identifiers;
- camera pose, look target, and path metadata;
- scene cue and animal cue identifiers;
- asset groups and fallback descriptions.

### Journey controller

A pure state machine owns:

- threshold, settled, travelling, and fallback-settled phases;
- current and target scene IDs;
- accepted input and input lock;
- feature-list boundary behavior;
- reduced-motion transitions;
- recoverable renderer handoff.

Input adapters do not directly move the camera.

### Rendering adapters

- React Three Fiber and Three.js render one canvas and one camera.
- GSAP owns one finite timeline for a travel and its authored scene cues.
- Drei HTML anchoring or an equivalent existing mechanism attaches crisp, accessible DOM content to physical surfaces.
- Persistent controls, loading, live regions, and fallback UI remain ordinary React DOM.
- No new runtime dependency is required by the approved design.

### Forest world skin

The skin owns:

- terrain and curved-path generation;
- instancing recipes and quality tiers;
- forest, wedding prop, fabric, animal, and petal assets;
- lighting, palette, materials, wind, and scene-specific assembly;
- reusable placement recipes for dynamic scene counts;
- fallback art metadata.

### Asset residency

- Entry-gate assets are the only blocking world group.
- Current, previous, and next scene groups may remain resident.
- The next scene preloads before it can be requested when practical.
- Distant optional feature assets and gallery images are not all decoded at entry.
- Previously visited user-photo textures may remain in a bounded cache; the cache must have an eviction policy for long journeys.
- Shared vegetation and wedding-prop geometry is pooled instead of duplicated per scene.

## Performance strategy and budgets

Mobile smoothness is a primary acceptance criterion.

- One WebGL canvas and one camera.
- No full-scene real-time shadow map, bloom, depth-of-field pass, or multipass post-processing stack.
- Use baked material response, ambient occlusion, authored contrast, and localized cheap contact/blob shadows.
- Grass, wildflowers, petals, distant foliage, and repeated props use instancing where appropriate while retaining independent transforms and wind phases.
- No React state updates occur per frame.
- Hidden tabs stop camera timelines, ambient invalidation, animal animation, and wind updates.
- Mobile starts at DPR `1`; desktop caps DPR at `1.25` unless fresh measurements justify a change.
- A quality monitor may reduce far vegetation, grass density, petal count, animal detail, and ambient update rate after sustained degradation. It may not remove semantic content or navigation.

Working acceptance budgets:

- Initial world payload before entry: target `≤4MB` compressed, excluding application JavaScript and user photographs.
- Shared forest and wedding environment assets for the full lab: target `≤12MB` compressed.
- Mobile visible geometry: target around `≤150k` triangles and `≤80` draw calls.
- Desktop visible geometry: target around `≤250k` triangles and `≤120` draw calls.
- Mobile live texture memory: target `≤64MB`, including current decoded user images.
- Mobile environment textures: normally `≤1024px` per dimension; a current hero photo may use a measured higher tier when necessary for the large easel.
- Settled ambient animation: capped at approximately `30fps` on mobile when full display cadence is unnecessary.

These are ceilings to verify, not quotas to fill.

## Reduced motion, fallback, and error handling

### Reduced motion

When system reduced motion is active or a lab override is enabled:

- camera travel is removed;
- free look, petals, wind, voile motion, rabbits, and doves remain still;
- scenes change through a short `150–200ms` opacity transition;
- all semantic scenes, native controls, forms, map actions, and content remain available;
- system preference cannot be overridden to force motion.

### WebGL fallback

If capability preflight fails, the dynamic module fails, scene rendering throws, or the context is lost:

- the route remains usable;
- the renderer switches to a lightweight 2.5D forest presentation with the exact same generated semantic scene order;
- the same names, family data, photographs, schedule, venue, map, RSVP, wishes, gift, and finale remain reachable;
- Previous/Next, swipe, keyboard, focus behavior, and live-region announcements remain equivalent;
- recovery preserves the current semantic scene instead of returning to the gate;
- a localized, nontechnical notice announces the visual fallback.

### Asset and feature failures

- Missing nonessential foliage, petals, or animals may be omitted.
- A failed gallery image preserves the easel and displays an accessible neutral placeholder.
- Map failure preserves the address and external directions action.
- Local lab RSVP or wish failure preserves typed values and announces the error inline.
- Loading cannot leave a permanent blank canvas or permanently disabled entry.
- Every asynchronously loaded scene group has bounded loading, success, and error states.

## Accessibility and localization

- All user-facing copy uses `next-intl` in Vietnamese, English, Korean, Japanese, and Chinese.
- The canvas has a concise accessible description of the current scene.
- A DOM live region announces scene title and position, for example `8 trên 13`.
- Entry, Previous, Next, calendar, map, RSVP, wishes, and gift actions use native controls.
- Interactive DOM is in the tab order only when its scene is settled and active.
- When navigation originates from a button or keyboard, focus moves to the arrived scene heading. Gesture and wheel navigation preserve the user's focus source.
- Pointer lock, device orientation, and gyroscope permissions are not used.
- Text contrast is tested against the actual forest and paper materials, not only against design tokens.
- Long localized strings remain inside physical surfaces without clipping.
- Animal and petal animation conveys no information that is unavailable elsewhere.

## Lab route and delivery boundary

The first implementation is a private localized lab route:

```text
src/app/[locale]/lab/forest-wedding-journey/page.tsx
```

- Outside production, the route is available for review.
- Production returns `404` unless a dedicated lab environment flag is enabled.
- Metadata forbids indexing and following.
- The global decorative petal field does not mount on this route because the world owns its three-dimensional petals.
- Demo content covers every scene type, including optional dress-code and gift scenes, and includes a bounded set of representative gallery photos. Because the selected visual demo source contains owner-mismatched bank records, the lab uses clearly synthetic, non-production gift-account fixtures whose owners match the demo couple; it never relabels or displays those mismatched source accounts.
- RSVP, wishes, gift reveals, and map behavior are local demonstrations only.
- No template manifest, editor registration, published-invitation renderer, database write, guest tracking, authentication change, payment, audio, deployment, or migration is part of the lab phase.

Integration into a real invitation requires a separately reviewed contract and implementation plan after visual, interaction, accessibility, and performance approval of the lab.

## Verification and acceptance

### Unit and data tests

- Stable required scene order.
- Optional feature inclusion and omission.
- No empty scenes for missing data.
- Zero, one, and multiple curated gallery photographs.
- One stable photo scene per selected media ID.
- Bride-first and groom-first family and gift ordering.
- Scene IDs remain stable when an unrelated optional feature changes.
- Controller entry, next, previous, boundaries, travel lock, reverse travel, and fallback preservation.
- Reduced-motion behavior.
- Locale key parity.

### Browser tests

- Private route gating and `noindex` metadata.
- Entry remains disabled until the required world is truly ready.
- Voile opening, entry travel, and arrival at the first enabled scene.
- Swipe, wheel, keyboard, Previous, and Next parity.
- Free-look clamps and pre-travel authored recentering.
- Repeated input cannot skip scenes.
- Each representative feature scene becomes active in the generated order.
- Gallery easel count matches selected lab photos.
- Forms, guestbook, map, gift reveals, and scrollable paper do not trigger travel.
- Backward navigation restores the previous scene and local form state.
- Finale remains settled and explorable.
- System reduced motion and lab override.
- WebGL preflight failure and context-loss fallback preserve the semantic scene.
- No console errors or horizontal overflow at `390 × 844`.
- The global decorative petal field is absent.

### Visual and performance QA

- Desktop around `1280–1440px` and mobile at `390 × 844`.
- Opening gate, every base feature scene, representative first/middle/last gallery photos, and finale.
- At least one mid-travel frame on representative short and long rails.
- Clear parallax among near, mid, and far vegetation.
- Individually placed grass, wildflowers, hero trees, easels, and props do not collapse into a flat wall.
- No visible vegetation grid, repeated animal loop, camera clipping, floating easel, or missing contact cue.
- Photo, paper, map, form, QR, and localized text legibility.
- Fresh frame traces for entry, gallery travel, interactive settled scenes, petal gust, and finale.
- DPR, triangle, draw-call, asset, live-texture, and decoded-photo budgets verified in a real browser.

### Required automated gates

```text
npm run typecheck
npm run typecheck:tests
npm run test:unit
focused ESLint for the new lab files
focused Playwright for the new lab
production build through the Playwright web server
git diff --check
```

## Explicit non-goals for the lab

- No changes to the existing Đà Lạt lab or its unfinished verification work.
- No editor or published-template integration.
- No database writes for RSVP, wishes, or gifts.
- No real map API integration.
- No background music or audio lifecycle.
- No free roaming, joystick, pointer lock, collision physics, VR, AR, or WebGPU.
- No full-body bride or groom avatars.
- No photogrammetric recreation of the reference photograph.
- No unbounded conversion of the full gallery into journey scenes.
- No new runtime dependency, commit, push, deploy, or production enablement as part of design documentation.
