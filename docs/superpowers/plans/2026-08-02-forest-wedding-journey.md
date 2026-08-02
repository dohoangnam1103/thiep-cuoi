# Forest Wedding Journey Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private `/lab/forest-wedding-journey` page that turns enabled invitation features into a dynamic, guided first-person walk through a bright three-dimensional forest wedding with a floral gate, large easel photographs, sparse falling petals, rabbits, doves, accessible interactions, and a resilient 2.5D fallback.

**Architecture:** A pure content projection and scene builder produce stable semantic scenes and dynamic camera anchors from demo invitation data. A forest-specific reducer and input adapter drive both a dynamically loaded R3F renderer and a DOM/CSS fallback; GSAP owns finite authored travel, while accessible DOM surfaces are attached to physical 3D props. The implementation stays isolated from the unfinished Đà Lạt lab and loads only the gate plus the current/neighbor scene groups.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript strict, next-intl, CSS Modules/Tailwind CSS v4, GSAP 3, Three.js 0.185, React Three Fiber 9, Drei 10, Node test runner, Playwright.

**Design reference:** `docs/superpowers/specs/2026-08-02-forest-wedding-journey-design.md`

**Workspace constraint:** The checkout is already dirty with unrelated Conan, motion-lab, Đà Lạt, catalog, and application work. Preserve every pre-existing change. Do not create a worktree, modify the Đà Lạt lab, register a template, add a dependency, touch the database, commit, push, deploy, or enable the lab in production unless the user separately requests it.

---

## File map

### Create

- `src/app/[locale]/lab/forest-wedding-journey/page.tsx` — private Server Component route, env gate, and metadata.
- `src/data/forest-wedding-journey.ts` — serializable lab content projection, feature flags, dynamic scene builder, and layout definition.
- `src/data/forest-wedding-journey.test.ts` — scene generation, ordering, layout, gallery, bank validation, and locale parity.
- `src/lib/google-calendar-url.ts` — pure calendar-link helper shared by client templates and server-safe journey data.
- `src/components/forest-wedding-journey/forest-journey-controller.ts` — dynamic-count pure state machine.
- `src/components/forest-wedding-journey/forest-journey-controller.test.ts` — reducer and boundary tests.
- `src/components/forest-wedding-journey/use-forest-journey-input.ts` — pointer, touch, wheel, and keyboard adapters.
- `src/components/forest-wedding-journey/forest-journey-input.test.ts` — gesture and interactive-target tests.
- `src/components/forest-wedding-journey/forest-wedding-journey-lab.tsx` — client shell, scene generation, navigation, focus source, and renderer switch.
- `src/components/forest-wedding-journey/forest-journey-loading.tsx` — localized threshold/loading surface.
- `src/components/forest-wedding-journey/forest-journey-fallback.tsx` — dynamic 2.5D fallback using the same scene list.
- `src/components/forest-wedding-journey/forest-journey-canvas.tsx` — WebGL capability check, R3F boundary, readiness, quality, and recovery.
- `src/components/forest-wedding-journey/forest-journey-camera.tsx` — dynamic authored rails, pre-rail recentering, diagnostics, and GSAP cues.
- `src/components/forest-wedding-journey/forest-world-data.ts` — deterministic path, vegetation, prop, and quality placement helpers.
- `src/components/forest-wedding-journey/forest-world-data.test.ts` — corridor, layer, determinism, density, and budget tests.
- `src/components/forest-wedding-journey/forest-wedding-world.tsx` — scene residency and world composition.
- `src/components/forest-wedding-journey/forest-environment.tsx` — terrain, hero trees, instanced forest bands, grass, and wildflowers.
- `src/components/forest-wedding-journey/forest-gate.tsx` — floral gate, voile, and entry cue.
- `src/components/forest-wedding-journey/forest-petals.tsx` — instanced petals and bounded gusts.
- `src/components/forest-wedding-journey/forest-animals.tsx` — procedural rabbits and doves with authored cue states.
- `src/components/forest-wedding-journey/forest-cue-state.ts` — pure cue evaluation shared by camera, animals, petals, and tests.
- `src/components/forest-wedding-journey/forest-cue-state.test.ts` — entry, scene, finale, and reduced-motion cue tests.
- `src/components/forest-wedding-journey/forest-scene-content.tsx` — active-scene routing and shared physical DOM surface rules.
- `src/components/forest-wedding-journey/forest-static-scenes.tsx` — families, opening, calendar, schedule, dress code, venue, and finale surfaces.
- `src/components/forest-wedding-journey/forest-gallery-scene.tsx` — bounded photo texture lifecycle, easel, and placeholder.
- `src/components/forest-wedding-journey/forest-interactive-scenes.tsx` — map, RSVP, wishes, and gift local lab interactions.
- `src/components/forest-wedding-journey/forest-wedding-journey.module.css` — full-screen shell, physical papers/forms, fallback depth layers, and controls.
- `tests/e2e/forest-wedding-journey-lab.spec.ts` — route, renderer, navigation, scenes, forms, accessibility, fallback, and performance contracts.
- `public/chungdoi/labs/forest-wedding-journey/materials/foliage-atlas.webp` — original leaf/canopy alpha atlas.
- `public/chungdoi/labs/forest-wedding-journey/materials/wildflower-atlas.webp` — original white/ivory flower alpha atlas.
- `public/chungdoi/labs/forest-wedding-journey/materials/petal-atlas.webp` — original white petal alpha atlas.
- `public/chungdoi/labs/forest-wedding-journey/materials/ground-detail.webp` — original seamless grass/soil detail.

### Modify

- `messages/vi.json`, `messages/en.json`, `messages/ja.json`, `messages/ko.json`, `messages/zh.json` — complete `forestWeddingJourneyLab` namespace.
- `src/components/petal-field.tsx` — suppress the global decorative field on the forest lab.
- `playwright.config.ts` — add the private lab flag to the existing E2E server env without disturbing current dirty edits.
- `src/components/chungdoi-tpl-shared.tsx` — re-export the calendar-link helper from its pure module without changing existing consumers.
- `docs/research/asset-provenance.md` — record the four original generated material assets.

### Explicitly do not modify

- `src/components/dalat-journey/**`
- `src/data/dalat-journey.ts`
- `src/data/dalat-journey.test.ts`
- `tests/e2e/dalat-journey-lab.spec.ts`
- template manifests, generated renderer registry, editor schemas, Prisma files, audio files, or deployment configuration.

---

### Task 1: Lock the dynamic forest scene contract

**Files:**

- Create: `src/data/forest-wedding-journey.test.ts`
- Create: `src/data/forest-wedding-journey.ts`
- Create: `src/lib/google-calendar-url.ts`
- Modify: `src/components/chungdoi-tpl-shared.tsx`

- [ ] **Step 1: Write the failing scene-builder tests**

Create tests that exercise actual invitation-shaped data rather than fixture-free constants:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildForestJourneyScenes,
  forestWeddingJourneyDemoContent,
  forestWeddingJourneyFeatures,
} from "./forest-wedding-journey";

test("required scenes bracket every enabled feature scene", () => {
  const scenes = buildForestJourneyScenes(
    forestWeddingJourneyDemoContent,
    forestWeddingJourneyFeatures,
  );
  assert.equal(scenes[0]?.type, "cover-gate");
  assert.equal(scenes.at(-1)?.type, "finale");
  assert.deepEqual(
    scenes.filter(({ type }) => type !== "gallery-photo").map(({ type }) => type),
    [
      "cover-gate",
      "families",
      "opening-message",
      "calendar",
      "schedule",
      "dress-code",
      "venue",
      "map",
      "rsvp",
      "wishes",
      "gift",
      "finale",
    ],
  );
});

test("one stable scene is emitted for every curated photograph", () => {
  const scenes = buildForestJourneyScenes(
    forestWeddingJourneyDemoContent,
    forestWeddingJourneyFeatures,
  );
  assert.deepEqual(
    scenes.filter(({ type }) => type === "gallery-photo").map(({ id }) => id),
    ["gallery-photo:memory-01", "gallery-photo:memory-02", "gallery-photo:memory-03"],
  );
});

test("missing optional data removes scenes without leaving gaps", () => {
  const content = {
    ...forestWeddingJourneyDemoContent,
    dressCodeColors: [],
    gallery: [],
    giftAccounts: [],
    mapQuery: "",
    openingMessage: "",
    schedule: [],
  };
  const scenes = buildForestJourneyScenes(content, {
    ...forestWeddingJourneyFeatures,
    map: false,
  });
  assert.deepEqual(scenes.map(({ type }) => type), [
    "cover-gate",
    "families",
    "calendar",
    "venue",
    "rsvp",
    "wishes",
    "finale",
  ]);
  assert.deepEqual(scenes.map(({ ordinal }) => ordinal), [0, 1, 2, 3, 4, 5, 6]);
});

