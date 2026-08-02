# Motion Engine Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Upgrade the existing /lab/flow-demo route into a mobile-first comparison lab for four reusable invitation choreographies across CSS, WAAPI, GSAP, Canvas 2D, and React Three Fiber/WebGL.

**Architecture:** Keep the localized Server Component route and replace the current GSAP-only client prototype with a focused lab shell. All five adapters implement one MotionDemoProps contract and render the same semantic artwork; WebGL is dynamically loaded, while the other adapters stay in the main lab bundle. React changes state only at selection and run boundaries.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, CSS Modules, Web Animations API, GSAP, Canvas 2D, React Three Fiber/Three.js, next-intl, Node test runner, Playwright.

**Repository note:** Commit steps are intentionally omitted because project instructions require an explicit user request before committing.

---

### Task 1: Define and test the comparison registry

**Files:**
- Modify: src/data/flow-demo-scenes.ts
- Create: src/data/flow-demo-scenes.test.ts

- [ ] **Step 1: Write the failing registry tests**

    import assert from "node:assert/strict";
    import test from "node:test";

    import {
      FLOW_DEMO_CHOREOGRAPHIES,
      FLOW_DEMO_ENGINES,
      flowDemoCombinationIds,
    } from "./flow-demo-scenes";

    test("flow lab registers five engines and four choreographies", () => {
      assert.deepEqual(FLOW_DEMO_ENGINES, [
        "css", "waapi", "gsap", "canvas", "webgl",
      ]);
      assert.deepEqual(FLOW_DEMO_CHOREOGRAPHIES, [
        "splitGate", "irisBloom", "depthPortal", "ribbonSweep",
      ]);
    });

    test("flow lab exposes every engine and choreography combination", () => {
      assert.equal(flowDemoCombinationIds.length, 20);
      assert.equal(new Set(flowDemoCombinationIds).size, 20);
      assert.ok(flowDemoCombinationIds.includes("webgl:ribbonSweep"));
    });

- [ ] **Step 2: Run the test and verify it fails**

Run: npx tsx --test src/data/flow-demo-scenes.test.ts

Expected: FAIL because the registry exports do not exist.

- [ ] **Step 3: Replace scene copy with typed IDs and the cross-product**

    export const FLOW_DEMO_ENGINES = [
      "css", "waapi", "gsap", "canvas", "webgl",
    ] as const;

    export const FLOW_DEMO_CHOREOGRAPHIES = [
      "splitGate", "irisBloom", "depthPortal", "ribbonSweep",
    ] as const;

    export type FlowDemoEngine = (typeof FLOW_DEMO_ENGINES)[number];
    export type FlowDemoChoreography =
      (typeof FLOW_DEMO_CHOREOGRAPHIES)[number];
    export type FlowDemoViewMode = "focus" | "compare";

    export const flowDemoCombinationIds = FLOW_DEMO_ENGINES.flatMap((engine) =>
      FLOW_DEMO_CHOREOGRAPHIES.map((choreography) =>
        [engine, choreography].join(":"),
      ),
    );

    export const FLOW_DEMO_DURATION_MS = 1_100;
    export const FLOW_DEMO_REDUCED_DURATION_MS = 150;

- [ ] **Step 4: Run the test and verify it passes**

Run: npx tsx --test src/data/flow-demo-scenes.test.ts

Expected: 2 tests pass.

### Task 2: Build the shared semantic stage and CSS baseline

**Files:**
- Create: src/components/motion-lab/motion-demo-types.ts
- Create: src/components/motion-lab/motion-artwork.tsx
- Create: src/components/motion-lab/motion-artwork.module.css
- Create: src/components/motion-lab/css-motion-demo.tsx

- [ ] **Step 1: Define the adapter contract**

    import type { FlowDemoChoreography } from "@/data/flow-demo-scenes";

    export type MotionDemoProps = {
      choreography: FlowDemoChoreography;
      reducedMotion: boolean;
      runId: number;
    };

    export type MotionCopy = {
      kicker: string;
      title: string;
      body: string;
      date: string;
    };

    export type MotionActorName =
      | "frame"
      | "hero"
      | "accentLeft"
      | "accentRight"
      | "reveal"
      | "ribbon";

- [ ] **Step 2: Implement MotionArtwork**

Render exactly one element for each role: backdrop, frame, hero, accent-left,
accent-right, reveal-surface, and ribbon. Accept callback refs so WAAPI and
GSAP target the same actors. Receive every visible string through MotionCopy.

