# All Template Envelope Sizing Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Áp dụng kích thước thiệp chưa mở giống Chung Đôi cho toàn bộ mẫu đã đăng ký: responsive theo breakpoint, chiều cao theo nội dung, đồng thời giữ nguyên xoay 3D, kéo, zoom và hành vi mở thiệp.

**Architecture:** Giữ `Envelope3D` là renderer chung và dùng mode `responsive-natural` đã được kiểm chứng ở mẫu Anh Đào Hồng. Một policy tập trung quyết định mẫu nào đã được rollout; policy lấy danh sách mẫu từ registry hiện có để tránh bỏ sót. Rollout theo nhóm để kiểm tra hình ảnh, nhưng trạng thái cuối cùng là mọi source slug trong `vietnameseTemplateSlugs` đều dùng mode mới; slug không xác định vẫn dùng mode `fixed` an toàn.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Three.js/React Three Fiber, `html-to-image`, Node test runner, Playwright.

---

## 1. Trạng thái đã hoàn thành

Mẫu thử nghiệm: `cherry-blossom-pink`, URL tiếng Việt `/mau-thiep/anh-dao-hong/demo`.

Ba commit đã có trên nhánh `feat/new-invitation-layouts`:

| Commit | Nội dung |
| --- | --- |
| `34d46ff` | Ghi thiết kế responsive-natural cho Anh Đào Hồng |
| `095b02b` | Thêm hàm breakpoint, giới hạn theo chiều cao viewport và unit test |
| `03c0af6` | Implement renderer, opt-in Anh Đào Hồng và browser regression test |

Các thay đổi kỹ thuật đã làm:

- `src/components/chungdoi-envelope-constants.ts`
  - `responsiveEnvelopeWidth()` trả về `310`, `340`, `520`, `600` theo breakpoint Chung Đôi.
  - `fitEnvelopeWidth()` thu nhỏ đồng đều khi viewport quá thấp, không kéo giãn tỉ lệ.
- `src/components/chungdoi-demo.tsx`
  - `CoverCard` có mode chiều cao tự nhiên.
  - Chỉ `cherry-blossom-pink` đang opt-in `responsive-natural`.
  - Các mẫu còn lại vẫn dùng `fixed`, rộng mục tiêu `340px`, tỉ lệ `3 / 4.5`.
- `src/components/chungdoi-envelope-3d.tsx`
  - Capture DOM theo breakpoint hiện tại.
  - Tính tỉ lệ hình học từ kích thước canvas thật.
  - Recapture khi qua breakpoint.
  - Dispose texture cũ để tránh rò GPU.
  - Giữ nguyên `OrbitControls`, drag rotation, pinch/wheel zoom và UV hit-test của nút “Mở thiệp”.
- `tests/e2e/templates.spec.ts`
  - Kiểm tra Anh Đào Hồng đổi từ `600px` desktop sang `310px` mobile.
  - Kiểm tra Song Hỷ vẫn dùng đường `fixed` trong giai đoạn thử nghiệm.

Số đo thực tế đã xác nhận:

| Viewport | Bản hiện tại | Chung Đôi tham chiếu |
| --- | ---: | ---: |
| Desktop `1440 × 900` | `600 × 515.5px` | khoảng `600 × 508px` |
| Mobile `390 × 844` | `310 × 561px` | khoảng `310 × 555px` |

Kiểm thử đã chạy thành công trên một worktree cô lập chỉ chứa patch liên quan:

- lint: `0` lỗi; các warning hiện hữu không thuộc thay đổi này;
- source typecheck và test typecheck;
- `117/117` unit tests;
- Next.js production build;
- `2/2` Playwright tests cho Anh Đào Hồng và regression Song Hỷ;
- zoom làm thay đổi `8.16%` pixel canvas;
- drag rotation làm thay đổi `15.91%` pixel canvas;
- bấm đúng vùng “Mở thiệp” trên canvas mở thiệp thành công.

## 2. Quy tắc đích cho toàn bộ mẫu

Mọi thiệp chưa mở đã đăng ký phải tuân theo các quy tắc sau:

