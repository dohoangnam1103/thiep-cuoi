# Theme-specific layered opening effects for 18 art invitations

## Goal

Add a distinctive cinematic opening transition to each of the 18 art invitation themes. The effect must isolate meaningful visual subjects into clean transparent layers, animate those layers independently for 1.3–1.5 seconds, and preserve the stable 3D envelope renderer.

## Approved direction

- Every new art invitation receives its own opening composition rather than sharing one generic motion.
- Motion intensity is dramatic: foreground subjects enlarge and leave the card similarly to the restored Song Phụng effect.
- The full background artwork must never be used as the zooming foreground layer.
- Existing artwork may be separated into layers, and new supporting assets may be created when the source does not contain enough depth.
- Each transition lasts between 1,300 and 1,500 milliseconds.
- The 29 existing templates that already use `flyOnOpen` keep their current behavior.

## Asset pipeline

Each theme produces two kinds of output:

1. A repaired background plate with the animated subjects removed and the missing paper, texture, florals, architecture, or atmosphere reconstructed.
2. Three or four transparent WebP foreground layers containing only the animated subjects or effects.

Foreground layers must not be rectangular crops from the full artwork. They require real alpha transparency, clean matte removal, and a 1–2px edge cleanup so no paper, sky, textile, or dark background travels with the subject.

At the first animation frame, every foreground layer must align pixel-perfectly with its original location on the repaired plate. This prevents a visible jump when the opening transition begins.

The layer-preparation workflow must be non-destructive: keep the original `artwork.webp`, place repaired plates and alpha layers beside it in the theme decor folder, and use clear semantic filenames.

## Declarative effect architecture

`createArtTemplateManifest` gains an `openingEffect` description. The registrar validates it and writes the resulting theme configuration used by the shared envelope renderer.

The proposed contract contains:

- a unique effect identifier;
- `durationMs`, restricted to 1,300–1,500;
- a repaired background plate;
- an ordered list of foreground layers;
- per-layer source path, transform origin, delay, translation, scale, rotation, blur, opacity, and easing;
- a reduced-motion fallback.

The shared renderer remains responsible for orchestration. It reports the projected 3D card size, places each foreground layer at the matching card coordinates, starts all configured motions when `opening` becomes true, moves the 3D card away, and reveals invitation content only after the configured duration.

No template-specific React branches are added. All visual differences live in manifest data and prepared image layers.

## Approved subject-layer mapping

| Theme | Repaired plate and animated alpha layers |
|---|---|
| `dong-ho-folk` | paper/floral plate; left chicken; right chicken; center lotus |
| `tho-cam-highland` | indigo textile plate; upper-left embroidery cluster; lower-right cluster; small stitch accents |
| `son-mai-lacquer` | black lacquer/lotus plate; left crane; right crane; gold-cloud accents |
| `bat-trang-blue` | crazed porcelain plate; two swallows; lotus cluster; cobalt medallion |
| `hang-trong-folk` | paper/peony plate; large left peacock; small right peacock; selected peony clusters |
| `sen-monoline` | paper/water plate; left lotus; right lotus; leaf and seed-pod accents |
| `truc-chi-minimal` | handmade-paper plate; bamboo ring; lower-left bamboo cluster; backlight halo |
| `long-phung-deco` | oxblood Deco plate; dragon; phoenix; foil sun; selected frame accents |
| `ao-dai-hue` | purple silk plate; blue silk panel; coral silk panel; embroidered cloud/floral details |
| `art-deco-gatsby` | black paper plate; fan crown; two arch columns; corner ornaments |
| `celestial-map` | navy sky plate; upper constellation path; lower constellation path; moon sequence; center star |
| `coastal-mediterranean` | architecture/sea plate; ceramic vase; upper olive branches; lower olive branches |
| `swiss-brutalist` | warm-paper plate; upper black block; lower geometric blocks; red axis |
| `riso-duotone` | paper plate; coral ink layer; teal ink layer; black overprint layer |
| `cinema-credit` | theater plate; couple silhouette; left/right seat rows; projector-light layer |
| `aurora-glass-dark` | graphite plate; left glass ribbon; right glass ribbon; crossing-light flare |
| `y2k-chrome` | silver plate; left chrome ribbon; right/lower chrome ribbon; cyan-coral highlight layers |
| `botanical-lavender` | cool paper/color-shape plate; left lavender cluster; right mustard-pod cluster; small stem accents |

