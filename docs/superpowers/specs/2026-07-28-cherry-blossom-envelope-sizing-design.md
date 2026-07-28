# Anh Đào Hồng Envelope Sizing Design

## Goal

Make the unopened `cherry-blossom-pink` invitation follow Chung Đôi's responsive envelope sizing while preserving the current 3D rotation, pinch/wheel zoom, and UV-based “Mở thiệp” interaction.

This is a template-scoped trial. Every other invitation template must retain the current fixed `340px` wide, `3:4.5` cover until the Anh Đào Hồng result is reviewed and approved.

## Reference behavior

Measurements from `https://chungdoi.com/vi/mau-thiep/anh-dao-hong/demo`:

| Viewport | Card width | Card height |
| --- | ---: | ---: |
| 390px mobile | 310px | content-driven (555px with current reference copy) |
| 640–767px | 340px | content-driven |
| 768–1023px | 520px | content-driven |
| 1024px and wider | 600px | content-driven (508px with current reference copy) |

The width follows shared breakpoints. Height is not a fixed aspect ratio: it comes from the rendered names, date, guest copy, typography, and responsive padding.

## Selected approach

Add an opt-in responsive-natural sizing path to the shared envelope renderer and enable it only when `content.slug === "cherry-blossom-pink"`.

The existing fixed sizing path remains the default. This isolates the trial and provides a reusable path for later template-by-template rollout without changing those templates now.

## Component design

### Responsive width resolver

Introduce a dependency-free helper that maps the viewport width to the Chung Đôi breakpoints:

- `< 640px`: `310px`
- `640–767px`: `340px`
- `768–1023px`: `520px`
- `>= 1024px`: `600px`

The selected width changes only when a breakpoint is crossed, avoiding texture recapture on every resize event.

### Natural-height cover card

For the opt-in path, `CoverCard` must not use `aspect-ratio: 3 / 4.5`. Its text layer participates in normal document flow with the same responsive padding structure as the reference cover. Background and decorative layers remain absolutely positioned.

The default path keeps the existing fixed aspect ratio so other templates are unaffected.

### 3D texture and geometry

`Envelope3D` receives the resolved target/capture width for the opt-in path:

1. Render the hidden capture node at the selected responsive width.
2. Let the card determine its natural height.
3. Capture the DOM node to canvas.
4. Calculate `ratio = canvas.height / canvas.width`.
5. Build the front face, back face, edge geometry, and decorative plane from that measured ratio.
6. Project the card to the selected target width in screen pixels.

On breakpoint changes, recapture the texture and dispose replaced Three.js textures to avoid GPU memory leaks.

### Short-viewport safety

Use the Chung Đôi width unless the measured card would exceed the usable viewport after cover padding and the 3D gesture hint. In that case, uniformly reduce the projected scale. Never stretch width and height independently.

### Existing interactions

The following behavior remains unchanged:

- drag to rotate;
- pinch/wheel zoom through `OrbitControls`;
- no pan;
- button UV measurement and tap hit-testing;
- opening animation and music start;
- separately captured overflow decoration.

## Failure handling

If DOM-to-canvas capture fails, keep the existing paper geometry and accessible screen-reader “Mở thiệp” control. The responsive path must not block opening the invitation.

If the viewport changes during capture, only the latest breakpoint result may become active; stale captures must be discarded.

## Verification

### Unit tests

- Width resolver returns `310`, `340`, `520`, and `600` at the breakpoint boundaries.
- Short-viewport scale cap preserves the measured aspect ratio.
- Default sizing remains `340px` for non-opt-in templates.

### Browser checks

For `/mau-thiep/anh-dao-hong/demo`:

- At `1440 × 900`, the capture/card target width is `600px` and height is natural rather than `900px` (`600 × 1.5`).
- At `768 × 900`, the target width is `520px`.
- At `390 × 844`, the target width is `310px`.
- Crossing a breakpoint updates the card without leaving an old texture visible.
- Dragging does not open the invitation.
- Tapping the rendered “Mở thiệp” region opens it.
- Zoom still works and the card remains centered.

For one non-Cherry template:

- The cover remains on the current fixed `340px`, `3:4.5` path.

## Out of scope

- Rolling responsive-natural sizing out to other templates.
- Changing the opened invitation layout.
- Changing cover content, fonts, colors, particles, or decoration placement except where natural sizing requires the existing elements to participate in flow.
- Removing or redesigning the 3D renderer.
