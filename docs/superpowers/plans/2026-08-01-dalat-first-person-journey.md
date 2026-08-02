# Đà Lạt First-Person Journey Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new private `/lab/dalat-journey` page that delivers a five-checkpoint, first-person, guided Đà Lạt journey with fully diegetic content, accessible navigation, reduced motion, and a resilient 2.5D fallback.

**Architecture:** A pure typed journey definition and reducer drive both renderers. A client shell owns semantic navigation and dynamically imports one R3F/Three.js canvas; GSAP animates finite camera travel and scene cues, while projected DOM keeps localized content sharp on physical scene surfaces. A separate panorama renderer consumes the same controller state when WebGL is unavailable or lost.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, next-intl, Tailwind CSS v4, GSAP 3, Three.js, React Three Fiber, Drei, Node test runner, Playwright.

**Design reference:** `docs/superpowers/specs/2026-08-01-dalat-first-person-journey-design.md`

**Workspace constraint:** The worktree already contains unrelated Conan and motion-lab changes. Preserve them, do not reset them, and do not commit, push, or deploy unless the user separately requests it.

---

## File map

### Create

- `src/app/[locale]/lab/dalat-journey/page.tsx` — private server route and metadata.
- `src/data/dalat-journey.ts` — immutable checkpoint/world definition and public types.
- `src/data/dalat-journey.test.ts` — registry, budgets, asset paths, and locale parity.
- `src/components/dalat-journey/journey-controller.ts` — pure state machine.
- `src/components/dalat-journey/journey-controller.test.ts` — controller tests.
- `src/components/dalat-journey/use-journey-input.ts` — wheel, keyboard, and pointer adapters.
- `src/components/dalat-journey/journey-input.test.ts` — gesture-classification tests.
- `src/components/dalat-journey/dalat-journey-lab.tsx` — full-screen client shell and controls.
- `src/components/dalat-journey/journey-loading.tsx` — localized loading surface.
- `src/components/dalat-journey/journey-fallback.tsx` — five-scene 2.5D fallback.
- `src/components/dalat-journey/journey-canvas.tsx` — R3F boundary and recovery.
- `src/components/dalat-journey/journey-camera.tsx` — GSAP camera and free look.
- `src/components/dalat-journey/dalat-mist-world.tsx` — procedural world.
- `src/components/dalat-journey/diegetic-content.tsx` — anchored localized surfaces.
- `src/components/dalat-journey/dalat-journey.module.css` — panorama and pseudo-element effects.
- `tests/e2e/dalat-journey-lab.spec.ts` — browser coverage.
- Seven original WebP assets under `public/chungdoi/labs/dalat-journey/`.

### Modify

- `messages/{vi,en,ja,ko,zh}.json` — complete `dalatJourneyLab` namespace.
- `src/components/petal-field.tsx` — suppress petals on the new lab.
- `playwright.config.ts` — enable the private lab in E2E.
- `docs/research/asset-provenance.md` — record generated assets.

---

### Task 1: Lock the typed journey contract

**Files:**

- Create: `src/data/dalat-journey.test.ts`
- Create: `src/data/dalat-journey.ts`

- [ ] **Step 1: Write the failing registry and locale-parity tests**

Create tests for exact IDs, uniqueness, camera limits, durations, fallback paths, and identical namespace leaf keys:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  DALAT_JOURNEY_CHECKPOINT_IDS,
  dalatJourneyDefinition,
} from "./dalat-journey";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

test("Dalat journey registers the approved five checkpoints", () => {
  assert.deepEqual(DALAT_JOURNEY_CHECKPOINT_IDS, [
    "mistGate",
    "memoryPines",
    "timeGlasshouse",
    "lakePavilion",
    "wishValley",
  ]);
  assert.equal(new Set(DALAT_JOURNEY_CHECKPOINT_IDS).size, 5);
  assert.deepEqual(
    dalatJourneyDefinition.checkpoints.map(({ id }) => id),
    DALAT_JOURNEY_CHECKPOINT_IDS,
  );
});

test("Dalat journey keeps approved camera limits and fallback assets", () => {
  assert.equal(dalatJourneyDefinition.look.yawDegrees, 20);
  assert.equal(dalatJourneyDefinition.look.pitchDegrees, 8);
  assert.equal(dalatJourneyDefinition.camera.fovDegrees, 50);
  for (const checkpoint of dalatJourneyDefinition.checkpoints) {
    assert.ok(checkpoint.travelDurationMs >= 1_500);
    assert.ok(checkpoint.travelDurationMs <= 2_000);
    assert.match(checkpoint.fallbackImage, /^\/chungdoi\/labs\/dalat-journey\/.+\.webp$/);
  }
});