test("layout stays finite and connects every adjacent scene", () => {
  const scenes = buildForestJourneyScenes(
    forestWeddingJourneyDemoContent,
    forestWeddingJourneyFeatures,
  );
  for (const [index, scene] of scenes.entries()) {
    assert.equal(scene.ordinal, index);
    assert.ok(scene.cameraPosition.every(Number.isFinite));
    assert.ok(scene.lookTarget.every(Number.isFinite));
    assert.equal(scene.travelMidpointToNext === null, index === scenes.length - 1);
    assert.ok(scene.travelDurationMs >= 1_200 && scene.travelDurationMs <= 1_800);
  }
});
```

- [ ] **Step 2: Run the test and verify the expected red failure**

```bash
npx tsx --test src/data/forest-wedding-journey.test.ts
```

Expected: FAIL because `forest-wedding-journey.ts` does not exist.

- [ ] **Step 3: Define the serializable content, features, scenes, and camera recipe**

The implementation must expose these exact public types and constants:

```ts
import { chungdoiDemoContent } from "@/data/chungdoi-demo-content";

export const FOREST_JOURNEY_SCENE_TYPES = [
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

export type ForestJourneySceneType =
  (typeof FOREST_JOURNEY_SCENE_TYPES)[number];
export type ForestJourneyVector3 = readonly [number, number, number];

export type ForestJourneyPhoto = {
  id: string;
  src: string;
};

export type ForestJourneyGiftAccount = {
  accountName: string;
  accountNumber: string;
  bankName: string;
  side: "bride" | "groom";
};

export type ForestJourneyContent = {
  brideFirst: boolean;
  brideName: string;
  calendarUrl: string;
  ceremonyDate: string;
  ceremonyHeader: string;
  ceremonyTime: string;
  dressCodeColors: readonly string[];
  families: {
    brideAddress: string;
    brideFather: string;
    brideMother: string;
    brideParentTitle: string;
    groomAddress: string;
    groomFather: string;
    groomMother: string;
    groomParentTitle: string;
  };
  gallery: readonly ForestJourneyPhoto[];
  giftAccounts: readonly ForestJourneyGiftAccount[];
  groomName: string;
  mapQuery: string;
  openingMessage: string;
  receptionDate: string;
  receptionTime: string;
  schedule: readonly { label: string; time: string }[];
  venueAddress: string;
};

export type ForestJourneyFeatures = {
  gift: boolean;
  map: boolean;
  rsvp: boolean;
  wishes: boolean;
};

export type ForestJourneyScene = {
  cameraPosition: ForestJourneyVector3;
  id: string;
  lookTarget: ForestJourneyVector3;
  ordinal: number;
  photo: ForestJourneyPhoto | null;
  travelDurationMs: number;
  travelMidpointToNext: ForestJourneyVector3 | null;
  type: ForestJourneySceneType;
};

export const forestWeddingJourneyDefinition = {
  camera: { far: 160, fovDegrees: 50, near: 0.1 },
  look: { pitchDegrees: 8, yawDegrees: 20 },
  reducedDurationMs: 180,
} as const;

export const forestWeddingJourneyFeatures: ForestJourneyFeatures = {
  gift: true,
  map: true,
  rsvp: true,
  wishes: true,
};
```

First extract the existing `googleCalendarUrl()` implementation from the `"use client"` component module into `src/lib/google-calendar-url.ts`; keep `src/components/chungdoi-tpl-shared.tsx` as a compatibility re-export so current consumers do not change, and import the pure helper directly from forest data. Then project `chungdoiDemoContent["qasr-green"]` into `forestWeddingJourneyDemoContent`, including `calendarUrl`, `ceremonyHeader`, both parent titles, both family addresses, and ceremony/reception values. Select exactly the first three valid gallery URLs as `memory-01`, `memory-02`, and `memory-03`, and split `dressCodeColors` on commas. Normalize incoming photo IDs, preserve the first valid occurrence, and never emit duplicate scene IDs. The source template's bank owners do not match its couple, so do not relabel or expose those records. Use clearly synthetic, non-production lab gift fixtures whose owners match the projected bride/groom names, then validate ownership before creating gift accounts. Scene inclusion rules are exact: emit `families` only when at least one parent/title/address value exists; `opening-message` when `openingMessage` or `ceremonyHeader` exists, preferring the explicit message; `calendar` when either date exists; `schedule` for at least one valid item; `dress-code` for at least one sanitized color; `venue` for a non-empty address; `map` for an enabled feature plus address/query; `rsvp` and `wishes` from their feature flags; and `gift` only when enabled and every retained account is complete and owner-matched.

Build optional semantic descriptors first. Insert gallery descriptors immediately after `schedule`, assign contiguous ordinals, then resolve each camera recipe with this deterministic spacing:

```ts
function resolveScenePose(
  ordinal: number,
  sceneCount: number,
): Pick<
  ForestJourneyScene,
  "cameraPosition" | "lookTarget" | "travelDurationMs" | "travelMidpointToNext"
> {
  const z = 8 - ordinal * 8.5;
  const side = ordinal === 0 || ordinal === sceneCount - 1
    ? 0
    : ordinal % 2 === 0 ? 1 : -1;
  return {
    cameraPosition: [side * 0.35, 1.62, z],
    lookTarget: [side * 1.1, 1.35, z - 4.5],
    travelDurationMs: ordinal === 0 ? 1_500 : 1_350 + (ordinal % 3) * 150,
    travelMidpointToNext: ordinal === sceneCount - 1
      ? null
      : [-side * 0.45, 1.72, z - 4.25],
  };
}
```

- [ ] **Step 4: Add gift validation, scene stability, and locale-test scaffolding**

Extend the test file with:

```ts
test("invalid or owner-mismatched gift accounts create no gift scene", () => {
  const content = {
    ...forestWeddingJourneyDemoContent,
    giftAccounts: [{
      accountName: "Người Không Liên Quan",
      accountNumber: "123456",
      bankName: "Demo Bank",
      side: "bride" as const,
    }],
  };
  const scenes = buildForestJourneyScenes(content, forestWeddingJourneyFeatures);
  assert.equal(scenes.some(({ type }) => type === "gift"), false);
});

test("toggling gift does not change stable gallery IDs", () => {
  const enabled = buildForestJourneyScenes(
    forestWeddingJourneyDemoContent,
    forestWeddingJourneyFeatures,
  );
  const disabled = buildForestJourneyScenes(
    forestWeddingJourneyDemoContent,
    { ...forestWeddingJourneyFeatures, gift: false },
  );
  assert.deepEqual(
    enabled.filter(({ type }) => type === "gallery-photo").map(({ id }) => id),
    disabled.filter(({ type }) => type === "gallery-photo").map(({ id }) => id),
  );
});
```

Locale parity belongs to Task 3, when the five message namespaces are created. Task 1 must not add a deliberately failing cross-task locale assertion.

- [ ] **Step 5: Run the focused contract test**

```bash
npx tsx --test src/data/forest-wedding-journey.test.ts
```

Expected: scene, gallery, omission, gift, and layout assertions PASS.

---

### Task 2: Build the dynamic controller and isolated input adapter

**Files:**

- Create: `src/components/forest-wedding-journey/forest-journey-controller.test.ts`
- Create: `src/components/forest-wedding-journey/forest-journey-controller.ts`
- Create: `src/components/forest-wedding-journey/forest-journey-input.test.ts`
- Create: `src/components/forest-wedding-journey/use-forest-journey-input.ts`

- [ ] **Step 1: Write failing reducer tests for a dynamic scene count**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialForestJourneyState,
  forestJourneyReducer,
} from "./forest-journey-controller";

test("entry targets the first content scene for any valid journey", () => {
  const travelling = forestJourneyReducer(
    createInitialForestJourneyState(13, false),
    { type: "enter", source: "button" },
  );
  assert.equal(travelling.phase, "travelling");
  assert.equal(travelling.currentIndex, 0);
  assert.equal(travelling.targetIndex, 1);
  assert.equal(travelling.navigationSource, "button");
});

test("travel lock rejects navigation and reduced-motion changes", () => {
  const travelling = forestJourneyReducer(
    createInitialForestJourneyState(13, false),
    { type: "enter", source: "gesture" },
  );
  assert.deepEqual(
    forestJourneyReducer(travelling, { type: "next", source: "wheel" }),
    travelling,
  );
  assert.deepEqual(
    forestJourneyReducer(travelling, { type: "setReducedMotion", value: true }),
    travelling,
  );
});

test("fallback preserves the intended dynamic scene", () => {
  const travelling = forestJourneyReducer(
    createInitialForestJourneyState(7, false),
    { type: "enter", source: "keyboard" },
  );
  const fallback = forestJourneyReducer(travelling, { type: "rendererFallback" });
  assert.equal(fallback.currentIndex, 1);
  assert.equal(fallback.phase, "fallback-settled");
  assert.equal(fallback.renderMode, "fallback");
});

test("bounds use sceneCount rather than a fixed checkpoint registry", () => {
  const last = {
    ...createInitialForestJourneyState(4, false),
    currentIndex: 3,
    phase: "settled" as const,
  };
  assert.deepEqual(
    forestJourneyReducer(last, { type: "next", source: "button" }),
    last,
  );
});
```

- [ ] **Step 2: Run the reducer test and observe the missing-module failure**

```bash
npx tsx --test src/components/forest-wedding-journey/forest-journey-controller.test.ts
```

Expected: FAIL because the controller does not exist.

- [ ] **Step 3: Implement the exact state and reducer contract**

```ts
import { forestWeddingJourneyDefinition } from "@/data/forest-wedding-journey";

export type ForestJourneyPhase =
  | "threshold"
  | "settled"
  | "travelling"
  | "fallback-settled";
export type ForestNavigationSource = "button" | "gesture" | "keyboard" | "wheel";
export type ForestJourneyState = {
  currentIndex: number;
  look: { pitchDegrees: number; yawDegrees: number };
  navigationSource: ForestNavigationSource | null;
  phase: ForestJourneyPhase;
  reducedMotion: boolean;
  renderMode: "webgl" | "fallback";
  sceneCount: number;
  targetIndex: number | null;
};
export type ForestJourneyAction =
  | { source: ForestNavigationSource; type: "enter" | "next" | "previous" }
  | { type: "arrive" }
  | { pitchDegrees: number; type: "look"; yawDegrees: number }
  | { type: "rendererFallback" }
  | { type: "resetLook" }
  | { type: "setReducedMotion"; value: boolean };

export function createInitialForestJourneyState(
  sceneCount: number,
  reducedMotion: boolean,
): ForestJourneyState {
  if (sceneCount < 2) throw new Error("Forest journey requires gate and finale");
  return {
    currentIndex: 0,
    look: { pitchDegrees: 0, yawDegrees: 0 },
    navigationSource: null,
    phase: "threshold",
    reducedMotion,
    renderMode: "webgl",
    sceneCount,
    targetIndex: null,
  };
}
```

Implement `requestTravel()` with dynamic bounds and a travel guard. Only `enter` may leave `threshold`; `next` and `previous` are accepted from `settled` or `fallback-settled` only. Clamp look from `forestWeddingJourneyDefinition.look`. Ignore `setReducedMotion` while travelling so one travel can own one immutable motion mode. `rendererFallback` must land on `targetIndex ?? currentIndex` and preserve threshold before entry.

- [ ] **Step 4: Write failing gesture and interactive-target tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyForestJourneyGesture,
  resolveForestWheelNavigation,
} from "./use-forest-journey-input";

