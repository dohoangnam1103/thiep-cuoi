# Forest Wedding Photoreal Upgrade Design

**Status:** Approved by the user on 2026-08-03 after the production and reference-image audit.

## Goal

Replace the lab's low-poly forest skin with a dense, cinematic, near-photoreal evergreen wedding garden while preserving the existing first-person journey, semantic invitation scenes, controls, localization, accessibility, fallback, and mobile performance contracts.

## Art direction

The visual target is **Dense emerald conifer garden / bright ivory wedding**:

- a continuous, irregular wall of dark evergreen foliage rather than evenly spaced tree rows;
- layered forest floor with grass, moss, pine needles, leaf litter, roots, ferns, wildflowers, and contact darkening;
- warm directional daylight over deep green ambient shade;
- bright ivory paper, cloth, flowers, and wedding photographs as the visual focus;
- sparse, plausible wildlife that appears briefly instead of looping like mascots;
- petals with varied depth, scale, blur impression, tumble, lift, and settling.

The two supplied Harmony Studio images are mood references only. No source pixels may be copied into shipped assets.

## Rendering architecture

Use a hybrid real-time renderer in three depth bands:

1. **Near field:** PBR terrain, textured trunks, instanced conifer branch cards, grass blades, flowers, roots, props, hero petals, and wildlife impostors.
2. **Mid field:** lower-density instanced conifer cards and undergrowth with earlier LOD transitions on mobile/reduced tiers.
3. **Far field:** an original photographic forest panorama/backdrop with subtle parallax and travel crossfade.

The existing `ForestWeddingWorld` becomes a progressive boundary:

```text
HybridPhotorealWorld
  -> asset/render failure: TexturedForestWorld
    -> material failure: TerminalProceduralWorld
      -> WebGL failure/context loss: DOM fallback
```

The journey controller, finite camera rail, input hooks, content builder, DOM `<Html>` content, scene identity, scene residency, and fallback must not be rewritten.

## Asset pipeline

The entry pack uses original generated artwork plus CC0 Poly Haven material sources. Every source URL, license, source checksum, conversion command, and shipped output must be recorded in `docs/research/asset-provenance.md`.

The shared photoreal pack contains:

- packed conifer color/alpha, normal, and ARM atlases;
- forest-ground color, normal, and ARM maps;
- an original far-forest backdrop;
- an original photographic wildlife atlas;
- the existing petal and wildflower atlases, resized only when necessary for the GPU budget.

Assets must be self-hosted under `public/chungdoi/labs/forest-wedding-journey/photoreal/`. No runtime decoder, model, image, or CDN dependency may be required.

## Trees and undergrowth

- Hero trees use textured tapered trunks plus multiple tiers of crossed branch cards.
- Tree cards use alpha testing, depth writing, PBR material response, fog, and deterministic wind phases.
- Mid trees use fewer branch tiers and earlier distance fade.
- Far forest comes from the backdrop and optional inexpensive impostor silhouettes.
- Tree silhouettes, scale, tint, spacing, and lean remain deterministic but visibly irregular.
- The camera corridor and every authored clearing remain free of trunk/card intersection.
- Grass uses instanced crossed blades/tufts with vertex wind; reduced motion freezes wind.

## Ground and lighting

- Terrain uses color, normal, and ARM maps; the path may blend toward moss/soil but may not use emissive flattening.
- Baked AO and localized contact decals remain the primary grounding mechanism.
- The upgrade does not introduce a full-scene shadow map, bloom, depth-of-field pass, SSAO pass, or other multipass postprocessing.
- Renderer tone mapping and physically plausible color management are allowed.
- Lighting uses a warm key plus cool/green hemisphere fill, denser distance fog, and authored contrast.

## Petals

- Preserve the current cue API and deterministic placement prefix.
- Replace the uniform sine/cosine loop with a pure deterministic motion solver containing fall velocity, drag, turbulence, lift/gust, tumble, and a non-visible respawn fade.
- Use background instanced petals plus a small hero tier near the camera.
- Reduced motion returns identical transforms for every timestamp.

## Wildlife

- Replace sphere-built animals in the photoreal mode with photographic atlas actors placed in 3D.
- Distant bird silhouettes may use cheap procedural geometry.
- A squirrel appears only in authored one-shot cues: hidden -> run -> climb -> perch -> hidden.
- Doves use perch/takeoff/flight poses and existing entry/finale cues.
- Rabbits remain at the forest edge with subtle idle/hop behavior.
- Wildlife is optional: an atlas load failure hides wildlife without downgrading the forest.
- Reduced motion freezes actors in a quiet safe pose.

## Wedding props

The gate, easels, family tables, fabrics, flowers, chairs, and finale props must receive material depth consistent with the forest. Existing semantic positions, HTML content, focus behavior, test IDs, and projection contracts stay unchanged.

## Quality tiers and budgets

Existing ceilings remain binding:

| Contract | Mobile | Desktop |
|---|---:|---:|
| DPR | 1 | up to 1.25 |
| Visible triangles | <=150k | <=250k |
| Draw calls | <=80 | <=120 |
| Decoded textures including three live gallery photos | <=64 MB | measured and bounded |

Additional delivery budgets:

- entry-required forest payload: target `<=4 MB` compressed;
- all shared forest/wedding assets: target `<=12 MB` compressed;
- only the entry/core environment group may block world readiness;
- wildlife and later-scene decoration groups stream after entry;
- current/target and their immediate neighbours are the only heavy scene chunks mounted.

## Acceptance

- Gate, families, first gallery, and finale are manually reviewed at 1440x900 and 390x844.
- The nearest vegetation no longer exposes faceted canopy blobs, cone grass, or sphere animals.
- The far field reads as a dense evergreen wall with no pale empty void.
- Tree trunks never dominate the camera or intersect the walking corridor.
- Travel, swipe, wheel, Next/Prev, focus, localization, forms, fallback, context-loss recovery, and reduced motion preserve their existing behavior.
- Unit, type, lint, build, full forest E2E, measured runtime budgets, and visual smoke checks pass before completion.

