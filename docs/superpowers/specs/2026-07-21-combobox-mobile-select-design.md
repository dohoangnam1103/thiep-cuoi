# Thay dropdown native bằng Combobox (react-select) toàn app

**Ngày:** 2026-07-21
**Trạng thái:** Đã duyệt design, chờ review spec

## Bối cảnh

Một số dropdown `<select>` native của trình duyệt không hoạt động được trên mobile / thiết bị lạ (bug hiển thị + không mở được menu). Form tạo/sửa thiệp ở `/editor/[id]` là nơi user báo lỗi rõ nhất.

Project đã cài sẵn `react-select ^5.10.2` và có một implementation mẫu hoàn chỉnh ở `src/components/ui/bank-combobox.tsx` — dùng `unstyled` + `classNames` + `menuPortalTarget={document.body}` + `menuPosition="fixed"` + `menuShouldScrollIntoView={false}` + `maxMenuHeight`. Đây chính là cấu hình đã chạy ổn định, chống được bug dropdown trên mobile.

Quyết định: thay **tất cả** `<select>` native trên toàn app bằng một component `Combobox` dùng chung, để đồng nhất và tránh bug tái diễn ở các thiết bị lạ.

## Hiện trạng — 10 `<select>` native (5 file)

| # | Vị trí | Kiểu | Cách submit |
|---|--------|------|-------------|
| 1 | `EditorForm.tsx` — `Select` (Font chữ, `fontFamily`) | uncontrolled `defaultValue` | FormData + autosave nháp |
| 2-3 | `EditorForm.tsx` — `BirthOrderField` ×2 (Thứ bậc cô dâu/chú rể) | native select + nút "Khác…" → ô text tự nhập | FormData + autosave nháp |
| 4 | `GuestManager.tsx` — `side` (modal thêm/sửa khách) | uncontrolled, trong modal | FormData |
| 5-7 | `GuestManager.tsx` — 3 filter (side/group/response) | **controlled** `value`/`onChange` | không submit (lọc client) |
| 8 | `RsvpQuestionBuilder.tsx` — `type` | **controlled**, đổi render theo giá trị | server action đọc state |
| 9 | `Interactions.tsx` (trang thiệp public) — `side` | uncontrolled, theme trắng/neutral cứng | FormData |
| 10 | `public-rsvp-dialog.tsx` — `side` + câu hỏi động type=select | uncontrolled, trong dialog | FormData |