test("vertical gestures navigate and horizontal gestures look", () => {
  assert.deepEqual(classifyForestJourneyGesture(4, -72), { type: "next" });
  assert.deepEqual(classifyForestJourneyGesture(-5, 68), { type: "previous" });
  assert.deepEqual(
    classifyForestJourneyGesture(55, 8),
    { type: "look", deltaX: 55, deltaY: 8 },
  );
  assert.deepEqual(classifyForestJourneyGesture(8, 9), { type: "none" });
});

test("wheel direction is stable", () => {
  assert.equal(resolveForestWheelNavigation(20), "next");
  assert.equal(resolveForestWheelNavigation(-20), "previous");
  assert.equal(resolveForestWheelNavigation(0), null);
});

```

The Node runner has no DOM. Export `isForestJourneyInteractiveElement(target: EventTarget | null)` for the hook, but test its selector behavior in Task 11 Playwright rather than adding jsdom.

- [ ] **Step 5: Implement the input adapter without importing Đà Lạt modules**

Use the established thresholds exactly:

```ts
const LOOK_LOCK_THRESHOLD_PX = 10;
const NAVIGATION_THRESHOLD_PX = 42;
const LOOK_THRESHOLD_PX = 18;
const PIXELS_PER_DEGREE = 10;
const WHEEL_BURST_MS = 120;
```

The hook must attach non-passive wheel plus pointer listeners to the stage, keyboard listeners to `window`, collapse wheel bursts by their signed accumulated delta, lock horizontal versus vertical intent, dispatch horizontal look before pointer-up, and convert a vertically locked 10–41px release into pitch-only look before the 42px navigation threshold. Ignore `button, a, input, textarea, select, [contenteditable], [data-forest-interactive]`, release pointer capture, and cancel timers/listeners on cleanup. It returns semantic source with navigation: wheel → `wheel`, vertical pointer → `gesture`, arrows → `keyboard`.

- [ ] **Step 6: Run focused unit and type gates**

```bash
npx tsx --test \
  src/components/forest-wedding-journey/forest-journey-controller.test.ts \
  src/components/forest-wedding-journey/forest-journey-input.test.ts
npm run typecheck
```

Expected: controller and gesture tests PASS; typecheck exits `0`.

---

### Task 3: Add the private Next.js route, localization, and threshold shell

**Files:**

- Create: `src/app/[locale]/lab/forest-wedding-journey/page.tsx`
- Create: `src/components/forest-wedding-journey/forest-wedding-journey-lab.tsx`
- Create: `src/components/forest-wedding-journey/forest-journey-loading.tsx`
- Create: `src/components/forest-wedding-journey/forest-wedding-journey.module.css`
- Create: `tests/e2e/forest-wedding-journey-lab.spec.ts`
- Modify: `messages/vi.json`
- Modify: `messages/en.json`
- Modify: `messages/ja.json`
- Modify: `messages/ko.json`
- Modify: `messages/zh.json`
- Modify: `src/data/forest-wedding-journey.test.ts`
- Modify: `src/components/petal-field.tsx`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Write the failing route and metadata smoke test**

```ts
import { expect, test } from "@playwright/test";

const LAB_PATH = "/lab/forest-wedding-journey";

test("private forest route exposes a localized noindex threshold", async ({ page }) => {
  await page.goto(LAB_PATH);
  await expect(page).toHaveTitle(/Rừng cưới|Forest Wedding/i);
  const stage = page.getByTestId("forest-journey-stage");
  await expect(stage).toHaveAttribute("data-journey-phase", "threshold");
  await expect(stage).toHaveAttribute("data-scene", "cover-gate");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator(".petal-field")).toHaveCount(0);
  await expect(page.getByTestId("forest-journey-enter")).toBeDisabled();
});
```

- [ ] **Step 2: Add only the E2E env flag and prove the route test is red**

Merge this property into the existing dirty `webServer.env` object in `playwright.config.ts`:

```ts
FOREST_WEDDING_JOURNEY_LAB_ENABLED: "1",
```

Run:

```bash
npx playwright test tests/e2e/forest-wedding-journey-lab.spec.ts --project=chromium
```

Expected: FAIL with 404 or missing stage. Do not overwrite other lab flags.

- [ ] **Step 3: Add the complete localized namespace to all five catalogs**

The `forestWeddingJourneyLab` namespace must expose identical leaf paths:

```text
metaTitle, metaDescription, entryKicker, entryBody, enter, previous, next,
loading, fallbackNotice, reducedMotion, gestureHint, sceneStatus,
sceneNames.{coverGate,families,openingMessage,calendar,schedule,galleryPhoto,
dressCode,venue,map,rsvp,wishes,gift,finale},
labels.{brideFamily,groomFamily,invitation,date,time,addToCalendar,
directions,photoAlt,rsvpName,rsvpAttendance,attendingYes,attendingNo,
rsvpGuests,rsvpNotes,rsvpSubmit,rsvpSuccess,rsvpNameRequired,
rsvpGuestsInvalid,wishName,wishText,wishSubmit,wishSuccess,wishRequired,
formError,openGift,closeGift,giftUnavailable,mapUnavailable,photoUnavailable,
thankYou}
```

Use this Vietnamese source copy:

```json
{
  "metaTitle": "Hành trình rừng cưới — 3D Lab",
  "metaDescription": "Thiệp cưới 3D dẫn người xem qua từng khu vực chức năng giữa một khu rừng ban ngày dịu nhẹ.",
  "entryKicker": "Một lễ cưới đang được chuẩn bị",
  "entryBody": "Vuốt để bước đi · kéo ngang để nhìn quanh",
  "enter": "Bước vào",
  "previous": "Quay lại",
  "next": "Đi tiếp",
  "loading": "Đang chuẩn bị cổng hoa",
  "fallbackNotice": "Thiết bị đang dùng phiên bản khu rừng nhẹ hơn.",
  "reducedMotion": "Giảm chuyển động",
  "gestureHint": "Vuốt dọc để di chuyển · kéo ngang để nhìn quanh",
  "sceneStatus": "{current} trên {total}: {name}"
}
```

Translate every value naturally in `en`, `ja`, `ko`, and `zh`; keep ICU placeholders identical. Add the same `leafKeys()` catalog helper used by `src/data/dalat-journey.test.ts`, target `forestWeddingJourneyLab`, and run it until all catalogs match. Do not weaken the assertion with optional chaining that could silently pass a missing namespace.

- [ ] **Step 4: Create the Next.js 16 Server Component page**

Use async `params`, Server Component metadata, runtime env gating, and serializable demo content:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ForestWeddingJourneyLab } from "@/components/forest-wedding-journey/forest-wedding-journey-lab";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

function isLabEnabled(): boolean {
  return process.env.NODE_ENV !== "production"
    || process.env.FOREST_WEDDING_JOURNEY_LAB_ENABLED === "1";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "forestWeddingJourneyLab" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function ForestWeddingJourneyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  if (!isLabEnabled()) notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  return <ForestWeddingJourneyLab />;
}
```