| Chiều rộng viewport | Chiều rộng capture/target |
| --- | ---: |
| `< 640px` | `310px` |
| `640–767px` | `340px` |
| `768–1023px` | `520px` |
| `>= 1024px` | `600px` |

Chiều cao phải do nội dung thật quyết định. Không dùng lại `aspect-ratio: 3 / 4.5` cho mẫu đã rollout. Tên cô dâu/chú rể, ngày cưới, tên khách, lời mời, font và padding có thể làm các mẫu cao khác nhau; đây là hành vi mong muốn.

Khi chiều cao tự nhiên vượt vùng hiển thị, chỉ giảm uniform scale của khối 3D. Không thay riêng width hoặc height và không crop nội dung.

Không thay đổi:

- giao diện sau khi mở thiệp;
- font, màu, nội dung và ảnh của template;
- animation mở thiệp và phát nhạc;
- drag để xoay;
- pinch/wheel để zoom;
- UV hit-test của nút mở;
- lớp hoa/decor tràn ngoài card và chuyển động cùng mặt thiệp.

## 3. Inventory và thứ tự rollout

Nguồn sự thật là `vietnameseTemplateSlugs` trong `src/data/template-route-slugs.ts`. Tại thời điểm viết tài liệu có 44 source slug, gồm Anh Đào Hồng đã hoàn thành và 43 mẫu còn lại.

Rollout theo các nhóm sau để lỗi hình ảnh dễ khoanh vùng:

### Nhóm A — renderer nền tảng và Song Hỷ/Song Long/Song Phụng

- `song-hy-red`
- `song-hy-green`
- `double-dragon-red`
- `double-dragon-green`
- `double-dragon-blue`
- `double-phoenix-red`
- `double-phoenix-green`
- `dragon-phoenix-red`
- `dragon-phoenix-green`

### Nhóm B — Long Phụng và mẫu truyền thống/hoàng kim

- `dragon-phoenix-v3-red`
- `dragon-phoenix-v2-red`
- `dragon-phoenix-blue`
- `dragon-phoenix-black`
- `royal-red`
- `royal-blue`
- `royal-green`
- `nhat-binh-red`
- `hoa-tinh-red`
- `co-ba-red`

### Nhóm C — hoa lá và vườn xuân

- `elegant-leaf-green`
- `boho-floral-green`
- `boho-floral-pink`
- `boho-floral-brown`
- `jasmine-white`
- `silk-flora-brown`
- `brocade-flower-red`
- `crystal-floral-blue`
- `glass-garden-green`
- `spring-garden-green`
- `spring-garden-red`
- `spring-garden-blue`

### Nhóm D — lâu đài và cung điện

- `chateau-blue`
- `chateau-green`
- `baroque-gold`
- `qasr-green`
- `qasr-gold`

### Nhóm E — tối giản và các layout mới

- `chibi-red`
- `minimalism-red`
- `maroon-love`
- `editorial-noir`
- `ticket-terracotta`
- `zen-sand`
- `arch-sage`

Mẫu baseline đã hoàn thành và không đưa lại vào batch: `cherry-blossom-pink`.

Nếu registry có thêm template sau ngày viết tài liệu, test ở Task 2 phải tự phát hiện. Không bổ sung một danh sách thứ hai trong component UI.

## 4. File map cho phần implement tiếp

- Create `src/components/chungdoi-envelope-sizing-policy.ts`: policy duy nhất ánh xạ source slug sang mode sizing.
- Create `src/components/chungdoi-envelope-sizing-policy.test.ts`: kiểm tra allowlist theo từng giai đoạn và coverage toàn registry ở trạng thái cuối.
- Modify `src/components/chungdoi-demo.tsx`: bỏ điều kiện hardcode riêng Anh Đào Hồng, gọi policy chung.
- Modify `src/components/chungdoi-envelope-3d.tsx`: chỉ sửa nếu kiểm tra batch phát hiện lỗi recapture, decor hoặc short viewport; không viết CSS riêng theo slug tại đây.
- Modify `tests/e2e/templates.spec.ts`: thêm ma trận breakpoint và interaction regression cho toàn bộ registry.
- Modify file tài liệu này sau mỗi batch: đánh dấu checkbox và ghi số đo/ngoại lệ đã xác nhận.

