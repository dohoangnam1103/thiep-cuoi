# Editor localStorage Draft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tự động lưu nội dung đang nhập trong editor tạo thiệp vào `localStorage` để refresh/đóng tab không mất dữ liệu chưa lưu lên server.

**Architecture:** Một hook client `useFormDraft` + hàm `readDraft` trong `src/hooks/use-form-draft.ts`. Hook lắng nghe sự kiện `input`/`change` bubbling trên `#editor-form`, debounce rồi serialize `FormData` vào localStorage. `EditorForm.tsx` seed giá trị khởi tạo từ draft (chỉ khi server rỗng) cho cả input không kiểm soát (`defaultValue`) lẫn state có kiểm soát. Clear draft khi lưu nháp thành công hoặc khi submit publish.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict. Không thêm dependency, không đổi server action/schema.

---

## File Structure

- **Create:** `src/hooks/use-form-draft.ts` — logic đọc/ghi/xoá draft localStorage. Export `readDraft`, `serializeForm`, `useFormDraft`, type `Draft`.
- **Modify:** `src/app/editor/[id]/EditorForm.tsx` — seed state/`defaultValue` từ draft, gọi hook, clear khi publish.

Không có test framework tự động trong repo (chỉ có Playwright cho lightbox). Verify bằng `npm run typecheck` + `npm run lint` + kiểm thử thủ công theo Task 4.

---

## Task 1: Hook `use-form-draft.ts` — đọc & serialize

**Files:**
- Create: `src/hooks/use-form-draft.ts`

Các field lặp trong form: `scheduleTime`, `scheduleLabel`, `galleryUrl` (nhiều input cùng name) → serialize thành mảng. `brideFirst` là checkbox → boolean. Còn lại là string.

- [ ] **Step 1: Tạo file với type + hằng key + serializeForm**

```ts
"use client";

import { useEffect, useRef } from "react";

const KEY = (id: string) => `chungdoi:draft:${id}`;

const ARRAY_FIELDS = ["scheduleTime", "scheduleLabel", "galleryUrl"] as const;

export type Draft = Record<string, string | boolean | string[]>;

/** Đọc form thành object; field lặp → mảng, brideFirst → boolean. */
export function serializeForm(form: HTMLFormElement): Draft {
  const fd = new FormData(form);
  const draft: Draft = {};
  for (const name of ARRAY_FIELDS) {
    draft[name] = fd.getAll(name).map(String);
  }
  for (const [name, value] of fd.entries()) {
    if ((ARRAY_FIELDS as readonly string[]).includes(name)) continue;
    draft[name] = String(value);
  }
  // brideFirst: checkbox không nằm trong FormData khi bỏ chọn
  draft.brideFirst = fd.get("brideFirst") != null;
  return draft;
}
```

- [ ] **Step 2: Thêm readDraft (đọc đồng bộ, an toàn)**

```ts
/** Đọc draft đồng bộ (client-only). Lỗi parse → xoá key hỏng, trả null. */
export function readDraft(invitationId: string): Draft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY(invitationId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Draft) : null;
  } catch {
    window.localStorage.removeItem(KEY(invitationId));
    return null;
  }
}
```

- [ ] **Step 3: Thêm useFormDraft (ghi debounce + clear)**

```ts
/** Gắn listener ghi draft có debounce; clear khi cleared=true. */
export function useFormDraft(opts: {
  formId: string;
  invitationId: string;
  enabled: boolean;
  cleared: boolean;
}): void {
  const { formId, invitationId, enabled, cleared } = opts;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (cleared) {
      window.localStorage.removeItem(KEY(invitationId));
    }
  }, [cleared, invitationId]);

  useEffect(() => {
    if (!enabled || cleared) return;
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    const write = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        try {
          window.localStorage.setItem(KEY(invitationId), JSON.stringify(serializeForm(form)));
        } catch {
          // localStorage đầy hoặc bị chặn — bỏ qua, đây chỉ là lưới an toàn
        }
      }, 500);
    };

    form.addEventListener("input", write);
    form.addEventListener("change", write);
    return () => {
      form.removeEventListener("input", write);
      form.removeEventListener("change", write);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [formId, invitationId, enabled, cleared]);
}
```

- [ ] **Step 4: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS, không lỗi ở `src/hooks/use-form-draft.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-form-draft.ts
git commit -m "feat: add useFormDraft hook for editor localStorage autosave"
```

---

## Task 2: Seed EditorForm từ draft

**Files:**
- Modify: `src/app/editor/[id]/EditorForm.tsx`