- [ ] **Step 5: Build the minimal client shell from generated scenes**

The client shell creates scenes exactly once from the immutable demo projection, initializes the dynamic-count reducer, and exposes stable diagnostics:

```tsx
<main
  className={styles.stage}
  data-journey-phase={state.phase}
  data-renderer={state.renderMode === "fallback" ? "fallback" : "loading"}
  data-scene={activeScene.type}
  data-scene-id={activeScene.id}
  data-scene-index={state.currentIndex}
  data-scene-total={scenes.length}
  data-testid="forest-journey-stage"
  ref={stageRef}
>
```

At threshold, render `ForestJourneyLoading`, the localized copy, names ordered by `brideFirst`, one locale-formatted reception date, and a disabled native entry button until a renderer reports ready. Do not duplicate an identical ceremony date or hide the visible name connective from assistive technology. Do not mount a WebGL module in the Server Component.

- [ ] **Step 6: Suppress the global decorative petal field**

Merge the new route into the existing dirty regex without deleting current exclusions:

```ts
if (/\/lab\/(?:flow-demo|dalat-journey|forest-wedding-journey)\/?$/.test(pathname)) {
  return null;
}
```

- [ ] **Step 7: Run route, locale, type, and lint gates**

```bash
npx tsx --test src/data/forest-wedding-journey.test.ts
npm run typecheck
npm run typecheck:tests
npx eslint \
  'src/app/[locale]/lab/forest-wedding-journey/page.tsx' \
  src/components/forest-wedding-journey \
  src/data/forest-wedding-journey.ts \
  src/data/forest-wedding-journey.test.ts \
  tests/e2e/forest-wedding-journey-lab.spec.ts \
  playwright.config.ts \
  src/components/petal-field.tsx
npx playwright test tests/e2e/forest-wedding-journey-lab.spec.ts --project=chromium
```

Expected: locale/type/lint checks and the threshold route smoke PASS. Task 5 will replace the disabled threshold renderer placeholder with a ready fallback path and update the entry assertion accordingly.

---

### Task 4: Produce and validate the original material atlas pack

**Files:**

- Create: `public/chungdoi/labs/forest-wedding-journey/materials/foliage-atlas.webp`
- Create: `public/chungdoi/labs/forest-wedding-journey/materials/wildflower-atlas.webp`
- Create: `public/chungdoi/labs/forest-wedding-journey/materials/petal-atlas.webp`
- Create: `public/chungdoi/labs/forest-wedding-journey/materials/ground-detail.webp`
- Modify: `docs/research/asset-provenance.md`
- Modify: `src/data/forest-wedding-journey.test.ts`

- [ ] **Step 1: Add a failing asset-contract test before generating files**

```ts
import { existsSync, statSync } from "node:fs";
import path from "node:path";

test("forest material pack exists inside its byte budget", () => {
  const names = [
    "foliage-atlas.webp",
    "wildflower-atlas.webp",
    "petal-atlas.webp",
    "ground-detail.webp",
  ];
  const paths = names.map((name) => path.join(
    process.cwd(),
    "public/chungdoi/labs/forest-wedding-journey/materials",
    name,
  ));
  for (const file of paths) assert.equal(existsSync(file), true, file);
  assert.ok(paths.reduce((total, file) => total + statSync(file).size, 0) <= 1_200_000);
});
```

Run `npx tsx --test src/data/forest-wedding-journey.test.ts` and verify the new assertion fails on missing files.

- [ ] **Step 2: Generate four original, coherent textures**

During execution, invoke the image-generation skill/tool with these exact prompts and save only reviewed outputs:

```text
foliage-atlas.webp — A 1024 by 1024 transparent texture atlas containing eight isolated realistic-but-gently-stylized dark evergreen and broadleaf foliage clusters for a premium outdoor forest wedding, soft overcast daylight, natural irregular silhouettes, no branches cut by the cell edge, no flowers, no people, no text, no logo, transparent background.
```

```text
wildflower-atlas.webp — A 1024 by 1024 transparent texture atlas containing twelve isolated small white, ivory and very pale green woodland wedding wildflower heads and leaf sprigs, restrained botanical realism, soft overcast daylight, no bouquet wrapping, no people, no text, no logo, transparent background.
```

```text
petal-atlas.webp — A 512 by 512 transparent texture atlas containing sixteen isolated white and ivory rose-like petals seen at varied rotations and slight curls, soft daylight, clean alpha edges, no flower heads, no text, no logo, transparent background.
```

```text
ground-detail.webp — A seamless 1024 by 1024 subtle forest lawn albedo detail, fine dark green grass, moss and tiny soil variation, evenly lit overcast daylight, no stones, no flowers, no shadows, no text, no logo, tileable in both axes.
```

Do not use, crop, trace, or texture-sample the user reference image. Convert reviewed outputs to WebP quality `78–84`; preserve alpha for the three atlases.

- [ ] **Step 3: Validate alpha, dimensions, and bytes**

```bash
node - <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = 'public/chungdoi/labs/forest-wedding-journey/materials';
const expected = new Map([
  ['foliage-atlas.webp', [1024, 1024, true]],
  ['wildflower-atlas.webp', [1024, 1024, true]],
  ['petal-atlas.webp', [512, 512, true]],
  ['ground-detail.webp', [1024, 1024, false]],
]);
(async () => {
  let bytes = 0;
  for (const [name, [width, height, alpha]] of expected) {
    const file = path.join(root, name);
    const stat = fs.statSync(file);
    const meta = await sharp(file).metadata();
    bytes += stat.size;
    if (meta.width !== width || meta.height !== height) throw new Error(`${name}: wrong dimensions`);
    if (alpha && !meta.hasAlpha) throw new Error(`${name}: missing alpha`);
  }
  if (bytes > 1_200_000) throw new Error(`material pack too large: ${bytes}`);
  console.log({ bytes });
})();
NODE
```

Expected: dimensions/alpha match and total bytes are at or below `1.2MB`.

- [ ] **Step 4: Record provenance and inspect the atlases at original resolution**

Append date, tool/model, exact prompts, output paths, conversion settings, and the statement “user reference used for mood only; no pixels copied” to `docs/research/asset-provenance.md`. Inspect with the local image viewer for matte boxes, fake lettering, clipped leaves, halos, non-seamless ground edges, or different light directions. Regenerate any defective atlas rather than masking defects in code.

- [ ] **Step 5: Re-run the focused data test**

```bash
npx tsx --test src/data/forest-wedding-journey.test.ts
```

Expected: all scene, locale, and asset assertions PASS.

---

### Task 5: Implement input wiring and the complete 2.5D fallback first

**Files:**

- Create: `src/components/forest-wedding-journey/forest-journey-fallback.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-journey-lab.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-journey.module.css`
- Modify: `tests/e2e/forest-wedding-journey-lab.spec.ts`

- [ ] **Step 1: Add failing forced-fallback navigation tests**

Add a preflight helper and the test:

```ts
async function forceWebglFallback(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => null,
    });
  });
}

test("fallback enters and walks the generated semantic scene list", async ({ page }) => {
  await forceWebglFallback(page);
  await page.goto(LAB_PATH);
  await expect(page.getByTestId("forest-journey-fallback")).toBeVisible();
  await expect(page.getByTestId("forest-journey-enter")).toBeEnabled();
  await page.getByTestId("forest-journey-enter").click();
  await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute("data-scene", "families");
  await page.getByTestId("forest-journey-next").click();
  await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute("data-scene", "opening-message");
  await page.getByTestId("forest-journey-previous").click();
  await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute("data-scene", "families");
});
```

Run the focused test and verify it fails because no fallback exists.

- [ ] **Step 2: Implement one dynamic fallback renderer, not per-scene hardcoding**

`ForestJourneyFallback` accepts the generated scene array, current/target indices, look, reduced motion, translated scene names, and `onReady`. It renders:

```tsx
<section
  aria-label={sceneName}
  className={styles.fallbackStage}
  data-scene={displayedScene.type}
  data-scene-id={displayedScene.id}
  data-testid="forest-journey-fallback"
>
  <div aria-hidden className={styles.fallbackFarTrees} />
  <div aria-hidden className={styles.fallbackMidTrees} />
  <div aria-hidden className={styles.fallbackGrass} />
  <div aria-hidden className={styles.fallbackNearFoliage} />
  <FallbackPhysicalSurface scene={displayedScene} />
</section>
```

Use CSS custom properties set through `element.style.setProperty()` in an effect for look parallax; do not construct background-image inline. The four layers consume the generated material paths from static CSS classes and move at distinct ratios. Normal transition is `650ms`; reduced transition is `180ms` opacity-only.

- [ ] **Step 3: Wire the reducer, input hook, entry, and persistent controls**

The shell must expose these stable native buttons:

```text
forest-journey-enter
forest-journey-previous
forest-journey-next
forest-journey-reduced-motion
```

Rules:

- `enter` calls `{ type: "enter", source: "button" }` only when renderer-ready.
- `next` and `previous` work only from settled/fallback-settled.
- The input hook is enabled only after entry while settled.
- Apply `touch-action: none` only to the non-interactive journey gesture surface while input is enabled; the threshold and interactive papers/forms retain normal touch and zoom behavior.
- Fallback travel uses one cancellable timer and dispatches `arrive` once.
- Previous is disabled at index `1` only if returning to the gate is intentionally disallowed after entry; this plan allows returning to the gate, so disable only at index `0`.
- Next is disabled at the finale.
- The reduced-motion button is disabled during travel.

- [ ] **Step 4: Add vertical swipe, horizontal look, wheel burst, and mobile-size E2E**

At `390×844`, assert:

- one upward swipe advances exactly one scene;
- a horizontal drag changes `data-look-yaw` but not `data-scene-index`;
- repeated wheel events during the same `120ms` burst advance once;
- all three navigation controls are at least `44×44px`;
- `document.documentElement.scrollWidth === window.innerWidth`.

- [ ] **Step 5: Run the fallback gates**

```bash
npx tsx --test \
  src/components/forest-wedding-journey/forest-journey-controller.test.ts \
  src/components/forest-wedding-journey/forest-journey-input.test.ts
npm run typecheck
npm run typecheck:tests
npx eslint src/components/forest-wedding-journey tests/e2e/forest-wedding-journey-lab.spec.ts
npx playwright test tests/e2e/forest-wedding-journey-lab.spec.ts --project=chromium --grep "fallback|private forest route"
```

Expected: fallback, route, mobile input, and static gates PASS.

---

### Task 6: Add the lazy WebGL boundary, strict readiness, and context recovery

**Files:**

- Create: `src/components/forest-wedding-journey/forest-journey-canvas.tsx`
- Create: `src/components/forest-wedding-journey/forest-wedding-world.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-journey-lab.tsx`
- Modify: `tests/e2e/forest-wedding-journey-lab.spec.ts`

- [ ] **Step 1: Add failing WebGL readiness and context-loss tests**

```ts
test("entry waits for runtime and world readiness", async ({ page }) => {
  await page.goto(LAB_PATH);
  const entry = page.getByTestId("forest-journey-enter");
  await expect(entry).toBeDisabled();
  const canvas = page.getByTestId("forest-journey-canvas");
  await expect(canvas).toHaveAttribute("data-runtime-ready", "true");
  await expect(canvas).toHaveAttribute("data-world-ready", "true");
  await expect(entry).toBeEnabled();
});

test("context loss preserves the active semantic scene in fallback", async ({ page }) => {
  await page.goto(LAB_PATH);
  await page.getByTestId("forest-journey-enter").click();
  await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute("data-scene", "families");
  await page.getByTestId("forest-journey-canvas").locator("canvas").evaluate((canvas) => {
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  });
  await expect(page.getByTestId("forest-journey-fallback")).toBeVisible();
  await expect(page.getByTestId("forest-journey-stage")).toHaveAttribute("data-scene", "families");
});
```

- [ ] **Step 2: Dynamically import WebGL only from the Client Component**

At module top level in `forest-wedding-journey-lab.tsx`:

```ts
const ForestJourneyCanvas = dynamic(
  () => import("./forest-journey-canvas")
    .then((module) => module.ForestJourneyCanvas)
    .catch(() => ForestJourneyCanvasImportFailure),
  { ssr: false },
);
```

`ForestJourneyCanvasImportFailure` calls `onUnavailable()` in an effect. Do not put `{ ssr: false }` in the Server Component route.

- [ ] **Step 3: Implement capability preflight, error boundary, and stable canvas identity**

Define a strict prop contract using generated scenes:

```ts
export type ForestJourneyCanvasProps = {
  activeIndex: number;
  lookRef: React.MutableRefObject<{ pitchDegrees: number; yawDegrees: number }>;
  onArrive: () => void;
  onReady: () => void;
  onUnavailable: () => void;
  phase: ForestJourneyPhase;
  reducedMotion: boolean;
  scenes: readonly ForestJourneyScene[];
  targetIndex: number | null;
};
```

Render one stable wrapper and one stable `<Canvas>` regardless of threshold/travelling/settled phase. Use `frameloop="demand"`, `dpr={isMobile ? 1 : [1, 1.25]}`, camera FOV `50`, near `0.1`, far `160`, `shadows={false}`, and no post-processing.

- [ ] **Step 4: Report ready only after runtime plus a world frame**

Maintain separate `runtimeReady` and `worldReady`. `JourneyRuntimeBridge` reports after one R3F frame plus one browser RAF. Its cleanup cancels the RAF and resets its reported ref so React Strict Effects cannot permanently consume readiness. `ForestWeddingWorld` reports only after required gate material textures are loaded or the procedural terminal fallback is selected, followed by one rendered frame. The provisional Suspense fallback cannot call `onWorldReady`.

- [ ] **Step 5: Add context-loss recovery and ambient invalidation lifecycle**

Listen on `gl.domElement` for `webglcontextlost`, call `preventDefault()`, report fallback once, and clean up. Ambient invalidation runs only while visible and not reduced: desktop display cadence, mobile `30fps`, adaptively reduced `20fps`. `visibilitychange` cancels/resumes RAF without leaking duplicate loops.

- [ ] **Step 6: Run repeated readiness and recovery tests**

```bash
npm run typecheck
npx eslint src/components/forest-wedding-journey
npx playwright test tests/e2e/forest-wedding-journey-lab.spec.ts \
  --project=chromium \
  --grep "entry waits|context loss" \
  --repeat-each=5 \
  --workers=1
```

Expected: 10/10 PASS without an entry hang or canvas remount.

---

### Task 7: Generate the continuous layered forest and adaptive quality tiers

**Files:**

- Create: `src/components/forest-wedding-journey/forest-world-data.test.ts`
- Create: `src/components/forest-wedding-journey/forest-world-data.ts`
- Create: `src/components/forest-wedding-journey/forest-environment.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-world.tsx`
- Modify: `src/components/forest-wedding-journey/forest-journey-canvas.tsx`
- Modify: `tests/e2e/forest-wedding-journey-lab.spec.ts`

- [ ] **Step 1: Write failing determinism, corridor, depth-band, and density tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  createForestWorldPlacements,
  getForestWorldDensity,
} from "./forest-world-data";

test("placements are deterministic and preserve the walking corridor", () => {
  const density = getForestWorldDensity("desktop", "desktop");
  const first = createForestWorldPlacements(13, density);
  const second = createForestWorldPlacements(13, density);
  assert.deepEqual(first, second);
  for (const tree of first.heroTrees) assert.ok(Math.abs(tree.pathOffset) >= 2.6);
  for (const flower of first.wildflowers) assert.ok(Math.abs(flower.pathOffset) >= 1.55);
});

test("near mid and far forest bands remain populated", () => {
  const placements = createForestWorldPlacements(
    13,
    getForestWorldDensity("mobile", "mobile"),
  );
  assert.ok(placements.heroTrees.length >= 20);
  assert.ok(placements.midTrees.length >= 48);
  assert.ok(placements.farTrees.length >= 64);
  assert.ok(new Set(placements.farTrees.map(({ depthBand }) => depthBand)).size >= 3);
});

test("reduced tier removes only density outside semantic clearings", () => {
  const base = createForestWorldPlacements(13, getForestWorldDensity("mobile", "mobile"));
  const reduced = createForestWorldPlacements(13, getForestWorldDensity("mobile", "reduced"));
  assert.deepEqual(reduced.heroTrees, base.heroTrees);
  assert.ok(reduced.midTrees.length < base.midTrees.length);
  assert.ok(reduced.grass.length < base.grass.length);
});
```

- [ ] **Step 2: Implement deterministic path and placement helpers**

Use one seeded generator, never `Math.random()`:

```ts
function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}
```

Export `ForestWorldDensity`, `ForestWorldQualityTier`, `getForestWorldDensity()`, `createForestPathSamples(sceneCount)`, and `createForestWorldPlacements(sceneCount, density)`. Every placement carries a deterministic position, scale, rotation, tint, wind phase, and `pathOffset`. Hero trees remain identical between base/reduced tiers. Populate three explicit far depth bands.

- [ ] **Step 3: Build one curved terrain ribbon with physically separate near objects**

`ForestEnvironment` must render:

- connected terrain segments following the dynamic scene path;
- a central grass path with subtle height variation;
- individual hero tree trunks, branches, and canopy groups within `0–8m`;
- instanced mid/far trunks and canopy cards in separate draw calls and depth bands;
- instanced grass clumps, separately transformed wildflower stems/heads, shrubs, roots, and stones;
- a ground-detail texture with repeated UV scale;
- baked/material ambient occlusion plus cheap circular contact meshes, not a full shadow map.

Load all four material textures in one Suspense-governed branch. If an atlas fails, select an explicit procedural terminal branch using solid-color leaf/flower/petal geometry and still report world readiness.

- [ ] **Step 4: Add quality tiers with measurable fixed ceilings**

Use these initial counts as testable ceilings:

```ts
const DENSITIES = {
  desktop: { farTrees: 112, grass: 1_200, midTrees: 82, petals: 72, wildflowers: 260 },
  mobile: { farTrees: 72, grass: 720, midTrees: 52, petals: 42, wildflowers: 150 },
  reduced: { farTrees: 42, grass: 420, midTrees: 32, petals: 18, wildflowers: 90 },
} as const;
```

Keep hero trees and required wedding props outside density reduction. A sustained delta above `24ms` for `2s` lowers one tier once; a later fast frame resets the accumulator before reduction. Expose `data-quality-tier` on the canvas wrapper.

- [ ] **Step 5: Add WebGL world markers and a corridor E2E**

Assert the canvas reports `data-world-skin="forest-wedding-daylight"`, quality tier, and scene total. Use a development-only diagnostic snapshot from `gl.info.render` for triangles/draw calls; do not update React state per frame.

- [ ] **Step 6: Run focused world tests and prohibited scans**

```bash
npx tsx --test \
  src/components/forest-wedding-journey/forest-world-data.test.ts \
  src/data/forest-wedding-journey.test.ts
