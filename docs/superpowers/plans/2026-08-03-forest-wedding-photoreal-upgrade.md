# Forest Wedding Photoreal Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the forest wedding lab's low-poly visual skin with a hybrid photoreal forest, physically responsive materials, richer petals, and plausible wildlife while preserving every journey and fallback contract.

**Architecture:** Keep the existing controller, camera, scene data, DOM content, and fallback. Add a progressive `HybridPhotorealWorld` composed of a photographic far backdrop, PBR ground, instanced multi-LOD conifer cards, undergrowth, deterministic petal physics, and optional wildlife impostors; fall back to the current textured and procedural renderers on failure.

**Tech Stack:** Next.js 16 client boundary, React 19, React Three Fiber 9, Drei 10, Three.js 0.185, TypeScript strict, Sharp asset processing, Node test runner, Playwright.

---

## File map

- `src/components/forest-wedding-journey/photoreal/forest-asset-manifest.ts` — self-hosted asset IDs, groups, dimensions, byte and decoded-memory estimates.
- `src/components/forest-wedding-journey/photoreal/forest-material-policy.ts` — PBR texture/color-space and quality-tier policy.
- `src/components/forest-wedding-journey/photoreal/forest-lod-policy.ts` — deterministic distance/quality LOD selection with hysteresis.
- `src/components/forest-wedding-journey/photoreal/forest-environment-chunks.ts` — current/target-neighbour chunk residency.
- `src/components/forest-wedding-journey/photoreal/forest-photoreal-assets.tsx` — texture loader and core/optional failure boundaries.
- `src/components/forest-wedding-journey/photoreal/forest-backdrop.tsx` — photographic far forest and travel crossfade.
- `src/components/forest-wedding-journey/photoreal/forest-terrain.tsx` — PBR terrain/path and contact response.
- `src/components/forest-wedding-journey/photoreal/forest-tree-layers.tsx` — instanced trunks and conifer branch-card LODs.
- `src/components/forest-wedding-journey/photoreal/forest-undergrowth.tsx` — grass, ferns, wildflowers, litter, roots, and stones.
- `src/components/forest-wedding-journey/photoreal/forest-lighting.tsx` — tone, fog, key/fill, and no-multipass lighting contract.
- `src/components/forest-wedding-journey/photoreal/forest-petal-motion.ts` — pure deterministic petal motion solver.
- `src/components/forest-wedding-journey/photoreal/forest-wildlife-behavior.ts` — pure one-shot squirrel/dove/rabbit state functions.
- `src/components/forest-wedding-journey/photoreal/forest-wildlife.tsx` — atlas actor renderer.
- `src/components/forest-wedding-journey/photoreal/forest-photoreal-world.tsx` — coordinator.
- Existing `forest-wedding-world.tsx`, `forest-journey-canvas.tsx`, `forest-gate.tsx`, `forest-static-scenes.tsx`, `forest-gallery-scene.tsx`, and tests — integration and prop material upgrades.
- `public/chungdoi/labs/forest-wedding-journey/photoreal/` — project-bound packed assets.

### Task 1: Asset manifest, provenance, and entry budget

**Files:**
- Create: `src/components/forest-wedding-journey/photoreal/forest-asset-manifest.ts`
- Create: `src/components/forest-wedding-journey/photoreal/forest-asset-manifest.test.ts`
- Create: `scripts/prepare-forest-photoreal-assets.mjs`
- Modify: `docs/research/asset-provenance.md`
- Create assets under: `public/chungdoi/labs/forest-wedding-journey/photoreal/`

- [ ] **Step 1: Write the failing manifest test**

Test that `FOREST_PHOTOREAL_ASSETS` contains `groundColor`, `groundNormal`, `groundArm`, `coniferColor`, `coniferNormal`, `coniferArm`, `backdrop`, and `wildlife`; every path is local, every core file exists, `entryCompressedBytes <= 4_000_000`, `sharedCompressedBytes <= 12_000_000`, and decoded entry textures stay below the previous four-texture estimate.