## 5. Kế hoạch implement

### Task 1: Tạo policy sizing tập trung

**Files:**

- Create: `src/components/chungdoi-envelope-sizing-policy.ts`
- Create: `src/components/chungdoi-envelope-sizing-policy.test.ts`
- Modify: `src/components/chungdoi-demo.tsx`

- [ ] **Step 1: Đọc tài liệu Next.js 16 tại workspace trước khi sửa client component**

Run:

```bash
sed -n '1,240p' node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md
sed -n '1,220p' node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md
```

Expected: xác nhận `chungdoi-demo.tsx` và policy được import vào client graph không dùng Node-only API.

- [ ] **Step 2: Viết unit test đỏ cho policy ban đầu**

Tạo `src/components/chungdoi-envelope-sizing-policy.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { envelopeSizingForTemplate } from "./chungdoi-envelope-sizing-policy";

test("keeps the approved cherry blossom template responsive", () => {
  assert.equal(envelopeSizingForTemplate("cherry-blossom-pink"), "responsive-natural");
});

test("keeps unknown templates on the safe fixed fallback", () => {
  assert.equal(envelopeSizingForTemplate("unknown-template"), "fixed");
});
```

- [ ] **Step 3: Chạy test để xác nhận fail vì module chưa tồn tại**

Run:

```bash
npx tsx --test src/components/chungdoi-envelope-sizing-policy.test.ts
```

Expected: FAIL với lỗi không tìm thấy `chungdoi-envelope-sizing-policy`.

- [ ] **Step 4: Tạo policy tối thiểu, chưa rollout thêm mẫu**

Tạo `src/components/chungdoi-envelope-sizing-policy.ts`:

```ts
export type EnvelopeSizing = "fixed" | "responsive-natural";

const responsiveEnvelopeTemplateSlugs = new Set<string>([
  "cherry-blossom-pink",
]);

export function envelopeSizingForTemplate(slug: string): EnvelopeSizing {
  return responsiveEnvelopeTemplateSlugs.has(slug)
    ? "responsive-natural"
    : "fixed";
}
```

- [ ] **Step 5: Thay hardcode trong `EnvelopeCover` bằng policy**

Trong `src/components/chungdoi-demo.tsx`, import policy và dùng cùng một giá trị cho renderer/card:

```ts
import { envelopeSizingForTemplate } from "@/components/chungdoi-envelope-sizing-policy";
```

```ts
const sizing = envelopeSizingForTemplate(content.slug);
const naturalHeight = sizing === "responsive-natural";
```

Thay đúng ba dòng điều kiện trong block hiện có:

```diff
- const responsiveNaturalSizing = content.slug === "cherry-blossom-pink";
+ const sizing = envelopeSizingForTemplate(content.slug);
+ const naturalHeight = sizing === "responsive-natural";

- sizing={responsiveNaturalSizing ? "responsive-natural" : "fixed"}
+ sizing={sizing}

- naturalHeight={responsiveNaturalSizing}
+ naturalHeight={naturalHeight}
```

Không thay các prop `onOpen`, `paperColor`, `accentColor`, `renderCard`, `renderDecor`, `content`, `tokens`, `opening` và `hideDecor` trong block đó.

- [ ] **Step 6: Chạy test và regression hiện tại**

Run:

```bash
npx tsx --test src/components/chungdoi-envelope-sizing-policy.test.ts src/components/chungdoi-envelope-constants.test.ts
npx playwright test tests/e2e/templates.spec.ts --grep "cherry blossom cover follows source sizing|song-hy cover never swaps back"
```

Expected: unit tests PASS và `2 passed` ở Playwright.

- [ ] **Step 7: Commit policy không đổi behavior**

```bash
git add src/components/chungdoi-envelope-sizing-policy.ts src/components/chungdoi-envelope-sizing-policy.test.ts src/components/chungdoi-demo.tsx
git commit -m "refactor: centralize envelope sizing rollout"
```

