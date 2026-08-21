# Elegant Leaf Responsive Couple Names Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Giữ tên cô dâu chú rể Elegant Leaf Green trên một dòng desktop bằng cỡ chữ giảm theo độ dài, vẫn cho phép xuống dòng an toàn trên mobile.

**Architecture:** Thêm helper thuần tại renderer Elegant Leaf để phân loại độ dài tên sau khi trim. Hai heading dùng chung helper, CSS mobile hiện tại và desktop override tách riêng qua Tailwind breakpoint.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS v4, `node:test` + `tsx`.

## Global Constraints

- Chỉ sửa `src/components/chungdoi-tpl-elegant-leaf-green.tsx` và test kề cạnh.
- Không sửa Song Hỷ, dữ liệu thiệp, editor, global typography, hoặc renderer mẫu khác.
- Mobile giữ `w-[80%]`, `text-[42px]`, cho phép wrap.
- Desktop (`md`) dùng toàn cột và `whitespace-nowrap`.
- Các band desktop theo độ dài tên trim: `<=14` dùng `58px`; `15–20` dùng `52px`; `>20` dùng `46px`.
- Không thêm đo DOM, resize listener, effect, hay dependency.
- Giữ display font, màu, alignment, line-height, vị trí birth-order hiện tại.

---

## File Structure

- Modify: `src/components/chungdoi-tpl-elegant-leaf-green.tsx`
  - Bổ sung `desktopNameSizeClass(name: string): string` và gắn vào hai heading tên đầy đủ.
- Create: `src/components/chungdoi-tpl-elegant-leaf-green.test.ts`
  - Kiểm tra contract CSS desktop/mobile và ba size band bằng source-level unit test, theo pattern `chungdoi-tpl-comic-hero-assemble.test.ts`.

### Task 1: Lock responsive name-sizing contract

**Files:**
- Create: `src/components/chungdoi-tpl-elegant-leaf-green.test.ts`

**Interfaces:**
- Consumes: Source file `src/components/chungdoi-tpl-elegant-leaf-green.tsx`.
- Produces: Regression tests naming exact helper `desktopNameSizeClass` and expected Tailwind class contracts.

- [ ] **Step 1: Create failing source-level test**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(
  join(process.cwd(), "src/components/chungdoi-tpl-elegant-leaf-green.tsx"),
  "utf8",
);

test("Elegant Leaf sizes desktop names by trimmed length", () => {
  assert.match(source, /function desktopNameSizeClass\(name: string\)/);
  assert.match(source, /if \(length <= 14\) return "md:text-\[58px\]";/);
  assert.match(source, /if \(length <= 20\) return "md:text-\[52px\]";/);
  assert.match(source, /return "md:text-\[46px\]";/);
});

test("Elegant Leaf keeps name wrapping mobile-only", () => {
  assert.match(
    source,
    /w-\[80%\][^"`]*text-\[42px\][^"`]*md:w-full[^"`]*md:whitespace-nowrap/,
  );
  assert.match(source, /desktopNameSizeClass\(people\[0\]\.fullName\)/);
  assert.match(source, /desktopNameSizeClass\(people\[1\]\.fullName\)/);
});
```

- [ ] **Step 2: Run test to verify red state**

Run:

```bash
node --import tsx --test src/components/chungdoi-tpl-elegant-leaf-green.test.ts
```

Expected: FAIL. Source does not yet declare `desktopNameSizeClass` or desktop `md:w-full md:whitespace-nowrap` contract.

- [ ] **Step 3: Commit failing-test checkpoint only if project convention allows red commits**

Do not commit a knowingly failing test unless human explicitly asks. Continue directly to implementation.

### Task 2: Add desktop one-line adaptive names

**Files:**
- Modify: `src/components/chungdoi-tpl-elegant-leaf-green.tsx` near existing constants/helpers before `ElegantLeafInvitation`.
- Modify: `src/components/chungdoi-tpl-elegant-leaf-green.tsx` at both full-name `<h3>` elements.
- Test: `src/components/chungdoi-tpl-elegant-leaf-green.test.ts`

**Interfaces:**
- Consumes: `desktopNameSizeClass(name: string): "md:text-[58px]" | "md:text-[52px]" | "md:text-[46px]"`.
- Produces: Desktop headings fit available column on one line; mobile headings retain wrapping behavior.

- [ ] **Step 1: Add pure size helper**

Insert after theme constants and before component declaration:

```ts
function desktopNameSizeClass(name: string) {
  const length = [...name.trim()].length;
  if (length <= 14) return "md:text-[58px]";
  if (length <= 20) return "md:text-[52px]";
  return "md:text-[46px]";
}
```

Use `[...name.trim()].length` so Vietnamese Unicode characters count as visible characters.

- [ ] **Step 2: Replace both fixed-size name headings**

Replace each current heading:

```tsx
<h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[42px] leading-[1.1] md:text-[58px]" style={nameFont}>{people[0].fullName}</h3>
```

and:

```tsx
<h3 className="flex min-h-[70px] w-[80%] items-center justify-center text-[42px] leading-[1.1] md:text-[58px]" style={nameFont}>{people[1].fullName}</h3>
```

with:

```tsx
<h3
  className={`flex min-h-[70px] w-[80%] items-center justify-center text-[42px] leading-[1.1] md:w-full md:whitespace-nowrap ${desktopNameSizeClass(people[0].fullName)}`}
  style={nameFont}