```ts
test("photoreal entry assets are local, complete, and budgeted", () => {
  const estimate = getForestPhotorealAssetEstimate("entry");
  assert.ok(estimate.compressedBytes <= 4_000_000);
  assert.ok(estimate.decodedRgbaMipBytes <= 18_175_312);
  for (const asset of estimate.assets) {
    assert.ok(asset.src.startsWith("/chungdoi/labs/forest-wedding-journey/photoreal/"));
    assert.ok(existsSync(resolve(process.cwd(), "public", asset.src.slice(1))));
  }
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test src/components/forest-wedding-journey/photoreal/forest-asset-manifest.test.ts`

Expected: FAIL because the manifest module and project assets do not exist.

- [ ] **Step 3: Generate and prepare the project assets**

Use the supplied images only as mood references to generate one original 2:1 dense evergreen backdrop and one original photographic wildlife atlas. Download the documented Poly Haven CC0 1K ground, pine-bark, and pine-twig source maps. The preparation script must use Sharp to resize/pack WebP color, normal, and ARM textures and must verify output dimensions and byte ceilings. It must never fetch at runtime.

- [ ] **Step 4: Implement the typed manifest**

```ts
export type ForestPhotorealAsset = {
  readonly blocking: boolean;
  readonly group: "entry" | "wildlife";
  readonly height: number;
  readonly id: string;
  readonly src: string;
  readonly width: number;
};

export function getForestPhotorealAssetEstimate(
  group: "entry" | "shared",
): ForestPhotorealAssetEstimate;
```

- [ ] **Step 5: Record provenance and verify GREEN**

Record exact URLs, CC0 license, source checksums, generated-image prompts, conversion settings, and “reference images used for mood only; no pixels copied.” Re-run the focused test and `git diff --check`.

### Task 2: Pure chunk, LOD, and material policies

**Files:**
- Create: `src/components/forest-wedding-journey/photoreal/forest-environment-chunks.ts`
- Create: `src/components/forest-wedding-journey/photoreal/forest-environment-chunks.test.ts`
- Create: `src/components/forest-wedding-journey/photoreal/forest-lod-policy.ts`
- Create: `src/components/forest-wedding-journey/photoreal/forest-lod-policy.test.ts`
- Create: `src/components/forest-wedding-journey/photoreal/forest-material-policy.ts`
- Create: `src/components/forest-wedding-journey/photoreal/forest-material-policy.test.ts`

- [ ] **Step 1: Write failing residency tests**

Assert that settled indices return current ±1, travel returns the union of source/target neighbourhoods, boundaries clamp, results are unique/sorted, and no more than four chunks are resident for adjacent travel.

- [ ] **Step 2: Write failing LOD tests**

```ts
assert.equal(selectForestLod({ distance: 5, previous: null, tier: "desktop" }), "hero");
assert.equal(selectForestLod({ distance: 20, previous: null, tier: "mobile" }), "impostor");
assert.equal(selectForestLod({ distance: 12.1, previous: "hero", tier: "desktop" }), "hero");
```

Also assert reduced/mobile transition earlier than desktop and hysteresis prevents boundary flicker.

- [ ] **Step 3: Write failing material tests**

Assert ground/conifer require color, normal, and ARM maps; color maps use sRGB; data maps use no color space; alpha foliage uses `alphaTest >= 0.35`, `transparent=false`, `depthWrite=true`; terrain/path emissive intensity is zero.

- [ ] **Step 4: Verify RED, implement minimal pure policies, and verify GREEN**

Run all three focused tests, implement immutable pure functions, rerun them, then run `npm run typecheck`.

### Task 3: Hybrid asset boundary and runtime mode

**Files:**
- Create: `src/components/forest-wedding-journey/photoreal/forest-photoreal-assets.tsx`
- Create: `src/components/forest-wedding-journey/photoreal/forest-photoreal-world.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-world.tsx`
- Modify: `src/components/forest-wedding-journey/forest-journey-canvas.tsx`
- Modify: `tests/e2e/forest-wedding-journey-lab.spec.ts`

- [ ] **Step 1: Add a failing E2E contract**

Assert `data-world-mode="hybrid"`, `data-world-skin="forest-wedding-photoreal"`, core asset requests are local, optional wildlife failure leaves hybrid mode ready, and core asset failure selects legacy textured WebGL rather than DOM fallback.

- [ ] **Step 2: Verify RED**

Run only the new E2E grep against the production-style Playwright server.

- [ ] **Step 3: Implement the progressive boundary**