### Task 2: Tạo regression matrix từ registry

**Files:**

- Modify: `tests/e2e/templates.spec.ts`
- Modify: `src/components/chungdoi-envelope-sizing-policy.test.ts`

- [ ] **Step 1: Đọc hướng dẫn Playwright đi kèm Next.js 16**

Run:

```bash
sed -n '1,260p' node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md
```

Expected: test tiếp tục dùng Playwright qua browser thật và `webServer` hiện có.

- [ ] **Step 2: Export allowlist chỉ để unit test kiểm tra coverage trong lúc rollout**

Đổi khai báo set trong policy thành:

```ts
export const responsiveEnvelopeTemplateSlugs = new Set<string>([
  "cherry-blossom-pink",
]);
```

Thêm test đảm bảo allowlist không chứa slug sai:

```ts
import { vietnameseTemplateSlugs } from "@/data/template-route-slugs";
import {
  envelopeSizingForTemplate,
  responsiveEnvelopeTemplateSlugs,
} from "./chungdoi-envelope-sizing-policy";

test("responsive rollout contains only registered source slugs", () => {
  const registered = new Set(vietnameseTemplateSlugs.map(([sourceSlug]) => sourceSlug));
  for (const slug of responsiveEnvelopeTemplateSlugs) {
    assert.equal(registered.has(slug), true, `unregistered responsive slug: ${slug}`);
  }
});
```

- [ ] **Step 3: Thêm helper Playwright kiểm tra một template ở bốn breakpoint**

Trong `tests/e2e/templates.spec.ts`, thêm helper:

```ts
async function expectResponsiveEnvelopeSizing(
  page: Page,
  routeSlug: string,
) {
  const cases = [
    { viewport: { width: 1440, height: 900 }, expectedWidth: 600 },
    { viewport: { width: 800, height: 900 }, expectedWidth: 520 },
    { viewport: { width: 700, height: 900 }, expectedWidth: 340 },
    { viewport: { width: 390, height: 844 }, expectedWidth: 310 },
  ];

  await page.setViewportSize(cases[0].viewport);
  await page.goto(`/mau-thiep/${routeSlug}/demo`, { timeout: 60_000 });

  const capture = page.locator(
    '[data-envelope-capture-root="responsive-natural"]',
  );
  await expect(capture).toHaveCount(1);

  for (const current of cases) {
    await page.setViewportSize(current.viewport);
    await expect.poll(async () => Math.round(
      await capture.evaluate((node) => node.getBoundingClientRect().width),
    )).toBe(current.expectedWidth);
  }
}
```

Đồng thời thêm `Page` vào type import hiện có từ `@playwright/test`.

- [ ] **Step 4: Giữ một interaction test đại diện cho mỗi batch**

Mỗi batch phải chọn mẫu có decor phức tạp nhất và kiểm tra:

```ts
const stage = page.locator("[data-envelope-renderer]");
await expect(stage).toHaveAttribute("data-envelope-renderer", "3d");
await expect(page.locator("canvas").first()).toBeVisible();
```

Không lặp pixel-diff cho cả 44 mẫu. Chạy pixel-diff rotation/zoom trên một mẫu mỗi batch để giữ runtime hợp lý; sizing width vẫn kiểm tra cho từng mẫu.

- [ ] **Step 5: Chạy test typecheck**

Run:

```bash
npm run typecheck:tests
```

Expected: PASS, không có TypeScript error ở helper Playwright.

- [ ] **Step 6: Commit test infrastructure**

```bash
git add src/components/chungdoi-envelope-sizing-policy.ts src/components/chungdoi-envelope-sizing-policy.test.ts tests/e2e/templates.spec.ts
git commit -m "test: add envelope sizing rollout matrix"
```

### Task 3: Rollout Nhóm A và Nhóm B

**Files:**

- Modify: `src/components/chungdoi-envelope-sizing-policy.ts`
- Modify: `tests/e2e/templates.spec.ts`
- Modify: `docs/superpowers/plans/2026-07-28-all-template-envelope-sizing-rollout.md`

