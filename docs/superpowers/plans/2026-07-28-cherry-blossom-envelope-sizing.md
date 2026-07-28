# Anh Đào Hồng Envelope Sizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make only the unopened `cherry-blossom-pink` invitation use Chung Đôi's responsive widths and content-driven height while preserving the current 3D rotation, zoom, and open-button hit testing.

**Architecture:** Add pure, dependency-free sizing helpers beside the existing envelope constant. Pass an opt-in `responsive-natural` sizing mode from `ChungDoiDemo` into `Envelope3D`; that mode changes the hidden capture width, measures the resulting natural card ratio, and scales the Three.js geometry responsively. The existing fixed path remains the default for every other template.

**Tech Stack:** Next.js 16 Client Components, React 19, TypeScript strict, Tailwind CSS v4, React Three Fiber/Three.js, html-to-image, Node test runner, Playwright.

---

## File map

- Modify `src/components/chungdoi-envelope-constants.ts`: pure width-breakpoint and viewport-fit calculations.
- Create `src/components/chungdoi-envelope-constants.test.ts`: unit coverage for breakpoint boundaries and short-viewport scaling.
- Modify `src/components/chungdoi-envelope-3d.tsx`: opt-in responsive capture width, measured natural ratio, texture recapture/disposal, and scale cap.
- Modify `src/components/chungdoi-demo.tsx`: content-flow variant for `CoverCard` and opt-in only for `cherry-blossom-pink`.
- Modify `tests/e2e/templates.spec.ts`: browser assertions for Cherry sizing and unchanged non-Cherry sizing.

The worktree already contains unrelated edits in `src/components/chungdoi-demo.tsx`. Preserve them and do not stage or commit that whole file. Any implementation commit must use selective staging and must be inspected before committing.

### Task 1: Pure responsive sizing calculations

**Files:**
- Modify: `src/components/chungdoi-envelope-constants.ts`
- Create: `src/components/chungdoi-envelope-constants.test.ts`

- [ ] **Step 1: Write the failing breakpoint tests**

Create `src/components/chungdoi-envelope-constants.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  ENVELOPE_TARGET_PX,
  fitEnvelopeWidth,
  responsiveEnvelopeWidth,
} from "./chungdoi-envelope-constants";

test("responsive envelope width follows the Chung Đôi breakpoints", () => {
  assert.equal(responsiveEnvelopeWidth(390), 310);
  assert.equal(responsiveEnvelopeWidth(639), 310);
  assert.equal(responsiveEnvelopeWidth(640), 340);
  assert.equal(responsiveEnvelopeWidth(767), 340);
  assert.equal(responsiveEnvelopeWidth(768), 520);
  assert.equal(responsiveEnvelopeWidth(1023), 520);
  assert.equal(responsiveEnvelopeWidth(1024), 600);
  assert.equal(responsiveEnvelopeWidth(1440), 600);
});

test("short viewports reduce width uniformly without stretching the ratio", () => {
  assert.equal(
    fitEnvelopeWidth({
      targetWidth: 600,
      ratio: 508 / 600,
      viewportWidth: 1408,
      viewportHeight: 868,
    }),
    600,
  );

  assert.equal(
    fitEnvelopeWidth({
      targetWidth: 310,
      ratio: 555 / 310,
      viewportWidth: 358,
      viewportHeight: 500,
    }),
    (500 - 96) / (555 / 310),
  );
});

test("the unchanged fixed path keeps its 340px target", () => {
  assert.equal(ENVELOPE_TARGET_PX, 340);
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run:

```bash
node --import tsx --test src/components/chungdoi-envelope-constants.test.ts
```

Expected: FAIL because `fitEnvelopeWidth` and `responsiveEnvelopeWidth` are not exported.

- [ ] **Step 3: Implement the pure helpers**

Replace `src/components/chungdoi-envelope-constants.ts` with:

```ts
// Keep shared envelope sizing dependency-free so importing it never pulls in Three.js.
export const ENVELOPE_TARGET_PX = 340;
export const ENVELOPE_VERTICAL_RESERVE_PX = 96;

export function responsiveEnvelopeWidth(viewportWidth: number): number {
  if (viewportWidth >= 1024) return 600;
  if (viewportWidth >= 768) return 520;
  if (viewportWidth >= 640) return 340;
  return 310;
}

export function fitEnvelopeWidth({
  targetWidth,
  ratio,
  viewportWidth,
  viewportHeight,
}: {
  targetWidth: number;
  ratio: number;
  viewportWidth: number;
  viewportHeight: number;
}): number {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return Math.min(targetWidth, viewportWidth);
  }

  const heightLimitedWidth = Math.max(
    0,
    viewportHeight - ENVELOPE_VERTICAL_RESERVE_PX,
  ) / ratio;
  return Math.min(targetWidth, viewportWidth, heightLimitedWidth);
}
```

- [ ] **Step 4: Run the unit test and confirm it passes**

Run:

```bash
node --import tsx --test src/components/chungdoi-envelope-constants.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit the isolated helper change**