Extend `ForestWeddingWorldMode` to `"hybrid" | "textured" | "procedural"`. Load entry textures in one Suspense boundary and wildlife in a separate optional boundary. Preserve `WorldReadyReporter`, canvas identity, current/target scene state, and all existing loader/error markers.

- [ ] **Step 4: Verify GREEN and legacy fallbacks**

Run the new grep plus existing material-failure, renderer-failure, WebGL1, and context-loss tests.

### Task 4: PBR terrain, lighting, backdrop, and conifer LOD layers

**Files:**
- Create: `src/components/forest-wedding-journey/photoreal/forest-backdrop.tsx`
- Create: `src/components/forest-wedding-journey/photoreal/forest-terrain.tsx`
- Create: `src/components/forest-wedding-journey/photoreal/forest-tree-layers.tsx`
- Create: `src/components/forest-wedding-journey/photoreal/forest-undergrowth.tsx`
- Create: `src/components/forest-wedding-journey/photoreal/forest-lighting.tsx`
- Modify: `src/components/forest-wedding-journey/photoreal/forest-photoreal-world.tsx`
- Modify: `src/components/forest-wedding-journey/forest-world-data.ts`
- Modify: `src/components/forest-wedding-journey/forest-world-data.test.ts`

- [ ] **Step 1: Replace the old layer-contract expectation with a failing hybrid contract**

Require hero conifers to use `branch-card-lod0`, mid conifers `branch-card-lod1`, and far forest `panorama-impostor`; keep procedural/textured legacy expectations unchanged.

- [ ] **Step 2: Verify RED**

Run `npx tsx --test src/components/forest-wedding-journey/forest-world-data.test.ts` and confirm only the new hybrid assertion fails.

- [ ] **Step 3: Build terrain and lighting**

Use `MeshStandardMaterial` with color/normal/ARM maps, zero emissive, repeated UVs, baked AO vertex factors, warm directional key, hemisphere fill, darker fog, and ACES tone mapping. Do not enable multipass postprocessing or full-scene shadows.

- [ ] **Step 4: Build trees and undergrowth**

Render tapered textured trunks and branch-card tiers as `InstancedMesh` groups. Share geometry/materials, vary deterministic scale/rotation/tint/wind phase, mount only resident chunks, and keep branch cards out of clearing/corridor envelopes. Render grass as crossed alpha-tested tufts with vertex wind; freeze uniforms in reduced motion.

- [ ] **Step 5: Build the far backdrop**

Use a curved/segmented background surface outside the last depth band, preserve ±20° look coverage, crossfade source/target chunk presentation during travel, and avoid pale sky gaps.

- [ ] **Step 6: Verify unit, type, and focused browser contracts**

Run world-data tests, typechecks, and the gate/families/gallery visual smoke grep.

### Task 5: Deterministic aerodynamic petals

**Files:**
- Create: `src/components/forest-wedding-journey/photoreal/forest-petal-motion.ts`
- Create: `src/components/forest-wedding-journey/photoreal/forest-petal-motion.test.ts`
- Modify: `src/components/forest-wedding-journey/forest-petals.tsx`

- [ ] **Step 1: Write failing solver tests**

Assert finite deterministic transforms, different seeds produce different paths, gust increases lateral displacement without violating bounds, respawn fades instead of teleporting visibly, and reduced motion returns the same transform at `t=0` and `t=20`.

- [ ] **Step 2: Verify RED**

Run the focused test and confirm the solver is missing.

- [ ] **Step 3: Implement the pure solver and renderer integration**

```ts
export function sampleForestPetalMotion(
  seed: number,
  timeSeconds: number,
  cue: Readonly<Pick<ForestJourneyCueState, "petalPulse" | "windStrength">>,
  reducedMotion: boolean,
): ForestPetalTransform;
```

Keep one instanced draw for background petals and a bounded hero tier. Update matrices imperatively without React state per frame.

- [ ] **Step 4: Verify GREEN and reduced-motion E2E**

Run focused unit tests and the existing reduced-motion WebGL tests.

### Task 6: Plausible optional wildlife

**Files:**
- Create: `src/components/forest-wedding-journey/photoreal/forest-wildlife-behavior.ts`
- Create: `src/components/forest-wedding-journey/photoreal/forest-wildlife-behavior.test.ts`
- Create: `src/components/forest-wedding-journey/photoreal/forest-wildlife.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-world.tsx`

- [ ] **Step 1: Write failing behavior tests**