- [ ] **Step 1: Viết test đỏ yêu cầu toàn bộ Nhóm A và B là responsive**

Thêm vào policy test:

```ts
const groupAAndB = [
  "song-hy-red",
  "song-hy-green",
  "double-dragon-red",
  "double-dragon-green",
  "double-dragon-blue",
  "double-phoenix-red",
  "double-phoenix-green",
  "dragon-phoenix-red",
  "dragon-phoenix-green",
  "dragon-phoenix-v3-red",
  "dragon-phoenix-v2-red",
  "dragon-phoenix-blue",
  "dragon-phoenix-black",
  "royal-red",
  "royal-blue",
  "royal-green",
  "nhat-binh-red",
  "hoa-tinh-red",
  "co-ba-red",
] as const;

test("groups A and B use responsive natural sizing", () => {
  for (const slug of groupAAndB) {
    assert.equal(envelopeSizingForTemplate(slug), "responsive-natural", slug);
  }
});
```

- [ ] **Step 2: Chạy unit test và xác nhận fail**

Run:

```bash
npx tsx --test src/components/chungdoi-envelope-sizing-policy.test.ts
```

Expected: FAIL đầu tiên ở `song-hy-red`, hiện vẫn trả `fixed`.

- [ ] **Step 3: Thêm chính xác 19 slug trên vào allowlist policy**

Không thêm CSS riêng theo template. Tất cả dùng `CoverCard` natural flow và geometry đo từ canvas giống Anh Đào Hồng.

- [ ] **Step 4: Thêm Playwright cases dùng route slug tiếng Việt tương ứng**

Lấy mapping trực tiếp từ `vietnameseTemplateSlugs`, không tự viết lại mapping source-to-route. Với mỗi source slug trong Nhóm A/B, gọi `expectResponsiveEnvelopeSizing(page, routeSlug)`.

- [ ] **Step 5: Chạy unit, sizing matrix và interaction regression**

Run:

```bash
npx tsx --test src/components/chungdoi-envelope-sizing-policy.test.ts src/components/chungdoi-envelope-constants.test.ts
npx playwright test tests/e2e/templates.spec.ts --grep "envelope sizing group A|envelope sizing group B|3D invitation rotates|cover never swaps"
```

Expected: tất cả test được chọn PASS. Kiểm tra thủ công ít nhất `song-hy-green`, `dragon-phoenix-black` và `royal-red` ở desktop/mobile.

- [ ] **Step 6: Commit Nhóm A/B**

```bash
git add src/components/chungdoi-envelope-sizing-policy.ts src/components/chungdoi-envelope-sizing-policy.test.ts tests/e2e/templates.spec.ts docs/superpowers/plans/2026-07-28-all-template-envelope-sizing-rollout.md
git commit -m "feat: roll out responsive envelopes to traditional templates"
```

### Task 4: Rollout Nhóm C và Nhóm D

**Files:**

- Modify: `src/components/chungdoi-envelope-sizing-policy.ts`
- Modify: `src/components/chungdoi-envelope-sizing-policy.test.ts`
- Modify: `tests/e2e/templates.spec.ts`
- Modify: `docs/superpowers/plans/2026-07-28-all-template-envelope-sizing-rollout.md`

- [ ] **Step 1: Viết test đỏ cho danh sách Nhóm C/D**

```ts
const groupCAndD = [
  "elegant-leaf-green",
  "boho-floral-green",
  "boho-floral-pink",
  "boho-floral-brown",
  "jasmine-white",
  "silk-flora-brown",
  "brocade-flower-red",
  "crystal-floral-blue",
  "glass-garden-green",
  "spring-garden-green",
  "spring-garden-red",
  "spring-garden-blue",
  "chateau-blue",
  "chateau-green",
  "baroque-gold",
  "qasr-green",
  "qasr-gold",
] as const;

test("groups C and D use responsive natural sizing", () => {
  for (const slug of groupCAndD) {
    assert.equal(envelopeSizingForTemplate(slug), "responsive-natural", slug);
  }
});
```