These files do not overlap existing user changes, so they may be committed safely:

```bash
git add src/components/chungdoi-envelope-constants.ts src/components/chungdoi-envelope-constants.test.ts
git diff --cached --check
git commit -m "test: define responsive envelope sizing"
```

### Task 2: Add the browser regression test before changing the renderer

**Files:**
- Modify: `tests/e2e/templates.spec.ts`

- [ ] **Step 1: Add a failing Cherry-only sizing test**

Add this test to the `templates — demo pages` describe block:

```ts
test("cherry blossom cover follows source sizing without changing other templates", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/mau-thiep/anh-dao-hong/demo", { timeout: 60_000 });

  const cherryCapture = page.locator('[data-envelope-capture-root="responsive-natural"]');
  await expect(cherryCapture).toHaveCount(1);
  await expect.poll(() => cherryCapture.evaluate((node) => ({
    width: Math.round(node.getBoundingClientRect().width),
    height: Math.round(node.getBoundingClientRect().height),
  }))).toMatchObject({ width: 600 });

  const desktopSize = await cherryCapture.evaluate((node) => ({
    width: Math.round(node.getBoundingClientRect().width),
    height: Math.round(node.getBoundingClientRect().height),
  }));
  expect(desktopSize.height).toBeGreaterThanOrEqual(480);
  expect(desktopSize.height).toBeLessThanOrEqual(560);
  expect(desktopSize.height).not.toBe(900);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => cherryCapture.evaluate((node) => ({
    width: Math.round(node.getBoundingClientRect().width),
    height: Math.round(node.getBoundingClientRect().height),
  }))).toMatchObject({ width: 310 });

  await page.goto("/mau-thiep/song-hy-xanh/demo", { timeout: 60_000 });
  const fixedCapture = page.locator('[data-envelope-capture-root="fixed"]');
  await expect(fixedCapture).toHaveAttribute("data-envelope-target-width", "340");
  await expect(fixedCapture).toHaveCSS("width", "420px");
});
```

- [ ] **Step 2: Run the focused browser test and confirm it fails**

Run:

```bash
npx playwright test tests/e2e/templates.spec.ts --project=chromium --grep "cherry blossom cover follows source sizing"
```

Expected: FAIL because the capture mode/target data attributes do not exist and Cherry still captures at `420px` with a fixed aspect ratio.

Do not commit the failing test separately on the shared dirty branch.

### Task 3: Add an opt-in natural-height CoverCard

**Files:**
- Modify: `src/components/chungdoi-demo.tsx:625-775`

- [ ] **Step 1: Add the `naturalHeight` prop without changing the default path**

Extend `CoverCard`:

```tsx
function CoverCard({
  content,
  tokens,
  onOpen,
  opening = false,
  hideDecor = false,
  naturalHeight = false,
}: {
  content: ChungDoiDemoContent;
  tokens: Tokens;
  onOpen: () => void;
  opening?: boolean;
  hideDecor?: boolean;
  naturalHeight?: boolean;
}) {
```

Use conditional sizing on the root:

```tsx
<div
  className="relative rounded-lg"
  style={{
    aspectRatio: naturalHeight ? undefined : "3 / 4.5",
    boxShadow: "0 25px 60px -12px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.2)",
  }}
>
```

Replace the text-layer opening tag with:

```tsx
<div
  className={naturalHeight
    ? "relative z-10 px-6 pb-14 pt-28 text-center md:pb-8 md:pt-24"
    : "absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"}
>
```

The text layer's existing children remain unchanged. This produces natural height only when explicitly requested.

- [ ] **Step 2: Opt in only the Cherry template**

At the start of `EnvelopeCover`, derive:

```ts
const responsiveNaturalSizing = content.slug === "cherry-blossom-pink";
```

Pass it to the renderer and capture card:

```tsx
<Envelope3D
  sizing={responsiveNaturalSizing ? "responsive-natural" : "fixed"}
  onOpen={onOpen}
  paperColor={coverPaperColor(tokens)}
  accentColor={toSolidColor(tokens.accent, "#8C1C13")}
  renderCard={(handleOpen) => (
    <div className="relative">
      <Seal tokens={tokens} opening={opening} />
      <CoverCard
        content={content}
        tokens={tokens}
        onOpen={handleOpen}
        opening={opening}
        hideDecor
        naturalHeight={responsiveNaturalSizing}
      />
    </div>
  )}
```

Keep `renderDecor` unchanged; Task 4 aligns its capture box with the measured card ratio.