test("Dalat journey catalogs expose identical localized key paths", () => {
  const locales = ["vi", "en", "ja", "ko", "zh"] as const;
  const entries = locales.map((locale) => {
    const catalog = JSON.parse(
      readFileSync(path.join(process.cwd(), "messages", `${locale}.json`), "utf8"),
    ) as { dalatJourneyLab?: unknown };
    assert.ok(catalog.dalatJourneyLab, `${locale} is missing dalatJourneyLab`);
    return [locale, leafKeys(catalog.dalatJourneyLab).sort()] as const;
  });
  for (const [locale, keys] of entries) {
    assert.deepEqual(keys, entries[0][1], `${locale} key paths differ`);
  }
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
npx tsx --test src/data/dalat-journey.test.ts
```

Expected: FAIL because the definition and localized namespace do not exist.

- [ ] **Step 3: Implement the immutable definition**

```ts
export const DALAT_JOURNEY_CHECKPOINT_IDS = [
  "mistGate",
  "memoryPines",
  "timeGlasshouse",
  "lakePavilion",
  "wishValley",
] as const;

export type DalatJourneyCheckpointId =
  (typeof DALAT_JOURNEY_CHECKPOINT_IDS)[number];
export type JourneyVector3 = readonly [number, number, number];

export type DalatJourneyCheckpoint = {
  cameraPosition: JourneyVector3;
  fallbackImage: string;
  id: DalatJourneyCheckpointId;
  lookTarget: JourneyVector3;
  sceneCue: number;
  travelDurationMs: number;
};

export type DalatJourneyCheckpointCopy = {
  body: string;
  detail: string;
  kicker: string;
  name: string;
  title: string;
};

export type DalatJourneyCopy = {
  checkpoints: Record<DalatJourneyCheckpointId, DalatJourneyCheckpointCopy>;
  fallbackNotice: string;
  loading: string;
};

export const dalatJourneyDefinition = {
  camera: { fovDegrees: 50 },
  look: { pitchDegrees: 8, yawDegrees: 20 },
  reducedDurationMs: 180,
  checkpoints: [
    { id: "mistGate", cameraPosition: [0, 1.65, 8.5], lookTarget: [0, 1.55, 3.8], sceneCue: 0, travelDurationMs: 1_650, fallbackImage: "/chungdoi/labs/dalat-journey/fallback/mist-gate.webp" },
    { id: "memoryPines", cameraPosition: [-0.85, 1.65, -1], lookTarget: [-0.25, 1.55, -6], sceneCue: 0.25, travelDurationMs: 1_650, fallbackImage: "/chungdoi/labs/dalat-journey/fallback/memory-pines.webp" },
    { id: "timeGlasshouse", cameraPosition: [0.8, 1.7, -10.5], lookTarget: [0.2, 1.55, -15], sceneCue: 0.5, travelDurationMs: 1_750, fallbackImage: "/chungdoi/labs/dalat-journey/fallback/time-glasshouse.webp" },
    { id: "lakePavilion", cameraPosition: [-1.1, 1.65, -20], lookTarget: [-0.25, 1.45, -25], sceneCue: 0.75, travelDurationMs: 1_850, fallbackImage: "/chungdoi/labs/dalat-journey/fallback/lake-pavilion.webp" },
    { id: "wishValley", cameraPosition: [0, 1.7, -31], lookTarget: [0, 1.6, -36], sceneCue: 1, travelDurationMs: 1_950, fallbackImage: "/chungdoi/labs/dalat-journey/fallback/wish-valley.webp" },
  ],
} as const satisfies {
  camera: { fovDegrees: number };
  checkpoints: readonly DalatJourneyCheckpoint[];
  look: { pitchDegrees: number; yawDegrees: number };
  reducedDurationMs: number;
};
```

- [ ] **Step 4: Re-run the test**

Expected: definition assertions PASS; locale parity remains red until Task 3.

---

### Task 2: Build the pure journey state machine

**Files:**

- Create: `src/components/dalat-journey/journey-controller.test.ts`
- Create: `src/components/dalat-journey/journey-controller.ts`

- [ ] **Step 1: Write failing reducer tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { createInitialJourneyState, journeyReducer } from "./journey-controller";

test("entry travels from mist gate to memory pines", () => {
  const travelling = journeyReducer(createInitialJourneyState(false), { type: "enter" });
  assert.equal(travelling.phase, "travelling");
  assert.equal(travelling.currentIndex, 0);
  assert.equal(travelling.targetIndex, 1);
});

test("navigation is ignored while travelling", () => {
  const travelling = journeyReducer(createInitialJourneyState(false), { type: "enter" });
  assert.deepEqual(journeyReducer(travelling, { type: "next" }), travelling);
  assert.deepEqual(journeyReducer(travelling, { type: "previous" }), travelling);
});

test("renderer failure preserves the intended checkpoint", () => {
  const travelling = journeyReducer(createInitialJourneyState(false), { type: "enter" });
  const fallback = journeyReducer(travelling, { type: "rendererFallback" });
  assert.equal(fallback.renderMode, "fallback");
  assert.equal(fallback.phase, "fallback-settled");
  assert.equal(fallback.currentIndex, 1);
});

test("fallback at the threshold still allows explicit entry", () => {
  const fallback = journeyReducer(createInitialJourneyState(false), { type: "rendererFallback" });
  assert.equal(fallback.phase, "threshold");
  assert.equal(journeyReducer(fallback, { type: "enter" }).targetIndex, 1);
});

test("look is clamped", () => {
  const settled = { ...createInitialJourneyState(false), phase: "settled" as const };
  const looked = journeyReducer(settled, { type: "look", pitchDegrees: -99, yawDegrees: 99 });
  assert.deepEqual(looked.look, { pitchDegrees: -8, yawDegrees: 20 });
});
```

- [ ] **Step 2: Run and verify failure**

```bash
npx tsx --test src/components/dalat-journey/journey-controller.test.ts
```

Expected: FAIL because the controller does not exist.

- [ ] **Step 3: Implement exact phases and actions**

```ts
import { dalatJourneyDefinition } from "@/data/dalat-journey";

export type JourneyPhase = "threshold" | "settled" | "travelling" | "fallback-settled";
export type JourneyState = {
  currentIndex: number;
  look: { pitchDegrees: number; yawDegrees: number };
  phase: JourneyPhase;
  reducedMotion: boolean;
  renderMode: "webgl" | "fallback";
  targetIndex: number | null;
};
export type JourneyAction =
  | { type: "arrive" }
  | { type: "enter" }
  | { type: "look"; pitchDegrees: number; yawDegrees: number }
  | { type: "next" }
  | { type: "previous" }
  | { type: "rendererFallback" }
  | { type: "resetLook" }
  | { type: "setReducedMotion"; value: boolean };

export function createInitialJourneyState(reducedMotion: boolean): JourneyState {
  return { currentIndex: 0, look: { pitchDegrees: 0, yawDegrees: 0 }, phase: "threshold", reducedMotion, renderMode: "webgl", targetIndex: null };
}

function requestTravel(state: JourneyState, targetIndex: number): JourneyState {
  if (state.phase === "travelling") return state;
  if (targetIndex < 0 || targetIndex >= dalatJourneyDefinition.checkpoints.length) return state;
  return { ...state, look: { pitchDegrees: 0, yawDegrees: 0 }, phase: "travelling", targetIndex };
}

export function journeyReducer(state: JourneyState, action: JourneyAction): JourneyState {
  switch (action.type) {
    case "enter": return state.phase === "threshold" ? requestTravel(state, 1) : state;
    case "next": return requestTravel(state, state.currentIndex + 1);
    case "previous": return requestTravel(state, state.currentIndex - 1);
    case "arrive":
      if (state.phase !== "travelling" || state.targetIndex === null) return state;
      return { ...state, currentIndex: state.targetIndex, phase: state.renderMode === "fallback" ? "fallback-settled" : "settled", targetIndex: null };
    case "rendererFallback":
      return {
        ...state,
        currentIndex: state.targetIndex ?? state.currentIndex,
        phase: state.phase === "threshold" ? "threshold" : "fallback-settled",
        renderMode: "fallback",
        targetIndex: null,
      };
    case "look":
      if (state.phase !== "settled" && state.phase !== "fallback-settled") return state;
      return { ...state, look: { pitchDegrees: Math.max(-8, Math.min(8, action.pitchDegrees)), yawDegrees: Math.max(-20, Math.min(20, action.yawDegrees)) } };
    case "resetLook": return { ...state, look: { pitchDegrees: 0, yawDegrees: 0 } };
    case "setReducedMotion": return { ...state, reducedMotion: action.value };
  }
}
```

- [ ] **Step 4: Run reducer tests and typecheck**

```bash
npx tsx --test src/components/dalat-journey/journey-controller.test.ts
npm run typecheck
```

Expected: PASS and exit `0`.

---

### Task 3: Add route gating, localized copy, and the minimal shell

**Files:**

- Create: `src/app/[locale]/lab/dalat-journey/page.tsx`
- Create: `src/components/dalat-journey/dalat-journey-lab.tsx`
- Create: `src/components/dalat-journey/journey-loading.tsx`
- Create: `tests/e2e/dalat-journey-lab.spec.ts`
- Modify: `messages/{vi,en,ja,ko,zh}.json`
- Modify: `src/components/petal-field.tsx`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Write a failing route smoke test**

```ts
import { expect, test } from "@playwright/test";

const LAB_PATH = "/lab/dalat-journey";

test("private route exposes its threshold without global petals", async ({ page }) => {
  await page.goto(LAB_PATH);
  await expect(page).toHaveTitle(/Đà Lạt|Dalat/i);
  await expect(page.getByTestId("dalat-journey-stage")).toHaveAttribute("data-journey-phase", "threshold");
  await expect(page.getByTestId("dalat-journey-enter")).toBeEnabled();
  await expect(page.locator(".petal-field")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
```

- [ ] **Step 2: Enable the private route in Playwright and prove the test is red**

Add `DALAT_JOURNEY_LAB_ENABLED: "1"` to the Playwright web-server env, then run:

```bash
npx playwright test tests/e2e/dalat-journey-lab.spec.ts --project=chromium
```

Expected: FAIL with 404/missing stage.

- [ ] **Step 3: Add the complete message namespace to all five catalogs**

Each locale must have these exact leaf keys:

```text
metaTitle, metaDescription, entryKicker, entryTitle, entryBody, enter,
previous, next, loading, fallbackNotice, reducedMotion, gestureHint,
checkpointStatus,
checkpoints.{mistGate,memoryPines,timeGlasshouse,lakePavilion,wishValley}.
  {name,kicker,title,body,detail}
```

Vietnamese source copy:

```json
{
  "metaTitle": "Vườn sương Đà Lạt — Journey Lab",
  "metaDescription": "Một hành trình nhập vai góc nhìn thứ nhất qua năm checkpoint trong khu vườn Đà Lạt huyền ảo.",
  "entryKicker": "Một hành trình qua sương",
  "entryTitle": "Vườn sương Đà Lạt",
  "entryBody": "Vuốt để bước đi. Kéo ngang để nhìn quanh. Mỗi điểm dừng giữ một phần câu chuyện.",
  "enter": "Bước vào",
  "previous": "Quay lại",
  "next": "Đi tiếp",
  "loading": "Đang mở lối qua màn sương",
  "fallbackNotice": "Thiết bị đang dùng phiên bản cảnh nhẹ hơn.",
  "reducedMotion": "Giảm chuyển động",
  "gestureHint": "Vuốt dọc để di chuyển · kéo ngang để nhìn quanh",
  "checkpointStatus": "{current} trên {total}: {name}"
}
```

Checkpoint copy stays neutral: Cổng sương / Rừng ký ức / Nhà kính thời gian / Pavilion bên hồ / Thung lũng nguyện ước; titles use Lorem or `00 · 00 · 0000`. Translate naturally into `en`, `ja`, `ko`, and `zh`; never leave Vietnamese prose in those catalogs. Run `npx tsx --test src/data/dalat-journey.test.ts` until locale parity passes.

- [ ] **Step 4: Create the Next.js 16 Server Component page**

Use async `params`, dynamic rendering for runtime env gating, localized metadata, and `notFound()`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DalatJourneyLab } from "@/components/dalat-journey/dalat-journey-lab";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

function isLabEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.DALAT_JOURNEY_LAB_ENABLED === "1";
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dalatJourneyLab" });
  return { title: t("metaTitle"), description: t("metaDescription"), robots: { index: false, follow: false } };
}

