# Đà Lạt First-Person Journey Lab Design

## Status and purpose

- Date: 2026-08-01.
- Status: experience, storyboard, interaction model, architecture, performance strategy, fallback behavior, and route separation approved in conversation.
- New private route: `/lab/dalat-journey`.
- Existing route `/lab/flow-demo` remains unchanged as the motion-engine matrix.
- Goal: prove a reusable, immersive invitation journey shell through one deeply polished pilot world rather than another collection of isolated card transitions.
- Pilot world: **Vườn sương Đà Lạt**, using a 70% recognizable Đà Lạt environment and 30% magical environmental response.
- Content remains neutral and localized. The lab does not create or register a real invitation template.

## Product decisions

The experience is a guided first-person walk through one continuous world.

- The camera is the viewer's eyes; there is no visible avatar, weapon, game HUD, joystick, or free-roaming navigation.
- Forward and backward travel follows an authored camera rail.
- At every checkpoint the camera stops automatically and input is returned to the viewer.
- Vertical swipe, mouse wheel, keyboard, and persistent Previous/Next controls all navigate between checkpoints.
- Horizontal drag looks around up to `±20°`; vertical look is limited to `±8°`.
- The horizon stays level. There is no head bob or camera roll.
- Content is fully diegetic: text, images, dates, directions, and interaction affordances belong to physical objects in the scene.
- Interactive or long-form DOM is projected onto a physical surface to preserve sharp text and accessibility; it never appears as an unexplained floating card.
- The pilot is one deep world with five authored checkpoints.
- Future Night Promenade and Celestial Dreamscape worlds are preserved as independent skins over the same journey runtime.

## Route and privacy

The lab lives at the localized App Router page:

```text
src/app/[locale]/lab/dalat-journey/page.tsx
```

Behavior:

- It is available automatically outside production.
- Production returns `404` unless `DALAT_JOURNEY_LAB_ENABLED=1`.
- Metadata sets `robots.index=false` and `robots.follow=false`.
- All route and control copy uses a `dalatJourneyLab` next-intl namespace in `vi`, `en`, `ja`, `ko`, and `zh`.
- The global decorative petal field must not mount on this route.
- The page has no template manifest, editor integration, database access, publication flow, or public listing entry.

## Storyboard

The journey evolves from pre-dawn mist into a glowing night valley. The changing light gives the five locations one emotional arc rather than making them feel like disconnected scenes.

### Checkpoint 1 — Cổng sương

- Time: just before dawn.
- Role: threshold and opening title.
- A stone marker and pine arch hold the neutral title and entry instruction.
- The viewer activates `Bước vào`; mist parts and the camera enters the forest.
- This is the only explicit initial-entry action.

### Checkpoint 2 — Rừng ký ức

- Time: sun rays begin crossing the pine canopy.
- Role: narrative and gallery.
- Neutral images become translucent memory panes suspended between trees and reflected in dew or shallow water.
- Looking horizontally changes light across the panes and reveals short localized copy.
- The camera composition guarantees that every pane remains inside the `±20°` look range.

### Checkpoint 3 — Nhà kính thời gian

- Time: clear daylight inside the greenhouse.
- Role: date, schedule, or other time-based information.
- Flowers and greenhouse ribs form a large clock-like composition.
- Rings of flowers grow into placeholder date and time values.
- Copy stays attached to greenhouse surfaces; no overlay card appears.

### Checkpoint 4 — Pavilion bên hồ

- Time: golden hour.
- Role: place and directions.
- The path reaches a light pavilion beside a reflective lake.
- Place details are engraved into its architecture.
- Looking slightly downward reveals a path or map treatment reflected on the lake or inlaid into the floor.
- Direction controls are visual-only in the lab and do not open a real map.

### Checkpoint 5 — Thung lũng nguyện ước

- Time: blue hour into night.
- Role: final message and action.
- Flowers illuminate in response to the final reveal.
- A physical book, desk, or stone surface holds the placeholder RSVP/wish affordance.
- The affordance is local-only and performs no data write.
- The final state remains explorable and does not auto-exit.

## Interaction model

### State machine

The runtime has three user-visible phases:

```text
settled -> travelling -> settled
             |
             +-> fallback-settled on a recoverable rendering failure
```

- `settled`: free look and checkpoint interaction are enabled.
- `travelling`: the target checkpoint is fixed and all additional navigation input is ignored.
- Arrival restores input only after both camera and scene cues complete.
- Repeated wheel, touch, key, or button events cannot queue multiple transitions.

### Input mapping

- Swipe up or wheel down: next checkpoint.
- Swipe down or wheel up: previous checkpoint.
- Previous/Next buttons: identical navigation actions and always visible after entry.
- Desktop keyboard: `ArrowRight`/`ArrowDown` advance; `ArrowLeft`/`ArrowUp` go back.
- Horizontal pointer/touch drag: free look within `±20°` yaw.
- Small vertical drag: free look within `±8°` pitch.
- Touch orientation locks after a small movement threshold so a horizontal look gesture cannot accidentally advance the journey.
- Boundary controls are disabled at the first and last checkpoint.
- Controls keep native button semantics, keyboard focus, and visible focus treatment.