>
  {people[0].fullName}
</h3>
```

and:

```tsx
<h3
  className={`flex min-h-[70px] w-[80%] items-center justify-center text-[42px] leading-[1.1] md:w-full md:whitespace-nowrap ${desktopNameSizeClass(people[1].fullName)}`}
  style={nameFont}
>
  {people[1].fullName}
</h3>
```

`w-[80%]` and `text-[42px]` remain unprefixed for mobile. Desktop removes narrow width and disables only desktop wrapping.

- [ ] **Step 3: Run targeted regression test**

Run:

```bash
node --import tsx --test src/components/chungdoi-tpl-elegant-leaf-green.test.ts
```

Expected: 2 tests pass, 0 failures.

- [ ] **Step 4: Run static gates**

Run:

```bash
npm run typecheck -- --pretty false
npm run lint -- src/components/chungdoi-tpl-elegant-leaf-green.tsx src/components/chungdoi-tpl-elegant-leaf-green.test.ts
git diff --check
```

Expected: typecheck exits 0; lint reports no errors; `git diff --check` exits 0. Existing `next/no-img-element` warnings may remain.

- [ ] **Step 5: Commit implementation**

```bash
git add src/components/chungdoi-tpl-elegant-leaf-green.tsx src/components/chungdoi-tpl-elegant-leaf-green.test.ts
git commit -m "fix(template): fit Elegant Leaf names on desktop" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 3: Verify real invitation at desktop and mobile

**Files:**
- No source changes expected.

**Interfaces:**
- Consumes: Published or local invitation rendered by `ElegantLeafInvitation`.
- Produces: Runtime evidence for one-line baseline desktop names and safe mobile wrapping.

- [ ] **Step 1: Open target invitation in browser**

Navigate to:

```text
https://thiepmungonline.com/thiep/hoang-nam-cam-han-14072024
```

Open cover using only native `Mở thiệp` control.

- [ ] **Step 2: Verify desktop name line count at 1512px viewport**

Run page evaluation against the two `<h3>` elements with exact text `Đỗ Hoàng Nam` and `Phan Cẩm Hân`:

```js
() => [...document.querySelectorAll('h3')]
  .filter((node) => ['Đỗ Hoàng Nam', 'Phan Cẩm Hân'].includes(node.textContent?.trim() ?? ''))
  .map((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return {
      name: node.textContent?.trim(),
      lineCount: range.getClientRects().length,
      width: Math.round(node.getBoundingClientRect().width),
    };
  })
```

Expected: each `lineCount` is `1`.

- [ ] **Step 3: Verify mobile remains safe**

Resize browser to `390 × 844`, reload and open invitation. Run:

```js
() => ({
  documentWidth: document.documentElement.scrollWidth,
  viewportWidth: innerWidth,
})
```

Expected: `documentWidth <= viewportWidth`. Names may wrap on mobile; no clipping or horizontal scroll.

- [ ] **Step 4: Capture result and inspect console**

Take desktop and mobile screenshots. Check browser console contains no error-level messages caused by name rendering.

## Plan Self-Review

- Spec coverage: Task 1 locks three size bands and CSS breakpoint contract. Task 2 implements minimal helper and two affected headings. Task 3 verifies desktop line count and mobile overflow at runtime.
- Placeholder scan: no `TODO`, `TBD`, or generic test steps remain.
- Type consistency: `desktopNameSizeClass` uses same name in test and implementation. All class values in test match implementation.
