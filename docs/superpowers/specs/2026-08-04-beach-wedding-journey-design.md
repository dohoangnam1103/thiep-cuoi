# Beach Wedding Journey Design

**Status:** Design direction approved by the user on 2026-08-04; this written spec
is pending their review.

## Why a beach replaces the forest corridor

The forest journey works as an idea but costs too much to build and still falls
short of the realism the user pictured. Both problems have the same root, and it
was measured this session rather than guessed.

The forest is fill-rate bound on fragment count. At the gate, on the 1280x720
SwiftShader rasteriser the E2E suite uses, a frame costs 449 ms: roughly 323 ms
in the tree layers and 105 ms in the undergrowth. Quadrupling pixel count raised
frame time 5.8x. Stripping normal, AO and roughness maps from distant bands made
frames *worse* (652 ms), because the saving was never in texture fetch — it is in
thousands of overlapping alpha-tested foliage cards, each shading pixels that a
nearer card then covers.

Realism has the same cause. A photoreal conifer is a biological structure; the
only way to fake one cheaply is crossed billboards, and crossed billboards read
as billboards from exactly the distance a first-person camera stands at.

A beach inverts both. Sand, water and sky are three large opaque surfaces that
shade each pixel roughly once, so the overdraw that dominates the forest budget
disappears. And they are surfaces that a photographed PBR material plus an
environment map genuinely reproduces — there is no biological structure to fake.
The realism ceiling is higher *and* the cost is lower, which is why this is a
change of location rather than an optimisation of the forest.

## Scope

This spec covers a new lab at `/lab/beach-wedding-journey`, self-contained
alongside the existing forest lab. **The forest lab is not modified.** That is a
deliberate, user-approved decision recorded under "Shared mechanics" below.

Wave-break animation at the shoreline is **explicitly out of scope** for this
iteration, at the user's instruction, and will be added later. The design must
make that addition additive; see "Shoreline".

## Art direction

> **Revised 2026-08-05.** The art direction below is the second version. The
> first targeted a golden-hour coastal walk with dune grass and a finale pier;
> on review the sand read as coarse and dun, the sky as dim rather than a
> sunrise, and the waterline as a pasted-on strip of a different-coloured sand.
> The dune grass, the pier and the golden-hour grade are gone. Superseded
> statements are struck through where they still appear further down this
> document; the sections on budgets and asset provenance carry the new measured
> numbers.

The visual target is **bright sunrise coastal wedding / white sand and white
linen**:

- a wide **white, fine-grained** sand foreground — Poly Haven `sand_03`, whose
  grain RMS is 10.33 against `coast_sand_01`'s 30.93, graded to L\* 58.0 at 15.5%
  saturation so it reads as bright near-neutral sand rather than dun;
- a **bright sunrise sky with a visible sun and sun rays**: the sun sits 12.83deg
  above the horizon, 4.3deg off the camera's down-shore view axis, so it is in
  frame on both the desktop and the authored mobile view;
- calm sea on one side reflecting the real sky, deepening in colour toward the
  horizon;
- couple photographs hanging in weathered wooden frames from a line strung
  between driftwood posts, tilting gently in the breeze;
- **white-clothed reception tables with flower centrepieces**, in two bands: one
  between the frames and the water, one set back behind the walk, so the shore
  reads as a set reception with depth;
- a damp band at the waterline that is *darker* than the dry sand and inside the
  same colour family — the previous bake put a 55.6%-saturation damp sand against
  15.5% dry, which read as two different beaches meeting in a line;
- ~~low coastal dune grass and beach-morning-glory on the landward side~~ — no
  grass at all;
- ~~a weathered wooden pier closing the journey~~ — no pier; its
  `modular_wooden_pier` textures now dress only the driftwood posts, at 512²;
- no palm trees. The only CC0 palms available are stylised low-poly and would
  break the photoreal register on sight. The replacement sky is a `puresky` HDRI
  with no horizon geography whatsoever, so no vegetation appears in the panorama
  either.

The user's directive is "as real as possible". Where a choice trades bytes for
realism, this design takes realism, because the beach's low fragment cost leaves
headroom the forest never had.

## The shoreline problem, stated honestly

