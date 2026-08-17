# Beach Wedding Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained `/lab/beach-wedding-journey` 3D lab — a golden-hour walk along a shoreline with the couple's photos in wooden frames — reusing the forest journey's mechanics by copying them, without modifying the forest lab.

**Architecture:** A new `src/components/beach-wedding-journey/` folder holds copies of the seven location-neutral forest modules (controller, input, cue state, camera rail, framing, adaptive sampler, fallback) plus new beach-specific world modules. Sand, water and sky are three large opaque surfaces lit by a real CC0 HDRI, replacing the forest's thousands of alpha-tested foliage cards. All assets are self-hosted, converted by a deterministic prepare script with checksum verification.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, React Three Fiber 9 / drei 10 / three 0.185, `three/examples/jsm/objects/Water.js`, Sharp (asset pipeline), node:test (unit), Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-08-04-beach-wedding-journey-design.md`

## Global Constraints

- TypeScript strict mode. **No `any`.** Named exports. PascalCase components, camelCase utils. 2-space indentation.
- All user-facing copy goes through next-intl message catalogs (`messages/*.json`) — never hardcoded in components. Five locales required: `vi` (default), `en`, `ko`, `ja`, `zh`.
- **Do not modify any file under `src/components/forest-wedding-journey/`, `src/data/forest-wedding-journey.ts`, or `tests/e2e/forest-wedding-journey-*.spec.ts`.** The copy-not-extract decision is the point; the forest suites must still pass untouched. The only shared files this plan edits are `playwright.config.ts`, `messages/*.json`, `package.json`, and `docs/research/asset-provenance.md`.
- Every copied file starts with a header comment naming its forest twin, in this exact form: `// Copied from src/components/forest-wedding-journey/<file>. Fixes to journey mechanics must be applied to both.`
- Water uses `Water` from `three/examples/jsm/objects/Water.js`. **Never `WaterMesh.js`** — it imports `three/webgpu` + `three/tsl` and requires `WebGPURenderer`; this app is WebGL and the import would fail.
- Renderer budgets: DPR mobile 1 / desktop ≤1.25; visible triangles ≤150k mobile / ≤250k desktop; draw calls ≤80 / ≤120; decoded textures ≤64 MB including three live gallery photos.
- Delivery budgets: entry-required assets ≤4 MB compressed; all shared assets ≤12 MB compressed.
- Asset provenance: every downloaded source's URL, license, Poly Haven MD5 and downloaded SHA-256 must be recorded in `docs/research/asset-provenance.md`. No artwork from competitor websites.
- Lab route is gated: `NODE_ENV !== "production" || BEACH_WEDDING_JOURNEY_LAB_ENABLED === "1"`, plus `export const dynamic = "force-dynamic"` and `robots: { index: false, follow: false }`.
- Commit after each task. Do **not** push or deploy — the user does that explicitly.

---

## File Structure

**New — beach data and route**
- `src/data/beach-wedding-journey.ts` — scene types, content type, demo content, `resolveScenePose` along the shore, `buildBeachJourneyScenes`
- `src/data/beach-wedding-journey.test.ts`
- `src/app/[locale]/lab/beach-wedding-journey/page.tsx` — locale gate, env gate, metadata

**New — beach world**
- `src/components/beach-wedding-journey/beach-shoreline.ts` — curved waterline + `waterDepthAt`; the seam future wave work attaches to
- `src/components/beach-wedding-journey/beach-shoreline.test.ts`
- `src/components/beach-wedding-journey/beach-world-data.ts` — quality tiers, densities, placements, adaptive sampler
- `src/components/beach-wedding-journey/beach-world-data.test.ts`
- `src/components/beach-wedding-journey/beach-scene-framing.ts` + `.test.ts`
- `src/components/beach-wedding-journey/beach-frame-geometry.ts` + `.test.ts` — where each hanging frame sits
- `src/components/beach-wedding-journey/beach-wedding-world.tsx` — composes the world, owns mode fallback
- `src/components/beach-wedding-journey/photoreal/beach-asset-manifest.ts` + `.test.ts`
- `src/components/beach-wedding-journey/photoreal/beach-terrain.tsx` — sand
- `src/components/beach-wedding-journey/photoreal/beach-water.tsx` — `Water` + reflection budget
- `src/components/beach-wedding-journey/photoreal/beach-water.test.ts` — asserts no `WaterMesh` import
- `src/components/beach-wedding-journey/photoreal/beach-lighting.tsx` — HDRI environment + key light
- `src/components/beach-wedding-journey/photoreal/beach-photo-frames.tsx` — glTF frames, catenary line
- `src/components/beach-wedding-journey/photoreal/beach-props.tsx` — posts, pier, dune grass

**Copied from forest (header comment required)**
- `beach-journey-controller.ts` + `.test.ts` ← `forest-journey-controller.ts`
- `use-beach-journey-input.ts` ← `use-forest-journey-input.ts`
- `beach-cue-state.ts` + `.test.ts` ← `forest-cue-state.ts`
- `beach-journey-camera.tsx` ← `forest-journey-camera.tsx`
- `beach-journey-fallback.tsx` ← `forest-journey-fallback.tsx`
- `beach-journey-canvas.tsx` ← `forest-journey-canvas.tsx`
- `beach-wedding-journey-lab.tsx` ← `forest-wedding-journey-lab.tsx`

**New — pipeline and tests**
- `scripts/prepare-beach-photoreal-assets.mjs`
- `tests/e2e/beach-wedding-journey-lab.spec.ts`
- `tests/e2e/beach-wedding-journey-visual.spec.ts`

**Modified (shared)**
- `playwright.config.ts` — add `beach` project (`workers: 1`), extend `chromium` testIgnore, add env var
- `messages/{vi,en,ko,ja,zh}.json` — add `beachWeddingJourneyLab` block
- `package.json` — add `beach:prepare-assets` script
- `docs/research/asset-provenance.md` — beach pack section

---

## Task 1: Beach scene data and shore-parallel poses

**Files:**
- Create: `src/data/beach-wedding-journey.ts`
- Test: `src/data/beach-wedding-journey.test.ts`
- Read for reference (do not modify): `src/data/forest-wedding-journey.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `BEACH_JOURNEY_SCENE_TYPES`, `BeachJourneySceneType`, `BeachJourneyVector3`, `BeachFamilySide`, `BeachJourneyPhoto`, `BeachJourneyGiftAccount`, `BeachJourneyWishEntry`, `BeachJourneyContent`, `BeachCalendarEvent`, `BeachCalendarEventLabels`, `BeachJourneyFeatures`, `BeachJourneyScene`, `beachWeddingJourneyDefinition`, `beachWeddingJourneyFeatures`, `beachWeddingJourneyDemoContent`, `orderBeachFamilySides`, `buildBeachCalendarEvents`, `isValidBeachGiftAccount`, `buildBeachJourneyScenes`.

The shape mirrors the forest's exactly so the copied modules typecheck against it. Only `resolveScenePose` differs: the rail runs **along** the shore (advancing in `x`, holding a fixed setback in `z`) instead of down a corridor.

- [ ] **Step 1: Write the failing test**

Create `src/data/beach-wedding-journey.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  beachWeddingJourneyDefinition,
  beachWeddingJourneyDemoContent,
  beachWeddingJourneyFeatures,
  buildBeachCalendarEvents,
  buildBeachJourneyScenes,
  orderBeachFamilySides,
  BEACH_SHORE_SETBACK_METRES,
  type BeachJourneyContent,
} from "./beach-wedding-journey";

const demoScenes = buildBeachJourneyScenes(
  beachWeddingJourneyDemoContent,
  beachWeddingJourneyFeatures,
);

test("journey opens at the gate and closes on the pier", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );

  assert.equal(scenes[0]!.type, "cover-gate");
  assert.equal(scenes.at(-1)!.type, "finale");
  assert.ok(scenes.length >= 8, `expected a full journey, received ${scenes.length}`);
});

test("ordinals are dense and sequential", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );

  scenes.forEach((scene, index) => assert.equal(scene.ordinal, index));
});

test("the rail advances along the shore, not into it", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );

  for (let index = 1; index < scenes.length; index += 1) {
    const previous = scenes[index - 1]!;
    const current = scenes[index]!;
    assert.ok(
      current.cameraPosition[0] > previous.cameraPosition[0],
      `scene ${current.id} must advance along x`,
    );
  }
});

test("every camera pose keeps the documented setback from the waterline", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );

  for (const scene of scenes) {
    assert.ok(
      scene.cameraPosition[2] >= BEACH_SHORE_SETBACK_METRES,
      `${scene.id} sits ${scene.cameraPosition[2]}m from the water, closer than the ${BEACH_SHORE_SETBACK_METRES}m setback`,
    );
  }
});

test("travel midpoints keep the setback too", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );

  for (const scene of scenes) {
    if (scene.travelMidpointToNext === null) continue;
    assert.ok(
      scene.travelMidpointToNext[2] >= BEACH_SHORE_SETBACK_METRES,
      `${scene.id} passes ${scene.travelMidpointToNext[2]}m from the water mid-travel; the camera must not cross the setback between scenes either`,
    );
  }
});

test("eye height is human and constant across the walk", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );

  for (const scene of scenes) {
    assert.equal(scene.cameraPosition[1], 1.62);
  }
});

test("only the finale has no midpoint to the next scene", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );

  scenes.forEach((scene, index) => {
    const isLast = index === scenes.length - 1;
    assert.equal(
      scene.travelMidpointToNext === null,
      isLast,
      `${scene.id} midpoint nullity should be ${isLast}`,
    );
  });
});

test("a gallery scene exists per valid photo", () => {
  const scenes = buildBeachJourneyScenes(
    beachWeddingJourneyDemoContent,
    beachWeddingJourneyFeatures,
  );
  const galleryScenes = scenes.filter((scene) => scene.type === "gallery-photo");

  assert.equal(galleryScenes.length, beachWeddingJourneyDemoContent.gallery.length);
  for (const scene of galleryScenes) {
    assert.ok(scene.photo, `${scene.id} must carry its photo`);
  }
});

test("empty content still yields a walkable gate-to-finale journey", () => {
  const scenes = buildBeachJourneyScenes(
    {
      ...beachWeddingJourneyDemoContent,
      ceremonyDate: "",
      ceremonyHeader: "",
      dressCodeColors: [],
      families: {
        brideAddress: "", brideFather: "", brideMother: "", brideParentTitle: "",
        groomAddress: "", groomFather: "", groomMother: "", groomParentTitle: "",
      },
      gallery: [],
      giftAccounts: [],
      mapQuery: "",
      openingMessage: "",
      receptionDate: "",
      schedule: [],
      venueAddress: "",
    },
    { gift: false, map: false, rsvp: false, wishes: false },
  );

  assert.deepEqual(scenes.map((scene) => scene.type), ["cover-gate", "finale"]);
});

const METRE_EPSILON = 1e-9;

function assertMetresEqual(actual: number, expected: number, message: string): void {
  assert.ok(
    Math.abs(actual - expected) < METRE_EPSILON,
    `${message}: expected ${expected}m, received ${actual}m`,
  );
}