export default async function DalatJourneyLabPage({ params }: { params: Promise<{ locale: Locale }> }) {
  if (!isLabEnabled()) notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  return <DalatJourneyLab />;
}
```

- [ ] **Step 5: Create the minimal Client Component shell**

Render a full-viewport main with stable markers and a native `44px` entry button:

```tsx
<main
  className="relative h-[100dvh] w-full overflow-hidden bg-[#08120f] text-[#f5f2e8]"
  data-checkpoint="mistGate"
  data-checkpoint-index="0"
  data-journey-phase="threshold"
  data-renderer="loading"
  data-testid="dalat-journey-stage"
>
```

Use `useTranslations("dalatJourneyLab")`; no user-facing hardcoded copy.

Build one `DalatJourneyCopy` object in the shell by iterating `DALAT_JOURNEY_CHECKPOINT_IDS`; pass that object unchanged to both renderers so they cannot drift.

- [ ] **Step 6: Suppress petals on both labs**

```ts
if (/\/lab\/(?:flow-demo|dalat-journey)\/?$/.test(pathname)) return null;
```

- [ ] **Step 7: Run smoke verification**

```bash
npm run typecheck
npm run typecheck:tests
npx eslint 'src/app/[locale]/lab/dalat-journey/page.tsx' src/components/dalat-journey src/data/dalat-journey.ts src/data/dalat-journey.test.ts tests/e2e/dalat-journey-lab.spec.ts playwright.config.ts src/components/petal-field.tsx
npx playwright test tests/e2e/dalat-journey-lab.spec.ts --project=chromium
```

Expected: route smoke PASS; no petals; static checks exit `0`.

---

### Task 4: Produce and validate the original mini asset pack

**Files:**

- Create: `public/chungdoi/labs/dalat-journey/fallback/{mist-gate,memory-pines,time-glasshouse,lake-pavilion,wish-valley}.webp`
- Create: `public/chungdoi/labs/dalat-journey/materials/{foliage-atlas,fog-noise}.webp`
- Modify: `docs/research/asset-provenance.md`

- [ ] **Step 1: Generate five coherent fallback panoramas**

Use the image-generation tool with this shared art bible:

```text
First-person cinematic environment concept for a premium interactive Vietnamese invitation journey, magical-realist Da Lat highlands, 70 percent recognizable real landscape and 30 percent subtle magic, low-poly forms with painterly premium materials, center-safe composition for both 4:3 desktop and portrait mobile crop, no people, no typography, no logos, no interface, no floating cards, misty depth without bloom, elegant muted pine green, cream, amber and cool blue palette.
```

Append one scene directive per output:

1. `mist-gate.webp`: pre-dawn pine arch, stone threshold, mist opening around a central path.
2. `memory-pines.webp`: morning grove, three translucent memory panes suspended between trees.
3. `time-glasshouse.webp`: daylight glasshouse, botanical clock rings and a physical display surface.
4. `lake-pavilion.webp`: golden-hour lake and pavilion, floor inlay and reflected route.
5. `wish-valley.webp`: blue-hour flower valley, glowing blossoms and a physical guestbook desk.

Save center-safe WebP files around `1600×1200`, quality `78–82`, each below `350 KB` where quality permits.

- [ ] **Step 2: Generate the two material textures**

- `foliage-atlas.webp`: `1024×1024`, four clean pine/flower alpha clusters, transparent background.
- `fog-noise.webp`: `512×512`, seamless low-contrast monochrome organic fog noise.

- [ ] **Step 3: Validate dimensions, alpha, and byte budget**

```bash
node - <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = 'public/chungdoi/labs/dalat-journey';
const files = fs.readdirSync(path.join(root, 'fallback')).map((name) => path.join(root, 'fallback', name));
files.push(path.join(root, 'materials', 'foliage-atlas.webp'));
files.push(path.join(root, 'materials', 'fog-noise.webp'));
(async () => {
  let total = 0;
  for (const file of files) {
    const stat = fs.statSync(file);
    const meta = await sharp(file).metadata();
    total += stat.size;
    console.log(file, stat.size, meta.width, meta.height, meta.hasAlpha);
  }
  if (total > 3_000_000) throw new Error(`Asset pack too large: ${total}`);
})();
NODE
```

Expected: five panoramas and two material textures under `3 MB`; foliage reports alpha.

- [ ] **Step 4: Record provenance and inspect visually**

Append the generation tool, shared prompt, five directives, date, and paths to `docs/research/asset-provenance.md`. Inspect all outputs for people, logos, fake text, matte rectangles, inconsistent camera height, and unsafe mobile crops. Regenerate failures rather than hiding them in CSS.

---

### Task 5: Implement gesture classification and the 2.5D fallback first

**Files:**

- Create: `src/components/dalat-journey/journey-input.test.ts`
- Create: `src/components/dalat-journey/use-journey-input.ts`
- Create: `src/components/dalat-journey/journey-fallback.tsx`
- Create: `src/components/dalat-journey/dalat-journey.module.css`
- Modify: `src/components/dalat-journey/dalat-journey-lab.tsx`
- Modify: `tests/e2e/dalat-journey-lab.spec.ts`

- [ ] **Step 1: Write failing gesture tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { classifyJourneyGesture } from "./use-journey-input";

test("vertical gestures navigate and horizontal gestures look", () => {
  assert.deepEqual(classifyJourneyGesture(4, -72), { type: "next" });
  assert.deepEqual(classifyJourneyGesture(-5, 68), { type: "previous" });
  assert.deepEqual(classifyJourneyGesture(55, 8), { type: "look", deltaX: 55, deltaY: 8 });
  assert.deepEqual(classifyJourneyGesture(8, 9), { type: "none" });
});
```