Assert squirrel phases `hidden -> run -> climb -> perch -> hidden`, finite anchored positions, no path-corridor crossing, dove `perch -> takeoff -> flight`, rabbit edge placement, and frozen reduced-motion transforms.

- [ ] **Step 2: Verify RED**

Run the focused test and confirm the behavior module is missing.

- [ ] **Step 3: Implement photographic atlas actors**

Render alpha-tested billboard actors at bounded size with atlas pose changes, body bob/wing/tail motion, tree-anchor climb alignment, and distance fade. Preserve existing entry/finale cue timing and diagnostic counts. A wildlife texture failure renders zero actors without changing world mode.

- [ ] **Step 4: Verify GREEN and failure isolation**

Run wildlife unit tests plus new optional-failure and existing cue E2E greps.

### Task 7: Bring wedding props into the same material world

**Files:**
- Modify: `src/components/forest-wedding-journey/forest-gate.tsx`
- Modify: `src/components/forest-wedding-journey/forest-gallery-scene.tsx`
- Modify: `src/components/forest-wedding-journey/forest-static-scenes.tsx`
- Modify: `src/components/forest-wedding-journey/forest-scene-framing.test.ts`
- Modify: `src/components/forest-wedding-journey/forest-gallery-geometry.test.ts`

- [ ] **Step 1: Add failing geometry/material contracts**

Require beveled/tapered wood, non-emissive ivory cloth, visible fabric depth, contact cues, and unchanged gate/gallery projection bounds.

- [ ] **Step 2: Verify RED**

Run the two focused geometry tests.

- [ ] **Step 3: Upgrade materials and silhouettes without moving semantics**

Reuse shared wood/cloth/foliage PBR policies, add restrained bevel and drape geometry, preserve all `<Html>` positions, test IDs, focus surfaces, and photo dimensions.

- [ ] **Step 4: Verify GREEN and physical-scene E2E**

Run geometry tests and physical static/gallery E2E greps.

### Task 8: Diagnostics, budgets, visual QA, and rollout

**Files:**
- Modify: `src/components/forest-wedding-journey/forest-journey-canvas.tsx`
- Modify: `tests/e2e/forest-wedding-journey-lab.spec.ts`
- Create: `tests/e2e/forest-wedding-journey-visual.spec.ts`
- Modify: `docs/research/asset-provenance.md`

- [x] **Step 1: Add failing diagnostics assertions**

Expose development-only `worldMode`, resident chunk IDs, LOD counts, optional wildlife count, petal transform hash, actual renderer calls/triangles/textures, and manifest-estimated compressed/decoded bytes without per-frame React state.

- [x] **Step 2: Verify RED, implement diagnostics, and verify GREEN**

Keep production diagnostics absent and preserve hidden-tab invalidation behavior.

- [x] **Step 3: Run the complete verification matrix**

Run:

```bash
npm run typecheck
npm run typecheck:tests
npm run test:unit
npx eslint src/components/forest-wedding-journey src/data/forest-wedding-journey.test.ts tests/e2e/forest-wedding-journey-lab.spec.ts tests/e2e/forest-wedding-journey-visual.spec.ts
npx playwright test tests/e2e/forest-wedding-journey-lab.spec.ts tests/e2e/forest-wedding-journey-visual.spec.ts
npm run build
git diff --check
```

- [x] **Step 4: Manually inspect the rendered matrix**

Use the in-app browser at 1440x900 and 390x844. Inspect gate, families, first gallery, map/RSVP, and finale; verify dense depth, grass/ground detail, no camera/tree intersections, plausible wildlife, petal depth, readable HTML, and no neighbouring scene bleed. Reset viewport and finalize the kept tab.

Captured all six scenes at both viewports and measured each frame in three
horizontal bands. Every band is clear of the near-black floor (worst 1.53%
against the 2% ceiling), every canopy band is green-dominant, and every band
keeps texture rather than reading as a flat fill (lowest canopy standard
deviation 8.5 on mobile `map`, whose camera looks mostly at the far backdrop,
against the spec's floor of 8). The paper surfaces stay bright and legible —
mobile `rsvp` mid-band mean 161.9 with range 253.

- [ ] **Step 5: Independent final review**

Run spec-compliance review first, then code-quality/performance review. Fix and re-review every issue before declaring completion.