- [ ] **Step 3: Run static checks for this component**

Run:

```bash
npx eslint src/components/chungdoi-demo.tsx
npm run typecheck
```

Expected at this intermediate point: TypeScript may fail because `Envelope3D` does not accept `sizing` yet. ESLint should report no new issue in `CoverCard`.

Do not stage or commit `src/components/chungdoi-demo.tsx`; it contains unrelated user work.

### Task 4: Make Envelope3D responsive and recapture safely

**Files:**
- Modify: `src/components/chungdoi-envelope-3d.tsx`

- [ ] **Step 1: Extend imports and props**

Import `useSyncExternalStore` and the sizing helpers:

```tsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  ENVELOPE_TARGET_PX,
  fitEnvelopeWidth,
  responsiveEnvelopeWidth,
} from "@/components/chungdoi-envelope-constants";
```

Extend the props:

```ts
type EnvelopeSizing = "fixed" | "responsive-natural";

type Envelope3DProps = {
  renderCard: (onOpen: () => void) => ReactNode;
  onOpen: () => void;
  paperColor: string;
  accentColor: string;
  renderDecor?: () => ReactNode;
  sizing?: EnvelopeSizing;
};
```

- [ ] **Step 2: Add a breakpoint-only external store**

Add above `Envelope3D`:

```ts
const ENVELOPE_BREAKPOINTS = [
  "(min-width: 640px)",
  "(min-width: 768px)",
  "(min-width: 1024px)",
] as const;

function subscribeEnvelopeWidth(onStoreChange: () => void): () => void {
  const queries = ENVELOPE_BREAKPOINTS.map((query) => window.matchMedia(query));
  for (const query of queries) query.addEventListener("change", onStoreChange);
  return () => {
    for (const query of queries) query.removeEventListener("change", onStoreChange);
  };
}

function getResponsiveEnvelopeWidth(): number {
  return responsiveEnvelopeWidth(window.innerWidth);
}

function getServerEnvelopeWidth(): number {
  return ENVELOPE_TARGET_PX;
}
```

- [ ] **Step 3: Resolve fixed versus responsive dimensions**

At the top of the default component:

```tsx
export default function Envelope3D({
  renderCard,
  onOpen,
  paperColor,
  accentColor,
  renderDecor,
  sizing = "fixed",
}: Envelope3DProps) {
  const responsiveWidth = useSyncExternalStore(
    subscribeEnvelopeWidth,
    getResponsiveEnvelopeWidth,
    getServerEnvelopeWidth,
  );
  const naturalSizing = sizing === "responsive-natural";
  const captureWidth = naturalSizing ? responsiveWidth : CARD_PX;
  const targetWidth = naturalSizing ? responsiveWidth : ENVELOPE_TARGET_PX;
```

Add the diagnostics to the hidden capture root:

```tsx
<div
  ref={captureRef}
  className="envelope3d-capture-root"
  data-envelope-capture-root={sizing}
  data-envelope-target-width={targetWidth}
  style={{ width: captureWidth, background: paperColor }}
>
```

Replace every capture-layout use of `CARD_PX` with `captureWidth`, while leaving `CARD_W` unchanged.

- [ ] **Step 4: Pass responsive dimensions into the Three.js envelope**

Extend `Envelope` props with `captureWidth`, `targetWidth`, and `fitToViewport`, then replace the fixed pad/scale calculations:

```tsx
const padW = (CARD_W * DECOR_PAD_PX) / captureWidth;
const { viewport, size } = useThree();
const projectedWidth = fitToViewport
  ? fitEnvelopeWidth({
      targetWidth,
      ratio,
      viewportWidth: size.width,
      viewportHeight: size.height,
    })
  : targetWidth;
const scale = (projectedWidth * (viewport.width / size.width)) / CARD_W;
```

Pass the values at the call site:

```tsx
<Envelope
  onOpen={onOpen}
  paperColor={paperColor}
  accentColor={accentColor}
  frontTex={frontTex}
  decorTex={decorTex}
  ratio={ratio}
  btnUV={btnUV}
  captureWidth={captureWidth}
  targetWidth={targetWidth}
  fitToViewport={naturalSizing}
/>
```

- [ ] **Step 5: Recapture on breakpoint changes and reject stale work**

Change the capture effect dependency from `[]` to `[captureWidth, naturalSizing]`. Inside the effect, retain the existing `cancelled` guard and read the current natural card height before decor capture:

```ts
const cardHeight = node.getBoundingClientRect().height;
const nextRatio = canvas.width > 0 ? canvas.height / canvas.width : FALLBACK_RATIO;

const decorNode = decorRef.current;
const decorCard = decorNode?.querySelector<HTMLElement>("[data-envelope-decor-card]");
if (decorCard && naturalSizing) {
  decorCard.style.height = `${cardHeight}px`;
  decorCard.style.aspectRatio = "auto";
}
```