Without wave animation, a reflective rippling water plane meets the sand along a
**sharp, static line**. That reads as an ornamental pond, not the sea. This is the
single largest realism risk in the design and it is a direct consequence of
deferring waves.

Three mitigations, none of which require wave code:

1. **The camera rail stays 6-8 m inland of the waterline.** The shoreline sits in
   the mid-ground, never in the foreground where the eye can inspect the seam.
2. **A wet-sand band is baked into the sand material** — darker, patchy, damp —
   running along the shore. Texture breaks the seam's regularity, and it is a
   static authored asset rather than runtime work.
3. **The waterline is not straight.** The sand mesh carries a gently curved,
   deterministic shore edge, so the sand/water intersection is an organic curve
   rather than the edge of a rectangle.

These reduce the defect; they do not remove it. Frames that place the waterline
prominently in view will remain the weakest frames in the scene until waves land.
Acceptance criteria below make that explicit rather than papering over it.

### Designing for the wave upgrade

A dedicated module `beach-shoreline.ts` owns shore geometry and exposes:

```ts
shorelineOffsetAt(z: number): number   // curved waterline, deterministic
waterDepthAt(x: number, z: number): number
```

`waterDepthAt` currently returns depth from static geometry alone. Adding waves
means adding a time-phase term inside this one function plus a foam term in the
water material — the terrain, rail, framing, props and scene code do not change.
This module is the seam the future work attaches to, and it is unit-tested now so
that the later change has a regression net waiting for it.

## Rendering architecture

Three depth bands, mirroring the forest's proven structure:

1. **Near field:** PBR sand terrain, driftwood posts, hanging photo frames,
   white-clothed reception tables and their flower centrepieces.
2. **Mid field:** water plane with environment reflection, the landward table
   band,
   distance haze.
3. **Far field:** the HDRI environment itself as sky and horizon. No separate
   backdrop plate is needed — this is a saving the forest could not make, because
   a forest horizon is geometry while a sea horizon is sky.

Progressive degradation follows the forest's pattern:

```text
BeachPhotorealWorld
  -> asset/render failure: BeachSimpleWorld (flat materials, no HDRI)
    -> WebGL failure/context loss: DOM fallback
```

The middle tier is one level shallower than the forest's because there is no
foliage atlas whose absence needs its own fallback.

## Shared mechanics: copied, not extracted

Seven modules in the forest lab are location-neutral: the journey controller,
input hook, cue state, camera rail, scene framing, adaptive quality sampler, and
the LOD/chunk/residency policies. Roughly 2,500 lines.

**The user chose to copy them into the beach lab rather than extract a shared
core.** The reason is risk containment: the forest lab has in-flight E2E work and
an unresolved visual-spec failure, and touching its mechanics now would entangle
two efforts.

The cost is real and is accepted: every rail, input or adaptive-quality bug must
be fixed in two places, and it is easy to fix only one. To make that cost
visible rather than latent, **each copied beach file carries a header comment
naming its forest twin**, and the beach unit tests mirror the forest ones for the
same behaviours, so a fix applied to one side and not the other shows up as a
test asymmetry rather than a silent divergence.

Extraction into `journey-core/` remains the right move once the forest work
settles. This design does not block it.

## Asset pipeline

All sources are CC0 and were verified against the live Poly Haven and ambientCG
APIs rather than assumed. Every source URL, license, checksum, conversion command
and shipped output must be recorded in `docs/research/asset-provenance.md` before
delivery, exactly as the forest pack was.

Assets are self-hosted under
`public/chungdoi/labs/beach-wedding-journey/photoreal/`. No runtime CDN, decoder
or model dependency.

Every size below is a measured source figure from those APIs, not an estimate.
Shipped sizes are the encode targets the prepare script must hit.

