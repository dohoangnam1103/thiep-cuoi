# Đơn giản hóa form editor — phân tầng cần thiết — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tổ chức lại form editor thiệp cưới thành 2 tầng (cốt lõi luôn mở / tùy chọn đóng sẵn), thêm thanh tiến độ 3 field bắt buộc, và bỏ `required` HTML gây khó chịu — không đụng lưu trữ/xuất bản.

**Architecture:** Toàn bộ thay đổi nằm trong một file client component `EditorForm.tsx`. Thêm 1 component hiển thị `RequiredProgress` đọc trạng thái 3 field cốt lõi từ state cục bộ (cập nhật qua handler `onInput` sẵn có của form). Sắp xếp lại thứ tự các `<Accordion>` và đổi cờ `defaultOpen`. Không tạo file mới, không đổi API/schema/action.

**Tech Stack:** Next.js 16 (App Router, React 19), TypeScript strict, Tailwind CSS v4, component `Accordion`/`Text`/`Combobox` sẵn có.

## Global Constraints

- Không đổi bất kỳ thuộc tính `name=` nào của input (server đọc theo tên).
- Không sửa `actions.ts`, `content-schema.ts`, `slug.ts`, `useFormDraft`.
- Copy tiếng Việt hiển thị cho người dùng viết trực tiếp trong component (form này không đi qua next-intl — theo hiện trạng file).
- TypeScript strict, không `any`. Named exports, 2-space indent, Tailwind utility, không inline style.
- Verify: `npm run typecheck` và `npm run build` phải pass.

---

### Task 1: Thêm thanh tiến độ 3 field cốt lõi (`RequiredProgress`)

**Files:**
- Modify: `src/app/editor/[id]/EditorForm.tsx`

**Interfaces:**
- Produces: component `RequiredProgress({ bride, groom, date }: { bride: boolean; groom: boolean; date: boolean })`; state `coreFilled` trong `EditorForm` dạng `{ bride: boolean; groom: boolean; date: boolean }`.
- Consumes: handler `onEditorInput` sẵn có (line ~756) — mở rộng để cập nhật `coreFilled`.

- [ ] **Step 1: Thêm component `RequiredProgress`**

Đặt ngay trước `function TabBar` (khoảng line 595). 3 chấm + dòng đếm; đủ 3 thì chuyển xanh.