rg -n "EffectComposer|Bloom|DepthOfField|Math\.random|setState\(" \
  src/components/forest-wedding-journey
npm run typecheck
npx eslint src/components/forest-wedding-journey
```

Expected: placement tests PASS; prohibited scan has no unreviewed match; static gates exit `0`.

---

### Task 8: Build the floral gate, voile, petals, rabbits, and doves

**Files:**

- Create: `src/components/forest-wedding-journey/forest-cue-state.test.ts`
- Create: `src/components/forest-wedding-journey/forest-cue-state.ts`
- Create: `src/components/forest-wedding-journey/forest-gate.tsx`
- Create: `src/components/forest-wedding-journey/forest-petals.tsx`
- Create: `src/components/forest-wedding-journey/forest-animals.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-world.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-journey-lab.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-journey.module.css`
- Modify: `tests/e2e/forest-wedding-journey-lab.spec.ts`

- [ ] **Step 1: Write failing deterministic cue tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { evaluateForestCue } from "./forest-cue-state";

test("entry lifts voile, launches gate doves, and bounds the petal gust", () => {
  const cue = evaluateForestCue({
    phase: "travelling",
    progress: 0.6,
    reducedMotion: false,
    sourceType: "cover-gate",
    targetType: "families",
  });
  assert.ok(cue.voileLift > 0 && cue.voileLift <= 1);
  assert.ok(cue.doveFlight > 0 && cue.doveFlight <= 1);
  assert.ok(cue.petalGust >= 0 && cue.petalGust <= 1);
  assert.ok(cue.rabbitGuide >= 0 && cue.rabbitGuide <= 1);
});

test("reduced motion freezes environmental actors", () => {
  assert.deepEqual(
    evaluateForestCue({
      phase: "settled",
      progress: 1,
      reducedMotion: true,
      sourceType: "cover-gate",
      targetType: "families",
    }),
    { doveFlight: 0, petalGust: 0, rabbitGuide: 0, voileLift: 0, windStrength: 0 },
  );
});
```

- [ ] **Step 2: Implement the pure cue evaluator and mutable runtime cue**

Export:

```ts
export type ForestCueValues = {
  doveFlight: number;
  petalGust: number;
  rabbitGuide: number;
  voileLift: number;
  windStrength: number;
};

export type ForestJourneyCueState = ForestCueValues & {
  sceneTime: number;
  travelProgress: number;
};
```

`evaluateForestCue()` must be a pure function of semantic source/target type, phase, progress, and reduced motion. Entry has one gate cue; ordinary travel has a smaller wind/petal pulse; finale may use one dove departure; settled reduced motion returns zeros.

- [ ] **Step 3: Build the physical gate and stable centered voile overlay**

`ForestGate` renders a slender asymmetrical arch from cylinders/curves, separate leaf clusters, white/ivory flower clusters, and a physical plane for the voile. The shell renders the accessible names/date/button surface centered over the physical plane so the same native DOM survives renderer changes. CSS reads `data-journey-phase` to keep the surface aligned; R3F cue values lift the mesh and the DOM uses the same duration token.

The threshold surface must contain the couple names, ampersand, formatted reception date, and `forest-journey-enter`. It remains disabled until the renderer is ready.

- [ ] **Step 4: Build instanced petals with separate transforms and bounded visibility**

Generate all petal transforms from the seeded placement helper. One instanced mesh uses atlas UV offsets, but every instance has separate position, scale, quaternion, phase, and fall speed. Resting density is sparse; gust strength comes from `ForestJourneyCueState`. Wrap petals away from active form planes and cap mobile/desktop counts from Task 7.

- [ ] **Step 5: Build procedural animals from focused mesh groups**

- Rabbit: ellipsoid body/head, separate ears, legs, tail, and eyes; two white rabbits at the grass edge. Animate only ear turn, head turn, and one short hop/path offset from cue values.
- Dove: body, head, tail, and separate left/right wings; two gate doves plus a small finale group. Animate wing rotation and an authored bezier-like position path from cue values.
- Add cheap contact discs under resting rabbits/doves.
- No animation mixer or external GLB is required; there is no looping orbit.

- [ ] **Step 6: Add threshold visual and fallback-entry E2E contracts**

In WebGL before click, assert gate, voile, names/date, two-rabbit marker, and two-gate-dove marker. Use the already complete forced fallback path to assert click → immediate `travelling` → arrival at `families`. Do not assert live WebGL cue progress yet because Task 9 introduces the camera timeline that drives it. Under reduced motion at threshold, assert animal and petal cue data remain zero.

- [ ] **Step 7: Run cue, entry, and visual smoke gates**

```bash
npx tsx --test src/components/forest-wedding-journey/forest-cue-state.test.ts
npm run typecheck
npx eslint src/components/forest-wedding-journey
npx playwright test tests/e2e/forest-wedding-journey-lab.spec.ts \
  --project=chromium \
  --grep "gate|fallback enters|reduced"
```

Expected: cue tests, WebGL threshold visuals, fallback entry, and reduced threshold contracts PASS without console errors.

---

### Task 9: Implement finite GSAP camera rails and live free look

**Files:**

- Create: `src/components/forest-wedding-journey/forest-journey-camera.tsx`
- Modify: `src/components/forest-wedding-journey/forest-journey-canvas.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-world.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-journey-lab.tsx`
- Modify: `tests/e2e/forest-wedding-journey-lab.spec.ts`

- [ ] **Step 1: Add failing lifecycle, finite-rail, and pre-rail-recenter tests**

Capture diagnostics from the stable canvas wrapper:

```ts
type ForestCameraSample = {
  progress: number;
  renderedYaw: number;
  x: number;
  y: number;
  z: number;
};
```

Observe `data-camera-x`, `data-camera-y`, `data-camera-z`, `data-rendered-look-yaw`, and `data-travel-progress`. The tests must assert:

- `travelling` appears immediately after entry/Next.
- Repeated navigation during travel cannot skip a scene.
- A normal travel produces an early sample in `(0.05, 0.45)` and a late sample in `(0.55, 0.98)` before arrival.
- The first arrival completes within `2.4s`, measured with `const startedAt = Date.now()` before `await entry.click()`.
- After dragging to positive yaw, a Next travel has at least one sample with `travelProgress === 0`, rendered yaw between `1` and `19`, and unchanged camera position; rail progress begins only after that authored recenter sample.
- The canvas element identity remains the same across threshold, travelling, and settled.

Run the rail test and verify it fails because the camera adapter does not exist.

- [ ] **Step 2: Implement dynamic scene pose helpers**

`ForestJourneyCamera` receives the generated scenes rather than importing a fixed registry. Convert tuple vectors with:

```ts
function toVector3([x, y, z]: readonly [number, number, number]): Vector3 {
  return new Vector3(x, y, z);
}
```

For reverse travel, use the lower adjacent ordinal's authored midpoint. Throw a descriptive error when non-adjacent navigation or a missing midpoint reaches the camera; the reducer must never request either condition.

- [ ] **Step 3: Implement one layout-effect timeline with recenter before rail**

Use `useLayoutEffect`, kill any prior timeline, call `gsap.ticker.lagSmoothing(0)` for active travel, and restore `gsap.ticker.lagSmoothing(500, 33)` on cleanup. Snapshot actual start position/quaternion and actual free-look values.

Normal motion uses one GSAP timeline with two sequential phases inside the same total scene duration:

```ts
const totalDuration = targetScene.travelDurationMs / 1_000;
const recenterDuration = Math.min(0.18, totalDuration * 0.12);
const railDuration = totalDuration - recenterDuration;
const proxy = { railProgress: 0, recenterProgress: 0 };

timeline
  .to(proxy, {
    duration: recenterDuration,
    ease: "power1.out",
    recenterProgress: 1,
  }, 0)
  .to(proxy, {
    duration: railDuration,
    ease: "power2.inOut",
    railProgress: 1,
  }, recenterDuration);
```