Mục tiêu Task này: đọc draft lúc mount (chỉ khi server rỗng) và dùng làm giá trị khởi tạo cho mọi field. Chưa gọi hook ghi (Task 3).

- [ ] **Step 1: Thêm import**

Sửa dòng import React (dòng 5) để có `useMemo`, và thêm import hook. Dòng 5 hiện tại:

```ts
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
```

Đổi thành:

```ts
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
```

Thêm sau dòng import actions (sau dòng 28 `import { saveDraft, publish, checkSlug, type EditorState } from "./actions";`):

```ts
import { readDraft, useFormDraft, type Draft } from "@/hooks/use-form-draft";
```

- [ ] **Step 2: Thêm draft + helper seed ở đầu component**

Trong `EditorForm`, ngay sau khối `useActionState` cho publish (sau dòng 683, trước `const [scheduleRows...`), thêm:

```ts
  const serverEmpty = content == null;
  const draft = useMemo<Draft | null>(
    () => (serverEmpty ? readDraft(invitationId) : null),
    [serverEmpty, invitationId],
  );
  const seed = (key: string, fallback: string) =>
    typeof draft?.[key] === "string" ? (draft[key] as string) : fallback;
  const seedBool = (key: string, fallback: boolean) =>
    typeof draft?.[key] === "boolean" ? (draft[key] as boolean) : fallback;
```

- [ ] **Step 3: Seed scheduleRows từ draft**

Dòng 685 hiện tại:

```ts
  const [scheduleRows, setScheduleRows] = useState(schedule.length ? schedule : [{ time: "", label: "" }]);
```

Đổi thành:

```ts
  const [scheduleRows, setScheduleRows] = useState(() => {
    const dTime = Array.isArray(draft?.scheduleTime) ? (draft!.scheduleTime as string[]) : null;
    const dLabel = Array.isArray(draft?.scheduleLabel) ? (draft!.scheduleLabel as string[]) : null;
    if (dTime || dLabel) {
      const rows: { time: string; label: string }[] = [];
      const n = Math.max(dTime?.length ?? 0, dLabel?.length ?? 0);
      for (let i = 0; i < n; i++) {
        rows.push({ time: dTime?.[i] ?? "", label: dLabel?.[i] ?? "" });
      }
      if (rows.length) return rows;
    }
    return schedule.length ? schedule : [{ time: "", label: "" }];
  });
```

- [ ] **Step 4: Seed các input không kiểm soát (defaultValue)**

Thay mọi `field(content, "X")` dùng làm `defaultValue` bằng `seed("X", field(content, "X"))`. Danh sách đầy đủ các dòng cần đổi (theo tên field):

Thông tin cơ bản: `brideFullName`, `groomFullName`, `brideShortName`, `groomShortName`, `date`, `time`, `ceremonyDate`, `ceremonyTime`, `ceremonyHeader`.
Gia đình: `groomFather`, `groomMother`, `groomParentTitle`, `groomAddress`, `brideFather`, `brideMother`, `brideParentTitle`, `brideAddress`.
Tiệc: `address`, `mapAddress`, `banquetTime`.
Chuyển khoản: `groomBankName`, `groomAccountNumber`, `groomAccountName`, `brideBankName`, `brideAccountNumber`, `brideAccountName`.

Ví dụ cụ thể — dòng 773:

```ts
              defaultValue={field(content, "brideFullName")}
```

thành:

```ts
              defaultValue={seed("brideFullName", field(content, "brideFullName"))}
```

Áp dụng cùng pattern cho tất cả tên field liệt kê ở trên.

- [ ] **Step 5: Seed các component có defaultValue riêng**

`BirthOrderField` (dòng 798-809): đổi
```ts
              defaultValue={field(content, "brideBirthOrder")}
```
```ts
              defaultValue={field(content, "groomBirthOrder")}
```
thành `seed("brideBirthOrder", field(content, "brideBirthOrder"))` và `seed("groomBirthOrder", field(content, "groomBirthOrder"))`.

`brideFirst` checkbox (dòng 816):
```ts
                defaultChecked={content?.brideFirst ?? true}
```
thành:
```ts
                defaultChecked={seedBool("brideFirst", content?.brideFirst ?? true)}
```

`ColorField` primaryColor (dòng 835):
```ts
            <ColorField name="primaryColor" label="Màu chủ đạo" defaultValue={field(content, "primaryColor")} />
```
thành `defaultValue={seed("primaryColor", field(content, "primaryColor"))}`.