test("the shore setback is the documented 7 metres and at least one pose sits on it", () => {
  // Pinned as a literal: every pose's z is *computed* from this constant, so a
  // relative assertion can never catch it shrinking. At 2m the rail reads as the
  // rim of an ornamental pond, which is exactly what the doc comment forbids.
  assert.equal(BEACH_SHORE_SETBACK_METRES, 7);

  const onTheFloor = demoScenes.filter(
    (scene) => Math.abs(scene.cameraPosition[2] - BEACH_SHORE_SETBACK_METRES) < METRE_EPSILON,
  );
  assert.ok(
    onTheFloor.length >= 1,
    "the setback is a floor the walk actually touches, not an unreachable bound",
  );
  assertMetresEqual(demoScenes[0]!.cameraPosition[2], 7, "the gate sits on the setback");
  assertMetresEqual(demoScenes.at(-1)!.cameraPosition[2], 7, "the finale sits on the setback");
});

test("consecutive scenes are a full stride of shoreline apart", () => {
  assertMetresEqual(
    demoScenes[0]!.cameraPosition[0],
    -8,
    "the rail is anchored in world space; shoreline geometry is authored around this origin",
  );

  for (let index = 1; index < demoScenes.length; index += 1) {
    assertMetresEqual(
      demoScenes[index]!.cameraPosition[0] - demoScenes[index - 1]!.cameraPosition[0],
      8.5,
      `${demoScenes[index]!.id} must stand a stride down the beach from its predecessor`,
    );
  }

  const span =
    demoScenes.at(-1)!.cameraPosition[0] - demoScenes[0]!.cameraPosition[0];
  assert.ok(
    span >= 50,
    `the journey must cross a beach, not a doormat; spans only ${span}m`,
  );
});

test("interior scenes drift inland so the walk reads as a stroll, not a rail", () => {
  const interior = demoScenes.slice(1, -1);
  const inland = interior.filter(
    (scene) => scene.cameraPosition[2] > BEACH_SHORE_SETBACK_METRES + METRE_EPSILON,
  );

  assert.ok(inland.length >= 1, "a dead-straight rail is the failure this drift exists to avoid");
  for (const scene of inland) {
    assertMetresEqual(scene.cameraPosition[2], 7.9, `${scene.id} drifts a fixed step inland`);
  }
  assert.ok(
    interior.some(
      (scene) => Math.abs(scene.cameraPosition[2] - BEACH_SHORE_SETBACK_METRES) < METRE_EPSILON,
    ),
    "the drift must alternate back to the setback line, not hold a second parallel rail",
  );
});

test("each camera looks ahead down the beach and slightly seaward", () => {
  for (const scene of demoScenes) {
    assertMetresEqual(
      scene.lookTarget[0] - scene.cameraPosition[0],
      4.5,
      `${scene.id} must look ahead along the shore`,
    );
    assertMetresEqual(scene.lookTarget[1], 1.35, `${scene.id} look height`);
    assertMetresEqual(
      scene.lookTarget[2] - scene.cameraPosition[2],
      -1.1,
      `${scene.id} must angle seaward, keeping sky and water in frame`,
    );
  }
});

test("travel durations are bounded walks, never teleports", () => {
  for (const scene of demoScenes) {
    assert.ok(
      Number.isFinite(scene.travelDurationMs) &&
        scene.travelDurationMs >= 1_200 &&
        scene.travelDurationMs <= 1_800,
      `${scene.id} travels in ${scene.travelDurationMs}ms, outside the 1200-1800ms walk budget`,
    );
  }
  assert.equal(demoScenes[0]!.travelDurationMs, 1_500);
});

test("each midpoint sits halfway along its leg", () => {
  for (let index = 0; index < demoScenes.length - 1; index += 1) {
    const scene = demoScenes[index]!;
    const next = demoScenes[index + 1]!;
    const midpoint = scene.travelMidpointToNext;
    assert.ok(midpoint, `${scene.id} must carry a midpoint to ${next.id}`);
    assertMetresEqual(
      midpoint[0],
      (scene.cameraPosition[0] + next.cameraPosition[0]) / 2,
      `${scene.id} waypoint must sit halfway to ${next.id}`,
    );
    assert.ok(
      midpoint[0] > scene.cameraPosition[0] && midpoint[0] < next.cameraPosition[0],
      `${scene.id} waypoint must lie strictly between the two scenes, not on top of one`,
    );
    assertMetresEqual(midpoint[2], 7.45, `${scene.id} waypoint holds the mid-drift line`);
    assertMetresEqual(
      midpoint[1],
      1.72,
      `${scene.id} waypoint must hold eye height mid-travel, not dip underground or climb into the sky`,
    );
  }
});

test("gallery descriptors trim IDs and keep only the first valid occurrence", () => {
  const content: BeachJourneyContent = {
    ...beachWeddingJourneyDemoContent,
    gallery: [
      { id: " memory-a ", src: " /one.webp " },
      { id: "memory-a", src: "/duplicate.webp" },
      { id: "  ", src: "/invalid.webp" },
      { id: "memory-b", src: " /two.webp " },
    ],
  };

  const galleryScenes = buildBeachJourneyScenes(content, beachWeddingJourneyFeatures).filter(
    (scene) => scene.type === "gallery-photo",
  );

  assert.deepEqual(
    galleryScenes.map((scene) => ({ id: scene.id, photo: scene.photo })),
    [
      { id: "gallery-photo:memory-a", photo: { id: "memory-a", src: "/one.webp" } },
      { id: "gallery-photo:memory-b", photo: { id: "memory-b", src: "/two.webp" } },
    ],
  );
});

test("an account whose owner does not match its side does not add a gift scene", () => {
  const content: BeachJourneyContent = {
    ...beachWeddingJourneyDemoContent,
    giftAccounts: [
      {
        accountName: "Someone Else",
        accountNumber: "123456789",
        bankName: "Example Bank",
        side: "bride",
      },
    ],
  };

  assert.ok(
    !buildBeachJourneyScenes(content, beachWeddingJourneyFeatures).some(
      (scene) => scene.type === "gift",
    ),
    "an account naming someone other than the bride or groom must suppress the gift scene entirely",
  );
});

test("a mixed-validity gift account list does not add a gift scene", () => {
  const content: BeachJourneyContent = {
    ...beachWeddingJourneyDemoContent,
    giftAccounts: [
      ...beachWeddingJourneyDemoContent.giftAccounts,
      {
        accountName: beachWeddingJourneyDemoContent.groomName,
        accountNumber: "",
        bankName: "Beach Journey Demo Bank",
        side: "groom",
      },
    ],
  };

  assert.ok(
    !buildBeachJourneyScenes(content, beachWeddingJourneyFeatures).some(
      (scene) => scene.type === "gift",
    ),
    "one account with a blank number must suppress the gift scene even though the others are valid",
  );
});

test("valid demo accounts do keep the gift scene", () => {
  assert.ok(
    demoScenes.some((scene) => scene.type === "gift"),
    "the demo's fully valid accounts must still produce a gift scene, or the validity gate is rejecting everything",
  );
});

test("calendar event rows distinguish localized ceremony and reception values on different dates", () => {
  assert.deepEqual(
    buildBeachCalendarEvents(
      {
        ceremonyDate: "2026-08-02",
        ceremonyTime: "09:00",
        receptionDate: "2026-08-03",
        receptionTime: "18:30",
      },
      {
        ceremony: "Ceremony",
        formattedCeremonyDate: "August 2, 2026",
        formattedReceptionDate: "August 3, 2026",
        reception: "Reception",
      },
    ),
    [
      {
        date: "2026-08-02",
        formattedDate: "August 2, 2026",
        label: "Ceremony",
        time: "09:00",
      },
      {
        date: "2026-08-03",
        formattedDate: "August 3, 2026",
        label: "Reception",
        time: "18:30",
      },
    ],
  );
});

test("family side ordering follows brideFirst in both orientations", () => {
  assert.deepEqual(orderBeachFamilySides(true), ["bride", "groom"]);
  assert.deepEqual(orderBeachFamilySides(false), ["groom", "bride"]);
});

