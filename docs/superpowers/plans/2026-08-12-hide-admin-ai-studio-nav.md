# Hide Admin AI Studio Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the `AI Studio` link from the authenticated admin navigation while keeping `/admin/template-studio` and all of its functionality available by direct URL.

**Architecture:** Keep the existing admin layout and route structure unchanged. Add one focused source-contract regression test for the navigation configuration, then remove only the AI Studio entry from the `NAV` array.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict mode, Node.js test runner through `tsx`.

---

### Task 1: Hide AI Studio from the admin navigation

**Files:**
- Create: `src/app/admin/layout.test.ts`
- Modify: `src/app/admin/layout.tsx:17-25`
- Verify unchanged: `src/app/admin/template-studio/page.tsx`

- [ ] **Step 1: Write the failing regression test**

Create `src/app/admin/layout.test.ts`:

```ts
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const layoutSource = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");
const studioPage = new URL("./template-studio/page.tsx", import.meta.url);

test("admin navigation hides AI Studio while preserving its direct route", () => {
  assert.doesNotMatch(layoutSource, /href:\s*["']\/admin\/template-studio["']/);
  assert.doesNotMatch(layoutSource, /label:\s*["']AI Studio["']/);
  assert.equal(existsSync(studioPage), true);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npx tsx --test src/app/admin/layout.test.ts
```

Expected: FAIL because `src/app/admin/layout.tsx` still contains `/admin/template-studio` and `AI Studio` in the `NAV` array.

- [ ] **Step 3: Make the minimal navigation change**

Remove only this entry from `NAV` in `src/app/admin/layout.tsx`:

```ts
{ href: "/admin/template-studio", label: "AI Studio" },
```

Do not modify `src/app/admin/template-studio/page.tsx`, its actions, components, messages, or AI connection settings.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
npx tsx --test src/app/admin/layout.test.ts
```

Expected: one passing test and zero failures.

- [ ] **Step 5: Run static verification**

Run:

```bash
npx eslint src/app/admin/layout.tsx src/app/admin/layout.test.ts
npm run typecheck
npm run typecheck:tests
```

Expected: all commands exit with status `0` and report no new errors.

- [ ] **Step 6: Review the scoped diff**

Run:

```bash
git diff -- src/app/admin/layout.tsx src/app/admin/layout.test.ts
git status --short src/app/admin/template-studio/page.tsx
```

Expected: the diff contains one removed navigation entry plus the regression test; the AI Studio route file remains unchanged.

- [ ] **Step 7: Commit the scoped implementation if requested**

```bash
git add src/app/admin/layout.tsx src/app/admin/layout.test.ts
git commit -m "fix: hide AI Studio from admin navigation"
```

Do not stage unrelated working-tree changes.
