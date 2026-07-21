# Đơn giản hóa form editor thiệp cưới — phân tầng theo mức cần thiết

**Ngày:** 2026-07-21
**File chính:** `src/app/editor/[id]/EditorForm.tsx`

## Vấn đề

Form tạo thiệp hiện trải 8 accordion phẳng với 30+ field ra cùng một mặt phẳng. Người dùng phản ánh 4 điểm đau:

1. Quá nhiều field, ngợp mắt.
2. Không biết field nào bắt buộc.
3. Mất quá nhiều thời gian điền.
4. Cấu trúc/UX rối, khó tìm.

Gốc rễ: form không phân biệt "cái phải điền để xuất bản" với "cái điền thêm cho đẹp", và gắn `required` HTML lung tung lên cả field không thực sự bắt buộc.

## Sự thật về ràng buộc bắt buộc (đã xác minh)

- **Schema** (`content-schema.ts`): chỉ `templateId` bắt buộc; mọi field khác `optional`.
- **Action `publish`** (`actions.ts`): chặn xuất bản khi thiếu **tên cô dâu**, **tên chú rể**, hoặc **ngày cưới**. Slug tự sinh từ tên nếu người dùng không nhập.
- Kết luận: thực tế chỉ **3 field bắt buộc** để xuất bản: `brideFullName`, `groomFullName`, `date`.

## Hướng chọn

Hướng A (phân tầng theo mức cần thiết) + một chút C (ẩn nhóm ít dùng thay vì xóa). Giữ 1 trang, tổ chức lại thành 2 tầng, thêm thanh tiến độ, sửa `required` sai. Không đụng lưu trữ/xuất bản.

## Cấu trúc mới

### Thanh tiến độ (đầu form)
```
● Tên cô dâu   ● Tên chú rể   ○ Ngày cưới
Đã điền 2/3 mục cần thiết để xuất bản
```
- 3 chấm phản ánh realtime dựa trên `onInput` sẵn có của form.
- Đủ 3 → đổi sang trạng thái xanh + chữ "Sẵn sàng xuất bản".

### Tầng 1 — Cốt lõi (accordion luôn mở)
- ♡ **Thông tin chính** — brideFullName*, groomFullName*, brideBirthOrder, groomBirthOrder, date*, time, brideFirst
- ⌂ **Gia đình hai bên** — groomFather/Mother/ParentTitle/Address, brideFather/Mother/ParentTitle/Address
- ✦ **Nơi tổ chức** — address, mapAddress, banquetTime
- ◱ **Ảnh album** — GalleryUploader
- ✧ **Mẫu thiệp** — TemplatePicker (lưới thumbnail)

### Tầng 2 — Tùy chỉnh thêm (tiêu đề phân cách rõ, tất cả đóng sẵn)
- ✿ **Chương trình ngày cưới** — scheduleRows
- 🕊 **Lễ riêng** — ceremonyDate, ceremonyTime, ceremonyHeader (tách khỏi ngày cưới chính để tầng cốt lõi gọn)
- ♪ **Font & Nhạc** — fontFamily, MusicPicker
- 🎨 **Màu chủ đạo** — primaryColor (ColorField)
- ✉ **Chuyển khoản** — groom/bride bank fields

## Thay đổi kỹ thuật

Tất cả gói trong `EditorForm.tsx`:

1. **Component mới `RequiredProgress`** — nhận trạng thái điền của 3 field cốt lõi (đọc realtime từ form qua `onInput` hoặc state), render 3 chấm + dòng đếm. Dính đầu vùng edit.
2. **Sắp xếp lại thứ tự các `<Accordion>`** theo cấu trúc 2 tầng ở trên; các accordion tầng 1 `defaultOpen`, tầng 2 `defaultOpen={false}`.
3. **Thêm 1 dải tiêu đề phân cách** giữa hai tầng ("Tùy chỉnh thêm — không bắt buộc").
4. **Thêm dấu `*` đỏ** vào label của đúng 3 field cốt lõi.
5. **Bỏ prop `required`** trên các `<Text>` (brideFullName, groomFullName, date) — server đã lo việc chặn xuất bản; `required` HTML gây viền đỏ/cảnh báo khó hiểu. Cân nhắc thêm prop `requiredMark?: boolean` cho `<Text>` để hiện dấu `*` mà không bật validation trình duyệt.

## Không đụng tới (giữ nguyên hoàn toàn)

- Toàn bộ `name=` của input.
- Server actions (`saveDraft`, `publish`, `checkSlug`).
- `content-schema.ts`, các hàm parse.
- Cơ chế draft localStorage (`useFormDraft`), preview, slug.

## Kiểm thử

- `npm run typecheck` + `npm run build` pass.
- Kiểm tra UI thủ công: thanh tiến độ cập nhật khi gõ tên/ngày; accordion tầng 2 đóng sẵn; lưu nháp + xuất bản vẫn hoạt động; draft restore vẫn đúng.

## Rủi ro

Thấp. Thuần túy tổ chức lại UI + 1 component hiển thị. Không đổi hình dạng dữ liệu hay API.
