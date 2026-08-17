# Ẩn AI Studio khỏi điều hướng admin

## Mục tiêu

Ẩn mục `AI Studio` trên thanh điều hướng của khu vực quản trị.

## Phạm vi

- Xóa mục `{ href: "/admin/template-studio", label: "AI Studio" }` khỏi danh sách điều hướng dùng chung trong `src/app/admin/layout.tsx`.
- Giữ nguyên route `/admin/template-studio`, trang, server actions, cấu hình kết nối AI và dữ liệu liên quan.
- Áp dụng cho cả admin thường và super admin vì hai vai trò dùng chung danh sách điều hướng cơ sở.

## Hành vi mong đợi

- Admin đã đăng nhập không còn nhìn thấy link hoặc nhãn `AI Studio` trên thanh điều hướng.
- Các mục điều hướng khác giữ nguyên thứ tự và URL.
- Người có quyền vẫn có thể truy cập trực tiếp `/admin/template-studio` nếu biết URL.

## Kiểm thử

- Thêm kiểm thử hồi quy xác nhận cấu hình điều hướng không chứa `/admin/template-studio` hoặc nhãn `AI Studio`.
- Xác nhận source route `src/app/admin/template-studio/page.tsx` vẫn tồn tại.
- Chạy kiểm thử mục tiêu, typecheck và lint cho các file thay đổi.

## Ngoài phạm vi

- Không xóa hoặc đổi route AI Studio.
- Không thay đổi quyền truy cập admin.
- Không thay đổi API key, server actions hoặc giao diện bên trong AI Studio.
- Không deploy nếu chưa có yêu cầu deploy riêng.