- [ ] **Step 2: Chạy unit test và xác nhận fail ở slug đầu tiên chưa rollout**

Run:

```bash
npx tsx --test src/components/chungdoi-envelope-sizing-policy.test.ts
```

Expected: FAIL ở `elegant-leaf-green`.

- [ ] **Step 3: Thêm 17 slug Nhóm C/D vào allowlist**

Sau khi thêm, chạy lại unit test và yêu cầu PASS.

- [ ] **Step 4: Chạy sizing matrix và kiểm tra decor overflow**

Run:

```bash
npx playwright test tests/e2e/templates.spec.ts --grep "envelope sizing group C|envelope sizing group D"
```

Expected: tất cả cases PASS. Kiểm tra thủ công `boho-floral-green`, `brocade-flower-red`, `glass-garden-green` và `baroque-gold`; hoa/decor phải giữ đúng vị trí khi kéo xoay.

- [ ] **Step 5: Dừng batch nếu phát hiện sai khác cần CSS riêng**

Nếu một mẫu lệch Chung Đôi vì padding nội dung, không đoán giá trị và không thêm điều kiện `if (slug === ...)` vào `CoverCard` hoặc `Envelope3D`. Ghi vào “Nhật ký rollout” bốn dữ liệu cụ thể: source slug, viewport, kích thước bản chúng ta và kích thước Chung Đôi; sau đó dừng Task 4 để chẩn đoán mẫu đó thành một bug riêng. Chỉ tiếp tục batch khi regression test tái hiện sai khác và bản sửa dùng một policy layout tập trung.

- [ ] **Step 6: Commit Nhóm C/D**

```bash
git add src/components/chungdoi-envelope-sizing-policy.ts src/components/chungdoi-envelope-sizing-policy.test.ts tests/e2e/templates.spec.ts docs/superpowers/plans/2026-07-28-all-template-envelope-sizing-rollout.md
git commit -m "feat: roll out responsive envelopes to floral templates"
```

### Task 5: Rollout Nhóm E và khóa coverage toàn registry

**Files:**

- Modify: `src/components/chungdoi-envelope-sizing-policy.ts`
- Modify: `src/components/chungdoi-envelope-sizing-policy.test.ts`
- Modify: `tests/e2e/templates.spec.ts`
- Modify: `docs/superpowers/plans/2026-07-28-all-template-envelope-sizing-rollout.md`

- [ ] **Step 1: Viết test đỏ cho Nhóm E**

```ts
const groupE = [
  "chibi-red",
  "minimalism-red",
  "maroon-love",
  "editorial-noir",
  "ticket-terracotta",
  "zen-sand",
  "arch-sage",
] as const;

test("group E uses responsive natural sizing", () => {
  for (const slug of groupE) {
    assert.equal(envelopeSizingForTemplate(slug), "responsive-natural", slug);
  }
});
```

- [ ] **Step 2: Chuyển policy từ allowlist rollout sang toàn bộ registry**

Sau khi Nhóm A–D đã qua kiểm tra, thay set viết tay trong `src/components/chungdoi-envelope-sizing-policy.ts` bằng registry-derived set:

```ts
import { vietnameseTemplateSlugs } from "@/data/template-route-slugs";

export type EnvelopeSizing = "fixed" | "responsive-natural";

export const responsiveEnvelopeTemplateSlugs = new Set<string>(
  vietnameseTemplateSlugs.map(([sourceSlug]) => sourceSlug),
);

export function envelopeSizingForTemplate(slug: string): EnvelopeSizing {
  return responsiveEnvelopeTemplateSlugs.has(slug)
    ? "responsive-natural"
    : "fixed";
}
```

Thay đổi này bật Nhóm E và bảo đảm template mới được thêm đúng registry sẽ tự dùng sizing chuẩn; slug ngoài registry vẫn fallback `fixed`.

Run:

```bash
npx tsx --test src/components/chungdoi-envelope-sizing-policy.test.ts
```

Expected: PASS sau khi policy đọc đủ source slug từ registry.