| Asset | Source | License | Note |
|---|---|---|---|
| Environment | Poly Haven `table_mountain_1_puresky` HDRI, 1K HDR (1.38 MB shipped) | CC0 | Sky, sun, and the water's reflection source. Replaced `umhlanga_sunrise`, whose sun sat 1.65deg above the horizon and read as dim golden hour |
| Dry sand color/normal/ARM | Poly Haven `sand_03`, 1K | CC0 | Tiled — see "sand resolution" below. Replaced `coast_sand_01`, which was three times coarser-grained |
| Wet shore band | Poly Haven `damp_sand`, 1K | CC0 | Composited into the sand color/ARM maps at bake time |
| Water normal | **Generated** in the prepare script | n/a — ours | No CC0 source exists; see below |
| Photo frames | Poly Haven `hanging_picture_frame_01` (391 KB, 7 files at 1K), `_02` (696 KB) | CC0, James Ray Cock | glTF; unused map channels dropped, textures re-encoded to WebP |
| Driftwood wood | Poly Haven `modular_wooden_pier` **textures only**, at 512² | CC0, Rico Cilliers | Dresses the driftwood posts. The pier itself was removed, so the maps dropped from 1024² |
| Posts, tables, flowers, sun rays | Procedural geometry; tables, flowers and sun rays carry no maps at all | — | No model download needed |

Three source decisions need their reasoning recorded, because the obvious choice
is wrong in each case.

**The water normal map is generated, not downloaded.** There is no CC0 water
normal map on either source: the ambientCG API returns only `Ice001`-`Ice004`,
`Ground035`, `Ground083` and `SurfaceImperfections*` for a water query and
paving stones for a wave query, and Poly Haven has no water textures at all.
The remaining candidate, three.js's bundled `waternormals.jpg`, has undocumented
provenance and must not ship. So the prepare script synthesises a seamless
tiling normal map from summed value-noise octaves with a fixed seed. This is
strictly better than a download here: `Water` wants smooth low-frequency
undulation rather than photographic detail, the output is a few KB, and there is
no third-party provenance to defend.

**Sand stays at 1K.** Three 2K maps decode to roughly 67 MB with mipmaps, which
alone exceeds the 64 MB decoded-texture ceiling before water, frames or the
couple's three live photographs are counted. The realism argument for 2K was
also wrong: sand is a *tiled* material, so perceived sharpness at eye height
comes from tiling frequency and normal-map strength, not from map size. A 1K
tile repeated at a short world-space period looks sharper than a 2K tile
stretched over the same ground. Tiling period is tuned during visual QA, and a
detail-scale second UV layer is available if the near ground still reads soft.

~~**The pier ships as textures with procedural geometry.**~~ *Superseded
2026-08-05: there is no pier.* `modular_wooden_pier`'s textures are still the
reason the download is here, but they now dress only the driftwood posts, and at
512² rather than 1024² — a post is a 0.15m-wide cylinder seen from 2m and up, so
three tiles of grain at 512 already exceed what its silhouette resolves. Halving
all three maps returned 12.6 MB of the decoded ceiling, which is what paid for the
reception tables.

A real HDRI replaces procedural `<Sky>` deliberately. Procedural sky is free, but
the moment it is reflected in water it reads as a gradient. Since water
reflection is the beach's strongest realism lever, the environment map must be a
photograph. ~~`umhlanga_sunrise` is additionally tagged `beach / ocean / wave /
sand`: its horizon is a real sea with real surf~~ — *superseded 2026-08-05.* That
real coastline was also the source of the vegetation on the horizon, and its sun
sat 1.65deg above the horizon, which is why the scene read as dim golden hour
rather than sunrise. `table_mountain_1_puresky` is a pure sky: no coastline, no
vegetation, a sun at 12.83deg with the strongest measured disk contrast of eleven
candidates (113,395x sky mean), and the brightest sky mean (0.578). Its disk
measures only 2 pixels above 5% of peak at 1k, so the *visible* sun and its rays
are drawn separately as one additive billboard in `beach-sun-rays.tsx` — additive
decoration over a sky that already lights the scene correctly, contributing
nothing to the PBR solution.

Conversion runs through `scripts/prepare-beach-photoreal-assets.mjs`, copied from
the forest script's structure: verify every source checksum before processing,
Lanczos3 resampling, deterministic output, and a byte table the manifest test
asserts against.

## Terrain, water and lighting

- Sand is a subdivided plane with a deterministic curved shore edge and gentle
  dune relief, carrying color, normal and ARM maps plus the baked wet band. The
  bake asserts three properties after every run — wet sand darker than dry, dry
  sand above L\* 55, and no row-to-row saturation step above 2 points down the
  shore-relative V axis — because the waterline colour mismatch was a bake defect,
  not a shader one.