During recenter, keep `camera.position` exactly at `startPosition` and slerp from actual `startQuaternion` to the authored current-scene quaternion. During rail, sample a Catmull-Rom curve through start position, the authored midpoint, and target position; interpolate the authored current look target toward the target look target. Set `travelProgress` from `railProgress`, not recenter progress. Call `onArrive()` once after camera and cue values reach the target.

On every update, call `evaluateForestCue()` with the semantic source/target scene types and rail progress, then copy its values into the shared mutable `ForestJourneyCueState`. This is the first task that drives the gate voile, petal gust, rabbits, and doves through a live WebGL travel. Extend the Task 8 E2E here to assert cue progress becomes greater than zero after entry.

- [ ] **Step 4: Implement reduced motion as an immutable opacity handoff**

When travel begins reduced, run one `180ms` opacity timeline, snap the camera at its midpoint, keep environmental cue motion at zero, and arrive once. Do not change the active timeline's motion mode when the user toggles the control because the reducer rejects that action while travelling.

- [ ] **Step 5: Keep settled free look off React's render cadence**

The input adapter mutates a `lookRef`, clamps `±20°` yaw and `±8°` pitch, and requests invalidation. The camera applies the settled pose inside `useFrame`. Dispatch diagnostic reducer look no more often than every `80ms`; cancel an already queued timer before an immediate diagnostic dispatch so stale timers cannot race.

- [ ] **Step 6: Pause and clean up deterministically**

When the document is hidden, ambient settled frames stop. Timeline cleanup kills GSAP, clears diagnostic opacity, and cannot call arrival later. Unmount cancels pending diagnostics and RAF work.

- [ ] **Step 7: Run repeated camera contracts**

```bash
npm run typecheck
npx eslint src/components/forest-wedding-journey
npx playwright test tests/e2e/forest-wedding-journey-lab.spec.ts \
  --project=chromium \
  --grep "finite rail|recenter|cannot skip|canvas identity" \
  --repeat-each=5 \
  --workers=1
```

Expected: every repetition PASSes; normal travel contains early/late rail samples and a position-still recenter phase.

---

### Task 10: Build physical static scenes and bounded gallery easels

**Files:**

- Create: `src/components/forest-wedding-journey/forest-scene-content.tsx`
- Create: `src/components/forest-wedding-journey/forest-static-scenes.tsx`
- Create: `src/components/forest-wedding-journey/forest-gallery-scene.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-world.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-journey.module.css`
- Modify: `tests/e2e/forest-wedding-journey-lab.spec.ts`

- [ ] **Step 1: Add failing scene-surface and gallery residency tests**

Walk from `families` through `venue` and assert each scene exposes one active heading and one scene-specific physical marker:

```text
forest-scene-families
forest-scene-opening-message
forest-scene-calendar
forest-scene-schedule
forest-scene-gallery-photo
forest-scene-dress-code
forest-scene-venue
forest-scene-finale
```

At every stop, assert off-scene headings are absent from the tab order. For gallery scenes, log requested demo image URLs and assert only current plus immediate neighboring gallery-photo resources are decoded/mounted; the whole demo gallery cannot load at entry.

- [ ] **Step 2: Implement a shared active-scene content router**

`ForestSceneContent` receives one `ForestJourneyScene`, the full content projection, active/settled flags, translated labels, and renderer mode. It routes by `scene.type` with an exhaustive `switch`; the default branch assigns to `never` so a future scene type cannot silently render blank.

Every surface follows this semantic contract:

```tsx
<section
  aria-hidden={!interactive}
  className={styles.physicalSurface}
  data-forest-interactive={interactive ? "true" : undefined}
  data-testid={`forest-scene-${scene.type}`}
  inert={interactive ? undefined : true}
>
  <h2 ref={headingRef} tabIndex={interactive ? -1 : undefined}>{sceneName}</h2>
  {children}
</section>
```

For R3F use Drei `<Html transform>` attached to matching world coordinates. For fallback render the same semantic component inside the 2.5D physical surface. Never duplicate translated copy inside frame callbacks.

- [ ] **Step 3: Build separate physical props for each static feature**

- `families`: two cloth tables, two paper panels, bride/groom order from content.
- `opening-message`: opened envelope plus readable invitation paper.
- `calendar`: large paper calendar on wood, formatted ceremony/reception values, native add-to-calendar link.
- `schedule`: one ordered place card per schedule item on a long table.
- `dress-code`: separate fabric strips using sanitized CSS colors plus text values. Set `--forest-dress-color-1` through `--forest-dress-color-5` on the scene root with `element.style.setProperty()` in an effect and consume them in the CSS Module; do not use a React inline `style` prop.
- `venue`: wood sign, ivory address card, banquet time.
- `finale`: restrained seats, flower/voile focal point, thank-you surface; Next disabled.

Meshes have visible depth and cheap contact cues. Text remains DOM. Avoid rounded generic panels and unexplained floating glass.

- [ ] **Step 4: Implement the large gallery easel and bounded texture hook**

The easel is approximately `0.7 × 1.0m` at world scale with light-oak legs, crossbar, thin ivory print edge, grass contact, and a low wildflower cluster. It sits on the side assigned by scene ordinal.

Implement an explicit loader state:

```ts
type ForestPhotoTextureState =
  | { status: "loading"; texture: null }
  | { status: "ready"; texture: THREE.Texture }
  | { status: "error"; texture: null };
```

Load with `THREE.TextureLoader` in an effect, set `colorSpace = THREE.SRGBColorSpace`, cap anisotropy to the renderer maximum and a conservative upper limit, ignore callbacks after cancellation, and dispose non-cached textures on eviction. A failed image preserves the easel and displays the localized neutral paper placeholder.

- [ ] **Step 5: Mount only current/previous/next semantic scene assemblies**

```ts
function residentSceneIndices(
  currentIndex: number,
  targetIndex: number | null,
  sceneCount: number,
): number[] {
  const center = targetIndex ?? currentIndex;
  return Array.from(new Set([currentIndex, center - 1, center, center + 1]))
    .filter((index) => index >= 0 && index < sceneCount)
    .sort((a, b) => a - b);
}
```

Keep the lightweight environment continuous, but mount heavy prop/photo assemblies only for those indices. Previously visited photo textures use a bounded least-recently-used cache of at most three decoded textures; eviction disposes the texture.

- [ ] **Step 6: Add failed-photo and repeated-photo-navigation E2E**

Intercept the second curated image with `route.abort()`, reach its scene, assert the easel remains and localized `photoUnavailable` is visible, then go Previous/Next and confirm no crash, black canvas, or skipped scene.

- [ ] **Step 7: Run static/gallery gates**

```bash
npm run typecheck
npm run typecheck:tests
npx eslint src/components/forest-wedding-journey tests/e2e/forest-wedding-journey-lab.spec.ts
npx playwright test tests/e2e/forest-wedding-journey-lab.spec.ts \
  --project=chromium \
  --grep "physical|gallery|photo"
```

Expected: every static scene, bounded texture behavior, error placeholder, and reverse navigation PASS.

---

### Task 11: Implement map, RSVP, wishes, and gift as local interactive scenes

**Files:**

- Create: `src/components/forest-wedding-journey/forest-interactive-scenes.tsx`
- Modify: `src/components/forest-wedding-journey/forest-scene-content.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-world.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-journey.module.css`
- Modify: `tests/e2e/forest-wedding-journey-lab.spec.ts`

- [ ] **Step 1: Add failing form isolation and local-state persistence tests**

At the RSVP scene, fill the localized name, party-size, and notes controls; record `data-scene-index`; wheel inside the form; assert the index stays unchanged; submit and assert the localized success status. Navigate away and back; assert submitted local values/result remain. Repeat for a typed wish. In a separate pass submit the RSVP name and wish message sentinels `__forest_lab_failure__`; assert localized error and unchanged drafts. Assert opening/closing gift and map detail does not advance the journey.

- [ ] **Step 2: Build the map table without a map API dependency**

Render a stylized local paper map using CSS paths/landmarks, full textual `mapQuery`, and a native directions link generated from:

```ts
function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
```

The link opens a new tab with `rel="noreferrer"`. Empty queries show localized `mapUnavailable` and no link. Do not embed a remote iframe or add a maps SDK.

- [ ] **Step 3: Hoist local interaction state above both renderers**

Export `useForestJourneyLocalInteractions()` from `forest-interactive-scenes.tsx` and call it once in `ForestWeddingJourneyLab`. Its state contains RSVP draft/submission, wish draft/local notes, expanded map state, and open gift side. Pass the returned typed values and callbacks through the client component tree to both WebGL and fallback content. Switching renderers or navigating away cannot reset local state.

- [ ] **Step 4: Build a local-only RSVP ledger**

Use controlled local state with exact fields: guest name, attendance (`yes`/`no`), party size bounded `1–10`, and notes. Submit prevents default, validates name/party size, stores a submitted snapshot in component state, and announces localized success. The lab-only sentinel guest name `__forest_lab_failure__` produces the localized `formError` without clearing any draft value so E2E can prove recoverable failure. No fetch, server action, Prisma call, or live-form provider is allowed.