- [ ] **Step 3: Add static styles and four CSS recipes**

The CSS Module must expose splitGate, irisBloom, depthPortal, ribbonSweep, and
reduced run classes. Keyframes may change only transform and opacity. Do not
add filter, backdrop-filter, animated shadow, width, height, top, or left.

- [ ] **Step 4: Implement CssMotionDemo**

Use a replay key derived from choreography, runId, and reducedMotion. Track only
the running/complete boundary with onAnimationEnd on the reveal surface. Expose
data-motion-engine, data-motion-choreography, data-motion-state, and
data-reduced-motion.

- [ ] **Step 5: Run focused lint and typecheck**

Run: npx eslint src/components/motion-lab src/data/flow-demo-scenes.ts src/data/flow-demo-scenes.test.ts && npm run typecheck

Expected: no ESLint errors and TypeScript exits 0.

### Task 3: Add WAAPI and GSAP adapters

**Files:**
- Create: src/components/motion-lab/dom-motion-recipes.ts
- Create: src/components/motion-lab/waapi-motion-demo.tsx
- Create: src/components/motion-lab/gsap-motion-demo.tsx

- [ ] **Step 1: Define normalized DOM recipes**

    export type ActorAnimation = {
      actor: MotionActorName;
      keyframes: Keyframe[];
      options: KeyframeAnimationOptions;
    };

    export function domMotionRecipe(
      choreography: FlowDemoChoreography,
      reducedMotion: boolean,
    ): ActorAnimation[];

Every full recipe uses only transform and opacity. Every reduced recipe returns
one reveal opacity animation lasting FLOW_DEMO_REDUCED_DURATION_MS.

- [ ] **Step 2: Implement the WAAPI adapter**

Cancel previous Animation objects on replay or cleanup. Apply each recipe with
Element.animate, await all finished promises, and update React state only at
run start and completion.

- [ ] **Step 3: Implement the GSAP adapter**

Create one finite gsap.timeline per run. Translate the same recipe timing into
fromTo calls, kill the timeline during cleanup, and never call React state from
onUpdate.

- [ ] **Step 4: Verify disallowed animation properties are absent**

Run: rg -n 'filter|backdrop|boxShadow|width:|height:|top:|left:' src/components/motion-lab/dom-motion-recipes.ts src/components/motion-lab/waapi-motion-demo.tsx src/components/motion-lab/gsap-motion-demo.tsx

Expected: no matches in animation definitions.

### Task 4: Add finite Canvas 2D and WebGL adapters

**Files:**
- Create: src/components/motion-lab/canvas-motion-demo.tsx
- Create: src/components/motion-lab/webgl-motion-demo.tsx
- Create: src/components/motion-lab/motion-demo-card.tsx

- [ ] **Step 1: Implement Canvas 2D**

Resize from the CSS box, use DPR 1 below 768px and at most 1.25 otherwise, and
run requestAnimationFrame only until normalized progress reaches one. Cancel
the frame on replay, tab hiding, and cleanup.

    function drawCanvasFrame(
      context: CanvasRenderingContext2D,
      choreography: FlowDemoChoreography,
      progress: number,
      width: number,
      height: number,
    ): void;

- [ ] **Step 2: Implement WebGL with React Three Fiber**

Use an orthographic camera, basic materials, five simple meshes, no textures,
lights, shadows, controls, or post-processing. Keep frameloop="demand". A finite
requestAnimationFrame loop updates a progress ref and calls invalidate; useFrame
mutates mesh transforms before each demanded render.

- [ ] **Step 3: Dynamically load WebGL from MotionDemoCard**

    const WebglMotionDemo = dynamic(
      () => import("./webgl-motion-demo")
        .then((module) => module.WebglMotionDemo),
      { ssr: false, loading: () => <MotionStageLoading /> },
    );

Map the four other IDs to static adapters. Detect missing WebGL before mounting
the dynamic adapter and preserve card dimensions with localized unavailable copy.

- [ ] **Step 4: Run typecheck**

Run: npm run typecheck

Expected: all adapters satisfy MotionDemoProps.

### Task 5: Replace the lab shell and localize it

**Files:**
- Modify: src/components/flow-lab.tsx
- Modify: messages/vi.json
- Modify: messages/en.json
- Modify: messages/ja.json
- Modify: messages/ko.json
- Modify: messages/zh.json