- The reception tables are procedural geometry with no maps: a cloth surface over
  the top and down a scalloped flared skirt, drawn `DoubleSide` so the inside of
  the hem is not a hole. Each carries a centrepiece — a dome of petal fans over a
  foliage collar — whose blooms and leaves are separated by a `bloomMask` vertex
  attribute so one material and one draw call cover both.
- Water uses **`Water` from `three/examples/jsm/objects/Water.js`** (MIT), not
  `WaterMesh`. `WaterMesh` imports from `three/webgpu` and `three/tsl` and its own
  documentation states it works only with `WebGPURenderer`; this app renders
  through R3F's `WebGLRenderer`, so `WaterMesh` would fail at import. `Water` is
  the WebGL sibling and takes the same `waterNormals` / `sunDirection` /
  `sunColor` / `distortionScale` options.
- **`Water`'s planar reflection re-renders the whole scene from a mirror camera
  every frame.** That is a second full geometry pass, and it directly threatens
  the frame-time win this location change exists to deliver. Therefore:
  reflection render-target resolution starts at 256x256 (the class defaults to
  512x512), the mirror pass is measured as its own line in the diagnostics
  snapshot, and if it costs more than roughly a quarter of the frame the water
  falls back to an environment-map-only material with no planar reflection. The
  fallback is a visible quality step and must be an explicit, measured decision
  rather than a silent default.
- Because a black water plane is the known failure mode of both classes, a test
  must cover the renderer/tone-mapping configuration the water depends on.
- Lighting is HDRI-based ambient plus one warm directional key aligned to the
  HDRI's sun direction, with distance haze toward the horizon.
- No shadow map, bloom, depth-of-field or SSAO pass. Renderer tone mapping and
  physically plausible colour management are allowed, as in the forest.
- ~~Dune grass uses instanced crossed tufts with vertex wind~~ — *superseded
  2026-08-05.* The reception tables are two instanced meshes over one shared
  placement list, so a table and its centrepiece can never drift apart. Only the
  flowers take the vertex wind, at roughly a third of the grass's amplitude: a cut
  stem in a vase on a table has far less travel than a marram blade rooted in
  sand. Reduced motion freezes wind, and holds the sun rays' phase.

## Photo frames

Frames are the couple's presence in the scene and get the most attention:

- glTF geometry instanced per gallery photo, with the couple's photograph bound
  into the artwork material slot. Each source model already carries a dedicated
  `artwork` material with its own color, normal and roughness maps, so the
  photograph replaces a real artwork slot rather than being projected onto wood.
- Hung from a catenary line between driftwood posts, with deterministic per-frame
  tilt and a slow breeze sway. Reduced motion holds a fixed pose.
- Two frame silhouettes alternate so a row of frames does not read as clones.
  `hanging_picture_frame_03` is a verified third option if two prove too
  repetitive at the shipped gallery length.
- A frame model that fails to load falls back to the box-geometry frame rather
  than dropping the photograph — the photograph is the content and must never
  vanish.

## Scenes and content

Scene identity, ordering, content builder, `<Html>` DOM content, focus behaviour,
test IDs, localisation and the gift/RSVP/wishes features are carried over
unchanged from the forest journey's contract. The beach changes where scenes sit
in space, not what they are.

Scene poses come from a beach-specific `resolveScenePose`: the rail runs parallel
to the shore rather than down a corridor, alternating the camera between the
landward and seaward side. ~~and the finale walks onto the pier~~ — *superseded
2026-08-05: the finale is a shore pose like the others.*

## Quality tiers and budgets

Forest ceilings remain binding, since the same devices must run this:

| Contract | Mobile | Desktop |
|---|---:|---:|
| DPR | 1 | up to 1.25 |
| Visible triangles | <=150k | <=250k |
| Draw calls | <=80 | <=120 |
| Decoded textures including three live gallery photos | <=64 MB | measured and bounded |

Delivery budgets:

- entry-required beach payload: target `<=4 MB` compressed;
- all shared beach assets: target `<=12 MB` compressed;
- only the entry group blocks world readiness; frames and driftwood stream after.

**Measured shipped sizes** as of 2026-08-05 (the projections this table replaced
were ~1.1 MB entry and ~0.9 MB shared):