(Tổng **10 `<select>` native** cần thay, trên 5 file. #4 và #10 đều là field `side` nhưng ở 2 component riêng biệt.)

## Hai ràng buộc kỹ thuật

1. **Autosave nháp** (`useFormDraft` trong `EditorForm`): nghe sự kiện `input`/`change` nổi bọt trên form. `react-select` set giá trị vào hidden input bằng code nên **không** tự phát sự kiện đó. Phải tự `dispatchEvent(new Event("input", { bubbles: true }))` — đúng pattern `TemplatePicker` (EditorForm.tsx:358) đang chạy ổn.
2. **Theme khác nhau**: hầu hết dùng design token (`bg-background`, `border-input`, `text-foreground`), riêng `Interactions.tsx` (trang thiệp đã publish) dùng palette trắng/neutral cứng (`bg-white/80`, `border-black/15`, `text-neutral-800`). Không ép design token vào đó để tránh lệch tông.

## Thiết kế

### Component dùng chung: `Combobox`

File mới `src/components/ui/combobox.tsx`. Wrap `react-select` với cấu hình chống-bug-mobile giống `bank-combobox`. **Chỉ render ô select + hidden input (khi form mode), không render label** — mỗi call site giữ nguyên markup label/theme sẵn có.

```tsx
type ComboboxOption = { value: string; label: string };

type ComboboxBaseProps = {
  options: ComboboxOption[];
  placeholder?: string;
  isSearchable?: boolean;          // mặc định false (list ngắn); bật khi list dài
  isClearable?: boolean;           // mặc định false
  inputId?: string;                // nối với <label htmlFor>
  "aria-label"?: string;
  variant?: "default" | "neutral"; // token vs trắng/neutral cho trang public
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

type ComboboxProps = ComboboxFormProps | ComboboxControlledProps;
```

Mode tự nhận theo prop: có `onChange` → controlled mode; ngược lại → form mode.

### Form mode — xử lý autosave

- **Không** truyền `name` cho `<Select>` của react-select.
- Tự render `<input type="hidden" name={name} value={value} ref={inputRef} />`.
- Giữ state nội bộ `value` (khởi tạo từ `defaultValue`), đồng bộ hidden input.
- `useEffect` bắn `inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }))` mỗi khi `value` đổi, bỏ qua lần mount đầu (dùng `mountedRef`) — đúng pattern `TemplatePicker`.
- Nhờ vậy `useFormDraft` bắt được thay đổi như với select native.

### Controlled mode

- Nhận `value`/`onChange`, truyền thẳng vào react-select (map value ↔ option).
- Không render hidden input, không dispatch event.
- Dùng cho: 3 filter GuestManager, `type` trong RsvpQuestionBuilder.

### Variant theme

- `variant="default"` (mặc định): dùng design token — copy `classNames` từ `bank-combobox` (`border-input`, `bg-background`, `bg-popover`, `text-foreground`…).
- `variant="neutral"`: palette trắng/neutral cho `Interactions.tsx` — `border-black/15`, `bg-white/80`, `text-neutral-800`, menu `bg-white`.
- Cả hai variant giữ nguyên chống-bug: `menuPortalTarget={document.body}`, `menuPosition="fixed"`, `menuShouldScrollIntoView={false}`, `menuPlacement="auto"`, `maxMenuHeight`.

### Áp vào từng chỗ

| Chỗ | Cách thay |
|-----|-----------|
| EditorForm `Select` (Font) | Thay `<select>` trong component `Select` bằng `<Combobox name defaultValue options={FONT_OPTIONS} isSearchable />` (list font ~9 mục, bật search cho tiện). Giữ `labelClass`, `hint`. |
| EditorForm `BirthOrderField` ×2 | Giữ nguyên logic nút "Khác…" + ô text. Chỉ đổi phần `<select>` list thành `Combobox` form mode. Option "Khác…" (`__custom__`) vẫn nằm trong list, chọn nó → `setCustom(true)`. |
| GuestManager `side` (modal) | `Combobox` form mode, `variant="default"`. |
| GuestManager 3 filter | `Combobox` controlled mode (`value`/`onChange`), `aria-label` giữ nguyên. Filter group có thể nhiều mục → `isSearchable`. |
| RsvpQuestionBuilder `type` | `Combobox` controlled mode. Đổi `type` vẫn trigger render lại phần options như cũ. |
| Interactions `side` (public) | `Combobox` form mode, `variant="neutral"`. |
| public-rsvp-dialog `side` + câu hỏi type=select | `Combobox` form mode, `variant="default"` (dialog dùng token). Câu hỏi động: options build từ `question.options`. |

### Dọn dẹp

- Xóa component `Select` cũ trong `EditorForm.tsx` sau khi thay xong (không còn ai dùng).
- `optionClass` (EditorForm.tsx:162) chỉ còn dùng cho `<option>` — xóa nếu không còn `<option>` nào; `inputClass` giữ lại cho input text.
- Không refactor `bank-combobox.tsx`; giữ nguyên (đã chạy ổn, khác API vì có search ngân hàng + format option phức tạp).

## Xác minh

- Không có unit-runner trong repo (chỉ Playwright lightbox `npm run test:lightbox`, không liên quan).
- Bar xác minh: **`npm run check` xanh** (lint + typecheck + build).
- Mobile dropdown: user tự verify sau khi deploy — theo quy ước clone template lâu nay ([feedback_clone_verify]).

## Ngoài phạm vi (YAGNI)

- Không thêm animation/tính năng mới cho dropdown.
- Không đổi `bank-combobox.tsx`.
- Không đụng radio/checkbox/input khác — chỉ `<select>`.
- Không viết test tự động cho form (repo không có test runner cho phần này).