- [ ] **Step 1: Replace the GSAP-only navigator with selection state**

    const [viewMode, setViewMode] =
      useState<FlowDemoViewMode>("focus");
    const [engine, setEngine] =
      useState<FlowDemoEngine>("waapi");
    const [choreography, setChoreography] =
      useState<FlowDemoChoreography>("splitGate");
    const [runId, setRunId] = useState(1);
    const [forceReducedMotion, setForceReducedMotion] = useState(false);

Changing engine, choreography, or view mode increments runId. Replay increments
only runId. Focus renders one MotionDemoCard. Compare maps all engines with one
choreography and the shared runId.

- [ ] **Step 2: Build the mobile-first layout**

Use native buttons with aria-pressed, visible focus rings, 44px touch targets,
one mobile column, a two-column Compare grid at lg, and overflow-x-clip. Add:

- flow-demo-view-focus
- flow-demo-view-compare
- flow-demo-choreography-ID
- flow-demo-engine-ID
- flow-demo-replay
- flow-demo-reduced-motion
- flow-demo-compare-grid

- [ ] **Step 3: Replace flowDemoLab in all message catalogs**

Every locale defines identical keys for metadata, header, Focus/Compare, four
choreographies and descriptions, five engines and descriptions, Replay,
reduced motion, unavailable WebGL, neutral stage copy, comparison warning, and
guardrail notes.

Run: node -e 'for (const f of ["vi","en","ja","ko","zh"]) JSON.parse(require("node:fs").readFileSync("messages/"+f+".json", "utf8")); console.log("messages ok")'

Expected: messages ok.

- [ ] **Step 4: Keep the route private**

Leave src/app/[locale]/lab/flow-demo/page.tsx as a localized Server Component
with the existing FLOW_DEMO_LAB_ENABLED production gate.

### Task 6: Add browser coverage and verify

**Files:**
- Create: tests/e2e/flow-demo-lab.spec.ts
- Modify: playwright.config.ts

- [ ] **Step 1: Enable the private lab for Playwright**

Add FLOW_DEMO_LAB_ENABLED: "1" to playwright.config.ts webServer.env.

- [ ] **Step 2: Test Focus, Compare, replay, and all engine markers**

    test("flow lab compares all engines", async ({ page }) => {
      await page.goto("/lab/flow-demo");
      await page.getByTestId("flow-demo-view-compare").click();
      await expect(
        page.getByTestId("flow-demo-compare-grid")
          .locator("[data-motion-engine]"),
      ).toHaveCount(5);
      await page.getByTestId(
        "flow-demo-choreography-ribbonSweep",
      ).click();
      await page.getByTestId("flow-demo-replay").click();
      await expect(
        page.locator(
          '[data-motion-choreography="ribbonSweep"]',
        ),
      ).toHaveCount(5);
    });

- [ ] **Step 3: Test reduced motion and mobile overflow**

    test("flow lab supports reduced motion on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/lab/flow-demo");
      await page.getByTestId("flow-demo-reduced-motion").check();
      await page.getByTestId("flow-demo-engine-canvas").click();
      await page.getByTestId("flow-demo-replay").click();
      await expect(
        page.locator('[data-motion-engine="canvas"]'),
      ).toHaveAttribute("data-reduced-motion", "true");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth,
        ),
      ).toBeLessThanOrEqual(390);
    });

- [ ] **Step 4: Run focused automated checks**

Run:

    npx tsx --test src/data/flow-demo-scenes.test.ts
    npx eslint src/components/flow-lab.tsx src/components/motion-lab src/data/flow-demo-scenes.ts src/data/flow-demo-scenes.test.ts tests/e2e/flow-demo-lab.spec.ts playwright.config.ts
    npm run typecheck
    npm run typecheck:tests

Expected: all commands exit 0.

- [ ] **Step 5: Run the focused browser test**

Run: npx playwright test tests/e2e/flow-demo-lab.spec.ts --project=chromium

Expected: both tests pass against the production-built private lab.

- [ ] **Step 6: Perform rendered QA**

At desktop and 390x844, verify Focus and Compare, all four choreographies, all
five technologies, Replay, reduced motion, no framework overlay, no relevant
console errors, and no horizontal overflow. Save screenshots outside source.

- [ ] **Step 7: Run final non-committing checks**

Run:

    git diff --check
    git status --short

Expected: no whitespace errors; only lab implementation, tests, messages,
plan/spec, and the user's pre-existing changes are listed.