- [ ] **Step 2: Run and verify failure**

```bash
npx tsx --test src/components/dalat-journey/journey-input.test.ts
```

Expected: FAIL because the input module does not exist.

- [ ] **Step 3: Implement the classifier and event hook**

```ts
export type JourneyGesture =
  | { type: "look"; deltaX: number; deltaY: number }
  | { type: "next" }
  | { type: "none" }
  | { type: "previous" };

export function classifyJourneyGesture(deltaX: number, deltaY: number): JourneyGesture {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  if (absY >= 42 && absY > absX * 1.15) {
    return { type: deltaY < 0 ? "next" : "previous" };
  }
  if (absX >= 18 && absX > absY * 1.15) {
    return { type: "look", deltaX, deltaY };
  }
  return { type: "none" };
}
```

The hook must attach wheel/pointer listeners to the stage and keyboard listeners to `window`; ignore editable targets; collapse wheel bursts into one action; avoid React state during pointer movement; and remove listeners/timers on cleanup.

- [ ] **Step 4: Build the fallback from the shared definition**

Render one active panorama with CSS-module classes, never inline `backgroundImage`:

```ts
const FALLBACK_CLASS_BY_ID = {
  mistGate: styles.mistGate,
  memoryPines: styles.memoryPines,
  timeGlasshouse: styles.timeGlasshouse,
  lakePavilion: styles.lakePavilion,
  wishValley: styles.wishValley,
} satisfies Record<DalatJourneyCheckpointId, string>;
```

