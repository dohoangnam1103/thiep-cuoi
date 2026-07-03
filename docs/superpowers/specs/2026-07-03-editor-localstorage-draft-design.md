# Editor localStorage Draft — Design

**Ngày:** 2026-07-03
**Phạm vi:** `src/app/editor/[id]/EditorForm.tsx`, hook mới `src/hooks/use-form-draft.ts`

## Vấn đề

Editor tạo thiệp chỉ lưu lên server khi user bấm "Lưu bản nháp" (server action `saveDraft`). Không có auto-save. Nếu user gõ dở mà refresh/đóng tab trước khi bấm nút → mất toàn bộ phần đang nhập.

## Mục tiêu

Tự động ghi những gì đang nhập vào `localStorage` (lưới an toàn phía client), để khi refresh vẫn còn dữ liệu, user không phải nhập lại từ đầu. Không thay đổi server action hay schema.

## Nguyên tắc đã chốt

- **Server ưu tiên.** Nếu thiệp đã có content trên server (`content != null`), đổ từ server và **bỏ qua** localStorage. Draft localStorage chỉ dùng cho thiệp mới chưa từng lưu.
- **Toàn bộ form** được lưu (mọi field, kể cả template/màu/nhạc/thứ bậc/chương trình/album).
- **Xoá draft** sau khi lưu nháp thành công hoặc xuất bản thành công.
- Key tách riêng theo từng thiệp: `chungdoi:draft:{invitationId}`.

## Ràng buộc kỹ thuật

Form trộn hai kiểu input:
- **Không kiểm soát** (`defaultValue`): phần lớn text field. Chỉ nhận giá trị **lúc mount** → phải seed đồng bộ ngay khi khởi tạo, không dùng `useEffect` đổ lại (trễ nhịp, không ghi đè được).
- **Có kiểm soát** (state React): `scheduleRows`, gallery, template, màu, nhạc, thứ bậc, slug.

Autosave phải bắt cả hai; khôi phục phải seed đúng cả hai.

## Kiến trúc

Một hook `useFormDraft` + `readDraft`, cộng thay đổi nhỏ trong `EditorForm.tsx`. Không đụng server action, không đổi schema, không sửa nội bộ các component con — giá trị seed truyền từ cha xuống qua props sẵn có.

## Data flow

### Khởi tạo (một lần, lúc mount)

```
content != null?  ──yes──▶  dùng props (content/schedule/gallery), bỏ qua draft
      │ no
      ▼
readDraft(invitationId) có?  ──yes──▶  seed từ draft
      │ no
      ▼
form rỗng như hiện tại
```

### Ghi (khi user gõ)

- Hook lắng nghe `input` + `change` (bubbling) trên `#editor-form`.
- Debounce ~500ms → `serializeForm(form)` → `localStorage.setItem(key, json)`.
- `serializeForm`: đọc `new FormData(form)`, gom field lặp (`scheduleTime`, `scheduleLabel`, `galleryUrl`) thành mảng, `brideFirst` → boolean.

### Xoá

- Sau `saveState?.ok === true` → `removeItem(key)`.
- Trước khi publish redirect (khi submit form publish) → `removeItem(key)`.

## Chi tiết triển khai

### `src/hooks/use-form-draft.ts`

```ts
const KEY = (id: string) => `chungdoi:draft:${id}`;

export type Draft = Record<string, string | boolean | string[]>;

// Đọc đồng bộ một lần. JSON.parse an toàn (try/catch),
// lỗi → removeItem + trả null.
export function readDraft(invitationId: string): Draft | null;

// Gắn listener ghi có debounce + xoá khi cleared.
export function useFormDraft(opts: {
  formId: string;
  invitationId: string;
  enabled: boolean;   // = content == null (server rỗng)
  cleared: boolean;   // = saveState.ok
}): void;
```

- `readDraft`: chạy client-only; `typeof window === "undefined"` → null.
- Ghi: `addEventListener("input"/"change")` trên `getElementById(formId)`, debounce 500ms, serialize, `setItem`. Cleanup remove listener + clear timer.
- `enabled === false` → không gắn listener.
- `cleared === true` → `removeItem` và không ghi thêm.

### Thay đổi trong `EditorForm.tsx`

1. Đầu component:
   ```ts
   const serverEmpty = content == null;
   const draft = useMemo(
     () => (serverEmpty ? readDraft(invitationId) : null),
     [serverEmpty, invitationId],
   );
   const seed = (key: string, fallback: string) =>
     typeof draft?.[key] === "string" ? (draft[key] as string) : fallback;
   ```
2. State có kiểm soát seed từ draft:
   - `scheduleRows`: dựng lại từ `draft.schedule` (mảng `{time,label}` gom từ `scheduleTime`/`scheduleLabel`) hoặc `schedule` props.
   - gallery `initial`: `draft.gallery` (string[]) hoặc `gallery` props.
   - template `defaultValue`: `seed("templateId", templateId)`.
   - màu/nhạc/thứ bậc/font: `seed(name, field(content, name))`.
   - `brideFirst` defaultChecked: `draft.brideFirst ?? (content?.brideFirst ?? true)`.
   - `slug`, `previewContent`: giữ nguyên logic.
3. Input không kiểm soát: `field(content, k)` → `seed(k, field(content, k))`.
4. Gọi hook:
   ```ts
   useFormDraft({
     formId: "editor-form",
     invitationId,
     enabled: serverEmpty,
     cleared: saveState?.ok === true,
   });
   ```
5. Publish: clear key ngay trong `onSubmit` của form publish (trước redirect).

## Không làm (YAGNI)

- Không auto-save lên server.
- Không hỏi user chọn nguồn khi server có content (server luôn thắng).
- Không versioning/migration cho draft schema.
- Không sửa nội bộ component con.

## Kiểm thử

- `npm run typecheck` + `npm run lint`.
- Thủ công: thiệp mới → gõ vài field (text, template, mốc chương trình, ảnh) → refresh → dữ liệu còn.
- Thiệp đã lưu server → refresh → dùng bản server, không bị draft cũ đè.
- Lưu nháp thành công → refresh → draft đã xoá, dùng bản server.