### Camera motion

- Travel duration is distance-aware but constrained to about `1.5–2.0s`.
- One GSAP timeline owns camera position, look target, fog response, light response, and checkpoint cues for a travel.
- The timeline starts from the current rendered pose and is killed cleanly on unmount or fallback.
- There is no ScrollTrigger scrub; scroll and swipe request a finite transition to a checkpoint.
- Free-look offsets blend back toward the authored checkpoint framing before travel begins.
- Camera FOV remains fixed at `50°` during normal travel.

## Visual direction

The world uses magical realism rather than photorealism or full fantasy.

Recognizable Đà Lạt cues:

- layered pine forest;
- morning mist;
- sloped terrain and a narrow walking path;
- glasshouse geometry;
- lake and pavilion;
- flower fields and cool highland light.

Magical responses:

- mist opens around the path;
- flowers illuminate near the viewer;
- memory panes catch impossible shafts of light;
- greenhouse growth encodes time;
- the lake reveals route information;
- the final valley lights in response to the concluding message.

The magic must react to checkpoint arrival or viewer attention. It must not become continuous visual noise.

## Asset strategy

The repository currently has no reusable Đà Lạt GLB/GLTF world asset. The pilot therefore uses a small original asset pack instead of importing a large third-party scene.

### Procedural and reusable geometry

- low-poly terrain strips following the authored path;
- instanced pine trunks and canopy clusters;
- instanced flower groups and light points;
- modular stone marker, greenhouse, pavilion, desk/book, and memory-pane geometry;
- simple lake plane with a lightweight material treatment;
- authored camera spline and checkpoint anchors stored as data.

### Original raster assets

- a compact pine/foliage alpha atlas;
- flower and light sprites;
- one fog/noise texture;
- distant ridge or sky treatments where geometry is unnecessary;
- five mobile-first WebP panoramas used by the 2.5D fallback.

All new raster assets must be original or generated for the project, stored under `public/chungdoi/labs/dalat-journey/`, and documented in `docs/research/asset-provenance.md` if an external tool or source is involved.

## Architecture

The runtime separates journey behavior from art direction.

### Journey definition

`src/data/dalat-journey.ts` owns a typed definition containing:

- ordered checkpoint IDs;
- localized semantic content slots;
- camera rail samples or control points;
- checkpoint camera poses and look targets;
- allowed free-look bounds;
- asset groups required by each checkpoint;
- scene-cue identifiers;
- fallback panorama paths.

The definition is immutable runtime data and contains no React components.

### Journey controller

A pure controller owns:

- current checkpoint;
- target checkpoint;
- state-machine phase;
- accepted navigation events;
- boundary behavior;
- input lock and cancellation;
- reduced-motion transitions;
- recovery into the fallback renderer.

The controller exposes semantic actions such as `enter`, `next`, `previous`, and `look`. Input adapters do not manipulate the camera directly.

### Rendering adapter

The pilot renderer uses the project's existing dependencies:

- React Three Fiber and Three.js for the world;
- GSAP for one finite travel/cue timeline;
- Drei HTML anchoring only where DOM text or controls must live on a physical surface;
- CSS/React DOM for the persistent Previous/Next controls, loading state, and non-WebGL fallback.

There is one WebGL canvas. The five-engine matrix is not mounted or imported on this route.

### World skin

`DalatMistWorld` supplies:

- geometry and instancing recipes;
- palette, fog, environment, and material values;
- checkpoint scene cues;
- diegetic surface treatments;
- quality-tier variants;
- fallback panorama metadata.

Future Night Promenade and Celestial Dreamscape skins must implement the same world contract without changing navigation or controller code.

### Component boundaries

Suggested boundaries:

```text
src/components/dalat-journey/
  dalat-journey-lab.tsx       route shell and accessible controls
  journey-controller.ts       pure state machine
  use-journey-input.ts        wheel, touch, pointer, and keyboard adapters
  journey-canvas.tsx          dynamic R3F boundary and recovery
  dalat-mist-world.tsx        pilot scene composition
  journey-camera.tsx          GSAP camera and free-look adapter
  diegetic-content.tsx        anchored DOM/text surfaces
  journey-fallback.tsx        five-panorama 2.5D experience
  journey-loading.tsx         lightweight localized loading state
```

Large checkpoint-specific scene assemblies may be split into focused files when that keeps the world component understandable. They must continue to depend on the typed journey definition rather than hardcoded navigation state.

## Rendering and performance strategy

Mobile smoothness is the primary technical constraint.

### Rendering rules

- One canvas and one camera.
- No real-time shadows.
- No bloom or multipass post-processing.
- Emissive materials, additive sprites, baked gradients, and authored contrast create the glow.
- Pine trees, flower groups, and repeated lights use instancing.
- No React state updates per frame.
- Travel and free-look invalidate at display cadence.
- Settled ambient mist/light invalidates at a capped `30fps` on mobile and display cadence on desktop; hidden tabs render no frames.
- The scene pauses observers, timelines, and invalidation loops on unmount.

