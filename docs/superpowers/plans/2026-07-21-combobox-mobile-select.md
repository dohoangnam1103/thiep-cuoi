# Combobox (react-select) thay dropdown native — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay tất cả `<select>` native trên toàn app bằng một component `Combobox` dùng chung (wrap `react-select`) để dropdown hoạt động ổn định trên mobile / thiết bị lạ.

**Architecture:** Một component `src/components/ui/combobox.tsx` wrap `react-select` với đúng cấu hình chống-bug-mobile của `bank-combobox` (`unstyled` + `classNames` + `menuPortalTarget={document.body}` + `menuPosition="fixed"` + `menuShouldScrollIntoView={false}`). Hai mode qua discriminated union: **form mode** (`name`/`defaultValue` — tự render hidden input + bắn `input` event để autosave nháp của EditorForm bắt được, đúng pattern `TemplatePicker`) và **controlled mode** (`value`/`onChange`). Hai variant theme: `default` (design token) và `neutral` (palette trắng/neutral cho trang thiệp public).

**Tech Stack:** Next.js 16, React 19, TypeScript strict, `react-select ^5.10.2` (đã cài), Tailwind v4, `cn()` từ `@/lib/utils`.

## Global Constraints

- TypeScript strict, **không dùng `any`**. Named exports, PascalCase component, camelCase util. 2-space indent.
- Không hardcode copy người dùng thấy nếu chỗ đó vốn đã dùng i18n (`t(...)`); giữ nguyên nguồn label hiện có ở mỗi call-site.
- **Không có unit-test runner cho React trong repo.** Bar xác minh mỗi task = `npm run typecheck` + `npm run lint` xanh; task cuối chạy `npm run check` (lint + typecheck + build) xanh. UI mobile do user tự verify sau deploy.
- Không đổi `src/components/ui/bank-combobox.tsx`. Không đụng radio/checkbox/input khác — chỉ `<select>`.
- Autosave nháp (`useFormDraft`) nghe sự kiện `input`/`change` nổi bọt; form mode của Combobox **phải** bắn `new Event("input", { bubbles: true })` khi value đổi.
- `react-select` phải nhận `inputId`/`instanceId` cố định (từ `useId()`) để tránh hydration id mismatch.

---

### Task 1: Component `Combobox`

**Files:**
- Create: `src/components/ui/combobox.tsx`

**Interfaces:**
- Consumes: `react-select` (default export `Select`, type `ClassNamesConfig`); `cn` từ `@/lib/utils`.
- Produces:
  - `export type ComboboxOption = { value: string; label: string }`
  - `export type ComboboxProps` (union form | controlled)
  - `export function Combobox(props: ComboboxProps): JSX.Element`
  - Form mode: `{ name: string; defaultValue?: string }` → render `<input type="hidden" name value readOnly>` + bắn `input` event khi value đổi.
  - Controlled mode: `{ value: string; onChange: (value: string) => void }`.
  - Base props (cả 2 mode): `options: ComboboxOption[]`, `placeholder?`, `isSearchable?` (mặc định false), `isClearable?` (mặc định false), `inputId?`, `"aria-label"?`, `variant?: "default" | "neutral"` (mặc định default), `className?`.

- [ ] **Step 1: Tạo file component**

Create `src/components/ui/combobox.tsx`:

```tsx
"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Select, { type ClassNamesConfig } from "react-select";

import { cn } from "@/lib/utils";

export type ComboboxOption = { value: string; label: string };

type Variant = "default" | "neutral";

type ComboboxBaseProps = {
  options: ComboboxOption[];
  placeholder?: string;
  isSearchable?: boolean;
  isClearable?: boolean;
  inputId?: string;
  "aria-label"?: string;
  variant?: Variant;
  className?: string;
};

type ComboboxFormProps = ComboboxBaseProps & {
  name: string;
  defaultValue?: string;
};

type ComboboxControlledProps = ComboboxBaseProps & {
  value: string;
  onChange: (value: string) => void;
};

export type ComboboxProps = ComboboxFormProps | ComboboxControlledProps;

function isControlled(props: ComboboxProps): props is ComboboxControlledProps {
  return "onChange" in props;
}

function classNamesFor(variant: Variant): ClassNamesConfig<ComboboxOption, false> {
  const neutral = variant === "neutral";
  return {
    container: () => "text-sm",
    control: ({ isFocused }) =>
      cn(
        "min-h-11 rounded-xl border shadow-sm transition-[border-color,box-shadow]",
        neutral ? "border-neutral-300 bg-white" : "border-input bg-background",
        isFocused &&
          (neutral
            ? "border-neutral-700 ring-2 ring-neutral-900/10"
            : "border-primary ring-2 ring-ring/25"),
      ),
    valueContainer: () => "gap-1 px-3 py-0.5",
    placeholder: () => cn("truncate", neutral ? "text-neutral-500" : "text-muted-foreground"),
    singleValue: () => cn("min-w-0", neutral ? "text-neutral-900" : "text-foreground"),
    input: () => cn("m-0 p-0", neutral ? "text-neutral-900" : "text-foreground"),
    indicatorsContainer: () =>
      cn("shrink-0 pr-1", neutral ? "text-neutral-500" : "text-muted-foreground"),
    clearIndicator: () =>
      "grid size-8 cursor-pointer place-items-center rounded-md transition hover:bg-black/5",
    dropdownIndicator: () =>
      "grid size-8 cursor-pointer place-items-center rounded-md transition hover:bg-black/5",
    indicatorSeparator: () => "hidden",
    menuPortal: () => "z-[150]",
    menu: () =>
      cn(
        "my-1 overflow-hidden rounded-xl border shadow-xl",
        neutral
          ? "border-neutral-200 bg-white text-neutral-900"
          : "border-border bg-popover text-popover-foreground",
      ),
    menuList: () => "max-h-72 overscroll-contain p-1.5",
    option: ({ isFocused, isSelected }) =>
      cn(
        "cursor-pointer rounded-lg px-2.5 py-2",
        neutral
          ? cn(
              "text-neutral-900",
              isFocused && "bg-neutral-100",
              isSelected && "bg-neutral-200",
            )
          : cn(
              "text-foreground",
              isFocused && "bg-primary/10",
              isSelected && "bg-primary/15 text-primary",
            ),
      ),
    noOptionsMessage: () => "px-4 py-6 text-sm text-muted-foreground",
  };
}

export function Combobox(props: ComboboxProps) {
  const {
    options,
    placeholder,
    isSearchable = false,
    isClearable = false,
    inputId,
    variant = "default",
    className,
  } = props;
  const ariaLabel = props["aria-label"];
  const controlled = isControlled(props);

  const generatedId = useId();
  const id = inputId ?? generatedId;

  const [internal, setInternal] = useState(controlled ? "" : props.defaultValue ?? "");
  const currentValue = controlled ? props.value : internal;

  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (controlled) return;
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    hiddenRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [internal, controlled]);

  const selected = useMemo(
    () => options.find((option) => option.value === currentValue) ?? null,
    [options, currentValue],
  );

  const portalTarget = typeof document === "undefined" ? null : document.body;

  return (
    <div className={className}>
      {controlled ? null : (
        <input ref={hiddenRef} type="hidden" name={props.name} value={currentValue} readOnly />
      )}
      <Select<ComboboxOption, false>
        unstyled
        inputId={id}
        instanceId={id}
        aria-label={ariaLabel}
        options={options}
        value={selected}
        onChange={(option) => {
          const next = option?.value ?? "";
          if (controlled) props.onChange(next);
          else setInternal(next);
        }}
        classNames={classNamesFor(variant)}
        placeholder={placeholder ?? ""}
        isSearchable={isSearchable}
        isClearable={isClearable}
        menuPlacement="auto"
        menuPosition="fixed"
        menuPortalTarget={portalTarget}
        menuShouldScrollIntoView={false}
        menuShouldBlockScroll={false}
        maxMenuHeight={288}
        noOptionsMessage={() => "Không có lựa chọn"}
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS, không lỗi ở `combobox.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/combobox.tsx
git commit -m "feat(ui): thêm Combobox (react-select) dùng chung cho dropdown"
```

---

### Task 2: EditorForm — Font `Select` + `BirthOrderField`

**Files:**
- Modify: `src/app/editor/[id]/EditorForm.tsx` (component `Select` ~238-268, `BirthOrderField` ~271-345, hằng `optionClass` dòng 162, import dòng 28)

**Interfaces:**
- Consumes: `Combobox`, `ComboboxOption` từ Task 1; `BIRTH_ORDER_OPTIONS`, `FONT_OPTIONS` từ `@/data/editor-options`; `labelClass`, `inputClass` sẵn có.
- Produces: `Select` (giữ API cũ: `{ name, label, defaultValue?, options, hint?, full? }`) và `BirthOrderField` (giữ API cũ: `{ name, label, defaultValue?, hint? }`) — call-site không đổi.

- [ ] **Step 1: Thêm import Combobox**

Sửa dòng 24 (sau `import { BankCombobox } ...`), thêm:

```tsx
import { Combobox } from "@/components/ui/combobox";
```

- [ ] **Step 2: Thay thân component `Select` (dòng ~253-267)**

Giữ nguyên phần signature (dòng 238-252). Thay khối `return (...)`:

```tsx
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <Combobox
        inputId={name}
        name={name}
        defaultValue={defaultValue}
        options={options}
        isSearchable
        placeholder="Chọn…"
      />
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
```

- [ ] **Step 3: Thay thân `BirthOrderField` (dòng ~286-343, phần `return`)**

Giữ signature (dòng 271-285). Thay khối `return (...)`:

```tsx
  const options = [
    ...BIRTH_ORDER_OPTIONS,
    { value: "__custom__", label: "Khác…" },
  ];

  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      {custom ? (
        <input
          id={name}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="VD: Trưởng Nữ"
          className={inputClass}
          autoFocus
        />
      ) : (
        <>
          <input type="hidden" name={name} value={value} readOnly />
          <Combobox
            inputId={name}
            value={value}
            onChange={(next) => {
              if (next === "__custom__") {
                setCustom(true);
                setValue("");
              } else {
                setValue(next);
              }
            }}
            options={options}
            placeholder="— Chọn thứ bậc —"
            aria-label={label}
          />
        </>
      )}
      {custom ? (
        <button
          type="button"
          onClick={() => {
            setCustom(false);
            setValue("");
          }}
          className="mt-1 text-xs text-primary hover:underline"
        >
          Chọn từ danh sách
        </button>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
```

Ghi chú thiết kế: `BirthOrderField` dùng Combobox **controlled** (không truyền `name` cho Combobox) và tự render `<input type="hidden" name={name}>` để giữ tên field. Combobox controlled không tự bắn `input` event, nhưng khi đổi giá trị hidden input đổi + khi bật/tắt "Khác…" DOM thay đổi node có `name` → `useFormDraft` (MutationObserver + input listener trên form) vẫn bắt được. Không cần dispatch thủ công ở đây.

- [ ] **Step 4: Xóa hằng `optionClass`**

Xóa dòng 162:

```tsx
const optionClass = "bg-card text-foreground";
```

Sau khi thay 2 component trên, không còn `<option>` nào trong file — `optionClass` thành biến chết. `inputClass` (dòng 159) giữ nguyên (còn dùng cho input text).

- [ ] **Step 5: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS. Nếu lint báo `optionClass`/import thừa → đã xóa hết ở Step 4.

- [ ] **Step 6: Commit**

```bash
git add src/app/editor/[id]/EditorForm.tsx
git commit -m "feat(editor): thay select Font + Thứ bậc bằng Combobox"
```

---

### Task 3: GuestManager — `side` (modal) + 3 filter

**Files:**
- Modify: `src/app/dashboard/[id]/guests/GuestManager.tsx` (`GuestFields` select `side` ~170-174; 3 filter select ~858-872; import)

**Interfaces:**
- Consumes: `Combobox` từ Task 1; `t` (next-intl) sẵn có; state `sideFilter`/`groupFilter`/`responseFilter` + setter sẵn có; `groups: string[]` sẵn có.
- Produces: không export mới.

- [ ] **Step 1: Thêm import**

Thêm cùng nhóm import (sau import `Button`):

```tsx
import { Combobox } from "@/components/ui/combobox";
```

- [ ] **Step 2: Thay select `side` trong `GuestFields` (dòng ~169-175)**

Thay khối:

```tsx
      <Field label={t("fields.side")}>
        <Combobox
          inputId="guest-side"
          name="side"
          defaultValue={guest?.side ?? ""}
          options={[
            { value: "", label: t("fields.sideEmpty") },
            { value: "Nhà trai", label: t("sides.groom") },
            { value: "Nhà gái", label: t("sides.bride") },
          ]}
        />
      </Field>
```

- [ ] **Step 3: Thay 3 filter select (dòng ~858-872)**

Thay 3 khối `<select>`:

```tsx
        <Combobox
          aria-label={t("filters.side")}
          value={sideFilter}
          onChange={setSideFilter}
          options={[
            { value: "", label: t("filters.allSides") },
            { value: "Nhà trai", label: t("sides.groom") },
            { value: "Nhà gái", label: t("sides.bride") },
          ]}
        />
        <Combobox
          aria-label={t("filters.group")}
          value={groupFilter}
          onChange={setGroupFilter}
          isSearchable
          options={[
            { value: "", label: t("filters.allGroups") },
            ...groups.map((group) => ({ value: group, label: group })),
          ]}
        />
        <Combobox
          aria-label={t("filters.response")}
          value={responseFilter}
          onChange={setResponseFilter}
          options={[
            { value: "", label: t("filters.allResponses") },
            { value: "attending", label: t("status.attending") },
            { value: "declined", label: t("status.declined") },
            { value: "pending", label: t("status.pending") },
          ]}
        />
```

Ghi chú: filter dùng **controlled mode**. Nếu setter có kiểu hẹp hơn `string` (ví dụ `responseFilter` là union), ép kiểu tại `onChange={(v) => setResponseFilter(v as ResponseFilter)}` — kiểm ở Step 4, sửa theo lỗi TS thực tế.

- [ ] **Step 4: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS. Nếu TS báo mismatch ở `onChange` filter → bọc `(v) => setX(v as <Type>)` theo type của state đó.

- [ ] **Step 5: Commit**

```bash
git add "src/app/dashboard/[id]/guests/GuestManager.tsx"
git commit -m "feat(guests): thay select nhà + bộ lọc bằng Combobox"
```

---

### Task 4: RsvpQuestionBuilder — `type`

**Files:**
- Modify: `src/app/dashboard/[id]/guests/RsvpQuestionBuilder.tsx` (select `type` ~155-159; import)

**Interfaces:**
- Consumes: `Combobox` từ Task 1; `type`/`setType` (`QuestionType`) sẵn có; `t` sẵn có.
- Produces: không export mới.

- [ ] **Step 1: Thêm import**

Sau import `Button`:

```tsx
import { Combobox } from "@/components/ui/combobox";
```

- [ ] **Step 2: Thay select `type` (dòng ~155-159)**

Thay:

```tsx
                <Combobox
                  aria-label={t("type")}
                  value={type}
                  onChange={(next) => setType(next as QuestionType)}
                  options={[
                    { value: "text", label: t("types.text") },
                    { value: "boolean", label: t("types.boolean") },
                    { value: "select", label: t("types.select") },
                  ]}
                />
```

Ghi chú: `setType` nhận `QuestionType` (`"text" | "boolean" | "select"`), Combobox `onChange` trả `string` → ép `next as QuestionType` (giá trị luôn nằm trong 3 option). Đổi `type` vẫn trigger render lại phần textarea options như cũ.

- [ ] **Step 3: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/dashboard/[id]/guests/RsvpQuestionBuilder.tsx"
git commit -m "feat(guests): thay select loại câu hỏi RSVP bằng Combobox"
```

---

### Task 5: Interactions (RsvpForm public) — `side`

**Files:**
- Modify: `src/app/thiep/[slug]/Interactions.tsx` (RsvpForm select `side` ~50-59; import)

**Interfaces:**
- Consumes: `Combobox` từ Task 1; `guest?.side` sẵn có.
- Produces: không export mới.

- [ ] **Step 1: Thêm import**

Thêm vào nhóm import của file:

```tsx
import { Combobox } from "@/components/ui/combobox";
```

- [ ] **Step 2: Thay select `side` (dòng ~50-59)**

Trong `<div className="flex gap-3">`, thay khối `<select name="side" ...>`:

```tsx
        <Combobox
          className="flex-1"
          variant="neutral"
          aria-label="Nhà"
          name="side"
          defaultValue={guest?.side ?? ""}
          options={[
            { value: "", label: "Chọn nhà" },
            { value: "Nhà trai", label: "Nhà trai" },
            { value: "Nhà gái", label: "Nhà gái" },
          ]}
        />
```

Ghi chú: trang thiệp public dùng palette trắng/neutral cứng → `variant="neutral"`. `className="flex-1"` giữ layout cạnh ô số khách.

- [ ] **Step 3: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/thiep/[slug]/Interactions.tsx"
git commit -m "feat(thiep): thay select nhà form RSVP inline bằng Combobox"
```

---

### Task 6: public-rsvp-dialog — `side` + câu hỏi `type=select`

**Files:**
- Modify: `src/components/public-rsvp-dialog.tsx` (select `side` trong grid; select câu hỏi động; import)

**Interfaces:**
- Consumes: `Combobox` từ Task 1; `label` (PublicRsvpLabels), `guest?.side`, `questions` sẵn có.
- Produces: không export mới.

- [ ] **Step 1: Thêm import**

Sau import `useLiveForms`:

```tsx
import { Combobox } from "@/components/ui/combobox";
```

- [ ] **Step 2: Thay select `side` (trong `<label>...{label.side}<select.../></label>`)**

Thay khối `<select name="side" ...>`:

```tsx
                    <Combobox
                      variant="neutral"
                      aria-label={label.side}
                      name="side"
                      defaultValue={guest?.side ?? ""}
                      options={[
                        { value: "", label: label.sideEmpty },
                        { value: "Nhà trai", label: label.groomSide },
                        { value: "Nhà gái", label: label.brideSide },
                      ]}
                    />
```

- [ ] **Step 3: Thay select câu hỏi động (nhánh `else` trong `questions.map`)**

Thay khối `<select name={`question:${question.id}`} ...>`:

```tsx
                      <Combobox
                        variant="neutral"
                        aria-label={question.label}
                        name={`question:${question.id}`}
                        defaultValue=""
                        placeholder={label.selectPlaceholder}
                        options={question.options.map((option) => ({
                          value: option,
                          label: option,
                        }))}
                      />
```

Ghi chú thay đổi hành vi: `<select required>` cũ chặn submit client-side khi câu hỏi bắt buộc bỏ trống. Combobox form mode dùng hidden input nên **không** kích hoạt validation trình duyệt. Chấp nhận được vì server action `submitRsvp` đã enforce câu hỏi bắt buộc (`"Vui lòng trả lời đầy đủ các câu hỏi bắt buộc"`), giống cách các lỗi khác đã surface. Không thêm `required`.

- [ ] **Step 4: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/public-rsvp-dialog.tsx
git commit -m "feat(thiep): thay select nhà + câu hỏi RSVP dialog bằng Combobox"
```

---

### Task 7: Xác minh toàn bộ

**Files:** không sửa (trừ khi build lộ lỗi).

- [ ] **Step 1: Xác nhận không còn `<select>` native**

Run: `grep -rn "<select" src/`
Expected: chỉ còn khớp trong comment (nếu có) — không còn phần tử `<select>` thực. Nếu còn, quay lại task tương ứng.

- [ ] **Step 2: Full check**

Run: `npm run check`
Expected: lint + typecheck + build đều PASS.

- [ ] **Step 3: Commit (nếu có chỉnh sửa phát sinh từ build)**

```bash
git add -A
git commit -m "chore: xác minh Combobox thay toàn bộ select native"
```

Nếu không có thay đổi phát sinh, bỏ qua step này.

---

## Self-Review (đã chạy)

**Spec coverage:**
- Combobox component (2 mode, 2 variant, chống-bug-mobile) → Task 1. ✓
- Autosave dispatch → form mode Task 1; BirthOrderField dùng controlled + hidden input + MutationObserver (Task 2, có ghi chú). ✓
- 10 select trên 5 file: EditorForm Font+BirthOrder×2 (Task 2), GuestManager side+3 filter (Task 3), RsvpQuestionBuilder type (Task 4), Interactions side (Task 5), public-rsvp-dialog side+question (Task 6). ✓
- Dọn `optionClass` (Task 2), giữ `bank-combobox` (không đụng). ✓
- Bar xác minh `npm run check` (Task 7). ✓

**Sai lệch so với spec (có chủ đích, đã ghi chú tại chỗ):**
1. Spec ghi public-rsvp-dialog dùng `variant="default"` (nói "dialog dùng token") — **sai**: dialog thực tế dùng palette neutral (`border-neutral-300 bg-white text-neutral-900`). Task 6 dùng `variant="neutral"` cho đúng tông. Vì vậy variant `neutral` được thiết kế khớp cả Interactions lẫn dialog.
2. Spec nói "xóa component `Select`" — Task 2 **repurpose** `Select` thành wrapper mỏng gọi Combobox (giữ call-site dòng 1002 không đổi). Mục tiêu spec (bỏ `<select>` native) vẫn đạt.
3. Câu hỏi RSVP `required` client-side bị bỏ (server vẫn validate) — ghi chú tại Task 6 Step 3.

**Placeholder scan:** không có TBD/TODO; mọi step code có block đầy đủ. ✓

**Type consistency:** `ComboboxOption`/`ComboboxProps`/`Combobox` khớp giữa Task 1 và các call-site; `FONT_OPTIONS`/`BIRTH_ORDER_OPTIONS` (`SelectOption = {value,label}`) tương thích cấu trúc với `ComboboxOption`. ✓