Expose:

```tsx
<section
  aria-label={checkpointName}
  className={cn(styles.fallbackStage, FALLBACK_CLASS_BY_ID[checkpoint.id])}
  data-checkpoint={checkpoint.id}
  data-testid="dalat-journey-fallback"
>
```

Checkpoint copy sits on physical-looking stone, glass, greenhouse, pavilion, or book surfaces. Reduced motion uses `180ms`; normal fallback transitions use `650ms` opacity/transform only.

Preload only the active and next panorama with `new Image()` inside an effect. On image failure, keep the CSS gradient/geometry layer visible and announce the localized lightweight-renderer notice; never leave an empty black surface.

- [ ] **Step 5: Wire reducer, controls, live region, and fallback**

The shell owns `useReducer` and exposes:

```tsx
data-checkpoint={checkpoint.id}
data-checkpoint-index={state.currentIndex}
data-journey-phase={state.phase}
data-look-pitch={state.look.pitchDegrees.toFixed(2)}
data-look-yaw={state.look.yawDegrees.toFixed(2)}
data-renderer={state.renderMode}
```

Stable test IDs:

```text
dalat-journey-enter
dalat-journey-previous
dalat-journey-next
dalat-journey-reduced-motion
```

Fallback travel schedules `arrive` after the correct reduced/full duration and cancels the timer on rerender/unmount.