## Motion direction

Every theme uses a distinct composition while retaining the approved dramatic intensity:

- Paired figures such as chickens, peacocks, cranes, dragon/phoenix, swallows, constellations, and ribbons separate toward opposing sides and scale independently.
- Framing elements such as bamboo, silk, Deco arches, olive branches, geometric blocks, and botanical stems move from their actual anchor points rather than scaling around the card center.
- Light-driven themes use supporting luminance motion: lacquer gold, Trúc Chỉ backlight, projector light, aurora flare, and chrome highlights brighten before fading.
- Riso preserves its print identity by animating the coral, teal, and black ink separations with deliberate registration offsets.
- The repaired background plate stays visually stable, then receives only a restrained translate/fade while the 3D card exits.

All layer motion must finish before the invitation body replaces the cover.

## Loading and failure behavior

Foreground layers preload when the unopened envelope mounts. The opening control remains responsive; local assets are expected to be ready before a normal user can interact with the captured 3D face.

If an optional foreground layer fails, the renderer skips that layer and continues the transition. It must never fall back to enlarging a rectangular crop or the full composite artwork. A missing repaired plate is a registration error and must fail validation before build.

After the transition, all opening layers unmount so they do not retain GPU memory or intercept interactions.

## Performance and accessibility

- Limit each theme to approximately three or four transparent foreground WebPs plus its repaired plate.
- Animate only transform, opacity, and bounded filter values; do not animate layout properties.
- Keep layer dimensions proportional to the actual subject instead of exporting full-card transparent canvases when a tighter crop is possible.
- Verify mobile memory and smoothness at 390×844.
- Under `prefers-reduced-motion: reduce`, replace scale, rotation, and travel with a short opacity transition and reveal content without the cinematic delay.
- Decorative layers remain `aria-hidden` with empty alternative text and never receive pointer events.

## Validation and testing

### Asset and manifest invariants

- All 18 manifests define a unique opening effect.
- Every duration is between 1,300 and 1,500 milliseconds.
- Every repaired plate and foreground asset exists.
- No foreground source equals the original full `artwork.webp`.
- Foreground WebPs contain real alpha transparency and do not contain a fully opaque rectangular background.
- Layer count stays within the approved per-theme budget.

### Interaction tests

- Before opening, no foreground transition layer is visible.
- Activating the real 3D card button mounts the expected ordered layers.
- Each mounted layer receives its theme-specific animation and begins from the projected card position.
- The 3D card continues its exit animation without swapping to the old 2D renderer.
- Invitation content appears only after the theme duration.
- Layers unmount after completion.
- A simulated optional-layer failure still opens the invitation without a composite-image fallback.
- Reduced-motion mode uses the short fade path.

### Visual QA

Inspect all 18 themes at desktop and 390×844 mobile. For each theme verify:

- clean alpha edges on a contrasting background;
- no paper, textile, sky, architecture, or dark plate attached to moving subjects;
- exact first-frame alignment;
- no clipping, horizontal overflow, or framework overlay;
- smooth subject motion and correct final timing;
- readable cover content before interaction;
- normal invitation content and controls after opening.

## Success criteria

- All 18 art invitations have visually distinct opening transitions.
- Only clean isolated subjects enlarge or fly; the composite background never zooms with them.
- Every effect completes in 1.3–1.5 seconds and reveals content at the correct time.
- The stable 3D envelope interaction remains intact.
- Existing legacy templates remain unchanged.
- Automated validation, desktop/mobile QA, typechecks, unit tests, lint error gate, production build, and whitespace checks pass.