```tsx
function RequiredProgress({ bride, groom, date }: { bride: boolean; groom: boolean; date: boolean }) {
  const items = [
    { label: "Tên cô dâu", done: bride },
    { label: "Tên chú rể", done: groom },
    { label: "Ngày cưới", done: date },
  ];
  const filled = items.filter((i) => i.done).length;
  const ready = filled === items.length;
  return (
    <div className="mb-4 rounded-2xl border border-border bg-card px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {items.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-sm">
            <span
              className={`size-2.5 rounded-full ${item.done ? "bg-emerald-500" : "border border-muted-foreground/40"}`}
              aria-hidden
            />
            <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
          </span>
        ))}
      </div>
      <p className={`mt-2 text-xs font-semibold ${ready ? "text-emerald-600" : "text-muted-foreground"}`}>
        {ready ? "Sẵn sàng xuất bản" : `Đã điền ${filled}/${items.length} mục cần thiết để xuất bản`}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Thêm state `coreFilled` trong `EditorForm`**

Đặt cạnh các `useState` khác (sau `const [tab, setTab] = useState(...)`, khoảng line 673). Khởi tạo từ seed để lần render đầu đã đúng.

```tsx
const [coreFilled, setCoreFilled] = useState(() => ({
  bride: Boolean(seed("brideFullName", field(content, "brideFullName")).trim()),
  groom: Boolean(seed("groomFullName", field(content, "groomFullName")).trim()),
  date: Boolean(seed("date", field(content, "date")).trim()),
}));
```

- [ ] **Step 3: Cập nhật `coreFilled` trong `onEditorInput`**

Mở rộng handler hiện có (line ~756). Giữ nguyên logic slug, chỉ thêm cập nhật khi field cốt lõi thay đổi.

```tsx
function onEditorInput(event: React.FormEvent<HTMLFormElement>) {
  const target = event.target as HTMLInputElement | HTMLSelectElement | null;
  if (!target?.name) return;
  if (target.name === "brideFullName" || target.name === "groomFullName" || target.name === "date") {
    const key = target.name === "brideFullName" ? "bride" : target.name === "groomFullName" ? "groom" : "date";
    setCoreFilled((prev) => ({ ...prev, [key]: Boolean(target.value.trim()) }));
  }
  if (target.name === "slug" || slugEdited) return;
  const next = nextSlugFromForm();
  setSlug(next);
  setSlugStatus(null);
}
```

- [ ] **Step 4: Render `RequiredProgress` đầu vùng edit**

Ngay sau thẻ mở `<form ... id="editor-form">` (line ~839), trước `<Accordion title="Mẫu thiệp" ...>`.

```tsx
<RequiredProgress bride={coreFilled.bride} groom={coreFilled.groom} date={coreFilled.date} />
```

- [ ] **Step 5: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS, không lỗi mới.

- [ ] **Step 6: Commit**

```bash
git add src/app/editor/[id]/EditorForm.tsx
git commit -m "feat(editor): thêm thanh tiến độ 3 mục cần thiết"
```

---

### Task 2: Sắp xếp lại accordion thành 2 tầng + tách "Lễ riêng"

**Files:**
- Modify: `src/app/editor/[id]/EditorForm.tsx`

**Interfaces:**
- Consumes: `Accordion`, `Grid`, `Text`, `Select`, `ColorField`, `BirthOrderField`, `TemplatePicker`, `GalleryUploader`, `MusicPicker`, `BankCombobox`, `SubHeader`, `scheduleRows`, `RequiredProgress` (Task 1) — tất cả sẵn có.
- Produces: thứ tự accordion mới; component nhỏ `TierDivider` cho dải phân cách.

- [ ] **Step 1: Thêm component `TierDivider`**

Đặt cạnh `SubHeader` (khoảng line 591).

```tsx
function TierDivider() {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Tùy chỉnh thêm — không bắt buộc
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
```

- [ ] **Step 2: Tách "Lễ riêng" khỏi accordion "Thông tin cơ bản"**

Trong accordion "Thông tin cơ bản" (line ~844), **xóa** 3 field lễ khỏi `<Grid>`: `ceremonyDate`, `ceremonyTime`, `ceremonyHeader` (line ~893-902). Giữ lại: brideFullName, groomFullName, brideBirthOrder, groomBirthOrder, brideFirst, date, time. **Xóa cả `<ColorField name="primaryColor" ...>`** (line ~903) — chuyển xuống tầng 2.

Kết quả `<Grid>` của "Thông tin cơ bản" còn: 2 Text tên, 2 BirthOrderField, khối brideFirst, `date`, `time`.

- [ ] **Step 3: Đổi tiêu đề accordion đầu + sắp xếp lại thứ tự tầng 1**

Đổi `<Accordion title="Thông tin cơ bản" icon="♡">` → `<Accordion title="Thông tin chính" icon="♡">`.

Sắp xếp lại các accordion tầng 1 theo đúng thứ tự sau (tất cả `defaultOpen` mặc định = true, KHÔNG truyền `defaultOpen={false}`):
1. `Thông tin chính` (♡)
2. `Thông tin gia đình` (⌂) — giữ nguyên nội dung
3. `Tiệc cưới` (✦) — giữ nguyên nội dung, đổi title thành `Nơi tổ chức`
4. `Album ảnh` (◱) — giữ nguyên
5. `Mẫu thiệp` (✧) — **bỏ** `defaultOpen={false}` (line 840) để mở sẵn ở tầng 1

- [ ] **Step 4: Chèn `<TierDivider />` rồi các accordion tầng 2**

Sau accordion "Mẫu thiệp", chèn `<TierDivider />`, rồi các accordion tầng 2 (tất cả `defaultOpen={false}`):
1. `Chương trình` (✿) — giữ nguyên nội dung, thêm `defaultOpen={false}`
2. `Lễ riêng` (🕊) `defaultOpen={false}` — accordion MỚI chứa 3 field vừa tách:

```tsx
<Accordion title="Lễ riêng" icon="🕊" defaultOpen={false}>
  <Grid>
    <Text name="ceremonyDate" label="Ngày lễ" type="date" defaultValue={seed("ceremonyDate", field(content, "ceremonyDate"))} hint="Ngày lễ vu quy/thành hôn nếu khác ngày cưới." />
    <Text name="ceremonyTime" label="Giờ lễ" type="time" defaultValue={seed("ceremonyTime", field(content, "ceremonyTime"))} />
    <Text
      name="ceremonyHeader"
      label="Tiêu đề lễ"
      defaultValue={seed("ceremonyHeader", field(content, "ceremonyHeader"))}
      placeholder="VD: Lễ Thành Hôn"
      hint="Dòng chữ đặt trên phần thông tin lễ (VD: Lễ Vu Quy, Lễ Thành Hôn)."
      full
    />
  </Grid>
</Accordion>
```

3. `Font & Nhạc` (♪) — giữ nguyên (đã `defaultOpen={false}`)
4. `Màu chủ đạo` (🎨) `defaultOpen={false}` — accordion MỚI chứa ColorField vừa tách:

```tsx
<Accordion title="Màu chủ đạo" icon="🎨" defaultOpen={false}>
  <Grid>
    <ColorField name="primaryColor" label="Màu chủ đạo" defaultValue={seed("primaryColor", field(content, "primaryColor"))} />
  </Grid>
</Accordion>
```

5. `Thông tin chuyển khoản` (✉) — giữ nguyên (đã `defaultOpen={false}`)

- [ ] **Step 5: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: PASS. Mọi `name=` giữ nguyên nên serialize form không đổi.

- [ ] **Step 6: Commit**

```bash
git add src/app/editor/[id]/EditorForm.tsx
git commit -m "feat(editor): phân tầng cốt lõi/tùy chọn + tách lễ riêng, màu"
```

---

### Task 3: Bỏ `required` HTML + thêm dấu `*` cho 3 field cốt lõi

**Files:**
- Modify: `src/app/editor/[id]/EditorForm.tsx`

**Interfaces:**
- Consumes: component `Text` (line ~202) và các label của nó.
- Produces: prop mới `requiredMark?: boolean` trên `Text` — hiện dấu `*` đỏ, KHÔNG bật validation trình duyệt.

- [ ] **Step 1: Thêm prop `requiredMark` vào `Text`, bỏ `required` HTML**

Sửa signature và label của `Text` (line ~202-238). Bỏ prop `required` (không dùng nữa) và thay bằng `requiredMark`.

```tsx
function Text({
  name,
  label,
  defaultValue,
  placeholder,
  hint,
  type = "text",
  full,
  requiredMark,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  type?: string;
  full?: boolean;
  requiredMark?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label htmlFor={name} className={labelClass}>
        {label}
        {requiredMark ? <span className="ml-0.5 text-destructive" aria-hidden> *</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={inputClass}
      />
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
```

- [ ] **Step 2: Đổi `required` → `requiredMark` tại 3 field cốt lõi**

- `brideFullName` (line ~846): đổi `required` thành `requiredMark`.
- `groomFullName` (line ~854): đổi `required` thành `requiredMark`.
- `date` (line ~891): đổi `required` thành `requiredMark`.

Ví dụ:

```tsx
<Text
  name="brideFullName"
  label="Họ tên cô dâu"
  defaultValue={seed("brideFullName", field(content, "brideFullName"))}
  placeholder="VD: Nguyễn Quỳnh Anh"
  hint="Họ tên đầy đủ, hiển thị ở phần giới thiệu."
  requiredMark
/>
```

```tsx
<Text name="date" label="Ngày cưới" type="date" defaultValue={seed("date", field(content, "date"))} hint="Ngày tổ chức chính, hiển thị nổi bật trên thiệp." requiredMark />
```

- [ ] **Step 3: Kiểm tra không còn `required` sót trên `<Text>`**

Run: `grep -n "required" "src/app/editor/[id]/EditorForm.tsx"`
Expected: chỉ còn `requiredMark` (prop + định nghĩa). Không còn `required` đứng một mình trên `<Text>`.

- [ ] **Step 4: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/editor/[id]/EditorForm.tsx
git commit -m "feat(editor): thay required HTML bằng dấu * cho 3 mục cần thiết"
```

---

### Task 4: Kiểm thử thủ công UI

**Files:** không sửa code (chỉ verify). Nếu phát hiện lỗi, quay lại task tương ứng.

- [ ] **Step 1: Chạy dev server**

Run: `npm run dev`

- [ ] **Step 2: Mở editor và kiểm tra checklist**

Mở `/editor/<id>` một thiệp nháp. Xác nhận:
- Thanh tiến độ hiện đầu form, 3 chấm; gõ tên cô dâu → chấm 1 chuyển xanh; điền đủ 3 → "Sẵn sàng xuất bản".
- Tầng cốt lõi (Thông tin chính, Gia đình, Nơi tổ chức, Album, Mẫu thiệp) mở sẵn.
- Dải "Tùy chỉnh thêm — không bắt buộc" phân cách rõ; các accordion Chương trình / Lễ riêng / Font & Nhạc / Màu chủ đạo / Chuyển khoản đóng sẵn.
- 3 field cốt lõi có dấu `*`; không còn viền đỏ/tooltip "Please fill in this field" khi bấm Lưu với field trống.
- Lưu nháp OK, reload thấy draft restore đúng giá trị.
- Xuất bản khi thiếu tên/ngày vẫn báo lỗi từ server đúng như trước.
- Ngày/giờ lễ nhập trong "Lễ riêng" vẫn lưu và hiện ở preview.

- [ ] **Step 3: Ghi kết quả**

Nếu tất cả pass → hoàn tất. Nếu có mục fail → sửa ở task liên quan rồi chạy lại `npm run build`.

---

## Self-Review

**Spec coverage:**
- Thanh tiến độ → Task 1. ✅
- Phân tầng + thứ tự accordion → Task 2. ✅
- Tách "Lễ riêng" + "Màu chủ đạo" xuống tầng 2 → Task 2. ✅
- Dải phân cách tầng → Task 2 (`TierDivider`). ✅
- Bỏ `required`, thêm `*` → Task 3. ✅
- Giữ nguyên name/action/schema/draft → Global Constraints + không có task nào đụng. ✅
- Kiểm thử typecheck/build + thủ công → Task 3 + Task 4. ✅

**Type consistency:** `coreFilled` shape `{ bride, groom, date }` dùng nhất quán Task 1 (state, `RequiredProgress` props). `requiredMark` dùng nhất quán Task 3. `TierDivider`/`RequiredProgress` không nhận props ngoài định nghĩa.

**Placeholder scan:** không có TBD/TODO; mọi step có code hoặc lệnh cụ thể.
