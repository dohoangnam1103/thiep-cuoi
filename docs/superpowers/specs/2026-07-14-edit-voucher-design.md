# Thiết kế sửa voucher trong trang admin

## Mục tiêu

Bổ sung khả năng sửa voucher tại `/admin/vouchers` để admin có thể:

- Đặt tổng số lượt dùng tối đa mới.
- Bỏ giới hạn lượt dùng.
- Thay đổi hoặc xóa ngày hết hạn.

Không cho sửa mã voucher, số tiền giảm, số lượt đã dùng hoặc trạng thái bật/tắt trong luồng này.

## Giao diện

Mỗi dòng voucher có thêm nút **Sửa** trước các thao tác **Tắt/Bật** và **Xoá**. Nhấn **Sửa** mở một hộp thoại tập trung vào voucher đã chọn.

Hộp thoại hiển thị:

- Mã voucher: chỉ đọc.
- Số tiền giảm: chỉ đọc.
- Số lượt đã dùng: chỉ đọc.
- Tổng lượt tối đa: trường số, có thể để trống để chuyển thành không giới hạn.
- Ngày hết hạn: trường ngày, có thể để trống để chuyển thành không hết hạn.

Hộp thoại có nút **Huỷ** và **Lưu thay đổi**. Khi gửi, nút lưu bị vô hiệu hóa và hiển thị trạng thái đang lưu. Lỗi validation hiển thị trong hộp thoại; hộp thoại chỉ đóng khi cập nhật thành công. Sau thành công, bảng được refresh để hiển thị dữ liệu mới.

Hộp thoại phải dùng tốt trên desktop và mobile, giữ nguyên phong cách hiện tại của trang admin.

## Quy tắc dữ liệu

### Tổng lượt tối đa

- Là số nguyên dương hoặc `null`.
- Để trống lưu thành `null`, nghĩa là không giới hạn.
- Nếu có giá trị, tổng mới phải lớn hơn hoặc bằng `usedCount` hiện tại.
- Admin nhập tổng giới hạn mới, không nhập số lượt cộng thêm.
- `usedCount` không được sửa bởi chức năng này.

### Ngày hết hạn

- Là một ngày hợp lệ hoặc `null`.
- Để trống lưu thành `null`, nghĩa là không hết hạn.
- Cho phép chọn ngày hiện tại hoặc ngày quá khứ để voucher hết hiệu lực ngay.
- Ngày được chọn có hiệu lực hết ngày đó theo múi giờ Việt Nam (`Asia/Ho_Chi_Minh`). Ví dụ `2026-07-20` được lưu thành thời điểm tương ứng `2026-07-20 23:59:59.999` tại Việt Nam.
- Cùng một hàm chuyển đổi ngày được dùng khi tạo và sửa voucher để hai luồng có hành vi nhất quán.

Trạng thái `active` vẫn độc lập với ngày hết hạn. Sửa ngày không tự bật hoặc tắt voucher.

## Kiến trúc

### `src/app/admin/vouchers/page.tsx`

Trang server tiếp tục nạp danh sách voucher. Mỗi dòng truyền dữ liệu cần thiết sang một client component chỉnh sửa và render nút **Sửa** cùng hộp thoại.

### `src/app/admin/vouchers/EditVoucherDialog.tsx`

Client component mới chịu trách nhiệm:

- Mở và đóng hộp thoại.
- Khởi tạo form từ voucher được chọn.
- Gửi form bằng `useActionState` tới server action cập nhật.
- Hiển thị trạng thái pending và lỗi.
- Đóng hộp thoại, reset trạng thái và gọi `router.refresh()` sau khi action thành công.

Component dùng primitive dialog hiện có của dự án nếu đã có; không thêm dependency mới.

### `src/app/admin/vouchers/actions.ts`

Thêm `updateVoucher(id, previousState, formData)` và giữ action trong cùng module với các thao tác voucher hiện có.

Action thực hiện theo thứ tự:

1. Gọi `verifyAdmin()`.
2. Parse tổng lượt tối đa và ngày hết hạn bằng Zod.
3. Chuyển ngày `YYYY-MM-DD` thành cuối ngày theo giờ Việt Nam.
4. Xác nhận voucher tồn tại.
5. Cập nhật có điều kiện để tổng giới hạn mới không thấp hơn `usedCount` tại thời điểm ghi.
6. Nếu cập nhật thất bại do voucher bị xóa hoặc `usedCount` đã vượt tổng mới, trả lỗi rõ ràng và không đóng dialog.
7. Gọi `revalidatePath("/admin/vouchers")` và trả trạng thái thành công.

Logic parse ngày được tách thành helper nhỏ trong module voucher để `createVoucher` và `updateVoucher` dùng chung.

## Tính nhất quán khi có webhook

Webhook Casso có thể tăng `usedCount` trong lúc admin đang sửa. Vì vậy không chỉ đọc `usedCount` rồi gọi `update`; action phải dùng một cập nhật có điều kiện tại database khi đặt giới hạn cụ thể:

- Điều kiện gồm `id` của voucher và `usedCount <= maxUses` mới.
- Nếu không có bản ghi nào được cập nhật, action đọc lại để phân biệt voucher đã bị xóa với giới hạn vừa trở nên thấp hơn số đã dùng.
- Khi chuyển sang không giới hạn, chỉ cần cập nhật `maxUses = null`; không có ràng buộc với `usedCount`.

Phạm vi này bảo đảm action admin không ghi giới hạn thấp hơn `usedCount` đã tồn tại tại thời điểm ghi. Nó không thay đổi cơ chế giữ chỗ voucher của luồng thanh toán hiện tại.

## Thông báo lỗi

Các lỗi cần có thông báo tiếng Việt rõ ràng:

- Dữ liệu không hợp lệ.
- Tổng lượt tối đa phải là số nguyên dương.
- Tổng lượt tối đa không được nhỏ hơn số lượt đã dùng.
- Ngày hết hạn không hợp lệ.
- Voucher không còn tồn tại.

Lỗi không được làm mất giá trị người dùng vừa nhập. Không dùng optimistic update cho bảng voucher.

## Kiểm thử

Bổ sung kiểm thử cho các trường hợp:

1. Nút **Sửa** mở đúng voucher và hiển thị mã, số tiền giảm, `usedCount`, `maxUses`, `expiresAt` hiện tại.
2. Đổi tổng giới hạn và ngày hết hạn thành công; bảng và dữ liệu SQLite cùng được cập nhật.
3. Để trống tổng giới hạn và ngày hết hạn lưu thành `null`.
4. Tổng giới hạn thấp hơn `usedCount` bị từ chối và dữ liệu không đổi.
5. Ngày hiện tại và ngày quá khứ được chấp nhận.
6. Ngày được lưu tương ứng cuối ngày theo múi giờ Việt Nam.
7. Nhấn **Huỷ** không thay đổi dữ liệu.
8. Server action không cho phép người không có phiên admin cập nhật.

Sau triển khai, chạy lint, typecheck, test admin liên quan và production build. Do có thay đổi UI, chạy ứng dụng và thao tác thực tế trên desktop và mobile để xác nhận dialog, trạng thái pending, lỗi và refresh bảng hoạt động đúng.

## Ngoài phạm vi

- Sửa mã voucher hoặc số tiền giảm.
- Sửa trực tiếp `usedCount`.
- Thay đổi hành vi bật/tắt hoặc xóa voucher.
- Thay đổi schema Prisma hoặc tạo migration.
- Thiết kế lại cơ chế giữ lượt voucher khi mã được áp vào đơn pending.