- [ ] **Step 5: Build a local-only wishes guestbook**

Initialize from two short demo wishes. The form accepts name/message, trims both, rejects empty values, appends one local note, clears only after success, and retains notes while navigating. The lab-only message sentinel `__forest_lab_failure__` announces `formError` and preserves both fields. The guestbook may scroll internally without stage navigation.

- [ ] **Step 6: Build explicit bride/groom gift envelopes**

Render validated accounts only, ordered by `brideFirst`. Each native button reveals its own paper details; closing restores focus to the opening button. There is no QR generation, network request, or data write in the lab.

- [ ] **Step 7: Isolate every interactive target from journey gestures**

Mark map, form, guestbook, and gift roots with `data-forest-interactive="true"`. The input hook uses `closest()` so nested labels/spans inherit isolation. Pointer capture never starts from an interactive root. Wheel inside textarea, select, scroll paper, or open gift is not prevented by the stage.

- [ ] **Step 8: Run interactive E2E and prohibited-write scans**

```bash
rg -n "fetch\(|prisma|LiveFormsProvider|use server" \
  src/components/forest-wedding-journey
npm run typecheck
npx eslint src/components/forest-wedding-journey
npx playwright test tests/e2e/forest-wedding-journey-lab.spec.ts \
  --project=chromium \
  --grep "RSVP|wish|map|gift|interactive"
```

Expected: no write/provider match; forms preserve state and never trigger camera travel.

---

### Task 12: Complete reduced motion, focus, localization, and renderer parity

**Files:**

- Modify: `src/components/forest-wedding-journey/forest-wedding-journey-lab.tsx`
- Modify: `src/components/forest-wedding-journey/forest-journey-camera.tsx`
- Modify: `src/components/forest-wedding-journey/forest-journey-fallback.tsx`
- Modify: `src/components/forest-wedding-journey/forest-scene-content.tsx`
- Modify: `src/components/forest-wedding-journey/forest-wedding-journey.module.css`
- Modify: `messages/vi.json`
- Modify: `messages/en.json`
- Modify: `messages/ja.json`
- Modify: `messages/ko.json`
- Modify: `messages/zh.json`
- Modify: `tests/e2e/forest-wedding-journey-lab.spec.ts`

- [ ] **Step 1: Add failing reduced-motion and focus-source tests**

Cover:

- `page.emulateMedia({ reducedMotion: "reduce" })` produces arrival within `600ms`.
- `data-look-yaw`, wind, petal, rabbit, and dove cue values stay zero.
- The force-reduced button cannot make motion active when the system preference is reduce.
- Button and keyboard arrival focus the active scene heading.
- Gesture and wheel arrival preserve the existing focus source.
- Reduced-motion control is disabled while travelling.
- Entry, Previous, Next, map, RSVP, wish, and gift controls use native elements.

- [ ] **Step 2: Implement system OR forced reduced motion with `useSyncExternalStore`**

```ts
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function reducedMotionSnapshot(): boolean {
  return window.matchMedia(REDUCED_QUERY).matches;
}

function serverReducedMotionSnapshot(): boolean {
  return false;
}
```

Compute `effectiveReducedMotion = systemReducedMotion || forceReducedMotion`. Toggling force reduction never disables a true system preference. Dispatch the change only while not travelling.

- [ ] **Step 3: Implement input-aware focus and live announcements**

The reducer already records navigation source. After arrival, focus the active scene heading only when source is `button` or `keyboard`. For `gesture` and `wheel`, do not programmatically focus. Add one polite live region with localized `sceneStatus({ current, total, name })` outside the canvas.

- [ ] **Step 4: Make fallback and WebGL use the same semantic content tree**

Both renderers receive the same generated scenes, content projection, labels, active scene ID, and local interaction state owner. `ForestSceneContent` owns copy and controls; renderers supply only physical placement wrappers. Assert WebGL and forced fallback expose identical scene IDs, headings, button labels, disabled boundaries, and local form values.

- [ ] **Step 5: Verify all five locales and long-string containment**

Navigate `/en/lab/forest-wedding-journey`, `/ja/lab/forest-wedding-journey`, `/ko/lab/forest-wedding-journey`, and `/zh/lab/forest-wedding-journey`; verify each route renders its namespace with no Vietnamese fallback prose. Test long parent/venue values in a local fixture and confirm paper surfaces wrap without horizontal overflow.

- [ ] **Step 6: Run focused accessibility/parity gates**

```bash
npx tsx --test src/data/forest-wedding-journey.test.ts
npm run typecheck
npm run typecheck:tests
npx eslint src/components/forest-wedding-journey tests/e2e/forest-wedding-journey-lab.spec.ts
npx playwright test tests/e2e/forest-wedding-journey-lab.spec.ts \
  --project=chromium \
  --grep "reduced|focus|locale|parity|native"
```

Expected: reduced, focus-source, localization, and renderer-parity tests PASS.

---

### Task 13: Final verification, visual matrix, and runtime budgets

**Files:**

- Modify only files required by reproduced defects.

- [ ] **Step 1: Run all static and unit gates fresh**

```bash
npm run typecheck
npm run typecheck:tests
npm run test:unit
npx eslint \
  'src/app/[locale]/lab/forest-wedding-journey/page.tsx' \
  src/components/forest-wedding-journey \
  src/data/forest-wedding-journey.ts \
  src/data/forest-wedding-journey.test.ts \
  tests/e2e/forest-wedding-journey-lab.spec.ts \
  playwright.config.ts \
  src/components/petal-field.tsx
git diff --check
```

Expected: every command exits `0`; the full unit suite has zero failures.

- [ ] **Step 2: Run the production-build browser suite fresh**

```bash
npx playwright test tests/e2e/forest-wedding-journey-lab.spec.ts \
  --project=chromium \
  --workers=1
```

Expected: the Next 16 production build succeeds, all forest tests PASS, and captured console errors remain empty.

- [ ] **Step 3: Capture and inspect the complete visual matrix**

At desktop `1440×900` and mobile `390×844`, capture:

- gate before entry;
- entry mid-cue with lifted voile, petals, and doves;
- families, opening, calendar, and schedule;
- first, middle, and last gallery-photo scenes;
- dress code, venue, map, RSVP, wishes, and gift;
- finale;
- one representative mid-travel rail;
- forced fallback at gate, gallery, interactive scene, and finale;
- reduced motion at gate and one settled interactive scene.

Inspect for real foreground/mid/far parallax, grass/wildflower separation, visible contact at tree/easel/table/animal feet, no repeated grid, no floating card, photo/text legibility, safe mobile crop, no camera clipping, restrained petal density, and non-looping animals.

- [ ] **Step 4: Measure renderer budgets from a fresh browser session**

Expose a development-only diagnostic function that reads `gl.info.render` and current texture-cache counts without React state. Record gate, a gallery scene, the densest interactive clearing, and finale.

Acceptance:

- mobile DPR `1`;
- desktop DPR `≤1.25`;
- mobile visible geometry `≤150k` triangles and `≤80` draw calls;
- desktop visible geometry `≤250k` triangles and `≤120` draw calls;
- material pack `≤1.2MB` and initial required world payload `≤4MB` excluding application JS/photos;
- shared environment payload `≤12MB`;
- mobile live decoded texture estimate `≤64MB`;
- no more than three decoded journey-photo textures resident;
- no sustained frame delta above `24ms` for two seconds without one adaptive reduction;
- hidden tab produces no ambient invalidation loop.

- [ ] **Step 5: Reproduce and repair any QA defect with TDD**

For each defect, first add the smallest failing Node or Playwright contract, run it to observe the behavioral failure, implement the minimal repair, run the focused contract, then re-run every Step 1–4 gate affected by the repair. Do not mask visual defects with timeouts, fixed screenshots, or disabled assertions.

- [ ] **Step 6: Audit route scope and preserved dirty files**

```bash
git status --short
git diff --stat -- \
  'src/app/[locale]/lab/forest-wedding-journey' \
  src/components/forest-wedding-journey \
  src/data/forest-wedding-journey.ts \
  src/data/forest-wedding-journey.test.ts \
  tests/e2e/forest-wedding-journey-lab.spec.ts \
  messages \
  playwright.config.ts \
  src/components/petal-field.tsx \
  public/chungdoi/labs/forest-wedding-journey \
  docs/research/asset-provenance.md \
  docs/superpowers
```

Confirm the implementation introduced no change to Đà Lạt, Conan, flow-demo, template manifests, generated renderer registry, editor, Prisma/database, dependencies, audio, or deployment. Do not commit, push, deploy, or enable production.

---

## Execution handoff

Plan execution has two valid modes:

1. **Subagent-Driven (recommended):** use `superpowers:subagent-driven-development`, dispatch one fresh implementation worker per task, and perform spec plus quality review between tasks.
2. **Inline Execution:** use `superpowers:executing-plans`, execute tasks in batches with verification checkpoints in this session.

In either mode, preserve the dirty checkout, follow TDD, and honor the explicit no-commit/no-push/no-deploy constraint.