- [ ] **Step 6: Extend E2E for forced fallback and mobile input**

Force WebGL failure:

```ts
await page.addInitScript(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: () => null,
  });
});
```

Assert fallback visibility, entry, Previous/Next, one vertical swipe, horizontal look without checkpoint change, `390px` overflow safety, and `44×44px` controls.

- [ ] **Step 7: Run focused gates**

```bash
npx tsx --test src/components/dalat-journey/journey-input.test.ts src/components/dalat-journey/journey-controller.test.ts
npm run typecheck
npm run typecheck:tests
npx eslint src/components/dalat-journey tests/e2e/dalat-journey-lab.spec.ts
npx playwright test tests/e2e/dalat-journey-lab.spec.ts --project=chromium
```

Expected: all fallback tests PASS.

---

### Task 6: Add the dynamic WebGL boundary and recovery

**Files:**

- Create: `src/components/dalat-journey/journey-canvas.tsx`
- Modify: `src/components/dalat-journey/dalat-journey-lab.tsx`
- Modify: `tests/e2e/dalat-journey-lab.spec.ts`

- [ ] **Step 1: Add a failing WebGL smoke assertion**

```ts
await page.getByTestId("dalat-journey-enter").click();
await expect(page.getByTestId("dalat-journey-canvas")).toBeVisible();
await expect(page.getByTestId("dalat-journey-stage")).toHaveAttribute("data-renderer", "webgl");
```

Expected before implementation: FAIL because no canvas mounts.

- [ ] **Step 2: Dynamically import from the Client Component**

At top-level in `dalat-journey-lab.tsx`:

```ts
const JourneyCanvas = dynamic(
  () => import("./journey-canvas").then((module) => module.JourneyCanvas),
  { ssr: false },
);
```

Never place `{ ssr:false }` in the Server Component page.

- [ ] **Step 3: Implement preflight, error boundary, and context-loss recovery**

Preflight `webgl2` then `webgl`; call `onUnavailable` if absent. Wrap R3F in an error boundary. On the real canvas, listen for `webglcontextlost`, call `preventDefault()`, invoke `onUnavailable`, and clean up.

Define the boundary props and quality type explicitly:

```ts
export type JourneyQualityTier = "desktop" | "mobile" | "reduced";

export type JourneyCanvasProps = {
  copy: DalatJourneyCopy;
  currentIndex: number;
  lookRef: MutableRefObject<{ pitchDegrees: number; yawDegrees: number }>;
  onArrive: () => void;
  onInvalidateReady: (invalidate: (() => void) | null) => void;
  onReady: () => void;
  onUnavailable: () => void;
  phase: JourneyPhase;
  reducedMotion: boolean;
  targetIndex: number | null;
};
```

In the client shell, derive `isMobile` with `useSyncExternalStore` and `matchMedia("(max-width: 767px)")`; do not read `window.innerWidth` during render. Keep a local `rendererReady` boolean so `data-renderer` is `loading` until `onReady`, then `webgl`, or `fallback` after `onUnavailable`.

```tsx
<div
  className="absolute inset-0"
  data-quality-tier={qualityTier}
  data-testid="dalat-journey-canvas"
  data-world-skin="dalat-mist"
>
  <Canvas
    camera={{ fov: 50, near: 0.1, far: 90, position: [0, 1.65, 8.5] }}
    dpr={isMobile ? 1 : [1, 1.25]}
    frameloop="demand"
    gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
    shadows={false}
  >
    {/* world added in Task 7 */}
  </Canvas>
</div>
```

- [ ] **Step 4: Add context-loss E2E**

```ts
await page.getByTestId("dalat-journey-canvas").locator("canvas").evaluate((canvas) => {
  canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
});
await expect(page.getByTestId("dalat-journey-fallback")).toBeVisible();
```

Assert checkpoint preservation and zero console errors.

- [ ] **Step 5: Run focused verification**

Run typecheck, focused ESLint, and focused Playwright. Expected: WebGL smoke and both fallback paths PASS.

---

### Task 7: Build the procedural Đà Lạt world and adaptive quality tier

**Files:**

- Create: `src/components/dalat-journey/dalat-mist-world.tsx`
- Modify: `src/components/dalat-journey/journey-canvas.tsx`
- Modify: `tests/e2e/dalat-journey-lab.spec.ts`

