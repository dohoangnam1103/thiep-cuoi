# Motion Engine Lab Design

## Status and scope

- Date: 2026-08-01.
- Surface: the existing private route `/lab/flow-demo`.
- Goal: compare reusable invitation-opening motion independently from wedding content or theme art.
- Priority: stable smoothness on ordinary mobile devices.
- Content: neutral geometric artwork and localized lorem-style copy only.
- This lab does not register a template, alter published invitations, or add a production animation engine.

## Product decision

The lab compares a fixed motion grammar across multiple rendering technologies. Every technology receives the same visual actors, timing, stage dimensions, and choreography intent so that differences are attributable to the engine rather than the design.

The lab supports two viewing modes:

1. **Focus** renders one selected technology at a large size.
2. **Compare** renders every technology for one selected choreography and replays them from a shared trigger.

## Motion grammar

The shared semantic actors are:

- `backdrop`: static stage background.
- `frame`: the boundary around the invitation surface.
- `hero`: the central neutral symbol.
- `accent-left` and `accent-right`: two supporting ornaments.
- `reveal-surface`: the lightweight first screen revealed at the end.
- `ribbon`: an optional sweep actor used by one preset.

The four choreography presets are:

| ID | Motion | Reusable theme mappings |
| --- | --- | --- |
| `splitGate` | Two sides separate and clear the center | curtains, doors, leaves, clouds, glass panels |
| `irisBloom` | Concentric layers open from the center | flower, sun, moon, drum, lace, halo |
| `depthPortal` | Layered planes push toward a reveal surface | arch, forest, cinema frame, city, galaxy |
| `ribbonSweep` | A single curved band crosses the stage and exposes content | silk, ink, wave, smoke, light, film strip |

Every full-motion run uses the same lifecycle:

```text
ready -> response -> signature-motion -> clear -> handoff -> complete
```

Full motion targets about 1,100ms. Reduced motion uses a 150ms opacity-only reveal.

## Technologies compared

### CSS keyframes

The baseline uses data attributes and CSS Module keyframes. A changing replay key remounts only the small stage. It demonstrates the lowest-complexity implementation and a compositor-friendly baseline.

### Web Animations API

WAAPI runs `Element.animate()` on semantic actor refs. React updates only at run boundaries. All animation objects are cancelled during replay, preset changes, unmount, or reduced-motion changes.

### GSAP

A single finite GSAP timeline targets the same semantic actors. It does not animate blur, shadows, layout dimensions, or React state per frame. GSAP remains an enhanced choreography reference rather than the mobile baseline.

### Canvas 2D

Canvas draws the same neutral actors from a normalized `0..1` progress value. The requestAnimationFrame loop exists only while a run is active and is cancelled when hidden, replayed, or unmounted. Canvas uses a capped backing-store pixel ratio.

### WebGL / React Three Fiber

The WebGL demo is dynamically loaded only when selected or visible in compare mode. It uses a small scene, no textures, shadows, post-processing, or continuous idle loop. The scene uses demand rendering and invalidates only during the finite run.

## Shared component contract

Every technology adapter accepts the same props:

```ts
type MotionDemoProps = {
  choreography: MotionChoreography;
  reducedMotion: boolean;
  runId: number;
};
```

Every rendered stage exposes:

- `data-motion-engine` with its engine ID.
- `data-motion-choreography` with its preset ID.
- `data-motion-state` with `idle`, `running`, or `complete`.
- A stable accessible label identifying the technology and choreography.

## Layout

The page is mobile-first and uses a dark neutral visual system so theme art cannot bias the comparison.

- Header: title, short explanation, and mobile-performance priority.
- Control rail: Focus/Compare, choreography selector, technology selector in Focus mode, Replay, and reduced-motion toggle.
- Focus stage: one large preview with a technology badge and concise implementation note.
- Compare grid: five synchronized cards, one per technology, using the selected choreography.
- Notes panel: shared constraints and a warning that simultaneous Compare mode is visual comparison, not a valid performance benchmark.

The stage copy, controls, descriptions, accessible labels, and metadata use the five existing `flowDemoLab` message catalogs.

## Performance guardrails

- Animate only `transform` and `opacity` in DOM engines.
- Do not animate `filter`, `backdrop-filter`, shadows, width, height, top, or left.
- At most two full-stage surfaces and six moving semantic actors per demo.
- No continuous decorative loop after completion.
- No React state updates per animation frame.
- Canvas and WebGL pixel ratio is capped at `1.25`; mobile uses `1`.
- WebGL is dynamically loaded and remains optional.
- Input is locked only for the finite run; Replay restarts cleanly.
- `prefers-reduced-motion` and the lab override both select the opacity-only path.
- Page width must not overflow at `390px`.

## Failure behavior

- If WebGL fails, its card shows a localized unavailable state while other technologies remain usable.
- A replay or selection change cancels the current adapter run before starting a new one.
- A hidden tab finishes or cancels finite loops; it never accumulates queued frames.
- Compare mode never claims comparative FPS because running all engines together changes the workload.

## Verification

- Unit tests validate the complete engine and choreography registries and their cross-product IDs.
- TypeScript ensures every adapter implements the shared contract.
- Browser checks cover the private route, focus selection, compare mode, replay, reduced motion, Canvas/WebGL markers, console health, and mobile overflow.
- Manual visual review confirms that the same motion idea remains recognizable across all technologies.

## Explicit non-goals

- No Rive, Lottie, Spline, WebGPU, video, or new dependency is added.
- No real invitation content, forms, maps, audio, database access, template manifest, or editor integration.
- No commit, push, or deployment is part of this request.