`TemplatePicker` (dòng 765):
```ts
          <TemplatePicker defaultValue={templateId} />
```
thành `defaultValue={seed("templateId", templateId)}`.

`Select` fontFamily (dòng 938):
```ts
              defaultValue={field(content, "fontFamily")}
```
thành `seed("fontFamily", field(content, "fontFamily"))`.

`MusicField` (dòng 942):
```ts
            <MusicField defaultValue={field(content, "music")} />
```
thành `defaultValue={seed("music", field(content, "music"))}`.

- [ ] **Step 6: Seed gallery cho GalleryUploader**

Dòng 930:
```ts
          <GalleryUploader initial={gallery} />
```
thành:
```ts
          <GalleryUploader initial={Array.isArray(draft?.galleryUrl) ? (draft!.galleryUrl as string[]) : gallery} />
```

- [ ] **Step 7: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS. Nếu báo `seedBool` unused (khi chưa dùng) — đã dùng ở Step 5 nên phải OK.

- [ ] **Step 8: Commit**

```bash
git add src/app/editor/[id]/EditorForm.tsx
git commit -m "feat: seed editor form fields from localStorage draft"
```

---

## Task 3: Gọi hook ghi + clear khi lưu/publish

**Files:**
- Modify: `src/app/editor/[id]/EditorForm.tsx`

- [ ] **Step 1: Gọi useFormDraft**

Sau khối `useEffect` xử lý `publishState` (sau dòng 701, trước `function onShowPreview`), thêm:

```ts
  useFormDraft({
    formId: "editor-form",
    invitationId,
    enabled: serverEmpty,
    cleared: saveState?.ok === true,
  });
```

- [ ] **Step 2: Clear draft khi submit publish**

Form publish (dòng 980) hiện tại:

```tsx
        <form action={publishFormAction} className="space-y-3">
```

Đổi thành (thêm `onSubmit` clear key trước khi action chạy/redirect):

```tsx
        <form
          action={publishFormAction}
          onSubmit={() => {
            try {
              window.localStorage.removeItem(`chungdoi:draft:${invitationId}`);
            } catch {}
          }}
          className="space-y-3"
        >
```

- [ ] **Step 3: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/editor/[id]/EditorForm.tsx
git commit -m "feat: persist and clear editor draft on save/publish"
```

---

## Task 4: Kiểm thử thủ công + build

**Files:** không sửa; chỉ verify.

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: build thành công, không lỗi type/lint.

- [ ] **Step 2: Kiểm thử thủ công**

Run: `npm run dev`, mở editor của một thiệp **mới** (chưa lưu content). Thực hiện:

1. Gõ tên cô dâu/chú rể, chọn template khác, thêm 1 mốc chương trình, đổi màu chủ đạo.
2. Đợi ~1s (qua debounce), refresh trang (F5).
3. **Kỳ vọng:** các field vừa nhập còn nguyên (text, template, mốc chương trình, màu).

- [ ] **Step 3: Kiểm thử server ưu tiên**

1. Với thiệp mới ở trên, bấm "Lưu bản nháp" → toast "Đã lưu bản nháp".
2. Refresh trang.
3. **Kỳ vọng:** dữ liệu load từ server; draft localStorage đã bị xoá (kiểm tra DevTools → Application → Local Storage, không còn key `chungdoi:draft:{id}`).

- [ ] **Step 4: Kiểm thử draft không đè server**

1. Với thiệp đã có content trên server, mở editor, sửa vài field nhưng **không** bấm lưu.
2. Refresh.
3. **Kỳ vọng:** load lại từ server (bản đã lưu), phần sửa dở mất — vì `content != null` nên không đọc/ghi draft.

- [ ] **Step 5: Xác nhận kết quả**

Báo lại kết quả từng bước kiểm thử. Nếu tất cả PASS → tính năng hoàn tất.

---

## Self-Review Notes

- **Spec coverage:** server ưu tiên (Task 2 Step 2 `serverEmpty`), toàn bộ form (Task 2 Steps 4-6 phủ mọi field + Task 1 serialize field lặp), xoá sau lưu/publish (Task 3), key theo invitationId (Task 1). Đủ.
- **Ràng buộc input không kiểm soát:** seed đồng bộ qua `useMemo`/`useState` initializer (Task 2), không dùng useEffect đổ lại. Đúng.
- **Type consistency:** `Draft`, `readDraft`, `serializeForm`, `useFormDraft` khớp giữa Task 1 và cách dùng ở Task 2-3.