### Quality tiers

- Mobile starts at DPR `1` and conservative object density.
- Desktop caps DPR at `1.25`.
- A runtime performance monitor lowers particle density, far-tree density, and ambient update rate by one tier after sustained frame degradation.
- Quality may degrade only by removing density or distant detail; checkpoint content and navigation never disappear.

### Working budgets

- Initial world assets required before entry: target at or below `3 MB` compressed, excluding existing application JavaScript.
- Full journey asset payload: target at or below `15 MB` compressed.
- Mobile visible geometry: target at or below approximately `150k` triangles and `80` draw calls.
- Desktop visible geometry: target at or below approximately `250k` triangles and `120` draw calls.
- Mobile textures use a maximum dimension of `1024px`; only the desktop panorama or distant ridge assets may use `2048px`.
- Estimated live texture budget targets `64 MB` or less on mobile.
- Only the entry group is blocking. Current and next checkpoint groups preload behind mist and distance culling.

These are acceptance budgets, not targets to fill.

## Reduced motion and fallback

### Reduced motion

When `prefers-reduced-motion: reduce` is active or the lab override is enabled:

- camera travel is removed;
- free look is disabled;
- checkpoints change through a short opacity transition of roughly `150–200ms`;
- the same localized content and Previous/Next controls remain available;
- no ambient movement is required.

### WebGL fallback

If WebGL capability preflight fails, the dynamic module fails, the scene throws, or the context is lost:

- the route stays usable;
- the renderer switches to five 2.5D panorama scenes;
- the same controller, checkpoint order, swipe, buttons, keyboard, and content anchors are retained;
- transition failure never returns the viewer to the first checkpoint unexpectedly;
- a localized status announces the renderer change without exposing technical jargon.

### Asset failure

- Nonessential foliage, particles, or distant layers may be omitted.
- A missing checkpoint-critical raster uses neutral local geometry or the checkpoint panorama.
- Loading failure does not leave a permanent blank canvas.
- Every async asset group has a bounded loading and error state.

## Accessibility and localization

- The canvas has a concise accessible description of the current location.
- A DOM live region announces checkpoint name and position, for example `3 of 5`.
- Previous/Next controls remain outside the canvas and use native buttons.
- The initial entry control is a native button.
- Keyboard navigation works without pointer lock.
- Pointer lock, device orientation, and gyroscope permissions are not used.
- Every anchored interactive DOM element remains reachable by keyboard when its checkpoint is settled and is removed from the tab order while travelling or off-screen.
- Focus moves predictably to the current checkpoint heading after arrival when navigation came from a keyboard or button.
- All user-facing copy is provided through next-intl in all five application locales.
- Neutral scene content uses short lines that remain legible in Vietnamese, English, Korean, Japanese, and Chinese.

## Verification and acceptance

### Unit tests

- checkpoint order and uniqueness;
- exact five-checkpoint definition;
- state-machine transitions and boundary behavior;
- repeated input ignored while travelling;
- reduced-motion behavior;
- world-skin contract and fallback panorama completeness;
- locale key parity.

### Browser tests

- private route gating and `noindex` metadata;
- entry action;
- swipe next/previous;
- Previous/Next buttons;
- keyboard navigation;
- horizontal look clamped to `±20°`;
- input lock during travel;
- final checkpoint remains settled and explorable;
- reduced-motion path;
- WebGL capability and context-loss fallback;
- no console errors;
- no horizontal overflow at `390×844`;
- global petal field absent on the route.

### Visual and performance QA

- desktop around `1280–1440px`;
- mobile at `390×844`;
- all five settled checkpoints;
- at least one mid-travel frame per transition;
- text legibility across the five locales;
- image and anchored-DOM occlusion behavior;
- no camera clipping through terrain or checkpoint geometry;
- no input conflict between vertical navigation and horizontal look;
- fresh frame trace on an ordinary mobile-class viewport for travel and settled ambience;
- canvas backing-store DPR and texture budgets verified in the browser.

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

## Explicit non-goals

- No real invitation or template registration.
- No editor integration.
- No database, RSVP submission, guestbook write, map API, or authentication.
- No audio or music lifecycle.
- No joystick, pointer lock, free roaming, collision physics, or game HUD.
- No VR, AR, WebGPU, post-processing stack, or new runtime dependency.
- No photorealistic recreation of a specific Đà Lạt landmark.
- No implementation of the future Night Promenade or Celestial Dreamscape skins.
- No changes to `/lab/flow-demo`.
- No commit, push, or deployment unless separately requested.

## Future extension contract

The pilot is successful only if another world can reuse:

- the same five semantic checkpoint roles;
- the same controller and input adapters;
- the same camera-travel lifecycle;
- the same diegetic content contract;
- the same reduced-motion and 2.5D fallback behavior;
- the same browser tests with only skin-specific visual assertions changed.

Night Promenade and Celestial Dreamscape remain the first two future candidates. They are documented as future skins only and do not expand the pilot implementation scope.