Capture the decoration before publishing `nextRatio` to React state, then update the ratio and textures only after the cancellation guards have passed. This prevents a React render from interfering with the temporary measured decor height.

Mark the inner decor box and default it to the current ratio:

```tsx
<div
  data-envelope-decor-card
  style={{
    position: "relative",
    width: "100%",
    aspectRatio: naturalSizing ? undefined : "3 / 4.5",
  }}
>
  {renderDecor()}
</div>
```

- [ ] **Step 6: Dispose replaced and unmounted textures**

Add refs inside `Envelope3D`:

```ts
const frontTexRef = useRef<Texture | null>(null);
const decorTexRef = useRef<Texture | null>(null);
```

At the start of the capture effect, clear the previous breakpoint's textures so stale geometry is never shown at the new width:

```ts
frontTexRef.current?.dispose();
frontTexRef.current = null;
setFrontTex(null);
decorTexRef.current?.dispose();
decorTexRef.current = null;
setDecorTex(null);
```

After both captures and cancellation checks succeed, publish the new resources:

```ts
frontTexRef.current = tex;
setFrontTex(tex);
if (nextDecorTexture) {
  decorTexRef.current = nextDecorTexture;
  setDecorTex(nextDecorTexture);
}
setRatio(nextRatio);
setBtnUV(measureButtonUV(node));
```

Declare `let nextDecorTexture: Texture | null = null` before optional decor capture and assign the created texture to it. Add unmount cleanup:

```ts
useEffect(() => () => {
  frontTexRef.current?.dispose();
  decorTexRef.current?.dispose();
}, []);
```

- [ ] **Step 7: Run unit, lint, and type checks**

Run:

```bash
node --import tsx --test src/components/chungdoi-envelope-constants.test.ts
npx eslint src/components/chungdoi-envelope-3d.tsx src/components/chungdoi-demo.tsx tests/e2e/templates.spec.ts
npm run typecheck
npm run typecheck:tests
```

Expected: all commands pass.

Do not commit yet; browser verification must confirm the DOM capture and WebGL projection agree.

### Task 5: Verify sizing, isolation, and interactions

**Files:**
- Modify if the test exposes a real defect: `src/components/chungdoi-envelope-3d.tsx`
- Modify if the test exposes a real defect: `src/components/chungdoi-demo.tsx`
- Test: `tests/e2e/templates.spec.ts`

- [ ] **Step 1: Run the focused browser regression test**

Run:

```bash
npx playwright test tests/e2e/templates.spec.ts --project=chromium --grep "cherry blossom cover follows source sizing"
```

Expected: PASS at desktop and mobile; the non-Cherry assertion remains fixed.

- [ ] **Step 2: Run existing envelope interaction coverage**

Run:

```bash
node --import tsx --test src/lib/envelope-gesture.test.ts
npx playwright test tests/e2e/templates.spec.ts --project=chromium --grep "cover never swaps|cherry blossom cover"
```

Expected: pointer gesture tests pass, the 3D stage stays mounted, and Cherry sizing passes.

- [ ] **Step 3: Inspect the two requested viewport renders**

With the local production server used by Playwright, inspect `/mau-thiep/anh-dao-hong/demo` at:

- `1440 × 900`: approximately `600px` wide and content-driven height near the `600 × 508` reference;
- `390 × 844`: `310px` wide and content-driven height near the `310 × 555` reference.

Confirm visually that the background branch, seal, names, guest block, button, and overflow cherry blossoms remain aligned with the card during rotation. Confirm wheel/pinch zoom remains enabled and dragging does not open the card.

- [ ] **Step 4: Run the project verification suite**

Run:

```bash
npm run lint
npm run typecheck
npm run typecheck:tests
npm run test:unit
npm run build
```

Expected: all commands pass.

- [ ] **Step 5: Review the final diff without disturbing user work**

Run:

```bash
git diff --check
git diff -- src/components/chungdoi-envelope-constants.ts src/components/chungdoi-envelope-constants.test.ts src/components/chungdoi-envelope-3d.tsx src/components/chungdoi-demo.tsx tests/e2e/templates.spec.ts
git status --short
```

Verify that only the intended sizing hunks were added and all pre-existing unrelated changes remain intact.

- [ ] **Step 6: Commit only if selective staging is clean**

Because `src/components/chungdoi-demo.tsx` contains unrelated edits, do not use `git add src/components/chungdoi-demo.tsx`. If a clean selective patch cannot be staged without including user changes, leave implementation uncommitted and report that explicitly. Otherwise inspect `git diff --cached` before committing:

```bash
git diff --cached --check
git diff --cached
git commit -m "fix: match cherry blossom envelope sizing"
```