| Group | Contents | Measured |
|---|---|---:|
| Entry | HDRI, sand color/normal/ARM with baked wet band, generated water normal | 2,061,204 B (2.0 MB) |
| Shared | All fourteen: entry plus two frame sets and the driftwood set | 2,325,222 B (2.2 MB) |

Decoded, the shared pack is 32.0 MiB; with three live 1k gallery photographs the
total is **48.0 MiB of the 64 MiB ceiling**, leaving 16.0 MiB of headroom. The
earlier 62.9 MiB / 4.2 MiB (6%) figures were what forced the frame maps down to
512², and they no longer describe the pack — removing the pier and halving the
driftwood maps returned 12.6 MiB.

That is comfortably inside both ceilings, and the HDRI is the single largest item
— which is the right place to spend, since it drives both lighting and water
reflection. If the entry group overruns, the HDRI drops to a lower resolution
before any sand map is sacrificed, because sand is what the camera stands on.

These are projections. The prepare script records actual bytes, the manifest test
asserts them, and **the spec's numbers must be corrected to the measured values
once the pack is built** — the forest pack's provenance doc drifted from its
manifest exactly this way and the beach must not repeat it.

Payload is not the interesting comparison anyway. The forest's entry pack is
719 KB and it still costs 449 ms/frame at the gate, because its cost is overdraw,
not download. **Frame cost at the gate must be measured and reported for the
beach, not assumed to be lower** — the whole premise of this change is a frame-time
win, and an unmeasured premise is a guess.

## Testing

- Unit tests for `beach-shoreline` (curve determinism, depth monotonicity toward
  the sea, and a placeholder asserting the current time-invariance so the future
  wave change is a visible, intentional diff), beach scene framing, and the
  copied controller/input/cue/adaptive modules mirroring the forest suites.
- A manifest contract test asserting every declared asset exists on disk with the
  recorded byte size, matching the forest's `forest-asset-manifest.test.ts`.
- A test that the generated water normal map is seamless — opposite edges match
  within tolerance — and byte-identical across runs for a fixed seed.
- A test asserting the water component imports from
  `three/examples/jsm/objects/Water.js` and never from `WaterMesh.js`, since the
  latter requires `WebGPURenderer` and this app is WebGL.
- A material test covering the renderer/tone-mapping configuration the water
  depends on, so a black water plane fails a test rather than shipping.
- A Playwright project for the beach lab with `workers: 1`, as WebGL under
  SwiftShader cannot share a GPU without breaking timing budgets.
- E2E coverage: gate entry, travel between scenes, free-look and recenter,
  keyboard/wheel/gesture navigation, the DOM fallback with WebGL disabled,
  reduced motion, context-loss recovery, and mobile with no horizontal overflow.

## Acceptance

- Gate, families, first gallery, and finale reviewed at 1440x900 and 390x844.
- Sand holds detail at eye height with no visible tiling seam along the rail.
- Water reflects the HDRI sky coherently and is never black.
- The planar-reflection mirror pass is measured separately. If it is not
  affordable, the environment-map-only water is shipped and the downgrade is
  reported, not hidden.
- The shoreline seam is not prominent in any authored scene pose. **A frame
  deliberately aimed at the waterline is expected to be the scene's weakest and
  is accepted for this iteration; it is the wave work's acceptance target.**
- Photo frames read as wooden objects with the couple's photograph legible and
  correctly oriented at every scene.
- No stylised or low-poly element intrudes on the photoreal register.
- Measured decoded-texture total, with three live gallery photographs loaded,
  is inside the 64 MB ceiling — this is the constraint that ruled out 2K sand and
  must be confirmed, not assumed.
- Measured gate frame time is recorded and materially better than the forest's
  449 ms. If it is not, the premise of this change has failed and that must be
  reported rather than absorbed.
- Travel, swipe, wheel, Next/Prev, focus, localisation, forms, fallback,
  context-loss recovery and reduced motion all behave as the forest lab does.
- **The forest lab's full unit and E2E suites still pass unchanged**, proving the
  copy-not-extract decision was honoured.
- Unit, typecheck, lint, build, beach E2E, measured runtime budgets and visual
  smoke checks pass before completion.