- [ ] **Step 3: Thêm test khóa toàn bộ registry**

```ts
test("every registered invitation uses responsive natural sizing", () => {
  for (const [sourceSlug] of vietnameseTemplateSlugs) {
    assert.equal(
      envelopeSizingForTemplate(sourceSlug),
      "responsive-natural",
      sourceSlug,
    );
  }
});
```

Test này khiến template mới được thêm vào registry nhưng chưa có policy bị fail ngay, tránh quay lại lỗi kích thước cũ.

- [ ] **Step 4: Chạy Playwright matrix cho Nhóm E**

Run:

```bash
npx playwright test tests/e2e/templates.spec.ts --grep "envelope sizing group E"
```

Expected: tất cả 7 mẫu PASS ở bốn breakpoint. Kiểm tra riêng `ticket-terracotta` vì layout ngang/đặc biệt có nguy cơ wrap khác.

- [ ] **Step 5: Commit Nhóm E và coverage gate**

```bash
git add src/components/chungdoi-envelope-sizing-policy.ts src/components/chungdoi-envelope-sizing-policy.test.ts tests/e2e/templates.spec.ts docs/superpowers/plans/2026-07-28-all-template-envelope-sizing-rollout.md
git commit -m "feat: complete responsive envelope rollout"
```

### Task 6: Verification cuối và dọn đường legacy

**Files:**

- Modify: `docs/superpowers/plans/2026-07-28-all-template-envelope-sizing-rollout.md`

- [ ] **Step 1: Chạy toàn bộ static verification**

Run:

```bash
npm run lint
npm run typecheck
npm run typecheck:tests
npm run test:unit
```

Expected: `0` lint errors, TypeScript PASS, unit tests `0` fail.

- [ ] **Step 2: Chạy production build với đủ environment bắt buộc**

Run bằng environment test giống `playwright.config.ts`:

```bash
DATABASE_URL='file:./tests/e2e/.data/test.db' \
SESSION_SECRET='e2e-session-secret-do-not-use-in-prod' \
AUTH_SECRET='e2e-auth-secret-do-not-use-in-prod' \
CASSO_WEBHOOK_TOKEN='e2e-casso-token' \
PAYOS_CLIENT_ID='e2e-payos-client' \
PAYOS_API_KEY='e2e-payos-api-key' \
PAYOS_CHECKSUM_KEY='e2e-payos-checksum' \
NEXT_PUBLIC_SITE_URL='http://127.0.0.1:3100' \
ALLOW_INSECURE_SITE_URL='1' \
npm run build
```

Expected: Next.js production build exit code `0`.

- [ ] **Step 3: Chạy toàn bộ envelope E2E suite**

```bash
npx playwright test tests/e2e/templates.spec.ts --grep "envelope sizing|3D invitation rotates|cover never swaps|demo loads without crashing"
```

Expected: `0` failed.

- [ ] **Step 4: Visual smoke test ở bốn viewport đại diện**

Với một mẫu mỗi nhóm, chụp và kiểm tra ở:

- `390 × 844` → capture width `310`;
- `700 × 900` → capture width `340`;
- `800 × 900` → capture width `520`;
- `1440 × 900` → capture width `600`.

Mỗi ảnh phải có đủ seal, hai tên, ngày, tên khách, lời mời và nút mở; không crop decor và không có texture cũ nháy lại sau resize.

- [ ] **Step 5: Giữ fallback `fixed` cho slug không xác định**

Không xóa mode `fixed` khỏi `Envelope3D`. Policy phải tiếp tục trả `fixed` cho slug ngoài registry để thiệp dữ liệu cũ hoặc dữ liệu lỗi vẫn mở được.

- [ ] **Step 6: Ghi kết quả cuối vào Nhật ký rollout và commit**

```bash
git add docs/superpowers/plans/2026-07-28-all-template-envelope-sizing-rollout.md
git commit -m "docs: record responsive envelope rollout verification"
```

## 6. Tiêu chí nghiệm thu

Rollout chỉ được coi là hoàn tất khi tất cả điều kiện sau đều đúng:

- [ ] Mọi source slug trong `vietnameseTemplateSlugs` trả `responsive-natural`.
- [ ] Slug không xác định trả `fixed`.
- [ ] Tất cả mẫu đạt width `310/340/520/600` đúng breakpoint.
- [ ] Chiều cao lấy từ DOM/canvas thật, không quay lại `3 / 4.5` cho mẫu đã đăng ký.
- [ ] Viewport thấp chỉ scale đồng đều.
- [ ] Không có texture stale sau khi resize qua breakpoint.
- [ ] Texture cũ được dispose.
- [ ] Decor tràn mép vẫn đi cùng thiệp khi xoay.
- [ ] Drag rotation, pinch/wheel zoom và nút “Mở thiệp” vẫn hoạt động.
- [ ] Thiệp sau khi mở không thay đổi.
- [ ] Unit tests, typechecks, production build và envelope Playwright suite đều pass.

## 7. Nhật ký rollout

| Ngày | Nhóm | Trạng thái | Số đo/ghi chú |
| --- | --- | --- | --- |
| 2026-07-28 | Baseline `cherry-blossom-pink` | Hoàn thành | Desktop `600 × 515.5`; mobile `310 × 561`; 3D/zoom/drag/open đã kiểm tra |
| 2026-07-28 | Nhóm A | Hoàn thành | 9/9 mẫu đạt `600/520/340/310` đủ 4 breakpoint |
| 2026-07-28 | Nhóm B | Hoàn thành | 10/10 mẫu đạt `600/520/340/310` đủ 4 breakpoint |
| 2026-07-28 | Nhóm C | Chưa triển khai | Thực hiện theo Task 4 |
| 2026-07-28 | Nhóm D | Chưa triển khai | Thực hiện theo Task 4 |
| 2026-07-28 | Nhóm E | Chưa triển khai | Thực hiện theo Task 5 |

### Ghi chú Task 3 — test `3D invitation rotates automatically`

Test cũ đo pixel canvas ở trạng thái đứng yên và đòi đổi `> 1%`. Nó **không** kiểm
xoay tự động: cover đặt `autoRotate={false}` và không có `useFrame`/rAF nào trong
đường cover (tìm vét toàn repo chỉ ra đúng một dòng `autoRotate={false}`), và
`autoRotate={true}` chưa từng tồn tại trong git history. Test viết ngày 2026-07-15
(`247e08e`), còn `autoRotate={false}` vào ngày 2026-07-23 (`52675fb`) — tức test có
trước và không được cập nhật khi hành vi đổi.

Thứ nó thực sự đo là nhiễu damping của `OrbitControls`. Probe timeline: canvas chỉ
đổi `0.17–0.36%` ở mọi cửa sổ thời gian, first→last chỉ `0.114%`. Ngưỡng `1%` nằm
sát vùng nhiễu này nên luôn mong manh; sizing mới làm ảnh desktop rộng `600px` thay
vì `420px`, mẫu số pixel tăng nhanh hơn tử số nên tỉ lệ loãng xuống `~0.25%`.

Đã xác nhận **không phải hồi quy do rollout**: bỏ `double-dragon-green` khỏi
allowlist (trở lại `fixed` như trước Task 3) thì test **vẫn đỏ**; chạy 3/3 lần đều
đỏ nên không flaky.

Bản sửa đổi test sang `3D invitation rotates when dragged` — kéo chuột để xoay là
hợp đồng thật mà rollout phải giữ. Ngưỡng `2%` gấp `5×` nhiễu đã đo, cộng assertion
thiệp không bị mở do cú kéo. Chạy 3/3 lần đều pass.

## 8. Phạm vi không làm trong rollout này

- Không thay layout nội dung sau khi mở thiệp.
- Không sửa copy, font, màu hoặc asset để “làm đẹp thêm”.
- Không áp một chiều cao chung cho mọi mẫu.
- Không thêm điều kiện CSS rải rác theo slug trong renderer 3D.
- Không tự động sửa các thay đổi unrelated đang tồn tại trong worktree.