- [ ] **Step 1: Add failing world-marker assertions**

```ts
await expect(page.getByTestId("dalat-journey-canvas")).toHaveAttribute("data-world-skin", "dalat-mist");
await expect(page.getByTestId("dalat-journey-canvas")).toHaveAttribute("data-quality-tier", /mobile|desktop|reduced/);
```

- [ ] **Step 2: Implement deterministic placement helpers**

Use a seeded PRNG inside `useMemo`; never use `Math.random()` during render:

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

Create instanced meshes for pine trunks, crowns, flower heads, and light points. Use `80/140` pines and `120/220` flower groups on mobile/desktop. Set matrices once and mark `instanceMatrix.needsUpdate`.

- [ ] **Step 3: Build one continuous scene**

Implement focused scene units:

- `DalatTerrain` — five connected low-poly ground strips and central path.
- `PineForest` — deterministic instances with a clear corridor.
- `MistLayers` — two or three alpha planes using `fog-noise.webp`, `depthWrite={false}`.
- `MistGate` around z≈`4`.
- `MemoryPines` around z≈`-6`.
- `TimeGlasshouse` around z≈`-15`.
- `LakePavilion` around z≈`-25`.
- `WishValley` around z≈`-36`.

Use basic/standard/physical materials only. No shadow maps, environment HDR, bloom, EffectComposer, or multipass post-processing. Emissive/basic materials and additive sprites provide light.

- [ ] **Step 4: Add one shared mutable cue ref**

```ts
export type JourneyCueState = {
  glow: number;
  mistOpen: number;
  sceneTime: number;
  travelProgress: number;
};
```

Pass `MutableRefObject<JourneyCueState>` into the world. In `useFrame`, apply values to material opacity, group positions, and emissive intensity without React setters.

- [ ] **Step 5: Add conservative adaptive quality**

Start at `mobile` or `desktop`. A sustained-frame monitor lowers exactly one tier after frame time stays above `24ms` for `2s`. The reduced tier halves far pines/flowers, removes secondary firefly lights, and caps settled ambience at `20fps`; it never removes checkpoint structures or content. Expose the tier for tests.

Load foliage/fog textures behind a small local error boundary. If either material texture fails, render procedural solid-color foliage and opacity-gradient mist; do not fail the entire checkpoint or leave the canvas blank.

- [ ] **Step 6: Scan prohibited patterns and run gates**

```bash
rg -n "EffectComposer|Bloom|Math\.random|setState\(|style=" src/components/dalat-journey
npm run typecheck
npx eslint src/components/dalat-journey
npx playwright test tests/e2e/dalat-journey-lab.spec.ts --project=chromium
```

Expected: no prohibited pattern except reviewed legitimate matches; all gates PASS.

---

### Task 8: Implement GSAP camera travel, free look, and diegetic content

**Files:**

- Create: `src/components/dalat-journey/journey-camera.tsx`
- Create: `src/components/dalat-journey/diegetic-content.tsx`
- Modify: `src/components/dalat-journey/journey-canvas.tsx`
- Modify: `src/components/dalat-journey/dalat-mist-world.tsx`
- Modify: `src/components/dalat-journey/dalat-journey-lab.tsx`
- Modify: `tests/e2e/dalat-journey-lab.spec.ts`

- [ ] **Step 1: Add failing lifecycle assertions**

Assert entry changes immediately to `travelling`; arrow controls disable; arrival settles at `memoryPines` within `2.5s`; repeated input cannot skip; final checkpoint remains settled; horizontal drag never exceeds `20°`.

- [ ] **Step 2: Implement one finite camera/cue timeline per travel**

`JourneyCamera` receives current/target indices, look ref, reduced motion, cue ref, `onArrive`, and an invalidate bridge. It must:

- snapshot actual camera position/quaternion at travel start;
- create one GSAP timeline;
- tween proxy progress from `0` to `1`;
- interpolate a Catmull-Rom curve through current position, one authored midpoint, and target position;
- interpolate look target;
- tween `sceneTime`, `mistOpen`, `glow`, and `travelProgress` in the same timeline;
- call `invalidate()` on update;
- call `onArrive()` once;
- use `180ms` opacity-only handoff under reduced motion;
- kill the timeline on replacement/unmount.

Do not register ScrollTrigger.

- [ ] **Step 3: Bridge free look without frame-by-frame React renders**

Store live yaw/pitch in a mutable ref in the shell. Pointer input mutates it and requests invalidation. Dispatch the clamped reducer diagnostic value only at a throttled cadence so `data-look-yaw` remains testable without becoming a render loop. Before travel, blend the look offset to zero.

- [ ] **Step 4: Build physical diegetic surfaces**

`DiegeticContent` maps IDs to typed position/rotation values and Drei `<Html transform>` surfaces. Requirements:

- content is visibly attached to stone, glass, greenhouse, pavilion, or book geometry;
- no generic floating rounded card;
- only active settled content receives pointer events or tab focus;
- off-screen content is `aria-hidden` and removed from tab order;
- text comes from the shared localized copy object;
- the final guestbook affordance is local-only, native, and cannot submit data.

- [ ] **Step 5: Implement ambient invalidation lifecycle**

While settled/visible: mobile `30fps`, desktop display cadence, reduced tier `20fps`. Reduced motion has no ambient loop. `visibilitychange` pauses/resumes; cleanup cancels RAF/timer.

- [ ] **Step 6: Run all focused checks**

```bash
npx tsx --test src/components/dalat-journey/*.test.ts src/data/dalat-journey.test.ts
npm run typecheck
npm run typecheck:tests
npx eslint src/components/dalat-journey tests/e2e/dalat-journey-lab.spec.ts
npx playwright test tests/e2e/dalat-journey-lab.spec.ts --project=chromium
```

Expected: lifecycle, input lock, final state, and look bounds PASS.

---

### Task 9: Complete reduced motion, focus management, and renderer parity

**Files:**

- Modify: `src/components/dalat-journey/dalat-journey-lab.tsx`
- Modify: `src/components/dalat-journey/journey-camera.tsx`
- Modify: `src/components/dalat-journey/journey-fallback.tsx`
- Modify: `src/components/dalat-journey/diegetic-content.tsx`
- Modify: `tests/e2e/dalat-journey-lab.spec.ts`

- [ ] **Step 1: Add failing accessibility/reduced-motion assertions**

Test `page.emulateMedia({ reducedMotion: "reduce" })`, arrival within `600ms`, no look change, live-region checkpoint announcement, button/keyboard focus transfer, native `BUTTON` controls, and identical checkpoint labels in fallback/WebGL.

- [ ] **Step 2: Implement system plus override reduced motion**

Use `useSyncExternalStore` with `matchMedia("(prefers-reduced-motion: reduce)")`, following `flow-lab.tsx`. The lab checkbox can force reduction but cannot disable a system preference.

- [ ] **Step 3: Implement input-aware focus**

Track last semantic source (`button`, `keyboard`, `gesture`, `wheel`). After arrival, focus the active checkpoint heading only for button/keyboard. Gesture/wheel preserve focus. Never focus scene content while travelling.

- [ ] **Step 4: Verify renderer parity**

Build one `DalatJourneyCopy` object in the shell and pass it to both renderers. Do not translate inside frame callbacks. Confirm identical checkpoint IDs, names, status, and disabled boundaries in E2E.

- [ ] **Step 5: Run focused E2E and manual keyboard inspection**

Tab through entry, Previous/Next, reduced-motion toggle, and final in-world affordance at `390×844` and `1440×900`.

---

### Task 10: Final verification and visual/performance QA

**Files:**

- Modify only files required by verified defects.

- [ ] **Step 1: Run every static and unit gate fresh**

```bash
npm run typecheck
npm run typecheck:tests
npm run test:unit
npx eslint 'src/app/[locale]/lab/dalat-journey/page.tsx' src/components/dalat-journey src/data/dalat-journey.ts src/data/dalat-journey.test.ts tests/e2e/dalat-journey-lab.spec.ts playwright.config.ts src/components/petal-field.tsx
git diff --check
```

Expected: all exit `0`; full unit suite has zero failures.

- [ ] **Step 2: Run the production-build browser suite fresh**

```bash
npx playwright test tests/e2e/dalat-journey-lab.spec.ts --project=chromium
```

Expected: focused tests PASS, the production build completes, and console error capture stays empty.

- [ ] **Step 3: Capture the full visual matrix**

Capture all five settled checkpoints at desktop `1440×900`, mobile `390×844`, forced mobile fallback, and reduced motion. Capture one mid-travel frame for each transition. Inspect continuous path, diegetic text, clipping, mobile overflow, time-of-day arc, and control prominence.

- [ ] **Step 4: Measure runtime budgets**

Record canvas CSS/backing size, DPR, `gl.info.render` draw calls/triangles through a development-only snapshot, asset transfer size, and travel/settled frame cadence.

Acceptance:

- mobile DPR `1`;
- desktop DPR ≤ `1.25`;
- mobile visible geometry ≈`150k` triangles and `80` draw calls or less;
- initial lab assets ≤ `3 MB`;
- no checkpoint-arrival long task;
- no sustained frame collapse in ordinary mobile-class emulation.

- [ ] **Step 5: Re-run gates after every QA fix**

Run the smallest proving test first, then the complete Task 10 gate set.

- [ ] **Step 6: Review worktree scope without committing**

```bash
git status --short
git diff --stat -- src/app/'[locale]'/lab/dalat-journey src/components/dalat-journey src/data/dalat-journey.ts src/data/dalat-journey.test.ts tests/e2e/dalat-journey-lab.spec.ts messages playwright.config.ts src/components/petal-field.tsx docs/research/asset-provenance.md docs/superpowers
```

Confirm no Conan, template registry, database, audio, dependency, or deployment file was changed by this implementation. Do not commit, push, or deploy.