test("the journey definition keeps a usable camera frustum and look angle", () => {
  const { camera, look, reducedDurationMs } = beachWeddingJourneyDefinition;

  assert.equal(camera.near, 0.1);
  assert.equal(camera.far, 320);
  assert.equal(camera.fovDegrees, 50);
  assert.equal(look.pitchDegrees, 8);
  assert.equal(look.yawDegrees, 20);
  assert.equal(reducedDurationMs, 180);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx tsx --test src/data/beach-wedding-journey.test.ts
```

Expected: FAIL — `Cannot find module './beach-wedding-journey'`.

- [ ] **Step 3: Write the implementation**

Create `src/data/beach-wedding-journey.ts`. Read `src/data/forest-wedding-journey.ts` first and mirror its structure — the type shapes must match so copied modules compile. Reuse its `chungdoiDemoContent["qasr-green"]` demo-content derivation and its `googleCalendarUrl` import verbatim (check the forest file's exact import lines and copy them).

The parts that are genuinely beach-specific:

```ts
export const BEACH_JOURNEY_SCENE_TYPES = [
  "cover-gate",
  "families",
  "opening-message",
  "calendar",
  "schedule",
  "gallery-photo",
  "dress-code",
  "venue",
  "map",
  "rsvp",
  "wishes",
  "gift",
  "finale",
] as const;

export type BeachJourneySceneType = (typeof BEACH_JOURNEY_SCENE_TYPES)[number];
export type BeachJourneyVector3 = readonly [number, number, number];

/**
 * How far inland the rail runs from the still waterline, in metres.
 *
 * Waves are deferred, so the sand/water intersection is a hard static line. Kept
 * in the mid-ground the eye reads it as distance haze; brought into the
 * foreground it reads as the rim of an ornamental pond. When wave foam lands this
 * can be reduced, and `beach-shoreline.ts` is where that change belongs.
 */
export const BEACH_SHORE_SETBACK_METRES = 7;

/** Metres of shoreline between consecutive scenes. */
const SCENE_SPACING_METRES = 8.5;

/** How far inland non-terminal scenes step off the setback line, in metres. */
const SCENE_DRIFT_METRES = 0.9;

export const beachWeddingJourneyDefinition = {
  camera: { far: 320, fovDegrees: 50, near: 0.1 },
  look: { pitchDegrees: 8, yawDegrees: 20 },
  reducedDurationMs: 180,
} as const;

export const beachWeddingJourneyFeatures = {
  gift: true,
  map: true,
  rsvp: true,
  wishes: true,
} as const;

function resolveScenePose(ordinal: number, sceneCount: number) {
  const x = -8 + ordinal * SCENE_SPACING_METRES;
  const isTerminal = ordinal === 0 || ordinal === sceneCount - 1;
  // Terminal scenes sit closest to the water; the rest alternate a small step
  // inland and back so the walk reads as a stroll, never a rail. The drift is
  // measured *inland* from the setback, which is a floor and not a mean — no
  // pose may come closer to the waterline than BEACH_SHORE_SETBACK_METRES.
  const drift = isTerminal ? 0 : ordinal % 2 === 0 ? SCENE_DRIFT_METRES : 0;
  const z = BEACH_SHORE_SETBACK_METRES + drift;

  return {
    cameraPosition: [x, 1.62, z] as BeachJourneyVector3,
    // Look ahead down the beach, angled slightly seaward so sky and water stay
    // in frame without putting the waterline seam under the camera.
    lookTarget: [x + 4.5, 1.35, z - 1.1] as BeachJourneyVector3,
    travelDurationMs: ordinal === 0 ? 1500 : 1350 + (ordinal % 3) * 150,
    travelMidpointToNext:
      ordinal === sceneCount - 1
        ? null
        : ([
            x + SCENE_SPACING_METRES / 2,
            1.72,
            BEACH_SHORE_SETBACK_METRES + SCENE_DRIFT_METRES / 2,
          ] as BeachJourneyVector3),
  };
}
```

Note the setback is a **floor, not a mean**. An earlier draft of this plan had
`drift = ±0.9` around the setback, which put odd-ordinal scenes at 6.1 m and
contradicted the test above. Drift is inland-only, so every pose — including every
travel midpoint — stays at or beyond 7 m.

`buildBeachJourneyScenes` is the forest's `buildForestJourneyScenes` with `Forest` renamed to `Beach` throughout — same conditional descriptor order (families, opening-message, calendar, schedule, gallery photos, dress-code, venue, map, rsvp, wishes, gift, finale), same `hasText` / `sanitizePhoto` / `validGalleryPhotos` / `hasFamilyDetails` / `hasValidSchedule` helpers, same gift-account validation. Keep the forest's lab-only synthetic gift accounts, renaming the bank to `"Beach Journey Demo Bank"`.

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx tsx --test src/data/beach-wedding-journey.test.ts
```

Expected: PASS, 22 tests.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck && npm run typecheck:tests
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/data/beach-wedding-journey.ts src/data/beach-wedding-journey.test.ts
git commit -m "feat(beach): add beach journey scene data with shore-parallel rail"
```

---

## Task 2: Shoreline geometry and the wave-upgrade seam

**Files:**
- Create: `src/components/beach-wedding-journey/beach-shoreline.ts`
- Test: `src/components/beach-wedding-journey/beach-shoreline.test.ts`

**Interfaces:**
- Consumes: `BEACH_SHORE_SETBACK_METRES` from Task 1.
- Produces: `shorelineOffsetAt(x: number): number`, `waterDepthAt(x: number, z: number): number`, `BEACH_SHORE_CURVE_AMPLITUDE_METRES`, `BEACH_WATER_LEVEL_Y`.

This is the single module future wave work modifies. It must be pure, deterministic, and time-invariant **today**, with a test that pins the time-invariance so adding a time term later is a visible, intentional diff rather than an accident.

- [ ] **Step 1: Write the failing test**

Create `src/components/beach-wedding-journey/beach-shoreline.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { BEACH_SHORE_SETBACK_METRES } from "@/data/beach-wedding-journey";

import {
  BEACH_SHORE_CURVE_AMPLITUDE_METRES,
  shorelineOffsetAt,
  waterDepthAt,
} from "./beach-shoreline";

test("the shoreline is deterministic", () => {
  for (const x of [-40, -12.5, 0, 7.25, 33, 118]) {
    assert.equal(shorelineOffsetAt(x), shorelineOffsetAt(x));
  }

  // Depth feeds terrain vertices and frame placement, so it must be as pure as
  // the offset it is built from — on the sand side and out at sea alike.
  for (const x of [-40, -12.5, 0, 7.25, 33, 118]) {
    const shore = shorelineOffsetAt(x);

    for (const z of [shore + 12, shore + 0.5, shore, shore - 0.5, shore - 9, shore - 45]) {
      assert.equal(waterDepthAt(x, z), waterDepthAt(x, z), `depth wandered at x=${x}, z=${z}`);
    }
  }
});

test("the shoreline curves rather than running straight", () => {
  const samples = Array.from({ length: 64 }, (_, index) => shorelineOffsetAt(index * 2.5));
  const spread = Math.max(...samples) - Math.min(...samples);

  assert.ok(spread > 1, `a straight waterline reads as a pond rim; spread was ${spread}`);
});

test("the curve stays inside its documented amplitude", () => {
  for (let x = -120; x <= 120; x += 0.5) {
    assert.ok(
      Math.abs(shorelineOffsetAt(x)) <= BEACH_SHORE_CURVE_AMPLITUDE_METRES,
      `offset at x=${x} escaped the amplitude envelope`,
    );
  }
});

test("depth is zero on the sand side and positive seaward", () => {
  const x = 12;
  const shore = shorelineOffsetAt(x);

  assert.equal(waterDepthAt(x, shore + 3), 0, "sand must not be underwater");
  assert.ok(waterDepthAt(x, shore - 3) > 0, "sea must have depth");
});

test("depth increases monotonically out to sea", () => {
  const x = -6;
  const shore = shorelineOffsetAt(x);
  let previous = 0;

  for (let step = 0; step <= 40; step += 1) {
    const depth = waterDepthAt(x, shore - step);
    assert.ok(depth >= previous, `depth dipped at step ${step}`);
    previous = depth;
  }
});

test("depth is continuous across the waterline", () => {
  const x = 3.5;
  const shore = shorelineOffsetAt(x);

  assert.equal(waterDepthAt(x, shore), 0, "the waterline itself is the zero-depth edge");
  assert.equal(waterDepthAt(x, shore + 0.1), 0, "sand just landward of the line stays dry");

  // Sampled just *seaward* of the line, where the ramp is actually evaluated.
  // Reading exactly at the line only exercises the `seawardMetres <= 0` guard,
  // which returns a literal 0 regardless of how the ramp is shaped or tuned.
  const near = waterDepthAt(x, shore - 0.1);
  const far = waterDepthAt(x, shore - 0.2);

  assert.ok(near < 0.02, `there must be no cliff at the waterline; depth 10cm out was ${near}m`);
  assert.ok(far > 0, "the floor must still be descending 20cm out, or the ratio below is vacuous");

  // Smoothstep leaves the waterline flat, so depth grows slower than linearly
  // out of the shallows: halving the distance from the line must do more than
  // halve the depth. A plain linear ramp would sit at exactly 0.5 here, and a
  // ramp short enough to saturate immediately would sit at 1.
  assert.ok(
    near / far < 0.35,
    `the floor leaves the waterline as a wedge, not a flat: depth fell only to ${near / far} ` +
      "of its 20cm value at 10cm",
  );
});

/**
 * Waves are deferred. When they land, `waterDepthAt` gains a time term and this
 * test must be updated deliberately — it exists so that change cannot slip in
 * unnoticed, and so the wave work inherits a regression net.
 *
 * Arity alone is not enough: a time term added as a defaulted third parameter
 * leaves `.length` at 2, and a `Date.now()` read inside the body changes no
 * signature at all. So this also pins the result across real elapsed wall-clock
 * time, and pins it against a spurious third argument.
 */
test("depth is time-invariant while waves are deferred", () => {
  assert.equal(waterDepthAt.length, 2, "waterDepthAt still takes exactly (x, z)");

  const x = 9.5;
  const z = shorelineOffsetAt(x) - 6;
  const baseline = waterDepthAt(x, z);

  const startedAt = Date.now();
  while (Date.now() - startedAt < 5) {
    assert.equal(waterDepthAt(x, z), baseline, "depth drifted with the wall clock");
  }
  assert.ok(Date.now() > startedAt, "the interval must actually elapse for this to bite");

  // A defaulted time parameter would still type-check against this signature.
  const withSpuriousTime: (x: number, z: number, timeSeconds: number) => number = waterDepthAt;
  for (const timeSeconds of [0.25, 3, 1000]) {
    assert.equal(
      withSpuriousTime(x, z, timeSeconds),
      baseline,
      `depth responded to a time argument (${timeSeconds}s)`,
    );
  }
});

/**
 * The module documents its two sine periods as incommensurable "so the curve
 * never visibly repeats along the walk". Spread alone cannot see a violation: a
 * secondary period that divides evenly into the primary keeps the same envelope
 * while making the curve exactly periodic, so the walker passes the identical
 * waterline three times over the 119m journey. Both periods are module-private,
 * so the primary is restated here — 37m, the outer sine's wavelength and the
 * shortest span the whole curve could repeat over.
 */
const PRIMARY_PERIOD_METRES = 37;
const MINIMUM_PERIOD_DIVERGENCE_METRES = 0.5;

test("the curve does not repeat at the primary period", () => {
  let widestDivergence = 0;

  for (let x = -8; x <= 111; x += 0.25) {
    const divergence = Math.abs(shorelineOffsetAt(x) - shorelineOffsetAt(x + PRIMARY_PERIOD_METRES));
    widestDivergence = Math.max(widestDivergence, divergence);
  }

  assert.ok(
    widestDivergence > MINIMUM_PERIOD_DIVERGENCE_METRES,
    `the waterline repeats every ${PRIMARY_PERIOD_METRES}m along the walk; the widest ` +
      `divergence across a full period was only ${widestDivergence}m`,
  );
});

/**
 * The load-bearing cross-module invariant: the camera rail sits at a fixed z of
 * BEACH_SHORE_SETBACK_METRES, so the curving waterline must never reach it. If
 * the curve ever crosses the rail the walker is standing in the sea. Swept well
 * past the journey's own span (the rail runs x = -8 to about x = 111) because
 * terrain and water tiles are built beyond the walked range.
 */
const MINIMUM_DRY_CLEARANCE_METRES = 1;

test("the camera rail never falls seaward of the waterline", () => {
  for (let x = -120; x <= 240; x += 0.5) {
    const shore = shorelineOffsetAt(x);
    const clearance = BEACH_SHORE_SETBACK_METRES - shore;

    assert.ok(
      clearance >= MINIMUM_DRY_CLEARANCE_METRES,
      `the rail at z=${BEACH_SHORE_SETBACK_METRES} is only ${clearance}m inland of the waterline ` +
        `at x=${x} (offset ${shore}); it needs at least ${MINIMUM_DRY_CLEARANCE_METRES}m`,
    );
    assert.equal(
      waterDepthAt(x, BEACH_SHORE_SETBACK_METRES),
      0,
      `the camera is standing in ${waterDepthAt(x, BEACH_SHORE_SETBACK_METRES)}m of water at x=${x}`,
    );
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx tsx --test src/components/beach-wedding-journey/beach-shoreline.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/components/beach-wedding-journey/beach-shoreline.ts`:

```ts
/**
 * Shore geometry, and the seam the deferred wave work attaches to.
 *
 * Wave foam needs a water-depth function and a time phase. Depth lives here and
 * is time-invariant today; adding waves means adding a time term to
 * `waterDepthAt` and a foam term to the water material. Terrain, rail, framing
 * and scene modules read this module and do not need to change.
 */

/** Peak excursion of the waterline from its mean line, in metres. */
export const BEACH_SHORE_CURVE_AMPLITUDE_METRES = 2.4;

/** World-space y of the still water surface. Sand meets it at the waterline. */
export const BEACH_WATER_LEVEL_Y = 0;

/** How far out to sea the floor takes to reach full depth, in metres. */
const DEPTH_RAMP_METRES = 26;

/** Full depth of the open water plane, in metres. */
const MAX_DEPTH_METRES = 3.2;

/**
 * Two incommensurable sine periods, so the curve never visibly repeats along the
 * walk while remaining a pure function of x — no seeded RNG, no state.
 */
const PRIMARY_PERIOD_METRES = 37;
const SECONDARY_PERIOD_METRES = 13.5;

export function shorelineOffsetAt(x: number): number {
  const primary = Math.sin((x / PRIMARY_PERIOD_METRES) * Math.PI * 2);
  const secondary = Math.sin((x / SECONDARY_PERIOD_METRES) * Math.PI * 2 + 1.1);

  return BEACH_SHORE_CURVE_AMPLITUDE_METRES * (primary * 0.68 + secondary * 0.32);
}

export function waterDepthAt(x: number, z: number): number {
  const seawardMetres = shorelineOffsetAt(x) - z;
  if (seawardMetres <= 0) return 0;

  const ramp = Math.min(seawardMetres / DEPTH_RAMP_METRES, 1);
  // Smoothstep, so the floor leaves the waterline flat instead of as a step.
  return MAX_DEPTH_METRES * ramp * ramp * (3 - 2 * ramp);
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx tsx --test src/components/beach-wedding-journey/beach-shoreline.test.ts
```

Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/beach-wedding-journey/beach-shoreline.ts src/components/beach-wedding-journey/beach-shoreline.test.ts
git commit -m "feat(beach): add shoreline geometry and wave-upgrade seam"
```

---

## Task 3: Asset pipeline — download, verify, convert

**Files:**
- Create: `scripts/prepare-beach-photoreal-assets.mjs`
- Modify: `package.json` (add one script line)
- Read for reference (do not modify): `scripts/prepare-forest-photoreal-assets.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: files under `public/chungdoi/labs/beach-wedding-journey/photoreal/` — `sand-color.webp`, `sand-normal.webp`, `sand-arm.webp`, `water-normal.webp`, `pier-planks-color.webp`, `pier-planks-normal.webp`, `pier-planks-arm.webp`, `frame-01-color.webp`, `frame-01-normal.webp`, `frame-01-arm.webp`, `frame-02-color.webp`, `frame-02-normal.webp`, `frame-02-arm.webp`, `sky.hdr`, and `beach-asset-bytes.json` (the measured byte table Task 4 consumes).

Every checksum below was verified against the live Poly Haven API. Copy `loadVerifiedSource`, `getArgument` and `digest` from the forest script unchanged.

- [ ] **Step 1: Write the script**

Create `scripts/prepare-beach-photoreal-assets.mjs`. Start from the forest script's imports and helpers, then use these sources:

```js
const POLY_HAVEN_SOURCES = Object.freeze({
  frame01Arm: {
    filename: "hanging_picture_frame_01_arm_1k.jpg",
    md5: "8d9dd625ec0705f3ac0a2ec2b402844e",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/hanging_picture_frame_01/hanging_picture_frame_01_arm_1k.jpg",
  },
  frame01Color: {
    filename: "hanging_picture_frame_01_diff_1k.jpg",
    md5: "4311cd03620cafa59976f9e8b7b26f88",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/hanging_picture_frame_01/hanging_picture_frame_01_diff_1k.jpg",
  },
  frame01Normal: {
    filename: "hanging_picture_frame_01_nor_gl_1k.jpg",
    md5: "2ff7cca9a9b2918b5476d39c13592214",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/hanging_picture_frame_01/hanging_picture_frame_01_nor_gl_1k.jpg",
  },
  frame02Arm: {
    filename: "hanging_picture_frame_02_arm_1k.jpg",
    md5: "01e09bbe488c7a2953b5a207fdf192ca",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/hanging_picture_frame_02/hanging_picture_frame_02_arm_1k.jpg",
  },
  frame02Color: {
    filename: "hanging_picture_frame_02_diff_1k.jpg",
    md5: "906c164baad3f02b67244998b7558a9c",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/hanging_picture_frame_02/hanging_picture_frame_02_diff_1k.jpg",
  },
  frame02Normal: {
    filename: "hanging_picture_frame_02_nor_gl_1k.jpg",
    md5: "bc686a415608ae66bd88f70d081fd572",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/hanging_picture_frame_02/hanging_picture_frame_02_nor_gl_1k.jpg",
  },
  hdri: {
    filename: "umhlanga_sunrise_1k.hdr",
    md5: "9fb1501bb5ec41e7909a8dc497638501",
    url: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/umhlanga_sunrise_1k.hdr",
  },
  pierPlanksArm: {
    filename: "modular_wooden_pier_planks_arm_1k.jpg",
    md5: "e6ffdf7314cc015aaa5c0899326b42a7",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/modular_wooden_pier/modular_wooden_pier_planks_arm_1k.jpg",
  },
  pierPlanksColor: {
    filename: "modular_wooden_pier_planks_diff_1k.jpg",
    md5: "f3fef39b0ec16e4006678c846d3601ab",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/modular_wooden_pier/modular_wooden_pier_planks_diff_1k.jpg",
  },
  pierPlanksNormal: {
    filename: "modular_wooden_pier_planks_nor_gl_1k.jpg",
    md5: "b752108fe7504d5dd4ae0f4701b1218b",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/modular_wooden_pier/modular_wooden_pier_planks_nor_gl_1k.jpg",
  },
  sandArm: {
    filename: "coast_sand_01_arm_1k.jpg",
    md5: "f044891a328d284c9e7cd46da12fa45d",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/coast_sand_01/coast_sand_01_arm_1k.jpg",
  },
  sandColor: {
    filename: "coast_sand_01_diff_1k.jpg",
    md5: "a1e243fc8635806381505c7dc44b192a",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/coast_sand_01/coast_sand_01_diff_1k.jpg",
  },
  sandNormal: {
    filename: "coast_sand_01_nor_gl_1k.jpg",
    md5: "38bbe6863249a3d20d8417c9db207780",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/coast_sand_01/coast_sand_01_nor_gl_1k.jpg",
  },
  wetSandArm: {
    filename: "damp_sand_arm_1k.jpg",
    md5: "c4653c6996f55d919bf89fe3f21920de",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/damp_sand/damp_sand_arm_1k.jpg",
  },
  wetSandColor: {
    filename: "damp_sand_diff_1k.jpg",
    md5: "fd55de6d79f938dbf5cc0f5e1f473c6c",
    url: "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/damp_sand/damp_sand_diff_1k.jpg",
  },
});

const ENTRY_COMPRESSED_BUDGET = 4_000_000;
const SHARED_COMPRESSED_BUDGET = 12_000_000;
const SAND_TEXTURE_SIZE = 1_024;
const WATER_NORMAL_SIZE = 512;
/**
 * Pier planks ship at 1k: the deck is a large tiled surface the camera walks
 * along, so halving it reads as mush underfoot.
 */
const PIER_TEXTURE_SIZE = 1_024;
/**
 * Frame maps ship at 512, forced by the 64MB decoded-texture ceiling.
 *
 * Nine prop maps at 1k decode to 50.3MB, which with the 21.0MB entry group and
 * the 16.8MB worst case of three live 1k gallery photos totals 88.1MB — 21.0MB
 * over. Frames are narrow mouldings around the photos, so they lose the least
 * from 512; the ceiling is a hard constraint and is never the thing that moves.
 * This leaves 4.2MB (6%) of headroom, so any later task adding a texture must
 * recompute the decoded total rather than assume room exists.
 */
const FRAME_TEXTURE_SIZE = 512;
```

Sand encoding — resize to 1024 with Lanczos3, drop alpha, and blend the damp-sand maps into a band so the waterline is not a clean edge. The wet band occupies the seaward third of the tile's V axis:

```js
const WET_BAND_START_V = 0.62;
const WET_BAND_FEATHER_V = 0.16;

/**
 * Alpha mask for compositing damp sand over dry along the tile's V axis, so the
 * shore edge carries damp texture instead of meeting the water as a clean line.
 */
async function createWetBandMask(size) {
  const mask = Buffer.alloc(size * size);
  for (let y = 0; y < size; y += 1) {
    const v = y / (size - 1);
    const ramp = (v - WET_BAND_START_V) / WET_BAND_FEATHER_V;
    const coverage = Math.max(0, Math.min(1, ramp));
    // Smoothstep, so the band's inland edge is a gradient, not a stripe.
    const alpha = Math.round(255 * coverage * coverage * (3 - 2 * coverage));
    mask.fill(alpha, y * size, (y + 1) * size);
  }
  return mask;
}

async function encodeSandMap(dryPath, wetPath, destination, { dataMap }) {
  const size = SAND_TEXTURE_SIZE;
  const resize = { fit: "fill", kernel: sharp.kernel.lanczos3 };

  const dry = sharp(dryPath).resize(size, size, resize).removeAlpha();
  const wetBase = await sharp(wetPath)
    .resize(size, size, resize)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const mask = await createWetBandMask(size);

  // Interleave the mask as the wet layer's alpha so `composite` blends per pixel.
  const wetRgba = Buffer.alloc(size * size * 4);
  for (let index = 0; index < size * size; index += 1) {
    wetRgba[index * 4] = wetBase.data[index * 3];
    wetRgba[index * 4 + 1] = wetBase.data[index * 3 + 1];
    wetRgba[index * 4 + 2] = wetBase.data[index * 3 + 2];
    wetRgba[index * 4 + 3] = mask[index];
  }

  let image = dry.composite([
    { input: wetRgba, raw: { channels: 4, height: size, width: size } },
  ]);
  if (!dataMap) {
    // Warm the dry sand toward golden hour; data maps must not be tinted.
    image = image.linear([1.04, 1.0, 0.94], [0, 0, 0]);
  }

  await image.webp({ effort: 6, lossless: false, quality: 88 }).toFile(destination);
}
```

Water normal — generated, because no CC0 source exists. Seamless by construction: the noise lattice wraps, so opposite edges match exactly.

```js
const WATER_NOISE_SEED = 0x5eab1234;
const WATER_NOISE_OCTAVES = Object.freeze([
  { amplitude: 1.0, period: 64 },
  { amplitude: 0.5, period: 32 },
  { amplitude: 0.25, period: 16 },
]);
/**
 * Normal-map slope strength. `Water` wants long swell, not choppy detail.
 *
 * Measured at 10 (this value): max tilt 27.88deg, byte levels X 112 / Y 111 /
 * Z 16, min Z byte 240, every normal unit length (max error 0.0052), none
 * inverted or degenerate, all 262,144 Z-dominant. Reference points from the same
 * harness: 1.35 -> 4.27deg / X 18, 8 -> 23.26deg / X 94, 14 -> 36.74deg / X 144,
 * 20 -> 46.60deg / X 177 but 43 pixels lose Z-dominance. 1.35 was the plan's
 * original value, tuned against the broken white-noise field whose gradients ran
 * ~10x larger; on the corrected smooth field it leaves Z a constant 255 and uses
 * 18 of 256 levels in X and Y. Quantisation is baked into the texture, so a
 * runtime multiplier cannot recover it.
 */
const WATER_NORMAL_STRENGTH = 10;
/**
 * Max per-channel delta allowed between opposite tile edges.
 *
 * The wrapping lattice makes the tile seamless by construction, so this only
 * ever trips when the generator itself breaks — which is exactly how the white
 * noise field shipped: the seam check lived in a manual verification step
 * outside the script instead of in this path.
 */
const WATER_SEAM_TOLERANCE = 12;

/** Deterministic integer hash — no Math.random, so output is reproducible. */
function hashLattice(x, y, seed) {
  let h = (x * 374_761_393 + y * 668_265_263 + seed) | 0;
  h = (h ^ (h >>> 13)) * 1_274_126_177;
  return ((h ^ (h >>> 16)) >>> 0) / 4_294_967_295;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

/** Value noise on a wrapping lattice, so the tile is seamless in both axes. */
function tilingValueNoise(x, y, period, size, seed) {
  // `period` is the lattice cell size in pixels, so the tile spans `size / period`
  // cells and `wrap` closes the loop at the tile edge. Deriving this as
  // `period / size` instead advances the lattice index by `size / period` per pixel
  // — every pixel lands in its own cell, which is white noise, not value noise —
  // and pushes the wrap modulus beyond any `x` reached, so the tile never wraps.
  // Measured: `period / size` fails the Step 4 seam gate at delta 152; `period`
  // gives delta 1, and the file drops from ~640 KB to ~44 KB.
  const scale = period;
  const gx = x / scale;
  const gy = y / scale;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const cells = Math.round(size / scale);
  const wrap = (value) => ((value % cells) + cells) % cells;
  const fx = smoothstep(gx - x0);
  const fy = smoothstep(gy - y0);

  const c00 = hashLattice(wrap(x0), wrap(y0), seed);
  const c10 = hashLattice(wrap(x0 + 1), wrap(y0), seed);
  const c01 = hashLattice(wrap(x0), wrap(y0 + 1), seed);
  const c11 = hashLattice(wrap(x0 + 1), wrap(y0 + 1), seed);

  return (
    c00 * (1 - fx) * (1 - fy) +
    c10 * fx * (1 - fy) +
    c01 * (1 - fx) * fy +
    c11 * fx * fy
  );
}

function sampleWaterHeight(x, y, size) {
  let height = 0;
  let total = 0;
  for (const [index, octave] of WATER_NOISE_OCTAVES.entries()) {
    height +=
      octave.amplitude *
      tilingValueNoise(x, y, octave.period, size, WATER_NOISE_SEED + index * 7_919);
    total += octave.amplitude;
  }
  return height / total;
}

/**
 * Largest per-channel difference between the tile's opposite edges.
 *
 * Read off the raw RGB the encoder is about to hand to Sharp: the WebP is
 * lossless, so the buffer and the file agree byte for byte.
 */
function maxOppositeEdgeDelta(rgb, size) {
  let columns = 0;
  let rows = 0;
  for (let index = 0; index < size; index += 1) {
    for (let channel = 0; channel < 3; channel += 1) {
      const lastColumn = (index * size + size - 1) * 3 + channel;
      const firstColumn = index * size * 3 + channel;
      columns = Math.max(columns, Math.abs(rgb[lastColumn] - rgb[firstColumn]));

      const lastRow = ((size - 1) * size + index) * 3 + channel;
      const firstRow = index * 3 + channel;
      rows = Math.max(rows, Math.abs(rgb[lastRow] - rgb[firstRow]));
    }
  }
  return { columns, rows };
}

async function encodeWaterNormal(destination) {
  const size = WATER_NORMAL_SIZE;
  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      heights[y * size + x] = sampleWaterHeight(x, y, size);
    }
  }

  const wrapIndex = (value) => ((value % size) + size) % size;
  const rgb = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // Central differences on the wrapping lattice keep the edges seamless.
      const dx =
        heights[y * size + wrapIndex(x + 1)] - heights[y * size + wrapIndex(x - 1)];
      const dy =
        heights[wrapIndex(y + 1) * size + x] - heights[wrapIndex(y - 1) * size + x];
      const nx = -dx * WATER_NORMAL_STRENGTH;
      const ny = -dy * WATER_NORMAL_STRENGTH;
      const length = Math.hypot(nx, ny, 1);
      const offset = (y * size + x) * 3;
      rgb[offset] = Math.round(((nx / length) * 0.5 + 0.5) * 255);
      rgb[offset + 1] = Math.round(((ny / length) * 0.5 + 0.5) * 255);
      rgb[offset + 2] = Math.round(((1 / length) * 0.5 + 0.5) * 255);
    }
  }

  // Assert before writing: a tile that does not wrap must not reach the output
  // directory, and the failure has to name the axis so the generator is the
  // first place to look.
  const seam = maxOppositeEdgeDelta(rgb, size);
  const worstDelta = Math.max(seam.columns, seam.rows);
  if (worstDelta > WATER_SEAM_TOLERANCE) {
    throw new Error(
      `water-normal tile is not seamless: max opposite-edge delta ${worstDelta} (columns ${seam.columns}, rows ${seam.rows}) exceeds ${WATER_SEAM_TOLERANCE} — the noise lattice is not wrapping`,
    );
  }

  await sharp(rgb, { raw: { channels: 3, height: size, width: size } })
    .webp({ effort: 6, lossless: true })
    .toFile(destination);

  console.log(
    `water-normal seam delta ${worstDelta} / ${WATER_SEAM_TOLERANCE} (columns ${seam.columns}, rows ${seam.rows})`,
  );
}
```

Wood and frame maps use a plain 1024 Lanczos3 → WebP encode (quality 88, data maps untinted). Copy the HDRI through byte-for-byte — it must stay radiance-encoded, so **do not** run it through Sharp.

Finally, write `beach-asset-bytes.json` mapping each output id to its actual byte size, and assert the entry group is under `ENTRY_COMPRESSED_BUDGET` and shared under `SHARED_COMPRESSED_BUDGET`, throwing with the measured totals if not. Also record each source's SHA-256 in the output JSON so Task 9 can transcribe provenance without re-downloading.

- [ ] **Step 2: Add the npm script**

In `package.json`, add to `"scripts"`:

```json
"beach:prepare-assets": "node scripts/prepare-beach-photoreal-assets.mjs"
```

- [ ] **Step 3: Run the pipeline**

```bash
npm run beach:prepare-assets
```

Expected: downloads 15 sources, all MD5 checks pass, writes 13 WebP files + `sky.hdr` + `beach-asset-bytes.json`, prints entry and shared totals under budget. If a checksum fails, stop — do not proceed with an unverified asset.

- [ ] **Step 4: Verify the generated water normal is seamless**

`encodeWaterNormal` asserts the seam itself before it writes, so a run that
reaches Step 3's success output has already passed the gate — it prints
`water-normal seam delta <n> / 12 (columns <n>, rows <n>)`. Confirm that line
appeared, then verify the encoded file independently, because the in-script
check reads the raw buffer rather than the WebP on disk:

```bash
node -e "
const sharp = require('sharp');
sharp('public/chungdoi/labs/beach-wedding-journey/photoreal/water-normal.webp')
  .raw().toBuffer({ resolveWithObject: true }).then(({ data, info }) => {
    const { width: w, height: h, channels: c } = info;
    let maxEdgeDelta = 0;
    for (let y = 0; y < h; y++) {
      for (let k = 0; k < 3; k++) {
        maxEdgeDelta = Math.max(maxEdgeDelta,
          Math.abs(data[(y*w)*c+k] - data[(y*w+w-1)*c+k]));
      }
    }
    for (let x = 0; x < w; x++) {
      for (let k = 0; k < 3; k++) {
        maxEdgeDelta = Math.max(maxEdgeDelta,
          Math.abs(data[x*c+k] - data[((h-1)*w+x)*c+k]));
      }
    }
    console.log('max opposite-edge delta:', maxEdgeDelta);
    if (maxEdgeDelta > 12) { console.error('NOT SEAMLESS'); process.exit(1); }
  });
"
```

Expected: a small delta and no `NOT SEAMLESS`. Measured at strength 10: delta 8
(columns 8, rows 6). Adjacent lattice cells differ slightly, so a delta up to
12/255 is fine; a broken lattice shows up in the hundreds — reverting `scale` to
`period / size` trips the in-script assertion at delta 249 and writes nothing.

- [ ] **Step 5: Commit**

```bash
git add scripts/prepare-beach-photoreal-assets.mjs package.json public/chungdoi/labs/beach-wedding-journey/
git commit -m "feat(beach): add deterministic beach asset pipeline"
```

---

## Task 4: Asset manifest with measured bytes

**Files:**
- Create: `src/components/beach-wedding-journey/photoreal/beach-asset-manifest.ts`
- Test: `src/components/beach-wedding-journey/photoreal/beach-asset-manifest.test.ts`
- Read for reference (do not modify): `src/components/forest-wedding-journey/photoreal/forest-asset-manifest.ts`

**Interfaces:**
- Consumes: the files and `beach-asset-bytes.json` from Task 3.
- Produces: `BeachPhotorealAsset` (`{ blocking, group: "entry" | "props", height, id, src, width }`), `BeachPhotorealAssetEstimate`, `BEACH_PHOTOREAL_ASSETS`, `getBeachPhotorealAssetEstimate(group: "entry" | "shared")`.

Mirror the forest manifest exactly, including `getDecodedRgbaMipBytes` = `ceil(w * h * 4 * 4 / 3)`. **Transcribe the byte table from the actual `beach-asset-bytes.json` produced in Task 3** — the forest's provenance doc drifted from its manifest by hand-editing numbers, and the test below is what prevents a repeat.

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import {
  BEACH_PHOTOREAL_ASSETS,
  getBeachPhotorealAssetEstimate,
} from "./beach-asset-manifest";

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const ENTRY_COMPRESSED_BUDGET = 4_000_000;
const SHARED_COMPRESSED_BUDGET = 12_000_000;
const DECODED_TEXTURE_CEILING = 64 * 1_024 * 1_024;

test("every declared asset exists on disk", () => {
  for (const asset of BEACH_PHOTOREAL_ASSETS) {
    const filePath = path.join(PUBLIC_ROOT, asset.src);
    assert.ok(statSync(filePath).isFile(), `${asset.id} missing at ${asset.src}`);
  }
});

test("declared bytes match the bytes on disk", () => {
  const measured = getBeachPhotorealAssetEstimate("shared");
  const actual = measured.assets.reduce(
    (total, asset) => total + statSync(path.join(PUBLIC_ROOT, asset.src)).size,
    0,
  );

  assert.equal(
    measured.compressedBytes,
    actual,
    "manifest byte table drifted from disk — re-run npm run beach:prepare-assets and transcribe",
  );
});

test("the manifest agrees with the pipeline's byte table", () => {
  const table = JSON.parse(
    readFileSync(
      path.join(
        PUBLIC_ROOT,
        "chungdoi/labs/beach-wedding-journey/photoreal/beach-asset-bytes.json",
      ),
      "utf8",
    ),
  ) as Record<string, number>;

  for (const asset of BEACH_PHOTOREAL_ASSETS) {
    assert.equal(
      statSync(path.join(PUBLIC_ROOT, asset.src)).size,
      table[asset.id],
      `${asset.id} disagrees with beach-asset-bytes.json`,
    );
  }
});

test("entry assets fit the delivery budget", () => {
  const entry = getBeachPhotorealAssetEstimate("entry");
  assert.ok(
    entry.compressedBytes <= ENTRY_COMPRESSED_BUDGET,
    `entry pack is ${entry.compressedBytes} bytes`,
  );
  assert.ok(entry.assets.every((asset) => asset.blocking));
});

test("shared assets fit the delivery budget", () => {
  const shared = getBeachPhotorealAssetEstimate("shared");
  assert.ok(
    shared.compressedBytes <= SHARED_COMPRESSED_BUDGET,
    `shared pack is ${shared.compressedBytes} bytes`,
  );
});

test("decoded textures leave room for three live gallery photos", () => {
  const shared = getBeachPhotorealAssetEstimate("shared");
  // Three 1024x1024 RGBA photos with mips, the worst case the lab ever holds.
  const galleryBytes = 3 * Math.ceil(1_024 * 1_024 * 4 * 4 / 3);

  assert.ok(
    shared.decodedRgbaMipBytes + galleryBytes <= DECODED_TEXTURE_CEILING,
    `decoded total ${shared.decodedRgbaMipBytes + galleryBytes} exceeds the 64MB ceiling`,
  );
});

test("asset ids are unique", () => {
  const ids = BEACH_PHOTOREAL_ASSETS.map((asset) => asset.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("only entry assets block world readiness", () => {
  for (const asset of BEACH_PHOTOREAL_ASSETS) {
    assert.equal(asset.blocking, asset.group === "entry", `${asset.id} blocking mismatch`);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx tsx --test src/components/beach-wedding-journey/photoreal/beach-asset-manifest.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the manifest**

Entry group (blocking): `sandColor`, `sandNormal`, `sandArm` (1024×1024 each), `waterNormal` (512×512), `sky` (`sky.hdr`, dimensions 1024×512). Props group (non-blocking): the three pier maps at 1024×1024 and the six frame maps at **512×512**. Transcribe every byte value from `beach-asset-bytes.json`.

Frames are 512 because the 64MB decoded ceiling forces it: nine prop maps at 1k decode to 50.3MB, which with the 21.0MB entry group and the 16.8MB worst case of three live 1k gallery photos totals 88.1MB — 21.0MB over. Pier planks keep 1k (large tiled deck the camera walks along); frames are narrow mouldings and lose the least. Decoded total lands at 62.9MB, leaving only 6% headroom, so a later task adding any texture must recompute rather than assume room exists.

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx tsx --test src/components/beach-wedding-journey/photoreal/beach-asset-manifest.test.ts
```

Expected: PASS, 8 tests. If the decoded-texture test fails, the fix is fewer or smaller maps — **not** raising the ceiling.

- [ ] **Step 5: Commit**

```bash
git add src/components/beach-wedding-journey/photoreal/beach-asset-manifest.ts src/components/beach-wedding-journey/photoreal/beach-asset-manifest.test.ts
git commit -m "feat(beach): add asset manifest with measured byte table"
```

---

## Task 5: Copy the journey mechanics

**Files:**
- Create: `src/components/beach-wedding-journey/beach-journey-controller.ts` + `.test.ts`
- Create: `src/components/beach-wedding-journey/beach-cue-state.ts` + `.test.ts`
- Create: `src/components/beach-wedding-journey/use-beach-journey-input.ts` + `beach-journey-input.test.ts` (the forest test file is `forest-journey-input.test.ts`, not `use-forest-journey-input.test.ts`)
- Create: `src/components/beach-wedding-journey/beach-world-data.ts` + `.test.ts`
- Create: `src/components/beach-wedding-journey/beach-scene-framing.ts` + `.test.ts`
- Create: `src/components/beach-wedding-journey/beach-frame-geometry.ts` + `.test.ts`
- Read for reference (do not modify): the corresponding `forest-*` files

**Interfaces:**
- Consumes: `beachWeddingJourneyDefinition`, `BeachJourneyScene`, `BeachJourneySceneType` (Task 1); `shorelineOffsetAt` (Task 2).
- Produces: `createInitialBeachJourneyState`, `beachJourneyReducer`, `BeachJourneyPhase`, `BeachNavigationSource`, `BeachJourneyState`, `BeachJourneyAction`; `createInitialBeachJourneyCueState`, `evaluateBeachCue`, `BeachCueValues`, `BeachJourneyCueState`, `BeachCueEvaluation`; `useBeachJourneyInput`, `classifyBeachJourneyGesture`, `resolveBeachWheelNavigation`, `resolveBeachWheelBurstNavigation`, `resolveBeachPointerGesture`, `isBeachJourneyInteractiveElement`, `isBeachJourneyNativeControlElement`, `BeachJourneyGesture`, `BeachJourneyInputHandlers`, `BeachPointerOrientation`; `BeachWorldViewport`, `BeachWorldQualityTier`, `BeachWorldDensity`, `getInitialBeachWorldQualityTier`, `getBeachWorldDensity`, `createBeachAdaptiveQualitySampler`, `BeachAdaptiveQualitySampler`, `estimateExactRgbaMipBytes`; `createBeachCameraScenes`; `BEACH_GALLERY_PRINT_SIZE`, `getBeachFrameGeometry`, `BeachFrameGeometry`.

This is mechanical renaming, and its risk is a silent divergence rather than a compile error. The header comment and the mirrored tests are what make a one-sided fix visible later.

- [ ] **Step 1: Copy the four mechanics modules and their tests**

```bash
cd /Users/namdo/Documents/learning/clone
for pair in "forest-journey-controller.ts:beach-journey-controller.ts" \
            "forest-journey-controller.test.ts:beach-journey-controller.test.ts" \
            "forest-cue-state.ts:beach-cue-state.ts" \
            "forest-cue-state.test.ts:beach-cue-state.test.ts" \
            "use-forest-journey-input.ts:use-beach-journey-input.ts" \
            "forest-journey-input.test.ts:beach-journey-input.test.ts" \
            "forest-world-data.ts:beach-world-data.ts" \
            "forest-world-data.test.ts:beach-world-data.test.ts" \
            "forest-scene-framing.ts:beach-scene-framing.ts" \
            "forest-scene-framing.test.ts:beach-scene-framing.test.ts" \
            "forest-gallery-geometry.ts:beach-frame-geometry.ts" \
            "forest-gallery-geometry.test.ts:beach-frame-geometry.test.ts"; do
  src="src/components/forest-wedding-journey/${pair%%:*}"
  dest="src/components/beach-wedding-journey/${pair##*:}"
  cp "$src" "$dest"
done
ls src/components/beach-wedding-journey/
```

Expected: 11 new files alongside `beach-shoreline.ts` and its test.

- [ ] **Step 2: Rename identifiers and add the twin header**

In each copied file: `Forest` → `Beach`, `forest` → `beach`, `FOREST_` → `BEACH_`, and update `@/data/forest-wedding-journey` imports to `@/data/beach-wedding-journey`. Prepend to each file, with `<file>` replaced by the actual forest filename:

```ts
// Copied from src/components/forest-wedding-journey/<file>. Fixes to journey
// mechanics must be applied to both.
```

Then make these beach-specific adjustments:

`beach-world-data.ts` — delete the forest-only exports: conifer LOD types and functions, chunk plan, residency, foliage/petal/wildflower atlas specs, `FOREST_ENVIRONMENT_RUNTIME_TEXTURE_SPECS`, path centerline, clearing slots, `FOREST_CORRIDOR_CLEARANCES`, gate placement envelope, tree and petal placement types. Keep `BeachWorldViewport`, `BeachWorldQualityTier`, `estimateExactRgbaMipBytes`, `getInitialBeachWorldQualityTier`, `getBeachWorldDensity`, and `createBeachAdaptiveQualitySampler` with its four tuning constants and their comments intact. Replace the density table with beach entities:

```ts
const DENSITIES = {
  desktop: { duneGrass: 900, frames: 3, pierPlanks: 48, posts: 24 },
  mobile: { duneGrass: 520, frames: 3, pierPlanks: 36, posts: 18 },
  reduced: { duneGrass: 240, frames: 3, pierPlanks: 24, posts: 12 },
} as const satisfies Record<BeachWorldQualityTier, BeachWorldDensity>;
```

`frames` is constant across tiers: the couple's photographs are the content, so they are never what gets reduced.

`beach-scene-framing.ts` — the forest version indexes clearings per scene. The beach has no clearings; frame the content at the scene's own position:

```ts
export function createBeachCameraScenes(
  scenes: readonly BeachJourneyScene[],
): readonly BeachJourneyScene[] {
  return scenes.map((scene) => {
    if (scene.type === "cover-gate") return scene;

    return {
      ...scene,
      lookTarget: [
        scene.lookTarget[0],
        CONTENT_CENTER_HEIGHTS[scene.type],
        scene.lookTarget[2],
      ],
    };
  });
}
```

Keep `CONTENT_CENTER_HEIGHTS` as-is — it is content-driven, not location-driven — and update its `satisfies` clause to `Record<Exclude<BeachJourneySceneType, "cover-gate">, number>`.

`beach-cue-state.ts` — the beach has no gate arch, no voile, no doves and no rabbits, so the forest's four actor cues reduce to the two this location drives. `waterSparkle` inherits `petalGust`'s expression in every branch; `smoothstep` goes away with the deleted cues (reintroduce it from the forest twin if a later task needs an ease curve):

```ts
export type BeachCueValues = {
  waterSparkle: number;
  windStrength: number;
};
```

`beach-frame-geometry.ts` — a hanging frame sits **along the scene's own look vector** at a fixed distance, at hanging height. It must not use a constant XZ offset: the beach pose aims down the shore at yaw 76.26°, so a fixed `[+2.55, +1.24]` would sit at yaw 115.93° — 39.67° off-axis against a 12.16° mobile horizontal half-FOV (390×844 at the journey's 50° vertical FOV), i.e. off-screen for every frame. Deriving from `lookTarget` also means the frame follows the pose if the pose is retuned:

```ts
export const BEACH_GALLERY_PRINT_SIZE = [0.68, 0.96] as const;

/** Height of the frame's centre above the sand, in metres. */
const FRAME_CENTER_HEIGHT = 1.42;

/**
 * How far along the authored look direction the frame hangs, in metres. At 2.8m a
 * 0.68m-wide print subtends `atan(0.34 / 2.8)` = 6.92°, comfortably inside the
 * 12.16° mobile limit with margin left for the pose's tilt.
 */
const FRAME_CAMERA_DISTANCE = 2.8;

export function getBeachFrameGeometry(
  scene: Pick<BeachJourneyScene, "cameraPosition" | "lookTarget">,
): BeachFrameGeometry {
  const lookX = scene.lookTarget[0] - scene.cameraPosition[0];
  const lookZ = scene.lookTarget[2] - scene.cameraPosition[2];
  const lookLength = Math.hypot(lookX, lookZ);
  if (lookLength === 0) {
    throw new RangeError(
      "Beach frame geometry requires a horizontal look direction",
    );
  }
  const position = [
    scene.cameraPosition[0] + (lookX / lookLength) * FRAME_CAMERA_DISTANCE,
    FRAME_CENTER_HEIGHT,
    scene.cameraPosition[2] + (lookZ / lookLength) * FRAME_CAMERA_DISTANCE,
  ] as const;
  const cameraDistance = Math.hypot(
    scene.cameraPosition[0] - position[0],
    scene.cameraPosition[2] - position[2],
  );

  return {
    cameraDistance,
    cameraPosition: scene.cameraPosition,
    position,
    printSize: BEACH_GALLERY_PRINT_SIZE,
    rotationY: Math.atan2(
      scene.cameraPosition[0] - position[0],
      scene.cameraPosition[2] - position[2],
    ),
  };
}
```

Drop the forest geometry's `side` field and its `ForestClearingSlot` parameter; update the test to match, keeping its determinism and facing-the-camera assertions, and add two the forest did not need: that every frame fits the 12.16° mobile horizontal half-FOV measured against the authored yaw, and that the returned `cameraPosition` is the scene's own (the forest covered this incidentally through its `side` sign assertion, which goes away with the field).

`beach-scene-framing.test.ts` — do **not** copy the forest test: it imports `./forest-gate`, `./forest-animals` and `./photoreal/forest-prop-material-policy`, none of which exist on the beach, and asserts a one-clearing-per-scene `RangeError` the beach signature has no parameter for. Rewrite it around `createBeachCameraScenes` only, keeping `ASSEMBLY_WIDTHS` verbatim from the forest for the FOV-fit assertion, pinning the content-height table exactly rather than range-bounding it, and asserting the `cover-gate` strict-equal passthrough plus `createBeachCameraScenes([])` returning `[]`. Loosening any assertion to make the copy compile is forbidden.

- [ ] **Step 3: Run the copied tests**

```bash
npx tsx --test "src/components/beach-wedding-journey/*.test.ts"
```

Expected: PASS. Tests asserting deleted forest-only exports must be removed, not weakened — if a test covers behaviour the beach kept, it must still pass unchanged.

- [ ] **Step 4: Verify the forest lab is untouched**

```bash
git status --short src/components/forest-wedding-journey/ src/data/forest-wedding-journey.ts
```

Expected: **no output.** Any modified forest file here is a violation of the core constraint — revert it.

- [ ] **Step 5: Confirm every copy carries its twin header**

```bash
grep -L "Copied from src/components/forest-wedding-journey/" \
  src/components/beach-wedding-journey/beach-journey-controller.ts \
  src/components/beach-wedding-journey/beach-cue-state.ts \
  src/components/beach-wedding-journey/use-beach-journey-input.ts \
  src/components/beach-wedding-journey/beach-world-data.ts \
  src/components/beach-wedding-journey/beach-scene-framing.ts \
  src/components/beach-wedding-journey/beach-frame-geometry.ts
```

Expected: no output (every file matched).

- [ ] **Step 6: Typecheck and commit**

```bash
npm run typecheck && npm run typecheck:tests
```

```bash
git add src/components/beach-wedding-journey/
git commit -m "feat(beach): copy journey mechanics with twin-file headers"
```

---

## Task 6: Sand, water and lighting

**Files:**
- Create: `src/components/beach-wedding-journey/photoreal/beach-terrain.tsx`
- Create: `src/components/beach-wedding-journey/photoreal/beach-water.tsx`
- Create: `src/components/beach-wedding-journey/photoreal/beach-water.test.ts`
- Create: `src/components/beach-wedding-journey/photoreal/beach-lighting.tsx`

**Interfaces:**
- Consumes: `shorelineOffsetAt`, `waterDepthAt`, `BEACH_WATER_LEVEL_Y` (Task 2); `BEACH_PHOTOREAL_ASSETS` (Task 4); `BeachWorldQualityTier` (Task 5).
- Produces: `BeachTerrain` (props: `qualityTier`), `BeachWater` (props: `qualityTier`, `reflectionEnabled`, `sunDirection`), `BEACH_WATER_REFLECTION_SIZE`, `createBeachSandGeometry(qualityTier)`, `BeachLighting` (props: `qualityTier`), `BEACH_SUN_DIRECTION`.

- [ ] **Step 1: Write the failing water test**

Create `src/components/beach-wedding-journey/photoreal/beach-water.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const WATER_SOURCE = path.join(
  process.cwd(),
  "src/components/beach-wedding-journey/photoreal/beach-water.tsx",
);

test("water uses the WebGL Water class, never the WebGPU WaterMesh", () => {
  const source = readFileSync(WATER_SOURCE, "utf8");

  assert.ok(
    source.includes("three/examples/jsm/objects/Water.js"),
    "must import the WebGL Water class",
  );
  assert.ok(
    !source.includes("WaterMesh"),
    "WaterMesh requires WebGPURenderer and would fail at import in this WebGL app",
  );
  assert.ok(
    !source.includes("three/webgpu") && !source.includes("three/tsl"),
    "WebGPU-only entry points must not be imported",
  );
});

// Asserted against source text rather than by importing the module: importing
// beach-water.tsx pulls in three and React Three Fiber, which need a WebGL
// context that node:test has no way to provide.
test("the reflection target starts below the class default", () => {
  const source = readFileSync(WATER_SOURCE, "utf8");
  const declaration = /BEACH_WATER_REFLECTION_SIZE = (\d+)/.exec(source);

  assert.ok(declaration, "BEACH_WATER_REFLECTION_SIZE must be a literal constant");
  const size = Number(declaration[1]);
  assert.ok(
    size <= 256,
    `planar reflection re-renders the whole scene; ${size} is too generous to start`,
  );
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx tsx --test src/components/beach-wedding-journey/photoreal/beach-water.test.ts
```

Expected: FAIL — `beach-water.tsx` does not exist.

- [ ] **Step 3: Write the three components**

`beach-terrain.tsx` — a `PlaneGeometry` subdivided per quality tier, displaced so the sand rises inland from the waterline using `waterDepthAt` for the submerged part and a low dune swell inland. Sand maps get `wrapS = wrapT = RepeatWrapping` with a repeat tuned so one tile spans about 3 m — the tiling frequency that substitutes for a 2K map. Set `colorSpace = SRGBColorSpace` on the color map only; normal and ARM stay linear.

`beach-water.tsx`:

```tsx
import { Water } from "three/examples/jsm/objects/Water.js";

/**
 * Planar reflection re-renders the entire scene from a mirror camera every
 * frame, so this is a second full geometry pass. The class defaults to 512x512;
 * starting at 256 keeps that pass affordable, and `reflectionEnabled={false}`
 * drops to environment-map-only water when even that is too expensive.
 */
export const BEACH_WATER_REFLECTION_SIZE = 256;
```

Build the `Water` instance in a `useMemo` keyed on the normal-map texture and reflection size, dispose it on unmount, and advance `material.uniforms.time.value` from `useFrame` only when not reduced-motion. When `reflectionEnabled` is false, render a `meshStandardMaterial` plane with the HDRI as `envMap`, high metalness and low roughness instead.

`beach-lighting.tsx` — drei `<Environment files={...sky.hdr} background />` plus one `directionalLight` on `BEACH_SUN_DIRECTION` matching the HDRI's sun, warm-tinted. No shadow map.

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx tsx --test src/components/beach-wedding-journey/photoreal/beach-water.test.ts
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Typecheck and commit**

```bash
npm run typecheck
```

```bash
git add src/components/beach-wedding-journey/photoreal/
git commit -m "feat(beach): add sand terrain, WebGL water and HDRI lighting"
```

---

## Task 7: Photo frames, props and the world composition

**Files:**
- Create: `src/components/beach-wedding-journey/photoreal/beach-photo-frames.tsx`
- Create: `src/components/beach-wedding-journey/photoreal/beach-props.tsx`
- Create: `src/components/beach-wedding-journey/beach-wedding-world.tsx`

**Interfaces:**
- Consumes: everything from Tasks 2, 4, 5, 6.
- Produces: `BeachPhotoFrames`, `BeachProps`, `BeachWeddingWorld`, `BeachWeddingWorldMode` (`"photoreal" | "simple"`), `BeachWeddingWorldProps`.

- [ ] **Step 1: Write the frames component**

`beach-photo-frames.tsx` — for each gallery scene, place a frame at `getBeachFrameGeometry(scene).position`. Load the two glTF models with `useLoader(GLTFLoader, ...)` (matching the forest's `useLoader` pattern rather than introducing `useGLTF`), alternating by index. Bind the couple's photograph into the mesh whose material name contains `artwork`; the models ship a dedicated artwork material, so the photo replaces a real slot. Suspend the sway when reduced-motion is set. If a model fails to load, render a `boxGeometry` frame carrying the same photograph — **the photograph must never be the thing that disappears.**

- [ ] **Step 2: Write the props component**

`beach-props.tsx` — instanced driftwood posts along the hanging line, a procedural pier at the finale (plank deck + pole rows, carrying the pier wood maps, extending seaward past `shorelineOffsetAt`), and instanced crossed-tuft dune grass at `duneGrass` density on the landward side only, with vertex wind frozen under reduced motion.

- [ ] **Step 3: Write the world composition**

`beach-wedding-world.tsx` — compose terrain, water, lighting, frames and props. Own the mode fallback: `photoreal` → `simple` (flat materials, no HDRI, no planar reflection) when an entry asset or the HDRI fails. Wire `createBeachAdaptiveQualitySampler` so sustained slow frames drop the quality tier, and turn off `reflectionEnabled` at the `reduced` tier.

- [ ] **Step 4: Typecheck and lint**

```bash
npm run typecheck && npx eslint src/components/beach-wedding-journey src/data/beach-wedding-journey.ts
```

Expected: no errors. `public/proto/` has 23 pre-existing `no-this-alias` errors unrelated to this work — scope lint to the beach paths as above.

- [ ] **Step 5: Commit**

```bash
git add src/components/beach-wedding-journey/
git commit -m "feat(beach): add photo frames, props and world composition"
```

---

## Task 8: Canvas, lab shell, route and localisation

**Files:**
- Create: `src/components/beach-wedding-journey/beach-journey-camera.tsx`
- Create: `src/components/beach-wedding-journey/beach-journey-fallback.tsx`
- Create: `src/components/beach-wedding-journey/beach-journey-canvas.tsx`
- Create: `src/components/beach-wedding-journey/beach-wedding-journey-lab.tsx`
- Create: `src/app/[locale]/lab/beach-wedding-journey/page.tsx`
- Modify: `messages/vi.json`, `messages/en.json`, `messages/ko.json`, `messages/ja.json`, `messages/zh.json`
- Modify: `playwright.config.ts`

**Interfaces:**
- Consumes: everything above.
- Produces: `BeachJourneyCamera`, `BeachJourneyFallback`, `BeachJourneyCanvas`, `BeachRuntimeDiagnosticsSnapshot`, `BeachWeddingJourneyLab`, `BeachWeddingJourneyFixture`.

- [ ] **Step 1: Copy the three shell modules**

```bash
cd /Users/namdo/Documents/learning/clone
cp src/components/forest-wedding-journey/forest-journey-camera.tsx \
   src/components/beach-wedding-journey/beach-journey-camera.tsx
cp src/components/forest-wedding-journey/forest-journey-fallback.tsx \
   src/components/beach-wedding-journey/beach-journey-fallback.tsx
cp src/components/forest-wedding-journey/forest-journey-canvas.tsx \
   src/components/beach-wedding-journey/beach-journey-canvas.tsx
cp src/components/forest-wedding-journey/forest-wedding-journey-lab.tsx \
   src/components/beach-wedding-journey/beach-wedding-journey-lab.tsx
```

Rename identifiers as in Task 5, add the twin header to each, and repoint imports at the beach modules. In `beach-journey-canvas.tsx`: rename the diagnostics global to `window.__beachWeddingJourneyDiagnostics`, and replace the forest-specific snapshot fields (`chunks`, `petals`, `wildlife`, `environment`) with beach ones — `water: { reflectionEnabled: boolean; reflectionSize: number }`, `frames: { instanceCount: number; modelFallbackCount: number }`, `duneGrass: { instanceCount: number }` — keeping `renderer`, `scene`, `assets`, `qualityTier`, `photos`, `viewport`, `adaptiveReductionCount` and `worldMode` unchanged so the E2E budget assertions read the same shape.

- [ ] **Step 2: Add localisation for all five locales**

Add a `beachWeddingJourneyLab` block to each `messages/*.json`, mirroring the key set of `forestWeddingJourneyLab`: `metaTitle`, `metaDescription`, `entryKicker`, `entryBody`, `enter`, `previous`, `next`, `loading`, `fallbackNotice`, `reducedMotion`, `gestureHint`, `sceneStatus`, `demoContent`, `longCopy`, `sceneNames`, `labels`. Vietnamese is the reference copy; the beach wording must be genuinely coastal rather than the forest strings with nouns swapped. For `vi`:

```json
"metaTitle": "Hành trình biển cưới — 3D Lab",
"metaDescription": "Thiệp cưới 3D dẫn người xem dạo dọc bờ biển lúc nắng chiều, qua từng khu vực chức năng."
```

- [ ] **Step 3: Write the route**

Create `src/app/[locale]/lab/beach-wedding-journey/page.tsx` following the forest page exactly: `export const dynamic = "force-dynamic"`, `isLabEnabled()` reading `BEACH_WEDDING_JOURNEY_LAB_ENABLED`, `areRuntimeDiagnosticsEnabled()` reading `BEACH_RUNTIME_DIAGNOSTICS`, the five-locale message map, `notFound()` on an unknown locale, `resolveFixture`, and `robots: { index: false, follow: false }`.

- [ ] **Step 4: Register the Playwright project**

In `playwright.config.ts`: extend the `chromium` project's `testIgnore` to also skip the beach specs, and add a `beach` project after `forest`:

```ts
{
  // Same constraint as the forest project: this lab boots a full WebGL world and
  // then measures the frames it produces, and the planar water reflection adds a
  // second scene pass per frame. Those readings are only meaningful when the
  // scene owns the GPU, so this project runs one worker while the others keep the
  // machine's full count. No assertion is relaxed — per-call timeouts inside the
  // specs bound the budgets, and neither setting here can widen them.
  name: "beach",
  expect: { timeout: 20_000 },
  testMatch: /beach-wedding-journey-.*\.spec\.ts/,
  timeout: 180_000,
  use: { ...devices["Desktop Chrome"] },
  workers: 1,
},
```

`chromium`'s `testIgnore` becomes:

```ts
testIgnore: /(forest|beach)-wedding-journey-.*\.spec\.ts/,
```

And in `webServer.env`, add:

```ts
BEACH_WEDDING_JOURNEY_LAB_ENABLED: "1",
BEACH_RUNTIME_DIAGNOSTICS: process.env.BEACH_RUNTIME_DIAGNOSTICS ?? "",
```

- [ ] **Step 5: Typecheck, lint, build**

```bash
npm run typecheck && npm run typecheck:tests && npx eslint src/components/beach-wedding-journey src/app/\[locale\]/lab/beach-wedding-journey
```

```bash
NEXT_PUBLIC_SITE_URL=https://thiepmungonline.com SITE_URL=https://thiepmungonline.com npm run build
```

Expected: build succeeds and the route appears in the output as dynamic.

- [ ] **Step 6: Commit**

```bash
git add src/components/beach-wedding-journey/ "src/app/[locale]/lab/beach-wedding-journey/" messages/ playwright.config.ts
git commit -m "feat(beach): add canvas, lab shell, route and localisation"
```

---

## Task 9: E2E coverage, measured budgets, provenance

**Files:**
- Create: `tests/e2e/beach-wedding-journey-lab.spec.ts`
- Create: `tests/e2e/beach-wedding-journey-visual.spec.ts`
- Modify: `docs/research/asset-provenance.md`
- Read for reference (do not modify): `tests/e2e/forest-wedding-journey-lab.spec.ts`

**Interfaces:**
- Consumes: the route and diagnostics snapshot from Task 8.
- Produces: no source interfaces — this task proves the work.

- [ ] **Step 1: Write the functional spec**

`tests/e2e/beach-wedding-journey-lab.spec.ts`, modelled on the forest spec: gate visible and enterable; travel advances the scene; Next/Prev; keyboard, wheel and swipe navigation; free-look and recenter; focus lands correctly per scene; the DOM fallback renders with WebGL disabled; reduced motion completes entry inside the reduced budget; context-loss recovery; and mobile at 390×844 asserting `document.documentElement.scrollWidth <= window.innerWidth`.

- [ ] **Step 2: Write the budget and visual spec**

`tests/e2e/beach-wedding-journey-visual.spec.ts` reads `window.__beachWeddingJourneyDiagnostics()` and asserts the Global Constraints budgets — DPR, triangles, draw calls, decoded textures ≤64 MB — at the gate, a gallery scene, and the finale. It must also **record measured frame time and the water reflection's cost, and print both**, since the frame-time win is this change's whole premise. Capture screenshots at those three scenes for the visual gate.

- [ ] **Step 3: Run both suites**

```bash
BEACH_RUNTIME_DIAGNOSTICS=1 npx playwright test --project=beach
```

Expected: all pass. If the server was already running, restart it so `BEACH_RUNTIME_DIAGNOSTICS` takes effect. **Report the measured frame time and reflection cost in the task summary.** If frame time is not materially better than the forest's 449 ms, say so plainly — that is a finding about the premise, not a test to adjust.

- [ ] **Step 4: Confirm the forest source tree is byte-identical**

The forest's Playwright suite is **not** the gate here. That suite is not currently
green — the forest photoreal work is mid-flight — so running it would produce
failures unrelated to the beach and prove nothing either way. The user decided on
2026-08-04 to drop it from this plan. Prove non-interference structurally instead:

```bash
git status --short src/components/forest-wedding-journey/ src/data/forest-wedding-journey.ts tests/e2e/forest-wedding-journey-lab.spec.ts tests/e2e/forest-wedding-journey-visual.spec.ts
```

Expected: **no output.** The forest tree was committed clean at `61fef9c` before this
plan began, so any output here is a beach change that leaked into the forest — revert
it. Then confirm the shared unit suite is still whole, which covers the forest's own
unit tests alongside the beach's:

```bash
npm run test:unit 2>&1 | tail -8
```

Expected: 0 failures, and a total at or above the 392 tests passing at `61fef9c`.

Note that `tests/e2e/forest-wedding-journey-tmpgate.spec.ts`, `-tmpgl.spec.ts` and
`-tmpstall.spec.ts` are deliberately untracked temporary diagnostic probes from the
forest debugging session. They are the forest work's cleanup item, not this plan's —
leave them alone and do not add them to git.

- [ ] **Step 5: Record provenance**

Add a beach section to `docs/research/asset-provenance.md` following the forest pack's format: for each of the 15 sources, its exact download URL, license (CC0), author, Poly Haven MD5 and downloaded SHA-256 (read these from `beach-asset-bytes.json`); then per-output encode settings; then a production table of dimensions, bytes and SHA-256 taken from the files on disk. Also state explicitly that `water-normal.webp` is generated by `scripts/prepare-beach-photoreal-assets.mjs` from seeded value noise with **no third-party source**, and that the pier ships as textures only with procedural geometry.

- [ ] **Step 6: Full gate**

```bash
npm run typecheck && npm run typecheck:tests && npm run test:unit && npx eslint src/components/beach-wedding-journey src/data/beach-wedding-journey.ts && git diff --check
```

```bash
NEXT_PUBLIC_SITE_URL=https://thiepmungonline.com SITE_URL=https://thiepmungonline.com npm run build
```

Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/beach-wedding-journey-lab.spec.ts tests/e2e/beach-wedding-journey-visual.spec.ts docs/research/asset-provenance.md
git commit -m "test(beach): add E2E coverage, measured budgets and provenance"
```

---

## Task 10: Visual QA and honest reporting

**Files:** no source changes expected; fixes land in the files they belong to.

- [ ] **Step 1: Start the dev server and walk the journey**

Use the preview tools (never Bash) to start the server, then visit `/vi/lab/beach-wedding-journey` and check, at 1440×900 and 390×844:

- sand holds detail at eye height with no visible tiling seam along the rail;
- water reflects the HDRI sky coherently and is never black;
- frames read as wooden objects with the photograph legible and correctly oriented;
- the pier reads as weathered wood, not flat-shaded boxes;
- nothing stylised or low-poly intrudes;
- no horizontal overflow on mobile.

- [ ] **Step 2: Inspect the shoreline seam deliberately**

Free-look toward the waterline at three scenes and capture each. The seam **will** be the weakest element — that is the documented consequence of deferring waves. Record how prominent it actually is; this is the acceptance target the future wave work inherits.

- [ ] **Step 3: Check reduced motion and the fallbacks**

With `prefers-reduced-motion: reduce`, confirm sway and wind are frozen and entry is a short transition. Then confirm the `simple` world mode and the DOM fallback both render.

- [ ] **Step 4: Report**

Summarise for the user in Vietnamese: measured frame time versus the forest's 449 ms, the reflection pass cost and whether planar reflection survived, measured entry/shared bytes versus the spec's ~1.1 MB / ~0.9 MB projections, how the shoreline seam actually reads, and anything that fell short. **If the frame-time premise did not hold, lead with that.**

- [ ] **Step 5: Correct the spec's projections**

Update the spec's projected byte table to the measured values, as its own text requires. Commit:

```bash
git add docs/superpowers/specs/2026-08-04-beach-wedding-journey-design.md
git commit -m "docs(beach): replace projected asset bytes with measured values"
```

---

## Self-Review

**Spec coverage.** Why-a-beach → Task 6 plus the Task 9 frame-time measurement. Scope/route → Task 8. Art direction → Tasks 6, 7, 10. Shoreline problem: setback → Task 1 (`BEACH_SHORE_SETBACK_METRES`, test-enforced); wet-sand band → Task 3 (`createWetBandMask`); curved waterline → Task 2. Wave seam → Task 2. Rendering architecture and progressive fallback → Task 7. Copied-not-extracted → Task 5, with the untouched-forest check in Task 5 Step 4 and Task 9 Step 4. Asset pipeline, all three source decisions → Task 3. Terrain/water/lighting incl. the `Water`-not-`WaterMesh` constraint and the reflection budget → Task 6. Photo frames → Task 7. Scenes/content → Task 1. Quality tiers and budgets → Task 4 (delivery, decoded) and Task 9 (runtime). Testing → Tasks 1, 2, 4, 5, 6, 9. Acceptance → Tasks 9 and 10. Every spec section maps to a task.

**Placeholders.** None: no TBD/TODO, no "add error handling", no "similar to Task N" — the frame-geometry and pose code is written out where it differs, and copy steps name exact files and exact renames.

**Type consistency.** `BeachJourneyScene` (Task 1) is what `createBeachCameraScenes` and `getBeachFrameGeometry` (Task 5) consume. `BeachWorldQualityTier` (Task 5) is the parameter type in Task 6's three components. `getBeachPhotorealAssetEstimate(group: "entry" | "shared")` (Task 4) matches the `assets` field of the diagnostics snapshot (Task 8). `BEACH_WATER_REFLECTION_SIZE` is defined in Task 6 and asserted by Task 6's own test. `BEACH_SHORE_SETBACK_METRES` is defined in Task 1 and consumed by Tasks 1 and 2. Asset group names are `"entry" | "props"` on the asset type and `"entry" | "shared"` on the estimator, matching the forest's deliberate split (`props` is a membership label; `shared` means "all").

One deviation worth flagging: Task 5 deletes a large part of `beach-world-data.ts` after copying it, so that file is more rewrite than copy. Copying first is still right — the adaptive sampler's four tuning constants carry hard-won comments about outlier streaks and credit ceilings that took a debugging session to derive, and retyping them invites reintroducing the bug they document.
